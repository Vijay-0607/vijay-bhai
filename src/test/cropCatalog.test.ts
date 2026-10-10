import { describe, expect, it } from 'vitest';
import { INITIAL_CROP_CATALOGUE, normalizeCropIdentifier, getInitialCropName } from '../data/cropCatalog';
import { CROP_PRICE_DATA } from '../data/mandiPrices';
import { calculateMatchScore, generateSmartMatches } from '../utils/matching';
import type { BuyerDemand, HarvestListing } from '../types';

describe('central crop catalogue', () => {
  it('contains all 93 requested initial crops with unique stable slugs', () => {
    expect(INITIAL_CROP_CATALOGUE).toHaveLength(93);
    expect(new Set(INITIAL_CROP_CATALOGUE.map((crop) => crop.slug)).size).toBe(93);
    expect(new Set(INITIAL_CROP_CATALOGUE.map((crop) => crop.category)).size).toBe(10);
  });

  it('normalizes capitalization, spaces, old values, and registered aliases', () => {
    expect(normalizeCropIdentifier(' TOMATO ')).toBe('tomato');
    expect(normalizeCropIdentifier('BhIndi')).toBe('okra');
    expect(normalizeCropIdentifier('Green_chilli')).toBe('green-chilli');
    expect(normalizeCropIdentifier('dry chilli')).toBe('dry-chilli');
  });

  it('keeps coriander leaves and seed as distinct products', () => {
    expect(normalizeCropIdentifier('coriander leaves')).toBe('coriander-leaves');
    expect(normalizeCropIdentifier('dhania seed')).toBe('coriander-seed');
    expect(normalizeCropIdentifier('coriander leaves')).not.toBe(normalizeCropIdentifier('coriander seed'));
  });

  it('uses English when a selected language has no crop translation', () => {
    expect(getInitialCropName('okra', 'hi')).toBe('भिंडी');
    expect(getInitialCropName('broccoli', 'kn')).toBe('Broccoli');
  });
});

describe('expanded crop marketplace flow', () => {
  const listing: HarvestListing = {
    id: 'new-crop-listing', farmerId: 'farmer-1', farmerName: 'Farmer', farmerRole: 'farmer',
    crop: 'brinjal', quantityQuintals: 40, availableQuantityQuintals: 40,
    expectedHarvestDate: '2026-10-18', askingPricePerQuintal: 1800, district: 'Dharwad', createdAt: '2026-10-10',
  };
  const demand: BuyerDemand = {
    id: 'new-crop-demand', buyerId: 'buyer-1', buyerName: 'Buyer', crop: 'brinjal',
    requiredQuantityQuintals: 25, deliveryDate: '2026-10-20', maxPricePerQuintal: 2000,
    district: 'Hubballi', createdAt: '2026-10-10',
  };

  it('matches the same newly supported crop through the existing fit rules', () => {
    expect(calculateMatchScore(listing, demand).score).toBeGreaterThan(0);
    expect(generateSmartMatches([listing], [demand])).toHaveLength(1);
    expect(generateSmartMatches([listing], [{ ...demand, crop: 'potato' }])).toHaveLength(0);
  });

  it('does not invent price data for crops without a record', () => {
    expect(CROP_PRICE_DATA.brinjal).toBeUndefined();
    expect(generateSmartMatches([listing], [demand])[0].priceComparison).toBe('unavailable');
  });
});
