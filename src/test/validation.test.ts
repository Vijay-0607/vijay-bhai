import { describe, it, expect } from 'vitest';
import {
  validateEmailOrPhone,
  validatePassword,
  validateNumberPositive,
  validateDateNotPast,
} from '../utils/validation';

describe('Input Validations', () => {
  it('validates email addresses', () => {
    expect(validateEmailOrPhone('test@mandimatch.demo').isValid).toBe(true);
    expect(validateEmailOrPhone('farmer@gmail.com').isValid).toBe(true);
    expect(validateEmailOrPhone('').isValid).toBe(false);
  });

  it('validates 10-digit Indian phone numbers', () => {
    expect(validateEmailOrPhone('9845012345').isValid).toBe(true);
    expect(validateEmailOrPhone('+919845012345').isValid).toBe(true);
    expect(validateEmailOrPhone('123').isValid).toBe(false);
  });

  it('validates passwords with minimum 6 characters', () => {
    expect(validatePassword('secret123').isValid).toBe(true);
    expect(validatePassword('12345').isValid).toBe(false);
    expect(validatePassword('').isValid).toBe(false);
  });

  it('validates positive numbers', () => {
    expect(validateNumberPositive(50, 'Quantity').isValid).toBe(true);
    expect(validateNumberPositive(0, 'Quantity').isValid).toBe(false);
    expect(validateNumberPositive(-5, 'Price').isValid).toBe(false);
  });

  it('validates future dates', () => {
    const future = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
    const past = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];

    expect(validateDateNotPast(future, 'Harvest Date').isValid).toBe(true);
    expect(validateDateNotPast(past, 'Harvest Date').isValid).toBe(false);
    expect(validateDateNotPast('', 'Date').isValid).toBe(false);
  });
});
