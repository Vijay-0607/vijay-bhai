import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, errorResponse } from '../../utils/apiResponse';
import { CreateFpoInput, AddFpoMemberInput } from './fpo.schema';

export async function createFpo(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const data = req.body as CreateFpoInput;

  const existing = await prisma.fPO.findUnique({
    where: { ownerUserId: userId },
  });

  if (existing) {
    errorResponse(res, 409, 'CONFLICT', 'You already own an FPO organization');
    return;
  }

  const fpo = await prisma.fPO.create({
    data: {
      ownerUserId: userId,
      organizationName: data.organizationName,
      district: data.district,
      description: data.description ?? null,
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    include: {
      owner: { select: { id: true, name: true, phone: true } },
      members: { include: { user: { select: { id: true, name: true, phone: true, district: true } } } },
    },
  });

  successResponse(res, fpo, 201);
}

export async function getMyFpo(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  const fpo = await prisma.fPO.findFirst({
    where: {
      OR: [
        { ownerUserId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, phone: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              district: true,
              rating: true,
              completedDealsCount: true,
            },
          },
        },
      },
    },
  });

  if (!fpo) {
    errorResponse(res, 404, 'NOT_FOUND', 'No FPO found for this user');
    return;
  }

  successResponse(res, fpo);
}

export async function addFpoMember(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const fpoId = req.params.fpoId as string;
  const data = req.body as AddFpoMemberInput;

  const fpo = await prisma.fPO.findUnique({
    where: { id: fpoId },
  });

  if (!fpo || fpo.ownerUserId !== userId) {
    errorResponse(res, 403, 'FORBIDDEN', 'Only the FPO owner can add members');
    return;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!targetUser) {
    errorResponse(res, 404, 'NOT_FOUND', 'User not found');
    return;
  }

  const membership = await prisma.fPOMembership.upsert({
    where: {
      fpoId_userId: {
        fpoId,
        userId: data.userId,
      },
    },
    update: { role: data.role },
    create: {
      fpoId,
      userId: data.userId,
      role: data.role,
    },
    include: {
      user: { select: { id: true, name: true, phone: true, district: true } },
    },
  });

  successResponse(res, membership);
}

export async function removeFpoMember(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const fpoId = req.params.fpoId as string;
  const memberUserId = req.params.memberUserId as string;

  const fpo = await prisma.fPO.findUnique({
    where: { id: fpoId },
  });

  if (!fpo || fpo.ownerUserId !== userId) {
    errorResponse(res, 403, 'FORBIDDEN', 'Only the FPO owner can remove members');
    return;
  }

  if (memberUserId === fpo.ownerUserId) {
    errorResponse(res, 400, 'BAD_REQUEST', 'Cannot remove the FPO owner');
    return;
  }

  await prisma.fPOMembership.deleteMany({
    where: { fpoId, userId: memberUserId },
  });

  successResponse(res, { success: true });
}
