import { z } from 'zod';

const cropEnum = z.enum(['Tomato', 'Maize', 'Onion', 'Green_chilli']);

export const createDemandSchema = z.object({
  crop: cropEnum,
  quantityQtl: z.number().positive('Quantity must be positive').max(10000),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  maxPricePerQtl: z.number().positive('Max price must be positive').max(100000),
  district: z.string().min(1).max(100).trim(),
  description: z.string().max(1000).optional(),
});

export const updateDemandSchema = createDemandSchema.partial().extend({
  status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
});

export const demandQuerySchema = z.object({
  crop: cropEnum.optional(),
  district: z.string().optional(),
  minQuantity: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  deliveryAfter: z.string().optional(),
  deliveryBefore: z.string().optional(),
  status: z.enum(['ACTIVE', 'PARTIALLY_FILLED', 'FULFILLED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['deliveryDate', 'maxPricePerQtl', 'quantityQtl', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateDemandInput = z.infer<typeof createDemandSchema>;
export type UpdateDemandInput = z.infer<typeof updateDemandSchema>;
export type DemandQueryInput = z.infer<typeof demandQuerySchema>;
