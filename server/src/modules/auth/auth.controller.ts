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

type PhoneOtpProvider = 'msg91' | 'twilio';
type OtpProvider = PhoneOtpProvider | 'email';
type OtpChallenge = { userId: string; codeHash: string | null; provider: OtpProvider; expiresAt: number; attempts: number };
type PendingSignup = {
  name: string;
  email: string | null;
  phone: string | null;
  role: 'FARMER' | 'BUYER' | 'FPO';
  district: string;
  preferredLanguage: 'EN' | 'HI' | 'KN';
};
type SignupOtpChallenge = { signup: PendingSignup; codeHash: string | null; provider: OtpProvider; expiresAt: number; attempts: number };
const otpChallenges = new Map<string, OtpChallenge>();
const signupOtpChallenges = new Map<string, SignupOtpChallenge>();
const OTP_MESSAGE = 'If a registered account exists for this email, a verification code has been sent.';

function parseIdentifier(identifier: string): { kind: 'email' | 'phone'; value: string } | null {
  const value = identifier.trim();
  if (value.includes('@')) {
    const email = value.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { kind: 'email', value: email } : null;
  }
  let phone = value.replace(/[^\d]/g, '');
  if (phone.length === 12 && phone.startsWith('91')) phone = phone.slice(2);
  return /^[6-9]\d{9}$/.test(phone) ? { kind: 'phone', value: phone } : null;
}

function hashOtp(identifier: string, code: string): string {
  return crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update(`${identifier}:${code}`).digest('hex');
}

function phoneProvider(): PhoneOtpProvider | null {
  if (env.MSG91_AUTH_KEY && env.MSG91_OTP_TEMPLATE_ID) return 'msg91';
  if (
    env.TWILIO_ACCOUNT_SID
    && env.TWILIO_VERIFY_SERVICE_SID
    && ((env.TWILIO_API_KEY_SID && env.TWILIO_API_KEY_SECRET) || env.TWILIO_AUTH_TOKEN)
  ) return 'twilio';
  return null;
}

