import { z } from 'zod';

export const waitlistSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number'),
  role: z.enum(['FARMER', 'BUYER', 'FPO']),
  district: z.string().min(2, 'District is required').max(100),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
