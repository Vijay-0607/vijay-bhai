import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, errorResponse, parsePagination, buildMeta } from '../../utils/apiResponse';
import { CreateListingInput, UpdateListingInput, ListingQueryInput } from './listings.schema';
import { recomputeMatchesForListing } from '../matches/matches.service';

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

  // If fpoId is given, verify ownership
  if (data.fpoId) {
    const fpo = await prisma.fPO.findUnique({ where: { id: data.fpoId } });
    if (!fpo || fpo.ownerUserId !== userId) {
      errorResponse(res, 403, 'FORBIDDEN', 'You are not authorized to list on behalf of this FPO');
      return;
    }
  }

  const listing = await prisma.listing.create({
    data: {
      farmerId: userId,
      fpoId: data.fpoId ?? null,
      crop: data.crop as any,
      quantityQtl: data.quantityQtl,
      remainingQuantityQtl: data.quantityQtl,
      harvestDate: new Date(data.harvestDate),
      askingPricePerQtl: data.askingPricePerQtl,
      district: data.district,
      description: data.description ?? null,
    },
    include: { farmer: { select: { id: true, name: true, role: true } } },
  });

  // Compute matches asynchronously
  recomputeMatchesForListing(listing.id).catch(() => {});

  successResponse(res, { listing: formatListing(listing) }, 201);
}

export async function getListings(req: Request, res: Response): Promise<void> {
  const q = req.query as unknown as ListingQueryInput;
  const { page, pageSize, skip } = parsePagination(req.query as any);

  const where: any = {};
  if (q.crop) where.crop = q.crop;
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
      include: { farmer: { select: { id: true, name: true, role: true } } },
    }),
    prisma.listing.count({ where }),
  ]);

  successResponse(res, { listings: listings.map(formatListing) }, 200, buildMeta(page, pageSize, total));
}

export async function getListing(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { farmer: { select: { id: true, name: true, role: true } } },
  });

  if (!listing) {
    errorResponse(res, 404, 'NOT_FOUND', 'Listing not found');
    return;
  }

  successResponse(res, { listing: formatListing(listing) });
}

export async function updateListing(req: Request, res: Response): Promise<void> {
  const data = req.body as UpdateListingInput;
  const userId = req.user!.id;
  const id = req.params.id as string;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) { errorResponse(res, 404, 'NOT_FOUND', 'Listing not found'); return; }
  if (listing.farmerId !== userId) { errorResponse(res, 403, 'FORBIDDEN', 'You do not own this listing'); return; }

  if (listing.status === 'CANCELLED' || listing.status === 'COMPLETED') {
    errorResponse(res, 409, 'INVALID_STATE', `Cannot update a ${listing.status.toLowerCase()} listing`);
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
      ...(data.crop ? { crop: data.crop as any } : {}),
      ...(data.quantityQtl !== undefined ? { quantityQtl: data.quantityQtl } : {}),
      ...(data.harvestDate ? { harvestDate: new Date(data.harvestDate) } : {}),
      ...(data.askingPricePerQtl !== undefined ? { askingPricePerQtl: data.askingPricePerQtl } : {}),
      ...(data.district ? { district: data.district } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status ? { status: data.status as any } : {}),
    },
    include: { farmer: { select: { id: true, name: true, role: true } } },
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
