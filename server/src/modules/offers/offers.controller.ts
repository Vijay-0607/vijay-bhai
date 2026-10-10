import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, errorResponse, parsePagination, buildMeta } from '../../utils/apiResponse';
import { createNotification } from '../notifications/notifications.service';
import { CreateOfferInput, CounterOfferInput } from './offers.schema';
import { COMMISSION_RATE } from '../../utils/matching';
import { Decimal } from '@prisma/client/runtime/library';

const OFFER_INCLUDE = {
  listing: { select: { id: true, crop: true, district: true, farmer: { select: { id: true, name: true } } } },
  demand: { select: { id: true, crop: true, district: true, buyer: { select: { id: true, name: true } } } },
  farmer: { select: { id: true, name: true } },
  buyer: { select: { id: true, name: true } },
  history: { orderBy: { createdAt: 'asc' as const } },
};

function formatOffer(o: any) {
  return {
    ...o,
    quantityQtl: parseFloat(o.quantityQtl),
    pricePerQtl: parseFloat(o.pricePerQtl),
    totalValue: parseFloat(o.totalValue),
    commission: parseFloat(o.commission),
  };
}

export async function createOffer(req: Request, res: Response): Promise<void> {
  const data = req.body as CreateOfferInput;
  const buyerId = req.user!.id;
  const buyerName = req.user!.name;

  // Verify listing exists and is available
  const listing = await prisma.listing.findUnique({
    where: { id: data.listingId },
    select: {
      id: true, farmerId: true, crop: true,
      remainingQuantityQtl: true, status: true, district: true,
      farmer: { select: { name: true } },
    },
  });

  if (!listing || !['ACTIVE', 'PARTIALLY_RESERVED'].includes(listing.status)) {
    errorResponse(res, 404, 'LISTING_UNAVAILABLE', 'Listing not found or no longer available');
    return;
  }

  // Verify buyer is not the listing owner
  if (listing.farmerId === buyerId) {
    errorResponse(res, 403, 'FORBIDDEN', 'You cannot make an offer on your own listing');
    return;
  }

  // Verify demand if provided
  if (data.demandId) {
    const demand = await prisma.demand.findUnique({
      where: { id: data.demandId },
      select: { buyerId: true, crop: true, status: true },
    });
    if (!demand || demand.buyerId !== buyerId) {
      errorResponse(res, 403, 'FORBIDDEN', 'Demand does not belong to you');
      return;
    }
    if (demand.crop !== listing.crop) {
      errorResponse(res, 409, 'CROP_MISMATCH', 'Demand crop does not match listing crop');
      return;
    }
  }

  // Check requested quantity is available
  const remaining = parseFloat(String(listing.remainingQuantityQtl));
  if (data.quantityQtl > remaining) {
    errorResponse(res, 409, 'INSUFFICIENT_QUANTITY', `Only ${remaining} quintals available`);
    return;
  }

  const totalValue = data.quantityQtl * data.pricePerQtl;
  const commission = Math.round(totalValue * COMMISSION_RATE * 100) / 100;

  const offer = await prisma.$transaction(async (tx) => {
    const newOffer = await tx.offer.create({
      data: {
        listingId: data.listingId,
        demandId: data.demandId ?? null,
        farmerId: listing.farmerId,
        buyerId,
        quantityQtl: data.quantityQtl,
        pricePerQtl: data.pricePerQtl,
        totalValue,
        commission,
        message: data.message ?? null,
        status: 'PENDING',
        currentTurnId: listing.farmerId, // Farmer responds first
      },
      include: OFFER_INCLUDE,
    });

    await tx.offerHistory.create({
      data: {
        offerId: newOffer.id,
        senderId: buyerId,
        pricePerQtl: data.pricePerQtl,
        quantityQtl: data.quantityQtl,
        note: data.message || 'Initial offer',
        statusSnapshot: 'PENDING',
      },
    });

    return newOffer;
  });

  // Notify farmer
  await createNotification({
    userId: listing.farmerId,
    type: 'new_offer',
    title: `New Offer for ${listing.crop}`,
    message: `${buyerName} offered ₹${data.pricePerQtl}/q for ${data.quantityQtl} quintals.`,
    relatedEntityType: 'Offer',
    relatedEntityId: offer.id,
    link: '/app/dashboard',
  });

  successResponse(res, { offer: formatOffer(offer) }, 201);
}

