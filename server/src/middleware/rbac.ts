import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/apiResponse';

type Role = 'FARMER' | 'BUYER' | 'FPO' | 'ADMIN';

/** Require the user to have one of the specified roles */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 401, 'UNAUTHENTICATED', 'Authentication required');
      return;
    }
    const userRole = req.user.role.toUpperCase() as Role;
    if (!roles.includes(userRole)) {
      errorResponse(
        res,
        403,
        'FORBIDDEN',
        `This action requires one of: ${roles.join(', ')}`
      );
      return;
    }
    next();
  };
}

/** Require admin role */
export const requireAdmin = requireRole('ADMIN');

/** Require farmer or fpo role */
export const requireSeller = requireRole('FARMER', 'FPO');

/** Require buyer role */
export const requireBuyer = requireRole('BUYER');

/** Require FPO or admin role */
export const requireFpo = requireRole('FPO', 'ADMIN');
