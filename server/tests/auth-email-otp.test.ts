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

  it('requires and normalizes an email for signup OTP request and verification', () => {
    const signup = { name: 'Lakshmi Devi', email: '  FARMER@example.com ', role: 'FARMER', district: 'Dharwad' };
    expect(signupOtpRequestSchema.safeParse(signup).success).toBe(true);
    const request = signupOtpRequestSchema.safeParse(signup);
    expect(request.success).toBe(true);
    if (request.success) expect(request.data.email).toBe('farmer@example.com');
    expect(signupOtpVerifySchema.safeParse({ email: signup.email, code: '123456' }).success).toBe(true);
    expect(signupOtpRequestSchema.safeParse({ ...signup, email: '+919876543210' }).success).toBe(false);
  });
});
