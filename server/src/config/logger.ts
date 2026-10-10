import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  // Never log sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash', 'token', 'resetToken'],
    censor: '[REDACTED]',
  },
});
