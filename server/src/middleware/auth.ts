import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../lib/jwt';
import { errorResponse } from '../utils/apiResponse';
import { prisma } from '../lib/prisma';

// Extend Express Request to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email?: string | null;
        phone?: string | null;
        name: string;
      };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.['mm_access'] as string | undefined;

  if (!token) {
    errorResponse(res, 401, 'UNAUTHENTICATED', 'Authentication required');
    return;
  }

  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    errorResponse(res, 401, 'TOKEN_INVALID', 'Session expired or invalid. Please log in again.');
    return;
  }

  // Verify the user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, email: true, phone: true, name: true, isActive: true },
  });

  if (!user || !user.isActive) {
    errorResponse(res, 401, 'USER_NOT_FOUND', 'Session expired or account deactivated. Please log in again.');
    return;
  }

  req.user = { id: user.id, role: user.role, email: user.email, phone: user.phone, name: user.name };
  next();
}

/** Optional auth — attaches user if token present, does not fail if absent */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.['mm_access'] as string | undefined;
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, email: true, phone: true, name: true, isActive: true },
    });
    if (user?.isActive) {
      req.user = { id: user.id, role: user.role, email: user.email, phone: user.phone, name: user.name };
    }
  } catch {
    // Token invalid — continue unauthenticated
  }
  next();
}
