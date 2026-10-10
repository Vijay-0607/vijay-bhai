import { z } from 'zod';

const cropEnum = z.enum(['Tomato', 'Maize', 'Onion', 'Green_chilli']);

export const createPriceAlertSchema = z.object({
  crop: cropEnum,
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