async function deliverOtp(kind: 'email' | 'phone', destination: string, code: string): Promise<OtpProvider> {
  if (kind === 'email') {
    const minutes = env.OTP_EXPIRES_MINUTES;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.OTP_EMAIL_FROM,
        to: [destination],
        subject: 'Your MandiMatch verification code',
        text: `Your MandiMatch verification code is ${code}. It expires in ${minutes} minutes. If you did not request this code, you can ignore this email.`,
      }),
    });
    if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
    return 'email';
  }

  const selectedProvider = phoneProvider();
  if (selectedProvider === 'msg91') {
    const url = new URL('https://control.msg91.com/api/v5/otp');
    url.searchParams.set('template_id', env.MSG91_OTP_TEMPLATE_ID!);
    url.searchParams.set('mobile', `91${destination}`);
    url.searchParams.set('otp_length', '6');
    url.searchParams.set('otp_expiry', String(env.OTP_EXPIRES_MINUTES));
    const response = await fetch(url, {
      method: 'POST',
      headers: { authkey: env.MSG91_AUTH_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const result = await response.json().catch(() => ({})) as { type?: string; message?: string };
    if (!response.ok || result.type?.toLowerCase() !== 'success') {
      throw new Error(`MSG91 OTP send failed (${response.status}): ${result.message ?? 'provider rejected request'}`);
    }
    return 'msg91';
  }

  if (selectedProvider !== 'twilio') throw new Error('No SMS OTP provider is configured.');

  const auth = getTwilioAuthHeader();
  const body = new URLSearchParams({ To: `+91${destination}`, Channel: 'sms' });
  const response = await fetch(`https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/Verifications`, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) throw new Error(`Twilio Verify returned ${response.status}`);
  return 'twilio';
}

function getTwilioAuthHeader(): string {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const apiKeySid = env.TWILIO_API_KEY_SID;
  const apiCredential = apiKeySid ? env.TWILIO_API_KEY_SECRET : env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !apiCredential) throw new Error('Twilio API credentials are not configured.');
  const authUsername = apiKeySid || accountSid;
  return `Basic ${Buffer.from(`${authUsername}:${apiCredential}`).toString('base64')}`;
}

async function verifyTwilioCode(destination: string, code: string): Promise<boolean> {
  const body = new URLSearchParams({ To: `+91${destination}`, Code: code });
  const response = await fetch(`https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`, {
    method: 'POST',
    headers: { Authorization: getTwilioAuthHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) throw new Error(`Twilio Verify check returned ${response.status}`);
  const result = await response.json() as { status?: string };
  return result.status === 'approved';
}

async function verifyMsg91Code(destination: string, code: string): Promise<boolean> {
  const url = new URL('https://control.msg91.com/api/v5/otp/verify');
  url.searchParams.set('mobile', `91${destination}`);
  url.searchParams.set('otp', code);
  const response = await fetch(url, { method: 'GET', headers: { authkey: env.MSG91_AUTH_KEY! } });
  const result = await response.json().catch(() => ({})) as { type?: string; message?: string };
  if (!response.ok) throw new Error(`MSG91 OTP verification returned ${response.status}`);
  const message = result.message?.toLowerCase() ?? '';
  return result.type?.toLowerCase() === 'success'
    || message === 'otp verified success'
    || message === 'number_verified_successfully';
}

async function verifyPhoneCode(provider: PhoneOtpProvider, destination: string, code: string): Promise<boolean> {
  return provider === 'msg91' ? verifyMsg91Code(destination, code) : verifyTwilioCode(destination, code);
}

function providerConfigured(kind: 'email' | 'phone'): boolean {
  return kind === 'email'
    ? Boolean(env.RESEND_API_KEY && env.OTP_EMAIL_FROM)
    : phoneProvider() !== null;
}

function otpProviderSetupMessage(kind: 'email' | 'phone'): string {
  if (kind === 'email') {
    const missing = [
      !env.RESEND_API_KEY ? 'RESEND_API_KEY' : null,
      !env.OTP_EMAIL_FROM ? 'OTP_EMAIL_FROM' : null,
    ].filter((name): name is string => name !== null);
    return `Email OTP delivery is not configured. Set ${missing.join(' and ')} in server/.env${missing.includes('OTP_EMAIL_FROM') ? ' using a sender address or domain verified with Resend' : ''}.`;
  }
  return 'SMS OTP delivery is not configured. Add MSG91 auth key and OTP template ID (or Twilio Verify settings) to the backend environment.';
}

function formatUser(user: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  upiId: string | null;
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
    upiId: user.upiId,
    role: user.role,
    district: user.district,
    preferredLanguage: user.preferredLanguage,
    profileDescription: user.profileDescription,
    rating: user.rating,
    completedDealsCount: user.completedDealsCount,
    createdAt: user.createdAt,
  };
}

export async function requestOtp(req: Request, res: Response): Promise<void> {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    errorResponse(res, 400, 'INVALID_EMAIL', 'Enter a valid email address.');
    return;
  }
  if (!providerConfigured('email')) {
    errorResponse(res, 503, 'OTP_DELIVERY_NOT_CONFIGURED', otpProviderSetupMessage('email'));
    return;
  }

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, isActive: true },
  });
  // Keep the response the same whether or not the account exists.
  if (!user || !user.isActive) {
    successResponse(res, { message: OTP_MESSAGE });
    return;
  }

  const identifierKey = `email:${email}`;
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  try {
    const provider = await deliverOtp('email', email, code);
    otpChallenges.set(identifierKey, {
      userId: user.id,
      codeHash: hashOtp(identifierKey, code),
      provider,
      expiresAt: Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000,
      attempts: 0,
    });
    successResponse(res, { message: OTP_MESSAGE });
  } catch (error) {
    otpChallenges.delete(identifierKey);
    logger.error({ error, channel: 'email' }, 'OTP delivery failed');
    errorResponse(res, 503, 'OTP_DELIVERY_FAILED', 'We could not send the code right now. Please try again shortly.');
  }
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const code = String(req.body.code ?? '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !/^\d{6}$/.test(code)) {
    errorResponse(res, 400, 'INVALID_OTP', 'Enter a valid email address and the 6-digit code.');
    return;
  }

  const identifierKey = `email:${email}`;
  const challenge = otpChallenges.get(identifierKey);
  if (!challenge || challenge.expiresAt <= Date.now()) {
    otpChallenges.delete(identifierKey);
    errorResponse(res, 401, 'OTP_EXPIRED', 'That code has expired. Request a new one.');
    return;
  }
  if (challenge.attempts >= 5) {
    otpChallenges.delete(identifierKey);
    errorResponse(res, 429, 'OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect codes. Request a new OTP.');
    return;
  }

  challenge.attempts += 1;
  let validCode: boolean;
  try {
    const expected = Buffer.from(challenge.codeHash!, 'hex');
    const received = Buffer.from(hashOtp(identifierKey, code), 'hex');
    validCode = crypto.timingSafeEqual(expected, received);
  } catch (error) {
    logger.error({ error, channel: 'email' }, 'OTP verification failed');
    errorResponse(res, 503, 'OTP_VERIFICATION_FAILED', 'We could not verify the code right now. Please try again shortly.');
    return;
  }
  if (!validCode) {
    errorResponse(res, 401, 'OTP_INVALID', 'The verification code is incorrect.');
    return;
  }

  otpChallenges.delete(identifierKey);
  const user = await prisma.user.findUnique({
    where: { id: challenge.userId },
    select: {
      id: true, name: true, email: true, phone: true, upiId: true, role: true,
      district: true, preferredLanguage: true, profileDescription: true,
      rating: true, completedDealsCount: true, createdAt: true, isActive: true, phoneVerifiedAt: true,
    },
  });
  if (!user || !user.isActive) {
    errorResponse(res, 401, 'ACCOUNT_UNAVAILABLE', 'This account is not available.');
    return;
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email ?? undefined });
  const refreshToken = signRefreshToken({ sub: user.id, jti: crypto.randomUUID() });
  const refreshHash = await argon2.hash(refreshToken, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: refreshHash } });
  res.cookie('mm_access', accessToken, COOKIE_OPTS_ACCESS);
  res.cookie('mm_refresh', refreshToken, COOKIE_OPTS_REFRESH);
  logger.info({ userId: user.id, channel: 'email' }, 'User verified with OTP');
  successResponse(res, { user: formatUser(user) });
}

