export const DEFAULT_COMMISSION_RATE = 0.025; // 2.5%

export function calculateDealValue(pricePerQuintal: number, quantityQuintals: number): number {
  if (pricePerQuintal <= 0 || quantityQuintals <= 0) return 0;
  return Math.round(pricePerQuintal * quantityQuintals);
}

export function calculateCommission(
  dealValue: number,
  ratePercent: number = 2.5
): number {
  if (dealValue <= 0 || ratePercent <= 0) return 0;
  return Math.round(dealValue * (ratePercent / 100) * 100) / 100;
}

export function calculateMonthlyProjectedCommission(
  averageDealValue: number,
  dealsPerMonth: number,
  commissionRatePercent: number = 2.5
): number {
  if (averageDealValue <= 0 || dealsPerMonth <= 0 || commissionRatePercent <= 0) return 0;
  const singleDealCommission = calculateCommission(averageDealValue, commissionRatePercent);
  return Math.round(singleDealCommission * dealsPerMonth);
}
