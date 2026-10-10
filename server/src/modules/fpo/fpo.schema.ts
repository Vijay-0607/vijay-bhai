import { z } from 'zod';

export const createFpoSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').max(150),
  district: z.string().min(2, 'District is required').max(100),
  description: z.string().max(1000).optional(),
});

export const addFpoMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['MEMBER', 'MANAGER']).default('MEMBER'),
});

export type CreateFpoInput = z.infer<typeof createFpoSchema>;
export type AddFpoMemberInput = z.infer<typeof addFpoMemberSchema>;
