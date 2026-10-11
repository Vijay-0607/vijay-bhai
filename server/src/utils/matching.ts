/**
 * District adjacency/fit table — ported from frontend src/utils/distance.ts
 * Policy: same district = 1.0, twin-city pair = 0.95, adjacent = 0.80,
 * unknown = 0.55 (partial score rather than 0 so unsupported pairs still appear)
 */
export function calculateDistrictFit(dist1: string, dist2: string): number {
  const d1 = dist1.split(',')[0].trim().toLowerCase();
  const d2 = dist2.split(',')[0].trim().toLowerCase();

  if (d1 === d2) return 1.0;

  // Hubballi & Dharwad are twin cities (~20 km)
  if (
    (d1 === 'hubballi' && d2 === 'dharwad') ||
    (d1 === 'dharwad' && d2 === 'hubballi')
  ) {
    return 0.95;
  }

  const adjacency: Record<string, string[]> = {
    hubballi: ['dharwad', 'gadag', 'haveri'],
    dharwad: ['hubballi', 'belagavi', 'gadag', 'uttara kannada'],
    gadag: ['hubballi', 'dharwad', 'haveri', 'bagalkot', 'koppal'],
    belagavi: ['dharwad', 'bagalkot', 'uttara kannada'],
    haveri: ['hubballi', 'gadag', 'shivamogga', 'davangere'],
    bagalkot: ['belagavi', 'gadag', 'vijayapura'],
    vijayapura: ['bagalkot'],
    'uttara kannada': ['dharwad', 'belagavi', 'haveri'],
  };

  if (adjacency[d1]?.includes(d2)) return 0.8;

  // Unknown pair: return 0.55 (documented fallback — still eligible for matching)
  return 0.55;
}

export interface MatchScoreResult {
  score: number;
  qtyFit: number;
  priceFit: number;
  dateFit: number;
  distFit: number;
}

export function calculateQtyFit(listingQty: number, demandQty: number): number {
  if (listingQty <= 0 || demandQty <= 0) return 0;
  return Math.min(1, Math.max(0, Math.min(listingQty, demandQty) / Math.max(listingQty, demandQty)));
}

export function calculatePriceFit(askPrice: number, maxPrice: number): number {
  if (askPrice <= 0 || maxPrice <= 0) return 0;
  if (maxPrice >= askPrice) return 1.0;
  const diffRatio = (askPrice - maxPrice) / askPrice;
  return Math.max(0, 1 - diffRatio);
}

export function calculateDateFit(harvestDate: Date | string, deliveryDate: Date | string): number {
  try {
    const h = new Date(harvestDate).getTime();
    const d = new Date(deliveryDate).getTime();
    if (isNaN(h) || isNaN(d)) return 0;
    const daysApart = Math.abs((d - h) / (1000 * 60 * 60 * 24));
    if (daysApart <= 7) return 1.0;
    return Math.max(0, 1 - (daysApart - 7) / 14);
  } catch {
    return 0;
  }
}

export interface MatchInput {
  listing: {
    id: string;
    crop: string;
    remainingQuantityQtl: number;
    askingPricePerQtl: number;
    harvestDate: Date;
    district: string;
  };
  demand: {
    id: string;
    crop: string;
    remainingQuantityQtl: number;
    maxPricePerQtl: number;
    deliveryDate: Date;
    district: string;
  };
}

export interface MatchOutput extends MatchScoreResult {
  matchId: string;
  listingId: string;
  demandId: string;
  tradeQuantityQtl: number;
  suggestedPricePerQtl: number;
  dealValue: number;
  commissionEstimate: number;
}

export const MIN_MATCH_SCORE = 35;
export const COMMISSION_RATE = 0.025;

export function computeMatch({ listing, demand }: MatchInput): MatchOutput | null {
  // Must match on exact crop type
  if (listing.crop !== demand.crop) return null;
  if (listing.remainingQuantityQtl <= 0 || demand.remainingQuantityQtl <= 0) return null;

  const qtyFit = calculateQtyFit(listing.remainingQuantityQtl, demand.remainingQuantityQtl);
  const priceFit = calculatePriceFit(listing.askingPricePerQtl, demand.maxPricePerQtl);
  const dateFit = calculateDateFit(listing.harvestDate, demand.deliveryDate);
  const distFit = calculateDistrictFit(listing.district, demand.district);

  const rawScore = 40 * qtyFit + 25 * priceFit + 20 * dateFit + 15 * distFit;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  if (score < MIN_MATCH_SCORE) return null;

  const tradeQuantityQtl = Math.min(listing.remainingQuantityQtl, demand.remainingQuantityQtl);
  const suggestedPricePerQtl = Math.round((listing.askingPricePerQtl + demand.maxPricePerQtl) / 2);
  const dealValue = Math.round(tradeQuantityQtl * suggestedPricePerQtl);
  const commissionEstimate = Math.round(dealValue * COMMISSION_RATE * 100) / 100;

  return {
    matchId: `match-${listing.id}-${demand.id}`,
    listingId: listing.id,
    demandId: demand.id,
    score,
    qtyFit: Math.round(qtyFit * 100) / 100,
    priceFit: Math.round(priceFit * 100) / 100,
    dateFit: Math.round(dateFit * 100) / 100,
    distFit: Math.round(distFit * 100) / 100,
    tradeQuantityQtl,
    suggestedPricePerQtl,
    dealValue,
    commissionEstimate,
  };
}
