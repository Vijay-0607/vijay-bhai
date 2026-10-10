import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { env } from '../config/env';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Log full error internally
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  // Never expose stack traces or internal errors to the client in production
  const message =
    env.NODE_ENV === 'production'
      ? 'An internal error occurred. Please try again later.'
      : err instanceof Error
        ? err.message
        : 'Unknown error';

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}
