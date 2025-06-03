import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log file paths
const logPaths = {
  error: path.join(logsDir, 'error.log'),
  combined: path.join(logsDir, 'combined.log'),
  database: path.join(logsDir, 'database.log'),
  api: path.join(logsDir, 'api.log'),
  migration: path.join(logsDir, 'migration.log'),
};

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'food-app',
    pid: process.pid,
  },
  transports: [
    // Error logs only
    new winston.transports.File({
      filename: logPaths.error,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // All logs
    new winston.transports.File({
      filename: logPaths.combined,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // Database operations
    new winston.transports.File({
      filename: logPaths.database,
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      tailable: true,
    }),

    // API requests
    new winston.transports.File({
      filename: logPaths.api,
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      tailable: true,
    }),
  ],
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: 'HH:mm:ss',
        }),
        winston.format.printf(
          ({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length
              ? JSON.stringify(meta, null, 2)
              : '';
            return `${timestamp} [${level}] [${service}]: ${message} ${metaStr}`;
          }
        )
      ),
    })
  );
}

// Create specialized loggers
export const dbLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { component: 'database' },
  transports: [
    new winston.transports.File({
      filename: logPaths.database,
      maxsize: 5242880,
      maxFiles: 3,
    }),
    new winston.transports.File({
      filename: logPaths.combined,
    }),
  ],
});

export const apiLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { component: 'api' },
  transports: [
    new winston.transports.File({
      filename: logPaths.api,
      maxsize: 5242880,
      maxFiles: 3,
    }),
    new winston.transports.File({
      filename: logPaths.combined,
    }),
  ],
});

export const migrationLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { component: 'migration' },
  transports: [
    new winston.transports.File({
      filename: logPaths.migration,
      maxsize: 2097152, // 2MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: logPaths.combined,
    }),
  ],
});

// Export default logger and paths
export { logPaths };
export default logger;
