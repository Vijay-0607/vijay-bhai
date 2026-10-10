import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  district: z.string().min(2).max(100).optional(),
  preferredLanguage: z.enum(['EN', 'HI', 'KN']).optional(),
  profileDescription: z.string().max(1000).optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
