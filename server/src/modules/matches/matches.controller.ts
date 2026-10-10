import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, errorResponse, parsePagination, buildMeta } from '../../utils/apiResponse';

function formatMatch(m: any) {
  return {
    ...m,
    score: m.score,
    tradeQuantityQtl: parseFloat(m.tradeQuantityQtl),
    suggestedPricePerQtl: parseFloat(m.suggestedPricePerQtl),
    dealValue: parseFloat(m.dealValue),
    commissionEstimate: parseFloat(m.commissionEstimate),
  };
}

const matchInclude = {
  listing: {
    include: { farmer: { select: { id: true, name: true, role: true } } },
  },
  demand: {
    include: { buyer: { select: { id: true, name: true, role: true } } },
  },
};

export async function getMatches(req: Request, res: Response): Promise<void> {
  const { page, pageSize, skip } = parsePagination(req.query as any);
  const userId = req.user?.id;
  const userRole = req.user?.role?.toUpperCase();

  const where: any = { isActive: true, score: { gte: 35 } };

  // Filter matches relevant to the authenticated user's role
  if (userId && userRole === 'FARMER') {
    where.listing = { farmerId: userId };
  } else if (userId && userRole === 'BUYER') {
    where.demand = { buyerId: userId };
  }
  // FPO and admin see all matches

  // Query filters
  if (req.query.minScore) where.score = { gte: parseInt(String(req.query.minScore)) };
  if (req.query.crop) {
    where.listing = { ...(where.listing ?? {}), crop: req.query.crop };
  }

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { score: 'desc' },
      include: matchInclude,
    }),
    prisma.match.count({ where }),
  ]);

  successResponse(res, { matches: matches.map(formatMatch) }, 200, buildMeta(page, pageSize, total));
}

export async function getMatch(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const match = await prisma.match.findUnique({
    where: { id },
    include: matchInclude,
  });

  if (!match || !match.isActive) {
    errorResponse(res, 404, 'NOT_FOUND', 'Match not found');
    return;
  }

  successResponse(res, { match: formatMatch(match) });
}

export async function getMatchesForListing(req: Request, res: Response): Promise<void> {
  const { page, pageSize, skip } = parsePagination(req.query as any);
  const id = req.params.id as string;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) { errorResponse(res, 404, 'NOT_FOUND', 'Listing not found'); return; }

  // Ownership check
  if (req.user && req.user.role.toUpperCase() === 'FARMER' && listing.farmerId !== req.user.id) {
    errorResponse(res, 403, 'FORBIDDEN', 'Access denied');
    return;
  }

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where: { listingId: id, isActive: true },
      skip,
      take: pageSize,
      orderBy: { score: 'desc' },
      include: matchInclude,
    }),
    prisma.match.count({ where: { listingId: id, isActive: true } }),
  ]);

  successResponse(res, { matches: matches.map(formatMatch) }, 200, buildMeta(page, pageSize, total));
}

export async function getMatchesForDemand(req: Request, res: Response): Promise<void> {
  const { page, pageSize, skip } = parsePagination(req.query as any);
  const id = req.params.id as string;

  const demand = await prisma.demand.findUnique({ where: { id } });
  if (!demand) { errorResponse(res, 404, 'NOT_FOUND', 'Demand not found'); return; }

  if (req.user && req.user.role.toUpperCase() === 'BUYER' && demand.buyerId !== req.user.id) {
    errorResponse(res, 403, 'FORBIDDEN', 'Access denied');
    return;
  }

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where: { demandId: id, isActive: true },
      skip,
      take: pageSize,
      orderBy: { score: 'desc' },
      include: matchInclude,
    }),
    prisma.match.count({ where: { demandId: id, isActive: true } }),
  ]);

  successResponse(res, { matches: matches.map(formatMatch) }, 200, buildMeta(page, pageSize, total));
}
