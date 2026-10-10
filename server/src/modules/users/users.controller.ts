import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, errorResponse } from '../../utils/apiResponse';
import { UpdateUserProfileInput } from './users.schema';

function sanitizeUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    district: u.district,
    preferredLanguage: u.preferredLanguage,
    profileDescription: u.profileDescription,
    rating: u.rating,
    completedDealsCount: u.completedDealsCount,
    createdAt: u.createdAt.toISOString(),
  };
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      fpoOwned: true,
      fpoMemberships: { include: { fpo: true } },
    },
  });

  if (!user) {
    errorResponse(res, 404, 'NOT_FOUND', 'User not found');
    return;
  }

  successResponse(res, sanitizeUser(user));
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const input = req.body as UpdateUserProfileInput;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.district !== undefined && { district: input.district }),
      ...(input.preferredLanguage !== undefined && { preferredLanguage: input.preferredLanguage }),
      ...(input.profileDescription !== undefined && { profileDescription: input.profileDescription }),
    },
  });

  successResponse(res, sanitizeUser(updated));
}

export async function getUserPublicProfile(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      role: true,
      district: true,
      rating: true,
      completedDealsCount: true,
      profileDescription: true,
      createdAt: true,
      fpoOwned: { select: { organizationName: true, district: true } },
    },
  });

  if (!user) {
    errorResponse(res, 404, 'NOT_FOUND', 'User not found');
    return;
  }

  successResponse(res, user);
}
