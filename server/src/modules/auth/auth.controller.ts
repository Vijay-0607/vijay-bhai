import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from '../../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { successResponse, errorResponse } from '../../utils/apiResponse';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { RegisterInput, LoginInput } from './auth.schema';
import argon2 from 'argon2';

const COOKIE_OPTS_ACCESS = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

const COOKIE_OPTS_REFRESH = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
};

function formatUser(user: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  district: string;
  preferredLanguage: string;
  profileDescription: string | null;
  rating: number;
  completedDealsCount: number;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    district: user.district,
    preferredLanguage: user.preferredLanguage,
    profileDescription: user.profileDescription,
    rating: user.rating,
    completedDealsCount: user.completedDealsCount,
    createdAt: user.createdAt,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const data = req.body as RegisterInput;

  // Check for duplicate email / phone
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      // Return generic message to prevent account enumeration
      errorResponse(res, 409, 'IDENTIFIER_TAKEN', 'An account with this email or phone already exists.');
      return;
    }
  }
  if (data.phone) {
    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) {
      errorResponse(res, 409, 'IDENTIFIER_TAKEN', 'An account with this email or phone already exists.');
      return;
    }
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      passwordHash,
      role: data.role as any,
      district: data.district,
      preferredLanguage: (data.preferredLanguage ?? 'EN') as any,
      profileDescription: data.profileDescription ?? null,
    },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      district: true, preferredLanguage: true, profileDescription: true,
      rating: true, completedDealsCount: true, createdAt: true,
    },
  });

  // Issue tokens
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email ?? undefined });
  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, jti });
  const refreshHash = await argon2.hash(refreshToken, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: refreshHash } });

  res.cookie('mm_access', accessToken, COOKIE_OPTS_ACCESS);
  res.cookie('mm_refresh', refreshToken, COOKIE_OPTS_REFRESH);

  logger.info({ userId: user.id, role: user.role }, 'User registered');
  successResponse(res, { user: formatUser(user) }, 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { identifier, password } = req.body as LoginInput;

  const query = identifier.trim().toLowerCase();
  const isEmail = query.includes('@');

  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: query }
      : { phone: query.replace(/[\s\-]/g, '') },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      district: true, preferredLanguage: true, profileDescription: true,
      rating: true, completedDealsCount: true, createdAt: true,
      passwordHash: true, isActive: true,
    },
  });

  // Always run password verification to prevent timing attacks
  const hashToVerify = user?.passwordHash ?? '$argon2id$v=19$m=65536,t=3,p=2$dummy';
  const valid = user ? await verifyPassword(hashToVerify, password) : false;

  if (!user || !valid || !user.isActive) {
    // Generic error to prevent account enumeration
    errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid email/phone or password.');
    return;
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email ?? undefined });
  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, jti });
  const refreshHash = await argon2.hash(refreshToken, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: refreshHash } });

  res.cookie('mm_access', accessToken, COOKIE_OPTS_ACCESS);
  res.cookie('mm_refresh', refreshToken, COOKIE_OPTS_REFRESH);

  logger.info({ userId: user.id }, 'User logged in');
  const { passwordHash: _, ...safeUser } = user;
  successResponse(res, { user: formatUser(safeUser) });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    }).catch(() => {}); // best-effort
    logger.info({ userId }, 'User logged out');
  }

  res.clearCookie('mm_access', { path: '/' });
  res.clearCookie('mm_refresh', { path: '/api/v1/auth' });
  successResponse(res, { message: 'Logged out successfully' });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      district: true, preferredLanguage: true, profileDescription: true,
      rating: true, completedDealsCount: true, createdAt: true,
      isActive: true,
    },
  });

  if (!user) {
    errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    return;
  }

  successResponse(res, { user });
}

export async function refreshTokens(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.['mm_refresh'] as string | undefined;
  if (!token) {
    errorResponse(res, 401, 'UNAUTHENTICATED', 'Refresh token missing');
    return;
  }

  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    errorResponse(res, 401, 'TOKEN_INVALID', 'Refresh token invalid or expired');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, email: true, refreshTokenHash: true, isActive: true },
  });

  if (!user || !user.isActive || !user.refreshTokenHash) {
    errorResponse(res, 401, 'TOKEN_INVALID', 'Session invalidated');
    return;
  }

  // Verify the stored refresh token hash matches
  const valid = await argon2.verify(user.refreshTokenHash, token);
  if (!valid) {
    errorResponse(res, 401, 'TOKEN_INVALID', 'Refresh token mismatch');
    return;
  }

  const newAccess = signAccessToken({ sub: user.id, role: user.role, email: user.email ?? undefined });
  const newJti = crypto.randomUUID();
  const newRefresh = signRefreshToken({ sub: user.id, jti: newJti });
  const newRefreshHash = await argon2.hash(newRefresh, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: newRefreshHash } });

  res.cookie('mm_access', newAccess, COOKIE_OPTS_ACCESS);
  res.cookie('mm_refresh', newRefresh, COOKIE_OPTS_REFRESH);
  successResponse(res, { message: 'Tokens refreshed' });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { identifier } = req.body;
  const query = identifier.trim().toLowerCase();
  const isEmail = query.includes('@');

  const user = await prisma.user.findFirst({
    where: isEmail ? { email: query } : { phone: query },
    select: { id: true, email: true, phone: true },
  });

  // Always return generic response to prevent account enumeration
  const GENERIC_RESPONSE = 'If an account with this identifier exists, a reset link has been sent.';

  if (!user) {
    successResponse(res, { message: GENERIC_RESPONSE });
    return;
  }

  // Generate cryptographically random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: tokenHash, passwordResetExpiresAt: expiresAt },
  });

  // In development: log the token. In production: send via email provider.
  if (env.NODE_ENV !== 'production') {
    logger.info(
      { resetUrl: `http://localhost:5173/reset-password?token=${rawToken}` },
      '[DEV] Password reset URL — do not log in production'
    );
  } else {
    // TODO: Integrate email provider (e.g., Resend, SendGrid, Nodemailer+SMTP)
    // sendResetEmail({ to: user.email, token: rawToken });
    logger.info({ userId: user.id }, 'Password reset requested (email delivery not configured)');
  }

  successResponse(res, { message: GENERIC_RESPONSE });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: tokenHash,
      passwordResetExpiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    errorResponse(res, 400, 'INVALID_TOKEN', 'Password reset token is invalid or has expired.');
    return;
  }

  const passwordHash = await hashPassword(password);

  // Single-use: clear the token on use
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      refreshTokenHash: null, // invalidate all sessions
    },
  });

  logger.info({ userId: user.id }, 'Password reset completed');
  successResponse(res, { message: 'Password updated successfully. Please log in.' });
}
