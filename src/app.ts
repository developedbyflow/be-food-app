/**
 * Express Application Configuration
 * Purpose: Configures the Express app instance
 * Responsibility: Middleware, routes, error handling
 * Focus: "What the app does"
 */

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Import middleware
import { errorHandler } from '../src/middlewares/errorHandler.ts';
import { httpLoggerWithSkip } from '../src/middlewares/loggerHandler.ts';
import { notFoundHandler } from '../src/middlewares/notFoundHandler.ts';
// Import routes
import apiV1Routes from './routes/v1/index.ts';
// Import custom errors
import { ConfigurationError } from './utils/customErrors.js';
import { pool } from '../database/scripts/connection.ts';

const app = express();

// ===== SECURITY MIDDLEWARE (FIRST) =====
try {
  // Set various HTTP headers to help protect the app
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    })
  );

  // Enable CORS for all routes
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin) {
    throw new ConfigurationError(
      'CORS_ORIGIN environment variable is required'
    );
  }

  app.use(
    cors({
      origin: corsOrigin,
      credentials: process.env.CORS_CREDENTIALS === 'true',
    })
  );

  // Rate limiting - protect against brute force attacks
  const windowMs = Number(process.env.LIMITER_WINDOW_MS);
  const maxRequests = Number(process.env.LIMITER_MAX_REQUESTS);

  if (isNaN(windowMs) || isNaN(maxRequests)) {
    throw new ConfigurationError(
      'Rate limiting configuration is invalid. Check LIMITER_WINDOW_MS and LIMITER_MAX_REQUESTS'
    );
  }

  const limiter = rateLimit({
    windowMs: windowMs || 15 * 60 * 1000, // 15 minutes
    max: maxRequests || 100,
    message: {
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
} catch (error) {
  console.error(
    '❌ Failed to configure security middleware:',
    error instanceof Error ? error.message : String(error)
  );
  throw error; // Re-throw to be caught by index.ts
}

// ===== PERFORMANCE MIDDLEWARE =====
app.use(compression());

// ===== BODY PARSING MIDDLEWARE =====
try {
  const bodyLimit = process.env.JSON_BODY_LIMIT || '10mb';

  // Validate body limit format
  if (!/^\d+(?:mb|kb|gb)$/i.test(bodyLimit)) {
    throw new ConfigurationError(
      `Invalid JSON_BODY_LIMIT format: ${bodyLimit}. Use format like '10mb', '1gb', etc.`
    );
  }

  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
} catch (error) {
  console.error(
    '❌ Failed to configure body parsing:',
    error instanceof Error ? error.message : String(error)
  );
  throw error;
}

// ===== LOGGING MIDDLEWARE =====
app.use(httpLoggerWithSkip);

// ===== ROOT ENDPOINT =====
app.get('/', (req, res) => {
  try {
    res.json({
      message: 'Welcome to Food App API',
      version: process.env.API_VERSION,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // This will be caught by the error handler middleware
    throw new ConfigurationError('Failed to generate API information');
  }
});

// ===== HEALTH CHECK ROUTE =====
app.get('/health', async (req, res) => {
  try {
    const checks = await Promise.allSettled([
      pool.query('SELECT 1'), // Database
      // Add more checks here
    ]);

    const memory = process.memoryUsage();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.API_VERSION,

      // 🎯 Memory metrics for monitoring
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
      },

      // Service checks
      services: {
        database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
      },
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// ===== API ROUTES =====
app.use('/api/v1', apiV1Routes);

// ===== ERROR HANDLING MIDDLEWARE (MUST BE LAST) =====
// Handle 404s for unmatched routes
app.use(notFoundHandler);

// Handle all other errors
app.use(errorHandler);

export default app;
