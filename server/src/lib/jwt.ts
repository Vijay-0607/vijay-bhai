import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;       // userId
  role: string;
  email?: string;
  phone?: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;       // unique token ID for invalidation
  type: 'refresh';
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload & AccessTokenPayload;
  if (decoded.type !== 'access') throw new Error('Invalid token type');
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload & RefreshTokenPayload;
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  return decoded;
}
