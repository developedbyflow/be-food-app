// app.ts
/**Express Application Configuration
Purpose: Configures the Express app instance
Responsibility: Middleware, routes, error handling
Focus: "What the app does" */

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler } from './middlewares/errorHandler.ts';
import { notFoundHandler } from './middlewares/notFoundHandler.ts';
// import apiRoutes from './routes/index.ts';

const app = express();

// Security middleware
// set various HTTP headers to help protect the app
app.use(helmet());
// enable CORS for all routes
app.use(
  cors({
    // This controls which domains can make requests to your server. Without this:
    origin: process.env.CORS_ORIGIN,
    // - your API would be accessible from any website (security risk)
    // - browsers would block cross-origin requests by default
    // - by setting it to config.corsOrigin, you're likely allowing specific trusted domains

    // Allows browsers to include user authentication data with requests
    credentials: Boolean(process.env.CORS_CREDENTIALS),
    // - tells the browser "yes, send cookies and auth headers with requests"
    // - essential for login systems and user sessions
    // - without this, users would appear "logged out" on cross-origin requests
    // - important gotcha: When credentials: true, your origin cannot be "*" (wildcard). You must specify exact domains.
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.LIMITER_WINDOW_MS),
  max: Number(process.env.LIMITER_MAX_REQUESTS),
});
app.use(limiter);

// Performance middleware
app.use(compression()); // Compress responses

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
// Purpose: This allows your Express app to accept JSON data in the body of incoming requests (Content-Type: application/json).
// Limit: '10mb':
// Sets a maximum body size of 10 megabytes to prevent clients from sending overly large JSON payloads (which could slow or crash your server).
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT }));
// Purpose: This allows your Express app to accept URL-encoded data, like what is sent from an HTML form (Content-Type: application/x-www-form-urlencoded).
// Extended: true: Allows nested objects in the data, using the qs library instead of the basic querystring library.
// Limit: '10mb': Again, prevents huge request bodies.
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
// app.use('/api/v1', apiRoutes);

// Error handling middleware (MUST BE LAST)
app.use(notFoundHandler); // Handles 404s
app.use(errorHandler); // Handles all other errors

export default app;
