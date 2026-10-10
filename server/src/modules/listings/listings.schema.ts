import { z } from 'zod';

const cropIdentifier = z.string().trim().min(1).max(120);

export const createListingSchema = z.object({
  crop: cropIdentifier,
  quantityQtl: z.number().positive('Quantity must be positive').max(10000),
  harvestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  askingPricePerQtl: z.number().positive('Price must be positive').max(100000),
  district: z.string().min(1).max(100).trim(),
  description: z.string().max(1000).optional(),
  fpoId: z.string().uuid().optional(),
});

export const updateListingSchema = createListingSchema.partial().extend({
  status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
});

export const listingQuerySchema = z.object({
  crop: cropIdentifier.optional(),
  district: z.string().optional(),
  minQuantity: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  harvestAfter: z.string().optional(),
  harvestBefore: z.string().optional(),
  status: z.enum(['ACTIVE', 'PARTIALLY_RESERVED', 'RESERVED', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['harvestDate', 'askingPricePerQtl', 'quantityQtl', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingQueryInput = z.infer<typeof listingQuerySchema>;
