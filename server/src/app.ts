import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { successResponse, errorResponse } from './utils/apiResponse';

// Module routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import listingsRoutes from './modules/listings/listings.routes';
import demandsRoutes from './modules/demands/demands.routes';
import matchesRoutes from './modules/matches/matches.routes';
import offersRoutes from './modules/offers/offers.routes';
import dealsRoutes from './modules/deals/deals.routes';
import pricesRoutes from './modules/prices/prices.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import fpoRoutes from './modules/fpo/fpo.routes';
import waitlistRoutes from './modules/waitlist/waitlist.routes';
import cropsRoutes from './modules/crops/crops.routes';
import supportRoutes from './modules/support/support.routes';

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  const allowedOrigins = env.FRONTEND_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parsing & Cookies
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Rate Limiting
  app.use('/api', apiLimiter);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    successResponse(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    });
  });

  // Swagger OpenAPI Documentation
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'MandiMatch API',
        version: '1.0.0',
        description: 'Comprehensive REST API for the MandiMatch agricultural trade platform',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}/api/v1`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ['./src/modules/**/*.routes.ts'],
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/listings', listingsRoutes);
  app.use('/api/v1/demands', demandsRoutes);
  app.use('/api/v1/matches', matchesRoutes);
  app.use('/api/v1/offers', offersRoutes);
  app.use('/api/v1/deals', dealsRoutes);
  app.use('/api/v1/prices', pricesRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/fpo', fpoRoutes);
  app.use('/api/v1/waitlist', waitlistRoutes);
  app.use('/api/v1/crops', cropsRoutes);
  app.use('/api/v1/support/reports', supportRoutes);

  // 404 handler for unknown routes
  app.use((req: Request, res: Response) => {
    errorResponse(res, 404, 'NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`);
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
