import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, parsePagination, buildMeta } from '../../utils/apiResponse';
import { WaitlistInput } from './waitlist.schema';

export async function joinWaitlist(req: Request, res: Response): Promise<void> {
  const data = req.body as WaitlistInput;

  const existing = await prisma.waitlistEntry.findUnique({
    where: { phone: data.phone },
  });

  if (existing) {
    successResponse(res, {
      phone: data.phone,
      message: "You're already registered on the waitlist! We will notify you when MandiMatch launches in your area.",
    });
    return;
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      name: data.name,
      phone: data.phone,
      role: data.role as any,
      district: data.district,
    },
  });

  successResponse(
    res,
    { id: entry.id, name: entry.name, phone: entry.phone },
    201
  );
}

export async function getWaitlist(req: Request, res: Response): Promise<void> {
  const { page, pageSize, skip } = parsePagination(req.query);

  const [entries, total] = await Promise.all([
    prisma.waitlistEntry.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.waitlistEntry.count(),
  ]);

  successResponse(
    res,
    entries.map((e) => ({
      id: e.id,
      name: e.name,
      phone: e.phone,
      role: e.role,
      district: e.district,
      createdAt: e.createdAt.toISOString(),
    })),
    200,
    buildMeta(page, pageSize, total)
  );
}
