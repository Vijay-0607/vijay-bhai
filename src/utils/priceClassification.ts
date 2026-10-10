export type PriceClassification = 'fair' | 'low' | 'high';

export function classifyPrice(price: number, benchmarkPrice: number): PriceClassification {
  if (benchmarkPrice <= 0) return 'fair';
  const ratio = price / benchmarkPrice;

  if (ratio > 1.05) {
    return 'high';
  } else if (ratio < 0.95) {
    return 'low';
  }
  return 'fair';
}

export function getPriceDifferencePercentage(price: number, benchmarkPrice: number): number {
  if (benchmarkPrice <= 0) return 0;
  return Math.round(((price - benchmarkPrice) / benchmarkPrice) * 100 * 10) / 10;
}
