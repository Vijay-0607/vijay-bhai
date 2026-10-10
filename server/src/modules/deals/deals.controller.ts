import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, errorResponse, parsePagination, buildMeta } from '../../utils/apiResponse';
import { createNotification } from '../notifications/notifications.service';
import { UpdateDealStatusInput } from './deals.schema';

const DEAL_INCLUDE = {
  listing: { select: { id: true, crop: true, district: true, harvestDate: true } },
  demand: { select: { id: true, crop: true, district: true, deliveryDate: true } },
  farmer: { select: { id: true, name: true, phone: true, district: true, rating: true } },
  buyer: { select: { id: true, name: true, phone: true, district: true, rating: true } },
  offer: { select: { id: true, message: true } },
};

function formatDeal(d: any) {
  return {
    id: d.id,
    listingId: d.listingId,
    demandId: d.demandId,
    matchId: d.matchId,
    offerId: d.offerId,
    farmerId: d.farmerId,
    farmerName: d.farmer?.name,
    buyerId: d.buyerId,
    buyerName: d.buyer?.name,
    crop: d.listing?.crop,
    district: d.listing?.district,
    quantityQtl: parseFloat(d.quantityQtl),
    agreedPricePerQtl: parseFloat(d.agreedPricePerQtl),
    totalValue: parseFloat(d.totalValue),
    commissionRate: parseFloat(d.commissionRate),
    commissionAmount: parseFloat(d.commissionAmount),
    status: d.status,
    confirmedAt: d.confirmedAt.toISOString(),
    completedAt: d.completedAt?.toISOString() ?? null,
    cancelledAt: d.cancelledAt?.toISOString() ?? null,
    cancelReason: d.cancelReason,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    farmer: d.farmer,
    buyer: d.buyer,
    listing: d.listing,
    demand: d.demand,
  };
}

export async function getDeals(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { page, pageSize, skip } = parsePagination(req.query);
  const statusFilter = req.query.status as string | undefined;

  let where: any = {};

  if (userRole === 'ADMIN') {
    // Admin sees all
  } else if (userRole === 'FARMER' || userRole === 'FPO') {
    where.farmerId = userId;
  } else if (userRole === 'BUYER') {
    where.buyerId = userId;
  } else {
    where.OR = [{ farmerId: userId }, { buyerId: userId }];
  }

  if (statusFilter) {
    where.status = statusFilter;
  }

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: DEAL_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.deal.count({ where }),
  ]);

  successResponse(
    res,
    deals.map(formatDeal),
    200,
    buildMeta(page, pageSize, total)
  );
}

export async function getDeal(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const id = req.params.id as string;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: DEAL_INCLUDE,
  });

  if (!deal) {
    errorResponse(res, 404, 'NOT_FOUND', 'Deal not found');
    return;
  }

  if (userRole !== 'ADMIN' && deal.farmerId !== userId && deal.buyerId !== userId) {
    errorResponse(res, 403, 'FORBIDDEN', 'Access denied');
    return;
  }

  successResponse(res, formatDeal(deal));
}

export async function updateDealStatus(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const id = req.params.id as string;
  const { status, cancelReason } = req.body as UpdateDealStatusInput;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      listing: true,
      farmer: { select: { id: true, name: true } },
      buyer: { select: { id: true, name: true } },
    },
  });

  if (!deal) {
    errorResponse(res, 404, 'NOT_FOUND', 'Deal not found');
    return;
  }

  if (userRole !== 'ADMIN' && deal.farmerId !== userId && deal.buyerId !== userId) {
    errorResponse(res, 403, 'FORBIDDEN', 'Access denied');
    return;
  }

  if (deal.status === 'COMPLETED' || deal.status === 'CANCELLED') {
    errorResponse(res, 400, 'INVALID_STATE', `Cannot update a deal that is already ${deal.status.toLowerCase()}`);
    return;
  }

  const updatedDeal = await prisma.$transaction(async (tx) => {
    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();

      // Increment completed deals counter for both farmer and buyer
      await tx.user.update({
        where: { id: deal.farmerId },
        data: { completedDealsCount: { increment: 1 } },
      });
      await tx.user.update({
        where: { id: deal.buyerId },
        data: { completedDealsCount: { increment: 1 } },
      });
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = cancelReason || 'Cancelled by participant';

      // Restore remaining quantity to listing
      const dealQty = parseFloat(String(deal.quantityQtl));
      const listing = await tx.listing.findUnique({ where: { id: deal.listingId } });
      if (listing) {
        const restored = parseFloat(String(listing.remainingQuantityQtl)) + dealQty;
        await tx.listing.update({
          where: { id: deal.listingId },
          data: {
            remainingQuantityQtl: restored,
            status: 'ACTIVE',
          },
        });
      }

      // Restore remaining quantity to demand if linked
      if (deal.demandId) {
        const demand = await tx.demand.findUnique({ where: { id: deal.demandId } });
        if (demand) {
          const restoredDemand = parseFloat(String(demand.remainingQuantityQtl)) + dealQty;
          await tx.demand.update({
            where: { id: deal.demandId },
            data: {
              remainingQuantityQtl: restoredDemand,
              status: 'ACTIVE',
            },
          });
        }
      }
    }

    return tx.deal.update({
      where: { id },
      data: updateData,
      include: DEAL_INCLUDE,
    });
  });

  // Notify other party
  const notifyTargetId = userId === deal.farmerId ? deal.buyerId : deal.farmerId;
  const notifyTitle =
    status === 'COMPLETED'
      ? 'Deal Completed! 🎉'
      : status === 'CANCELLED'
      ? 'Deal Cancelled'
      : 'Deal Status Updated';

  const notifyMsg =
    status === 'COMPLETED'
      ? `Deal for ${deal.listing.crop} (${deal.quantityQtl} qtl) has been marked completed.`
      : status === 'CANCELLED'
      ? `Deal for ${deal.listing.crop} was cancelled. Reason: ${cancelReason ?? 'No reason given'}`
      : `Deal status changed to ${status.replace('_', ' ').toLowerCase()}.`;

  await createNotification({
    userId: notifyTargetId,
    type: status === 'COMPLETED' ? 'deal_completed' : 'deal_confirmed',
    title: notifyTitle,
    message: notifyMsg,
    relatedEntityType: 'Deal',
    relatedEntityId: deal.id,
    link: `/deals/${deal.id}`,
  }).catch(() => {});

  successResponse(res, formatDeal(updatedDeal));
}

export async function getDealStats(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  let where: any = {};
  if (userRole === 'FARMER' || userRole === 'FPO') {
    where.farmerId = userId;
  } else if (userRole === 'BUYER') {
    where.buyerId = userId;
  }

  const [totalCount, completedCount, allDeals] = await Promise.all([
    prisma.deal.count({ where }),
    prisma.deal.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.deal.findMany({
      where,
      select: {
        totalValue: true,
        commissionAmount: true,
        agreedPricePerQtl: true,
        quantityQtl: true,
        createdAt: true,
        status: true,
      },
    }),
  ]);

  let totalValue = 0;
  let totalCommission = 0;
  let totalVolumeQtl = 0;

  for (const d of allDeals) {
    if (d.status !== 'CANCELLED') {
      totalValue += parseFloat(String(d.totalValue));
      totalCommission += parseFloat(String(d.commissionAmount));
      totalVolumeQtl += parseFloat(String(d.quantityQtl));
    }
  }

  successResponse(res, {
    totalDeals: totalCount,
    completedDeals: completedCount,
    totalGMV: Math.round(totalValue * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    totalVolumeQtl: Math.round(totalVolumeQtl * 100) / 100,
  });
}
