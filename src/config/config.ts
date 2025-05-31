import dotenv from 'dotenv';

interface Config {
  NODE_ENV: string;
  PORT: number;
  ORIGIN: string | string[];
  CREDENTIALS: boolean;
  LIMITER_WINDOW_MS: number; // in milliseconds
  LIMITER_MAX_REQUESTS: number; // maximum requests per window
  JSON_BODY_LIMIT: string; // e.g., '10mb'
  DB_URL?: string;
  JWT_SECRET?: string;
}

// Load environment variables from .env file
dotenv.config();

// Bridge: ENV_VAR || default_value
export const config: Config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
  LIMITER_WINDOW_MS: parseInt(process.env.LIMITER_WINDOW_MS || '900000', 10), // 15 minutes in milliseconds,
  LIMITER_MAX_REQUESTS: parseInt(process.env.LIMITER_MAX_REQUESTS || '100', 10), // limit each IP to 100 requests per windowMs
  JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || '10mb', // default body size limit
  DB_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
};

// TODO: implement complex config later
// interface Config {
//   // Server
//   nodeEnv: 'development' | 'production' | 'test';
//   port: number;
//   host: string;

//   // Security
//   corsOrigin: string | string[];
//   jwtSecret: string;
//   jwtExpiresIn: string;

//   // Database
//   database: {
//     url: string;
//     maxConnections: number;
//     timeout: number;
//   };

//   // Features
//   features: {
//     enableLogging: boolean;
//     enableRateLimit: boolean;
//     maxFileSize: number;
//   };
// }

// // Helper function for required env vars
// const getRequiredEnv = (key: string): string => {
//   const value = process.env[key];
//   if (!value) {
//     throw new Error(`Required environment variable ${key} is missing`);
//   }
//   return value;
// };

// // Helper for boolean conversion
// const getBooleanEnv = (key: string, defaultValue: boolean): boolean => {
//   const value = process.env[key];
//   if (value === undefined) return defaultValue;
//   return value.toLowerCase() === 'true';
// };

// export const config: Config = {
//   // Server config with validation
//   nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
//   port: parseInt(process.env.PORT || '5000', 10),
//   host: process.env.HOST || '0.0.0.0',

//   // Security - some required, some with defaults
//   corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
//   jwtSecret: process.env.NODE_ENV === 'production'
//     ? getRequiredEnv('JWT_SECRET')  // Required in production
//     : 'dev-secret-key',             // Safe default for dev
//   jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

//   // Database config
//   database: {
//     url: process.env.DATABASE_URL || 'mongodb://localhost:27017/food-app',
//     maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
//     timeout: parseInt(process.env.DB_TIMEOUT || '5000', 10)
//   },

//   // Feature flags
//   features: {
//     enableLogging: getBooleanEnv('ENABLE_LOGGING', true),
//     enableRateLimit: getBooleanEnv('ENABLE_RATE_LIMIT', process.env.NODE_ENV === 'production'),
//     maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) // 10MB default
//   }
// };

// // Validation on startup
// if (config.port < 1 || config.port > 65535) {
//   throw new Error(`Invalid port number: ${config.port}`);
// }

// if (config.nodeEnv === 'production' && config.jwtSecret === 'dev-secret-key') {
//   throw new Error('JWT_SECRET must be set in production');
// }
