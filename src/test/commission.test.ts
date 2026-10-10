import { describe, it, expect } from 'vitest';
import {
  calculateDealValue,
  calculateCommission,
  calculateMonthlyProjectedCommission,
} from '../utils/commission';

describe('Commission Calculations', () => {
  it('calculates total deal value correctly', () => {
    expect(calculateDealValue(2000, 30)).toBe(60000);
    expect(calculateDealValue(1850, 40)).toBe(74000);
    expect(calculateDealValue(0, 30)).toBe(0);
    expect(calculateDealValue(-100, 30)).toBe(0);
  });

  it('calculates platform commission at 2.5% rate', () => {
    // 60,000 * 0.025 = 1,500
    expect(calculateCommission(60000, 2.5)).toBe(1500);
    // 100,000 * 0.025 = 2,500
    expect(calculateCommission(100000, 2.5)).toBe(2500);
  });

  it('supports custom commission rates', () => {
    expect(calculateCommission(100000, 1.5)).toBe(1500);
    expect(calculateCommission(100000, 3.0)).toBe(3000);
  });

  it('calculates monthly projected run-rate accurately', () => {
    // 60,000 deal, 2.5% rate = 1500 per deal. 10 deals = 15,000
    expect(calculateMonthlyProjectedCommission(60000, 10, 2.5)).toBe(15000);
    // 50,000 deal, 2.5% rate = 1250 per deal. 20 deals = 25,000
    expect(calculateMonthlyProjectedCommission(50000, 20, 2.5)).toBe(25000);
  });
});