export async function requestSignupOtp(req: Request, res: Response): Promise<void> {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    errorResponse(res, 400, 'INVALID_EMAIL', 'Enter a valid email address.');
    return;
  }
  const existing = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    errorResponse(res, 409, 'IDENTIFIER_TAKEN', 'An account with this email already exists. Sign in instead.');
    return;
  }
  if (!providerConfigured('email')) {
    errorResponse(res, 503, 'OTP_DELIVERY_NOT_CONFIGURED', otpProviderSetupMessage('email'));
    return;
  }

  const key = `email:${email}`;
  const signup: PendingSignup = {
    name: String(req.body.name).trim(),
    email,
    phone: null,
    role: req.body.role,
    district: String(req.body.district).trim(),
    preferredLanguage: req.body.preferredLanguage ?? 'EN',
  };
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  try {
    const provider = await deliverOtp('email', email, code);
    signupOtpChallenges.set(key, {
      signup,
      codeHash: hashOtp(key, code),
      provider,
      expiresAt: Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000,
      attempts: 0,
    });
    successResponse(res, { message: 'A 6-digit verification code was sent to your email address.', expiresInSeconds: env.OTP_EXPIRES_MINUTES * 60 });
  } catch (error) {
    signupOtpChallenges.delete(key);
    logger.error({ error, channel: 'email' }, 'Signup OTP delivery failed');
    errorResponse(res, 503, 'OTP_DELIVERY_FAILED', 'We could not send the code right now. Please try again shortly.');
  }
}

export async function verifySignupOtp(req: Request, res: Response): Promise<void> {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const code = String(req.body.code ?? '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !/^\d{6}$/.test(code)) {
    errorResponse(res, 400, 'INVALID_OTP', 'Enter a valid email address and the 6-digit code.');
    return;
  }
  const key = `email:${email}`;
  const challenge = signupOtpChallenges.get(key);
  if (!challenge || challenge.expiresAt <= Date.now()) {
    signupOtpChallenges.delete(key);
    errorResponse(res, 401, 'OTP_EXPIRED', 'That code has expired. Request a new one.');
    return;
  }
  if (challenge.attempts >= 5) {
    signupOtpChallenges.delete(key);
    errorResponse(res, 429, 'OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect codes. Request a new OTP.');
    return;
  }
  challenge.attempts += 1;
  let validCode: boolean;
  try {
    const expected = Buffer.from(challenge.codeHash!, 'hex');
    const received = Buffer.from(hashOtp(key, code), 'hex');
    validCode = crypto.timingSafeEqual(expected, received);
  } catch (error) {
    logger.error({ error, channel: 'email' }, 'Signup OTP verification failed');
    errorResponse(res, 503, 'OTP_VERIFICATION_FAILED', 'We could not verify the code right now. Please try again shortly.');
    return;
  }
  if (!validCode) {
    errorResponse(res, 401, 'OTP_INVALID', 'The verification code is incorrect.');
    return;
  }
  signupOtpChallenges.delete(key);
  const duplicate = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  if (duplicate) {
    errorResponse(res, 409, 'IDENTIFIER_TAKEN', 'An account with this email or phone already exists.');
    return;
  }

  const passwordHash = await hashPassword(crypto.randomBytes(32).toString('base64url'));
  const user = await prisma.user.create({
    data: { ...challenge.signup, passwordHash },
    select: {
      id: true, name: true, email: true, phone: true, upiId: true, role: true,
      district: true, preferredLanguage: true, profileDescription: true,
      rating: true, completedDealsCount: true, createdAt: true,
    },
  });
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email ?? undefined });
  const refreshToken = signRefreshToken({ sub: user.id, jti: crypto.randomUUID() });
  const refreshHash = await argon2.hash(refreshToken, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: refreshHash } });
  res.cookie('mm_access', accessToken, COOKIE_OPTS_ACCESS);
  res.cookie('mm_refresh', refreshToken, COOKIE_OPTS_REFRESH);
  logger.info({ userId: user.id, role: user.role, channel: 'email' }, 'User registered after OTP verification');
  successResponse(res, { user: formatUser(user) }, 201);
}

export async function register(req: Request, res: Response): Promise<void> {
  // New accounts must use the email OTP signup flow so the address is verified.
  errorResponse(res, 410, 'OTP_SIGNUP_REQUIRED', 'Create your account using the email OTP signup flow.');
  return;

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
      id: true, name: true, email: true, phone: true, upiId: true, role: true,
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
      id: true, name: true, email: true, phone: true, upiId: true, role: true,
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
      id: true, name: true, email: true, phone: true, upiId: true, role: true,
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

export async function updateUpi(req: Request, res: Response): Promise<void> {
  const upiId = (req.body as { upiId: string }).upiId.trim();
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { upiId },
    select: { id: true, upiId: true },
  });
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
