import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';
import {
  register,
  login,
  logout,
  me,
  refreshTokens,
  forgotPassword,
  resetPassword,
} from './auth.controller';

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in
 */
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out (clears cookies)
 */
router.post('/logout', authenticate, logout);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 */
router.get('/me', authenticate, me);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using refresh cookie
 */
router.post('/refresh', refreshTokens);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 */
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 */
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
