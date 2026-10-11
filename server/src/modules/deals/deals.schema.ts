import { z } from 'zod';

export const updateDealStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  cancelReason: z.string().max(500).optional(),
});

export const dealQuerySchema = z.object({
  status: z.enum(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createDealReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
  deliveryOnTime: z.enum(['YES', 'PARTLY', 'NO']),
  qualityMatched: z.enum(['YES', 'PARTLY', 'NO']),
  communication: z.enum(['GREAT', 'OKAY', 'DIFFICULT']),
});

export const createDealPaymentSchema = z.object({
  // Payment destinations come from trusted server configuration, never the buyer's request.
});

export type UpdateDealStatusInput = z.infer<typeof updateDealStatusSchema>;
export type DealQueryInput = z.infer<typeof dealQuerySchema>;
export type CreateDealReviewInput = z.infer<typeof createDealReviewSchema>;
