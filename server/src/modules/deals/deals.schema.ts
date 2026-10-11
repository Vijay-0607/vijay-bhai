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
});

export type UpdateDealStatusInput = z.infer<typeof updateDealStatusSchema>;
export type DealQueryInput = z.infer<typeof dealQuerySchema>;
export type CreateDealReviewInput = z.infer<typeof createDealReviewSchema>;
