import { describe, it, expect } from 'vitest';
import { classifyPrice, getPriceDifferencePercentage } from '../utils/priceClassification';

describe('Price Classification', () => {
  const benchmark = 2000;

  it('classifies price within ±5% as fair', () => {
    expect(classifyPrice(2000, benchmark)).toBe('fair');
    expect(classifyPrice(2050, benchmark)).toBe('fair'); // +2.5%
    expect(classifyPrice(1950, benchmark)).toBe('fair'); // -2.5%
  });

  it('classifies price > 5% above benchmark as high', () => {
    expect(classifyPrice(2150, benchmark)).toBe('high'); // +7.5%
    expect(classifyPrice(2500, benchmark)).toBe('high');
  });

  it('classifies price > 5% below benchmark as low', () => {
    expect(classifyPrice(1850, benchmark)).toBe('low'); // -7.5%
    expect(classifyPrice(1500, benchmark)).toBe('low');
  });

  it('calculates price difference percentage accurately', () => {
    expect(getPriceDifferencePercentage(2200, 2000)).toBe(10);
    expect(getPriceDifferencePercentage(1800, 2000)).toBe(-10);
    expect(getPriceDifferencePercentage(2000, 2000)).toBe(0);
  });
});