export async function getOffers(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { page, pageSize, skip } = parsePagination(req.query as any);
  const role = req.user!.role.toUpperCase();

  const where: any = role === 'FARMER'
    ? { farmerId: userId }
    : role === 'BUYER'
    ? { buyerId: userId }
    : {};

  if (req.query.status) where.status = req.query.status;

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: OFFER_INCLUDE,
    }),
    prisma.offer.count({ where }),
  ]);

  successResponse(res, { offers: offers.map(formatOffer) }, 200, buildMeta(page, pageSize, total));
}

export async function getOffer(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: OFFER_INCLUDE,
  });

  if (!offer) { errorResponse(res, 404, 'NOT_FOUND', 'Offer not found'); return; }
  if (offer.farmerId !== userId && offer.buyerId !== userId) {
    errorResponse(res, 403, 'FORBIDDEN', 'Access denied');
    return;
  }

  successResponse(res, { offer: formatOffer(offer) });
}

export async function counterOffer(req: Request, res: Response): Promise<void> {
  const data = req.body as CounterOfferInput;
  const userId = req.user!.id;
  const id = req.params.id as string;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { farmer: { select: { name: true } }, buyer: { select: { name: true } } },
  });

  if (!offer) { errorResponse(res, 404, 'NOT_FOUND', 'Offer not found'); return; }
  if (offer.farmerId !== userId && offer.buyerId !== userId) {
    errorResponse(res, 403, 'FORBIDDEN', 'Access denied');
    return;
  }

  // Validate turn
  if (offer.currentTurnId !== userId) {
    errorResponse(res, 409, 'NOT_YOUR_TURN', 'It is not your turn to respond');
    return;
  }

  // Only PENDING or NEGOTIATING can be countered
  if (!['PENDING', 'NEGOTIATING'].includes(offer.status)) {
    errorResponse(res, 409, 'INVALID_STATE', `Cannot counter a ${offer.status.toLowerCase()} offer`);
    return;
  }

  // Verify quantity still available
  const listing = await prisma.listing.findUnique({
    where: { id: offer.listingId },
    select: { remainingQuantityQtl: true },
  });
  if (!listing || parseFloat(String(listing.remainingQuantityQtl)) < data.quantityQtl) {
    errorResponse(res, 409, 'INSUFFICIENT_QUANTITY', 'Requested quantity no longer available');
    return;
  }

  const nextTurnId = userId === offer.farmerId ? offer.buyerId : offer.farmerId;
  const totalValue = data.quantityQtl * data.pricePerQtl;
  const commission = Math.round(totalValue * COMMISSION_RATE * 100) / 100;

  const senderName = userId === offer.farmerId ? offer.farmer.name : offer.buyer.name;

  await prisma.$transaction(async (tx) => {
    await tx.offer.update({
      where: { id: offer.id },
      data: {
        quantityQtl: data.quantityQtl,
        pricePerQtl: data.pricePerQtl,
        totalValue,
        commission,
        status: 'NEGOTIATING',
        currentTurnId: nextTurnId,
        message: data.message ?? offer.message,
      },
    });

    await tx.offerHistory.create({
      data: {
        offerId: offer.id,
        senderId: userId,
        pricePerQtl: data.pricePerQtl,
        quantityQtl: data.quantityQtl,
        note: data.message || 'Counteroffer',
        statusSnapshot: 'NEGOTIATING',
      },
    });
  });

  await createNotification({
    userId: nextTurnId,
    type: 'counteroffer_received',
    title: `Counteroffer Received`,
    message: `${senderName} proposed ₹${data.pricePerQtl}/q for ${data.quantityQtl} quintals.`,
    relatedEntityType: 'Offer',
    relatedEntityId: offer.id,
    link: '/app/dashboard',
  });

  const updated = await prisma.offer.findUnique({ where: { id: offer.id }, include: OFFER_INCLUDE });
  successResponse(res, { offer: formatOffer(updated) });
}

