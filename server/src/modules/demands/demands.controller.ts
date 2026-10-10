import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, errorResponse, parsePagination, buildMeta } from '../../utils/apiResponse';
import { CreateDemandInput, UpdateDemandInput, DemandQueryInput } from './demands.schema';
import { recomputeMatchesForDemand } from '../matches/matches.service';
import { requireActiveCropSlug } from '../crops/crop.service';

function formatDemand(d: any) {
  return {
    ...d,
    quantityQtl: parseFloat(d.quantityQtl),
    remainingQuantityQtl: parseFloat(d.remainingQuantityQtl),
    maxPricePerQtl: parseFloat(d.maxPricePerQtl),
  };
}

export async function createDemand(req: Request, res: Response): Promise<void> {
  const data = req.body as CreateDemandInput;
  const userId = req.user!.id;
  const crop = await requireActiveCropSlug(data.crop);
  if (!crop) {
    errorResponse(res, 400, 'UNSUPPORTED_CROP', 'Select an active crop from the catalogue.');
    return;
  }

  const demand = await prisma.demand.create({
    data: {
      buyerId: userId,
      crop,
      quantityQtl: data.quantityQtl,
      remainingQuantityQtl: data.quantityQtl,
      deliveryDate: new Date(data.deliveryDate),
      maxPricePerQtl: data.maxPricePerQtl,
      district: data.district,
      description: data.description ?? null,
    },
    include: { buyer: { select: { id: true, name: true, role: true } } },
  });

  recomputeMatchesForDemand(demand.id).catch(() => {});

  successResponse(res, { demand: formatDemand(demand) }, 201);
}

export async function getDemands(req: Request, res: Response): Promise<void> {
  const q = req.query as unknown as DemandQueryInput;
  const { page, pageSize, skip } = parsePagination(req.query as any);

  const where: any = {};
  if (q.crop) {
    const crop = await requireActiveCropSlug(q.crop);
    if (!crop) { errorResponse(res, 400, 'UNSUPPORTED_CROP', 'Crop filter is not in the active catalogue.'); return; }
    where.crop = crop;
  }
  if (q.district) where.district = { contains: q.district, mode: 'insensitive' };
  if (q.minQuantity) where.remainingQuantityQtl = { gte: q.minQuantity };
  if (q.maxPrice) where.maxPricePerQtl = { lte: q.maxPrice };
  if (q.deliveryAfter) where.deliveryDate = { gte: new Date(q.deliveryAfter) };
  if (q.deliveryBefore) where.deliveryDate = { ...(where.deliveryDate ?? {}), lte: new Date(q.deliveryBefore) };
  if (q.status) where.status = q.status;
  else where.status = { in: ['ACTIVE', 'PARTIALLY_FILLED'] };

  const [demands, total] = await Promise.all([
    prisma.demand.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [q.sortBy ?? 'createdAt']: q.sortOrder ?? 'desc' },
      include: { buyer: { select: { id: true, name: true, role: true } } },
    }),
    prisma.demand.count({ where }),
  ]);

  successResponse(res, { demands: demands.map(formatDemand) }, 200, buildMeta(page, pageSize, total));
}

export async function getDemand(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const demand = await prisma.demand.findUnique({
    where: { id },
    include: { buyer: { select: { id: true, name: true, role: true } } },
  });

  if (!demand) { errorResponse(res, 404, 'NOT_FOUND', 'Demand not found'); return; }
  successResponse(res, { demand: formatDemand(demand) });
}

export async function updateDemand(req: Request, res: Response): Promise<void> {
  const data = req.body as UpdateDemandInput;
  const crop = data.crop ? await requireActiveCropSlug(data.crop) : undefined;
  if (data.crop && !crop) {
    errorResponse(res, 400, 'UNSUPPORTED_CROP', 'Select an active crop from the catalogue.');
    return;
  }
  const userId = req.user!.id;
  const id = req.params.id as string;

  const demand = await prisma.demand.findUnique({ where: { id } });
  if (!demand) { errorResponse(res, 404, 'NOT_FOUND', 'Demand not found'); return; }
  if (demand.buyerId !== userId) { errorResponse(res, 403, 'FORBIDDEN', 'You do not own this demand'); return; }

  if (demand.status === 'CANCELLED' || demand.status === 'FULFILLED') {
    errorResponse(res, 409, 'INVALID_STATE', `Cannot update a ${demand.status.toLowerCase()} demand`);
    return;
  }

  if (data.status === 'CANCELLED') {
    const activeDeals = await prisma.deal.count({
      where: { demandId: demand.id, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
    });
    if (activeDeals > 0) {
      errorResponse(res, 409, 'HAS_ACTIVE_DEALS', 'Cannot cancel a demand with confirmed deals.');
      return;
    }
  }

  const updated = await prisma.demand.update({
    where: { id: demand.id },
    data: {
      ...(crop ? { crop } : {}),
      ...(data.quantityQtl !== undefined ? { quantityQtl: data.quantityQtl } : {}),
      ...(data.deliveryDate ? { deliveryDate: new Date(data.deliveryDate) } : {}),
      ...(data.maxPricePerQtl !== undefined ? { maxPricePerQtl: data.maxPricePerQtl } : {}),
      ...(data.district ? { district: data.district } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status ? { status: data.status as any } : {}),
    },
    include: { buyer: { select: { id: true, name: true, role: true } } },
  });

  recomputeMatchesForDemand(demand.id).catch(() => {});
  successResponse(res, { demand: formatDemand(updated) });
}

export async function deleteDemand(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const demand = await prisma.demand.findUnique({ where: { id } });
  if (!demand) { errorResponse(res, 404, 'NOT_FOUND', 'Demand not found'); return; }
  if (demand.buyerId !== userId) { errorResponse(res, 403, 'FORBIDDEN', 'You do not own this demand'); return; }

  const activeDeals = await prisma.deal.count({
    where: { demandId: demand.id, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
  });
  if (activeDeals > 0) {
    errorResponse(res, 409, 'HAS_ACTIVE_DEALS', 'Cannot delete a demand with active deals.');
    return;
  }

  await prisma.demand.update({ where: { id: demand.id }, data: { status: 'CANCELLED' } });
  await prisma.match.updateMany({ where: { demandId: demand.id }, data: { isActive: false } });

  successResponse(res, { message: 'Demand cancelled' });
}

export async function getMyDemands(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { page, pageSize, skip } = parsePagination(req.query as any);

  const [demands, total] = await Promise.all([
    prisma.demand.findMany({
      where: { buyerId: userId },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { buyer: { select: { id: true, name: true, role: true } } },
    }),
    prisma.demand.count({ where: { buyerId: userId } }),
  ]);

  successResponse(res, { demands: demands.map(formatDemand) }, 200, buildMeta(page, pageSize, total));
}
