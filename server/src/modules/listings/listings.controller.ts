import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, errorResponse, parsePagination, buildMeta } from '../../utils/apiResponse';
import { CreateListingInput, UpdateListingInput, ListingQueryInput } from './listings.schema';
import { recomputeMatchesForListing } from '../matches/matches.service';
import { requireActiveCropSlug } from '../crops/crop.service';

function formatListing(l: any) {
  return {
    ...l,
    quantityQtl: parseFloat(l.quantityQtl),
    remainingQuantityQtl: parseFloat(l.remainingQuantityQtl),
    askingPricePerQtl: parseFloat(l.askingPricePerQtl),
  };
}

export async function createListing(req: Request, res: Response): Promise<void> {
  const data = req.body as CreateListingInput;
  const userId = req.user!.id;
  const crop = await requireActiveCropSlug(data.crop);
  if (!crop) {
    errorResponse(res, 400, 'UNSUPPORTED_CROP', 'Select an active crop from the catalogue.');
    return;
  }

  // FPO listings inherit the owner's organization when one exists.
  let fpoId = data.fpoId;
  if (!fpoId && req.user!.role.toUpperCase() === 'FPO') {
    fpoId = (await prisma.fPO.findUnique({ where: { ownerUserId: userId }, select: { id: true } }))?.id;
  }
  if (fpoId) {
    const fpo = await prisma.fPO.findUnique({ where: { id: fpoId } });
    if (!fpo || fpo.ownerUserId !== userId) {
      errorResponse(res, 403, 'FORBIDDEN', 'You are not authorized to list on behalf of this FPO');
      return;
    }
  }

  const listing = await prisma.listing.create({
    data: {
      farmerId: userId,
      fpoId: fpoId ?? null,
      crop,
      quantityQtl: data.quantityQtl,
      remainingQuantityQtl: data.quantityQtl,
      harvestDate: new Date(data.harvestDate),
      askingPricePerQtl: data.askingPricePerQtl,
      district: data.district,
      description: data.description ?? null,
      cropGrade: data.cropGrade ?? null,
      photoUrls: data.photoUrls ?? [],
    },
    include: { farmer: { select: { id: true, name: true, role: true, phoneVerifiedAt: true, rating: true } }, fpo: { select: { isVerified: true } } },
  });

  // Compute matches asynchronously
  recomputeMatchesForListing(listing.id).catch(() => {});

  successResponse(res, { listing: formatListing(listing) }, 201);
}

export async function getListings(req: Request, res: Response): Promise<void> {
  const q = req.query as unknown as ListingQueryInput;
  const { page, pageSize, skip } = parsePagination(req.query as any);

  const where: any = {};
  if (q.crop) {
    const crop = await requireActiveCropSlug(q.crop);
    if (!crop) { errorResponse(res, 400, 'UNSUPPORTED_CROP', 'Crop filter is not in the active catalogue.'); return; }
    where.crop = crop;
  }
  if (q.district) where.district = { contains: q.district, mode: 'insensitive' };
  if (q.minQuantity) where.remainingQuantityQtl = { gte: q.minQuantity };
  if (q.maxPrice) where.askingPricePerQtl = { lte: q.maxPrice };
  if (q.harvestAfter) where.harvestDate = { gte: new Date(q.harvestAfter) };
  if (q.harvestBefore) where.harvestDate = { ...(where.harvestDate ?? {}), lte: new Date(q.harvestBefore) };
  if (q.status) where.status = q.status;
  else where.status = { in: ['ACTIVE', 'PARTIALLY_RESERVED'] }; // default: only available

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [q.sortBy ?? 'createdAt']: q.sortOrder ?? 'desc' },
      include: { farmer: { select: { id: true, name: true, role: true, phoneVerifiedAt: true, rating: true } }, fpo: { select: { isVerified: true } } },
    }),
    prisma.listing.count({ where }),
  ]);

  successResponse(res, { listings: listings.map(formatListing) }, 200, buildMeta(page, pageSize, total));
}

