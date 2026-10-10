import { z } from 'zod';

export const createOfferSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID'),
  demandId: z.string().uuid('Invalid demand ID').optional(),
  quantityQtl: z.number().positive('Quantity must be positive').max(10000),
  pricePerQtl: z.number().positive('Price must be positive').max(100000),
  message: z.string().max(500).optional(),
});

export const counterOfferSchema = z.object({
  quantityQtl: z.number().positive('Quantity must be positive').max(10000),
  pricePerQtl: z.number().positive('Price must be positive').max(100000),
  message: z.string().max(500).optional(),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type CounterOfferInput = z.infer<typeof counterOfferSchema>;

/**
 * Offer State Machine:
 * PENDING → ACCEPTED (by farmer)
 * PENDING → REJECTED (by farmer)
 * PENDING → WITHDRAWN (by buyer)
 * PENDING → NEGOTIATING (by farmer counter)
 * NEGOTIATING → ACCEPTED (by whoever's turn it is)
 * NEGOTIATING → REJECTED (by whoever's turn it is)
 * NEGOTIATING → WITHDRAWN (by original sender if buyer's turn)
 * NEGOTIATING → NEGOTIATING (counter again)
 * ACCEPTED → (deal created) — terminal
 * REJECTED → terminal
 * WITHDRAWN → terminal
 */
