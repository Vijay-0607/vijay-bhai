import { HarvestListing, BuyerDemand, SmartMatch } from '../types';
import { calculateDistrictFit } from './distance';
import { CROP_PRICE_DATA } from '../data/mandiPrices';
import { classifyPrice } from './priceClassification';
import { calculateDealValue, calculateCommission } from './commission';
import { normalizeCropIdentifier } from '../data/cropCatalog';

export function calculateQtyFit(listingQty: number, demandQty: number): number {
  if (listingQty <= 0 || demandQty <= 0) return 0;
  const ratio = Math.min(listingQty, demandQty) / Math.max(listingQty, demandQty);
  return Math.min(1, Math.max(0, ratio));
}

export function calculatePriceFit(askPrice: number, maxPrice: number): number {
  if (askPrice <= 0 || maxPrice <= 0) return 0;
  if (maxPrice >= askPrice) return 1.0;
  const diffRatio = (askPrice - maxPrice) / askPrice;
  return Math.max(0, 1 - diffRatio);
}

export function calculateDateFit(harvestDateStr: string, deliveryDateStr: string): number {
  try {
    const harvestTime = new Date(harvestDateStr).getTime();
    const deliveryTime = new Date(deliveryDateStr).getTime();
    if (isNaN(harvestTime) || isNaN(deliveryTime)) return 0;
    const daysApart = Math.abs((deliveryTime - harvestTime) / (1000 * 60 * 60 * 24));
    if (daysApart <= 7) return 1.0;
    return Math.max(0, 1 - (daysApart - 7) / 14);
  } catch {
    return 0;
  }
}

export function calculateMatchScore(
  listing: HarvestListing,
  demand: BuyerDemand
): {
  score: number;
  qtyFit: number;
  priceFit: number;
  dateFit: number;
  distFit: number;
} {
  if (normalizeCropIdentifier(listing.crop) !== normalizeCropIdentifier(demand.crop)) {
    return { score: 0, qtyFit: 0, priceFit: 0, dateFit: 0, distFit: 0 };
  }

  const qtyFit = calculateQtyFit(listing.availableQuantityQuintals, demand.requiredQuantityQuintals);
  const priceFit = calculatePriceFit(listing.askingPricePerQuintal, demand.maxPricePerQuintal);
  const dateFit = calculateDateFit(listing.expectedHarvestDate, demand.deliveryDate);
  const distFit = calculateDistrictFit(listing.district, demand.district);

  const rawScore = 40 * qtyFit + 25 * priceFit + 20 * dateFit + 15 * distFit;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    score,
    qtyFit: Math.round(qtyFit * 100) / 100,
    priceFit: Math.round(priceFit * 100) / 100,
    dateFit: Math.round(dateFit * 100) / 100,
    distFit: Math.round(distFit * 100) / 100,
  };
}

export function generateSmartMatches(
  listings: HarvestListing[],
  demands: BuyerDemand[]
): SmartMatch[] {
  const matches: SmartMatch[] = [];

  for (const listing of listings) {
    if (listing.availableQuantityQuintals <= 0) continue;

    for (const demand of demands) {
      if (demand.requiredQuantityQuintals <= 0) continue;
      if (normalizeCropIdentifier(listing.crop) !== normalizeCropIdentifier(demand.crop)) continue;

      const fitResults = calculateMatchScore(listing, demand);

      if (fitResults.score >= 35) {
        const tradeQuantity = Math.min(
          listing.availableQuantityQuintals,
          demand.requiredQuantityQuintals
        );
        const suggestedPrice = Math.round(
          (listing.askingPricePerQuintal + demand.maxPricePerQuintal) / 2
        );
        const dealValue = calculateDealValue(suggestedPrice, tradeQuantity);
        const estimatedCommission = calculateCommission(dealValue, 2.5);

        const cropPrice = CROP_PRICE_DATA[normalizeCropIdentifier(listing.crop)];
        const cropBenchmark = cropPrice?.currentSimulatedPrice;
        const priceComparison = cropBenchmark === undefined ? 'unavailable' : classifyPrice(suggestedPrice, cropBenchmark);

        matches.push({
          id: `match-${listing.id}-${demand.id}`,
          listing,
          demand,
          score: fitResults.score,
          qtyFit: fitResults.qtyFit,
          priceFit: fitResults.priceFit,
          dateFit: fitResults.dateFit,
          distFit: fitResults.distFit,
          tradeQuantity,
          suggestedPrice,
          dealValue,
          estimatedCommission,
          ...(cropBenchmark === undefined ? {} : { mandiBenchmarkPrice: cropBenchmark }),
          priceComparison,
        });
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
