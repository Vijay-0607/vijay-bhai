import { describe, expect, it } from 'vitest';
import { otpRequestSchema, otpVerifySchema, signupOtpRequestSchema, signupOtpVerifySchema } from '../src/modules/auth/auth.schema';

describe('email OTP login validation', () => {
  it('normalizes a valid email address before it reaches the controller', () => {
    const result = otpRequestSchema.safeParse({ email: '  USER@gmail.com  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('user@gmail.com');
  });

  it('rejects phone identifiers for login OTP requests and verification', () => {
    expect(otpRequestSchema.safeParse({ identifier: '+919876543210' }).success).toBe(false);
    expect(otpVerifySchema.safeParse({ email: '+919876543210', code: '123456' }).success).toBe(false);
    expect(otpVerifySchema.safeParse({ email: 'farmer@gmail.com', code: '12345' }).success).toBe(false);
  });

  it('preserves the phone OTP signup request and verification schemas', () => {
    const signup = { name: 'Lakshmi Devi', identifier: '+919876543210', role: 'FARMER', district: 'Dharwad' };
    expect(signupOtpRequestSchema.safeParse(signup).success).toBe(true);
    expect(signupOtpVerifySchema.safeParse({ identifier: signup.identifier, code: '123456' }).success).toBe(true);
  });
});