export async function getListing(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { farmer: { select: { id: true, name: true, role: true, phoneVerifiedAt: true, rating: true } }, fpo: { select: { isVerified: true } } },
  });

  if (!listing) {
    errorResponse(res, 404, 'NOT_FOUND', 'Listing not found');
    return;
  }

  successResponse(res, { listing: formatListing(listing) });
}

export async function updateListing(req: Request, res: Response): Promise<void> {
  const data = req.body as UpdateListingInput;
  const crop = data.crop ? await requireActiveCropSlug(data.crop) : undefined;
  if (data.crop && !crop) {
    errorResponse(res, 400, 'UNSUPPORTED_CROP', 'Select an active crop from the catalogue.');
    return;
  }
  const userId = req.user!.id;
  const id = req.params.id as string;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) { errorResponse(res, 404, 'NOT_FOUND', 'Listing not found'); return; }
  if (listing.farmerId !== userId) { errorResponse(res, 403, 'FORBIDDEN', 'You do not own this listing'); return; }

  if (listing.status === 'CANCELLED' || listing.status === 'COMPLETED') {
    errorResponse(res, 409, 'INVALID_STATE', `Cannot update a ${listing.status.toLowerCase()} listing`);
    return;
  }
  if (data.quantityQtl !== undefined && listing.status !== 'ACTIVE') {
    errorResponse(res, 409, 'INVALID_STATE', 'Quantity can only be edited while the listing is fully active.');
    return;
  }

  // If cancelling, check for active confirmed deals
  if (data.status === 'CANCELLED') {
    const activeDeals = await prisma.deal.count({
      where: { listingId: listing.id, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
    });
    if (activeDeals > 0) {
      errorResponse(res, 409, 'HAS_ACTIVE_DEALS', 'Cannot cancel a listing with confirmed deals. Complete or cancel the deals first.');
      return;
    }
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: {
      ...(crop ? { crop } : {}),
      ...(data.quantityQtl !== undefined ? { quantityQtl: data.quantityQtl, remainingQuantityQtl: data.quantityQtl } : {}),
      ...(data.harvestDate ? { harvestDate: new Date(data.harvestDate) } : {}),
      ...(data.askingPricePerQtl !== undefined ? { askingPricePerQtl: data.askingPricePerQtl } : {}),
      ...(data.district ? { district: data.district } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.cropGrade !== undefined ? { cropGrade: data.cropGrade } : {}),
      ...(data.photoUrls !== undefined ? { photoUrls: data.photoUrls } : {}),
      ...(data.status ? { status: data.status as any } : {}),
    },
    include: { farmer: { select: { id: true, name: true, role: true, phoneVerifiedAt: true, rating: true } }, fpo: { select: { isVerified: true } } },
  });

  // Invalidate & recompute matches
  recomputeMatchesForListing(listing.id).catch(() => {});

  successResponse(res, { listing: formatListing(updated) });
}

export async function deleteListing(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) { errorResponse(res, 404, 'NOT_FOUND', 'Listing not found'); return; }
  if (listing.farmerId !== userId) { errorResponse(res, 403, 'FORBIDDEN', 'You do not own this listing'); return; }

  // Check for active deals — use soft cancel
  const activeDeals = await prisma.deal.count({
    where: { listingId: listing.id, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
  });
  if (activeDeals > 0) {
    errorResponse(res, 409, 'HAS_ACTIVE_DEALS', 'Cannot delete a listing with active deals. Cancel the deals first.');
    return;
  }

  // Soft delete via status
  await prisma.listing.update({
    where: { id: listing.id },
    data: { status: 'CANCELLED' },
  });

  // Invalidate matches
  await prisma.match.updateMany({ where: { listingId: listing.id }, data: { isActive: false } });

  successResponse(res, { message: 'Listing cancelled' });
}

export async function getMyListings(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { page, pageSize, skip } = parsePagination(req.query as any);

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where: { farmerId: userId },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { farmer: { select: { id: true, name: true, role: true } } },
    }),
    prisma.listing.count({ where: { farmerId: userId } }),
  ]);

  successResponse(res, { listings: listings.map(formatListing) }, 200, buildMeta(page, pageSize, total));
}
