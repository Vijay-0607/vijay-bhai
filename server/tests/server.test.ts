import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/password';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../src/lib/jwt';
import { calculateDistrictFit, calculatePriceFit, calculateDateFit, calculateQtyFit, computeMatch } from '../src/utils/matching';

describe('Backend Auth & Security', () => {
  it('hashes passwords securely and verifies correctly with argon2', async () => {
    const raw = 'SecurePassword123!';
    const hash = await hashPassword(raw);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(raw);
    const isValid = await verifyPassword(hash, raw);
    expect(isValid).toBe(true);
    const isInvalid = await verifyPassword(hash, 'WrongPassword');
    expect(isInvalid).toBe(false);
  });

  it('signs and verifies JWT access and refresh tokens', () => {
    const payload = { id: 'test-user-1', role: 'FARMER' as const, district: 'Dharwad' };
    const access = signAccessToken(payload);
    expect(access).toBeDefined();
    const verifiedAccess = verifyAccessToken(access);
    expect(verifiedAccess.id).toBe(payload.id);
    expect(verifiedAccess.role).toBe(payload.role);

    const refresh = signRefreshToken({ id: 'test-user-1' });
    expect(refresh).toBeDefined();
    const verifiedRefresh = verifyRefreshToken(refresh);
    expect(verifiedRefresh.id).toBe(payload.id);
  });
});

describe('Backend Matching Engine', () => {
  it('scores matching correctly according to the defined formula', () => {
    expect(calculateDistrictFit('Hubballi', 'Dharwad')).toBe(0.95);
    expect(calculateDistrictFit('Hubballi', 'Hubballi')).toBe(1.0);
    expect(calculatePriceFit(2000, 2000)).toBe(1.0);
    expect(calculatePriceFit(2000, 1800)).toBeCloseTo(0.9, 2);
    expect(calculateQtyFit(40, 40)).toBe(1.0);

    const match = computeMatch({
      listing: {
        id: 'l1',
        crop: 'Tomato',
        remainingQuantityQtl: 40,
        askingPricePerQtl: 2000,
        harvestDate: new Date('2026-10-15'),
        district: 'Hubballi',
      },
      demand: {
        id: 'd1',
        crop: 'Tomato',
        remainingQuantityQtl: 40,
        maxPricePerQtl: 2000,
        deliveryDate: new Date('2026-10-17'),
        district: 'Hubballi',
      },
    });

    expect(match).not.toBeNull();
    if (match) {
      expect(match.score).toBe(100);
      expect(match.commissionEstimate).toBeGreaterThan(0);
      expect(match.tradeQuantityQtl).toBe(40);
    }
  });

  it('returns null for mismatched crops', () => {
    const match = computeMatch({
      listing: {
        id: 'l1',
        crop: 'Tomato',
        remainingQuantityQtl: 40,
        askingPricePerQtl: 2000,
        harvestDate: new Date(),
        district: 'Hubballi',
      },
      demand: {
        id: 'd1',
        crop: 'Maize',
        remainingQuantityQtl: 40,
        maxPricePerQtl: 2000,
        deliveryDate: new Date(),
        district: 'Hubballi',
      },
    });
    expect(match).toBeNull();
  });
});
