import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, errorResponse } from '../../utils/apiResponse';
import { CreateSupportReportInput } from './support.schema';

export async function getMyReports(req: Request, res: Response): Promise<void> {
  const reports = await prisma.supportReport.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, category: true, description: true, status: true, dealId: true, createdAt: true },
  });
  successResponse(res, { reports });
}

export async function createSupportReport(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateSupportReportInput;
  if (input.dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: input.dealId, OR: [{ farmerId: req.user!.id }, { buyerId: req.user!.id }] },
      select: { id: true },
    });
    if (!deal) {
      errorResponse(res, 404, 'DEAL_NOT_FOUND', 'The selected deal could not be found.');
      return;
    }
  }

  const report = await prisma.supportReport.create({
    data: { userId: req.user!.id, category: input.category, description: input.description, dealId: input.dealId },
    select: { id: true, category: true, description: true, status: true, dealId: true, createdAt: true },
  });
  successResponse(res, { report }, 201);
}
