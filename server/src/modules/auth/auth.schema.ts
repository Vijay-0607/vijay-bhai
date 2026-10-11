import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    email: z.string().email('Invalid email address').toLowerCase().optional(),
    phone: z
      .string()
      .regex(/^(\+91[\-\s]?)?[6-9]\d{9}$/, 'Invalid Indian mobile number'),
    password: passwordSchema,
    role: z.enum(['FARMER', 'BUYER', 'FPO']),
    district: z.string().min(1, 'District is required').max(100).trim(),
    preferredLanguage: z.enum(['EN', 'HI', 'KN']).default('EN'),
    profileDescription: z.string().max(500).optional(),
  })
  .refine((data) => Boolean(data.phone), { message: 'A phone number is required', path: ['phone'] });

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateUpiSchema = z.object({
  upiId: z.string().trim().regex(/^[\w.-]{2,256}@[\w.-]{2,64}$/, 'Enter a valid UPI ID'),
});

export const otpRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
});

export const otpVerifySchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const signupOtpRequestSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  identifier: z.string().regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, 'A valid Indian mobile number is required'),
  role: z.enum(['FARMER', 'BUYER', 'FPO']),
  district: z.string().min(1).max(100).trim(),
  preferredLanguage: z.enum(['EN', 'HI', 'KN']).default('EN'),
});

export const signupOtpVerifySchema = z.object({
  identifier: z.string().regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, 'A valid Indian mobile number is required'),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
