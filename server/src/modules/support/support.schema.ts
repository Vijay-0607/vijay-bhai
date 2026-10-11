import { z } from 'zod';

export const createSupportReportSchema = z.object({
  category: z.enum(['ACCOUNT', 'LISTING', 'OFFER', 'PAYMENT', 'SAFETY', 'OTHER']),
  description: z.string().trim().min(10).max(2000),
  dealId: z.string().uuid().optional(),
});

export type CreateSupportReportInput = z.infer<typeof createSupportReportSchema>;
