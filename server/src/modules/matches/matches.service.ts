import { prisma } from '../../lib/prisma';
import { computeMatch } from '../../utils/matching';
import { logger } from '../../config/logger';

/** Recompute/upsert matches for all active demands when a listing changes */
export async function recomputeMatchesForListing(listingId: string): Promise<void> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true, crop: true, remainingQuantityQtl: true,
      askingPricePerQtl: true, harvestDate: true, district: true, status: true,
    },
  });

  if (!listing || !['ACTIVE', 'PARTIALLY_RESERVED'].includes(listing.status)) {
    // Invalidate existing matches
    await prisma.match.updateMany({ where: { listingId }, data: { isActive: false } });
    return;
  }

  const demands = await prisma.demand.findMany({
    where: { crop: listing.crop, status: { in: ['ACTIVE', 'PARTIALLY_FILLED'] } },
    select: {
      id: true, crop: true, remainingQuantityQtl: true,
      maxPricePerQtl: true, deliveryDate: true, district: true,
    },
  });

  for (const demand of demands) {
    const result = computeMatch({
      listing: {
        id: listing.id,
        crop: listing.crop,
        remainingQuantityQtl: parseFloat(String(listing.remainingQuantityQtl)),
        askingPricePerQtl: parseFloat(String(listing.askingPricePerQtl)),
        harvestDate: listing.harvestDate,
        district: listing.district,
      },
      demand: {
        id: demand.id,
        crop: demand.crop,
        remainingQuantityQtl: parseFloat(String(demand.remainingQuantityQtl)),
        maxPricePerQtl: parseFloat(String(demand.maxPricePerQtl)),
        deliveryDate: demand.deliveryDate,
        district: demand.district,
      },
    });

    if (result) {
      await prisma.match.upsert({
        where: { listingId_demandId: { listingId, demandId: demand.id } },
        create: {
          listingId,
          demandId: demand.id,
          score: result.score,
          qtyFit: result.qtyFit,
          priceFit: result.priceFit,
          dateFit: result.dateFit,
          distFit: result.distFit,
          tradeQuantityQtl: result.tradeQuantityQtl,
          suggestedPricePerQtl: result.suggestedPricePerQtl,
          dealValue: result.dealValue,
          commissionEstimate: result.commissionEstimate,
          isActive: true,
        },
        update: {
          score: result.score,
          qtyFit: result.qtyFit,
          priceFit: result.priceFit,
          dateFit: result.dateFit,
          distFit: result.distFit,
          tradeQuantityQtl: result.tradeQuantityQtl,
          suggestedPricePerQtl: result.suggestedPricePerQtl,
          dealValue: result.dealValue,
          commissionEstimate: result.commissionEstimate,
          isActive: true,
        },
      });
    } else {
      // Score fell below threshold — deactivate
      await prisma.match.updateMany({
        where: { listingId, demandId: demand.id },
        data: { isActive: false },
      });
    }
  }

  logger.debug({ listingId, matchCount: demands.length }, 'Recomputed matches for listing');
}

/** Recompute/upsert matches for all active listings when a demand changes */
export async function recomputeMatchesForDemand(demandId: string): Promise<void> {
  const demand = await prisma.demand.findUnique({
    where: { id: demandId },
    select: {
      id: true, crop: true, remainingQuantityQtl: true,
      maxPricePerQtl: true, deliveryDate: true, district: true, status: true,
    },
  });

  if (!demand || !['ACTIVE', 'PARTIALLY_FILLED'].includes(demand.status)) {
    await prisma.match.updateMany({ where: { demandId }, data: { isActive: false } });
    return;
  }

  const listings = await prisma.listing.findMany({
    where: { crop: demand.crop, status: { in: ['ACTIVE', 'PARTIALLY_RESERVED'] } },
    select: {
      id: true, crop: true, remainingQuantityQtl: true,
      askingPricePerQtl: true, harvestDate: true, district: true,
    },
  });

  for (const listing of listings) {
    const result = computeMatch({
      listing: {
        id: listing.id,
        crop: listing.crop,
        remainingQuantityQtl: parseFloat(String(listing.remainingQuantityQtl)),
        askingPricePerQtl: parseFloat(String(listing.askingPricePerQtl)),
        harvestDate: listing.harvestDate,
        district: listing.district,
      },
      demand: {
        id: demand.id,
        crop: demand.crop,
        remainingQuantityQtl: parseFloat(String(demand.remainingQuantityQtl)),
        maxPricePerQtl: parseFloat(String(demand.maxPricePerQtl)),
        deliveryDate: demand.deliveryDate,
        district: demand.district,
      },
    });

    if (result) {
      await prisma.match.upsert({
        where: { listingId_demandId: { listingId: listing.id, demandId } },
        create: {
          listingId: listing.id,
          demandId,
          score: result.score,
          qtyFit: result.qtyFit,
          priceFit: result.priceFit,
          dateFit: result.dateFit,
          distFit: result.distFit,
          tradeQuantityQtl: result.tradeQuantityQtl,
          suggestedPricePerQtl: result.suggestedPricePerQtl,
          dealValue: result.dealValue,
          commissionEstimate: result.commissionEstimate,
          isActive: true,
        },
        update: {
          score: result.score,
          qtyFit: result.qtyFit,
          priceFit: result.priceFit,
          dateFit: result.dateFit,
          distFit: result.distFit,
          tradeQuantityQtl: result.tradeQuantityQtl,
          suggestedPricePerQtl: result.suggestedPricePerQtl,
          dealValue: result.dealValue,
          commissionEstimate: result.commissionEstimate,
          isActive: true,
        },
      });
    } else {
      await prisma.match.updateMany({
        where: { listingId: listing.id, demandId },
        data: { isActive: false },
      });
    }
  }

  logger.debug({ demandId, matchCount: listings.length }, 'Recomputed matches for demand');
}
