import { describe, it, expect } from 'vitest';
import {
  calculateQtyFit,
  calculatePriceFit,
  calculateDateFit,
  calculateMatchScore,
  generateSmartMatches,
} from '../utils/matching';
import { HarvestListing, BuyerDemand } from '../types';

describe('Smart Matching Algorithm', () => {
  it('calculates quantity fit correctly', () => {
    expect(calculateQtyFit(40, 40)).toBe(1.0);
    expect(calculateQtyFit(20, 40)).toBe(0.5);
    expect(calculateQtyFit(40, 20)).toBe(0.5);
    expect(calculateQtyFit(0, 50)).toBe(0);
  });

  it('calculates price fit correctly when buyer budget meets or exceeds farmer ask', () => {
    // Buyer willing to pay 2200, farmer asks 2000 -> 1.0 fit
    expect(calculatePriceFit(2000, 2200)).toBe(1.0);
    expect(calculatePriceFit(2000, 2000)).toBe(1.0);
  });

  it('calculates price fit tolerance when buyer budget is lower than ask', () => {
    // Farmer asks 2000, buyer offers 1800 (diff 200 / 2000 = 0.1 -> 0.9 fit)
    expect(calculatePriceFit(2000, 1800)).toBeCloseTo(0.9, 2);
  });

  it('calculates date fit with harvest and delivery alignment', () => {
    const today = new Date().toISOString().split('T')[0];
    const fiveDaysLater = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
    expect(calculateDateFit(today, fiveDaysLater)).toBe(1.0);
  });

  it('computes exact scoring formula: round(40*qtyFit + 25*priceFit + 20*dateFit + 15*distFit)', () => {
    const listing: HarvestListing = {
      id: 'l1',
      farmerId: 'f1',
      farmerName: 'Lakshmi',
      farmerRole: 'farmer',
      crop: 'Tomato',
      quantityQuintals: 30,
      availableQuantityQuintals: 30,
      expectedHarvestDate: '2026-10-20',
      askingPricePerQuintal: 2000,
      district: 'Hubballi',
      createdAt: '2026-10-09',
    };

    const demand: BuyerDemand = {
      id: 'd1',
      buyerId: 'b1',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      requiredQuantityQuintals: 30,
      deliveryDate: '2026-10-22',
      maxPricePerQuintal: 2000,
      district: 'Hubballi',
      createdAt: '2026-10-09',
    };

    const result = calculateMatchScore(listing, demand);
    // Same district = 15, same qty = 40, same price = 25, 2 days gap = 20 -> 100
    expect(result.score).toBe(100);
    expect(result.qtyFit).toBe(1.0);
    expect(result.priceFit).toBe(1.0);
    expect(result.distFit).toBe(1.0);
  });

  it('filters out pairings with different crops', () => {
    const listing: HarvestListing = {
      id: 'l1',
      farmerId: 'f1',
      farmerName: 'Lakshmi',
      farmerRole: 'farmer',
      crop: 'Tomato',
      quantityQuintals: 30,
      availableQuantityQuintals: 30,
      expectedHarvestDate: '2026-10-20',
      askingPricePerQuintal: 2000,
      district: 'Hubballi',
      createdAt: '2026-10-09',
    };

    const demand: BuyerDemand = {
      id: 'd1',
      buyerId: 'b1',
      buyerName: 'Hotel Naveen',
      crop: 'Maize',
      requiredQuantityQuintals: 30,
      deliveryDate: '2026-10-22',
      maxPricePerQuintal: 2000,
      district: 'Hubballi',
      createdAt: '2026-10-09',
    };

    const result = calculateMatchScore(listing, demand);
    expect(result.score).toBe(0);

    const matches = generateSmartMatches([listing], [demand]);
    expect(matches.length).toBe(0);
  });

  it('generates suggested trade price as midpoint and calculates 2.5% commission', () => {
    const listing: HarvestListing = {
      id: 'l1',
      farmerId: 'f1',
      farmerName: 'Lakshmi',
      farmerRole: 'farmer',
      crop: 'Tomato',
      quantityQuintals: 40,
      availableQuantityQuintals: 40,
      expectedHarvestDate: '2026-10-20',
      askingPricePerQuintal: 1900,
      district: 'Hubballi',
      createdAt: '2026-10-09',
    };

    const demand: BuyerDemand = {
      id: 'd1',
      buyerId: 'b1',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      requiredQuantityQuintals: 30,
      deliveryDate: '2026-10-23',
      maxPricePerQuintal: 2100,
      district: 'Hubballi',
      createdAt: '2026-10-09',
    };

    const matches = generateSmartMatches([listing], [demand]);
    expect(matches.length).toBe(1);

    const match = matches[0];
    // Trade quantity = min(40, 30) = 30
    expect(match.tradeQuantity).toBe(30);
    // Suggested price = average(1900, 2100) = 2000
    expect(match.suggestedPrice).toBe(2000);
    // Deal value = 2000 * 30 = 60000
    expect(match.dealValue).toBe(60000);
    // Commission = 60000 * 2.5% = 1500
    expect(match.estimatedCommission).toBe(1500);
  });
});
