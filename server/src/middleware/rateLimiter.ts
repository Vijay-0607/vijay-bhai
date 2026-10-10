import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/apiResponse';
import { Request, Response } from 'express';

function rateLimitHandler(_req: Request, res: Response) {
  errorResponse(res, 429, 'RATE_LIMITED', 'Too many requests. Please slow down and try again.');
}

/** Strict limiter for auth endpoints (login, register, forgot-password) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
});

/** General API limiter */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/** Strict limiter for waitlist (public endpoint) */
export const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