export async function acceptOffer(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      farmer: { select: { name: true } },
      buyer: { select: { name: true } },
      deal: true,
    },
  });

  if (!offer) { errorResponse(res, 404, 'NOT_FOUND', 'Offer not found'); return; }
  if (offer.farmerId !== userId && offer.buyerId !== userId) {
    errorResponse(res, 403, 'FORBIDDEN', 'Access denied');
    return;
  }

  if (offer.currentTurnId !== userId) {
    errorResponse(res, 409, 'NOT_YOUR_TURN', 'It is not your turn to accept');
    return;
  }

  if (!['PENDING', 'NEGOTIATING'].includes(offer.status)) {
    errorResponse(res, 409, 'INVALID_STATE', `Cannot accept a ${offer.status.toLowerCase()} offer`);
    return;
  }

  // Prevent duplicate deal
  if (offer.deal) {
    errorResponse(res, 409, 'DEAL_EXISTS', 'A deal already exists for this offer');
    return;
  }

  const actorName = userId === offer.farmerId ? offer.farmer.name : offer.buyer.name;
  const notifyUserId = userId === offer.farmerId ? offer.buyerId : offer.farmerId;

  // Atomic transaction: verify quantity, create deal, update quantities
  const deal = await prisma.$transaction(async (tx) => {
    // Lock listing for update
    const listing = await tx.listing.findUnique({
      where: { id: offer.listingId },
      select: { id: true, remainingQuantityQtl: true, status: true, crop: true },
    });

    if (!listing || !['ACTIVE', 'PARTIALLY_RESERVED'].includes(listing.status)) {
      throw new Error('LISTING_UNAVAILABLE');
    }

    const remaining = parseFloat(String(listing.remainingQuantityQtl));
    const qty = parseFloat(String(offer.quantityQtl));
    if (qty > remaining) {
      throw new Error('INSUFFICIENT_QUANTITY');
    }

    // Update offer
    await tx.offer.update({
      where: { id: offer.id },
      data: { status: 'ACCEPTED', currentTurnId: 'none' },
    });

    await tx.offerHistory.create({
      data: {
        offerId: offer.id,
        senderId: userId,
        pricePerQtl: offer.pricePerQtl,
        quantityQtl: offer.quantityQtl,
        note: 'Offer accepted',
        statusSnapshot: 'ACCEPTED',
      },
    });

    // Create deal
    const agreedPrice = parseFloat(String(offer.pricePerQtl));
    const totalValue = Math.round(qty * agreedPrice * 100) / 100;
    const commissionAmount = Math.round(totalValue * COMMISSION_RATE * 100) / 100;

    const newDeal = await tx.deal.create({
      data: {
        listingId: offer.listingId,
        demandId: offer.demandId ?? undefined,
        offerId: offer.id,
        farmerId: offer.farmerId,
        buyerId: offer.buyerId,
        quantityQtl: qty,
        agreedPricePerQtl: agreedPrice,
        totalValue,
        commissionRate: COMMISSION_RATE,
        commissionAmount,
      },
    });

    // Update listing remaining quantity
    const newRemaining = remaining - qty;
    const newListingStatus = newRemaining <= 0 ? 'RESERVED' : 'PARTIALLY_RESERVED';
    await tx.listing.update({
      where: { id: offer.listingId },
      data: { remainingQuantityQtl: Math.max(0, newRemaining), status: newListingStatus },
    });

    // Update demand remaining quantity if present
    if (offer.demandId) {
      const demand = await tx.demand.findUnique({
        where: { id: offer.demandId },
        select: { remainingQuantityQtl: true },
      });
      if (demand) {
        const dRemaining = parseFloat(String(demand.remainingQuantityQtl)) - qty;
        const dStatus = dRemaining <= 0 ? 'FULFILLED' : 'PARTIALLY_FILLED';
        await tx.demand.update({
          where: { id: offer.demandId },
          data: { remainingQuantityQtl: Math.max(0, dRemaining), status: dStatus },
        });
      }
    }

    return newDeal;
  }).catch((err: Error) => {
    if (err.message === 'LISTING_UNAVAILABLE') {
      errorResponse(res, 409, 'LISTING_UNAVAILABLE', 'Listing no longer available');
      return null;
    }
    if (err.message === 'INSUFFICIENT_QUANTITY') {
      errorResponse(res, 409, 'INSUFFICIENT_QUANTITY', 'Insufficient quantity remaining');
      return null;
    }
    throw err;
  });

  if (!deal) return;

  await createNotification({
    userId: notifyUserId,
    type: 'deal_confirmed',
    title: 'Offer Accepted — Deal Confirmed!',
    message: `${actorName} accepted the offer. Deal confirmed for ${offer.quantityQtl} quintals at ₹${offer.pricePerQtl}/q.`,
    relatedEntityType: 'Deal',
    relatedEntityId: deal.id,
    link: '/app/dashboard',
  });

  successResponse(res, { deal, message: 'Offer accepted and deal created' });
}

