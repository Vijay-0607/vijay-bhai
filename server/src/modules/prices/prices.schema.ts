import { z } from 'zod';

const cropIdentifier = z.string().trim().min(1).max(120);

export const upsertMandiPriceSchema = z.object({
  crop: cropIdentifier,
  market: z.string().trim().min(2).max(120),
  district: z.string().trim().min(2).max(100),
  pricePerQtl: z.number().positive().max(100000),
  minPrice: z.number().positive().max(100000).optional(),
  maxPrice: z.number().positive().max(100000).optional(),
  volumeQtl: z.number().int().positive().optional(),
  recordedAt: z.string().datetime().optional(),
});
export type UpsertMandiPriceInput = z.infer<typeof upsertMandiPriceSchema>;

export const createPriceAlertSchema = z.object({
  crop: cropIdentifier,
  targetPricePerQtl: z.number().positive('Target price must be positive').max(100000),
  condition: z.enum(['ABOVE', 'BELOW']),
  district: z.string().min(2).max(100).optional(),
});

export const updatePriceAlertSchema = z.object({
  targetPricePerQtl: z.number().positive('Target price must be positive').max(100000).optional(),
  condition: z.enum(['ABOVE', 'BELOW']).optional(),
  district: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
});

export type CreatePriceAlertInput = z.infer<typeof createPriceAlertSchema>;
export type UpdatePriceAlertInput = z.infer<typeof updatePriceAlertSchema>;
