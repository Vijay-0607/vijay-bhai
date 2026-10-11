import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  otpRequestSchema,
  otpVerifySchema,
  signupOtpRequestSchema,
  signupOtpVerifySchema,
  updateUpiSchema,
} from './auth.schema';
import {
  register,
  login,
  logout,
  me,
  refreshTokens,
  forgotPassword,
  resetPassword,
  requestOtp,
  verifyOtp,
  requestSignupOtp,
  verifySignupOtp,
  updateUpi,
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

/** Request a one-time login code over email. */
router.post('/otp/request', authLimiter, validate(otpRequestSchema), requestOtp);

/** Verify an email login code and create a session. */
router.post('/otp/verify', authLimiter, validate(otpVerifySchema), verifyOtp);

/** Start account creation; user is not created until their email or phone OTP is verified. */
router.post('/signup/otp/request', authLimiter, validate(signupOtpRequestSchema), requestSignupOtp);
router.post('/signup/otp/verify', authLimiter, validate(signupOtpVerifySchema), verifySignupOtp);

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
router.patch('/me/upi', authenticate, validate(updateUpiSchema), updateUpi);

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