export async function rejectOffer(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { message } = req.body;
  const id = req.params.id as string;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { farmer: { select: { name: true } }, buyer: { select: { name: true } } },
  });

  if (!offer) { errorResponse(res, 404, 'NOT_FOUND', 'Offer not found'); return; }
  if (offer.farmerId !== userId && offer.buyerId !== userId) {
    errorResponse(res, 403, 'FORBIDDEN', 'Access denied');
    return;
  }

  if (offer.currentTurnId !== userId) {
    errorResponse(res, 409, 'NOT_YOUR_TURN', 'It is not your turn to reject');
    return;
  }

  if (!['PENDING', 'NEGOTIATING'].includes(offer.status)) {
    errorResponse(res, 409, 'INVALID_STATE', `Cannot reject a ${offer.status.toLowerCase()} offer`);
    return;
  }

  const actorName = userId === offer.farmerId ? offer.farmer.name : offer.buyer.name;
  const notifyUserId = userId === offer.farmerId ? offer.buyerId : offer.farmerId;

  await prisma.$transaction(async (tx) => {
    await tx.offer.update({
      where: { id: offer.id },
      data: { status: 'REJECTED', currentTurnId: 'none' },
    });
    await tx.offerHistory.create({
      data: {
        offerId: offer.id,
        senderId: userId,
        pricePerQtl: offer.pricePerQtl,
        quantityQtl: offer.quantityQtl,
        note: message || 'Offer rejected',
        statusSnapshot: 'REJECTED',
      },
    });
  });

  await createNotification({
    userId: notifyUserId,
    type: 'offer_rejected',
    title: 'Offer Declined',
    message: `${actorName} declined the offer for ${offer.quantityQtl} quintals.`,
    relatedEntityType: 'Offer',
    relatedEntityId: offer.id,
    link: '/app/dashboard',
  });

  const updated = await prisma.offer.findUnique({ where: { id: offer.id }, include: OFFER_INCLUDE });
  successResponse(res, { offer: formatOffer(updated) });
}

export async function withdrawOffer(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { farmer: { select: { name: true } }, buyer: { select: { name: true } } },
  });

  if (!offer) { errorResponse(res, 404, 'NOT_FOUND', 'Offer not found'); return; }

  // Only the buyer who created the offer can withdraw it
  if (offer.buyerId !== userId) {
    errorResponse(res, 403, 'FORBIDDEN', 'Only the offer sender can withdraw');
    return;
  }

  if (!['PENDING', 'NEGOTIATING'].includes(offer.status)) {
    errorResponse(res, 409, 'INVALID_STATE', `Cannot withdraw a ${offer.status.toLowerCase()} offer`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.offer.update({
      where: { id: offer.id },
      data: { status: 'WITHDRAWN', currentTurnId: 'none' },
    });
    await tx.offerHistory.create({
      data: {
        offerId: offer.id,
        senderId: userId,
        pricePerQtl: offer.pricePerQtl,
        quantityQtl: offer.quantityQtl,
        note: 'Offer withdrawn',
        statusSnapshot: 'WITHDRAWN',
      },
    });
  });

  const updated = await prisma.offer.findUnique({ where: { id: offer.id }, include: OFFER_INCLUDE });
  successResponse(res, { offer: formatOffer(updated) });
}

export async function getOfferHistory(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { history: { orderBy: { createdAt: 'asc' } } },
  });

  if (!offer) { errorResponse(res, 404, 'NOT_FOUND', 'Offer not found'); return; }
  if (offer.farmerId !== userId && offer.buyerId !== userId) {
    errorResponse(res, 403, 'FORBIDDEN', 'Access denied');
    return;
  }

  successResponse(res, { history: (offer.history || []).map((h: any) => ({
    ...h,
    pricePerQtl: parseFloat(String(h.pricePerQtl)),
    quantityQtl: parseFloat(String(h.quantityQtl)),
  })) });
}
