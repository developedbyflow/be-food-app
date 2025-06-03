import 'colors';
import dotenv from 'dotenv';
import { Server } from 'http';

// Load environment variables first
dotenv.config();

// Import the Express app configuration from app.ts
import app from './app.ts';
// Import our database functions
import {
  DatabaseError,
  ConfigurationError,
  ExternalServiceError,
} from './utils/customErrors.js';
import logger from './utils/customLogger.ts';
import {
  testConnection,
  closeDatabase,
} from '../database/scripts/connection.ts';

// Import logger and custom errors

// Variable to store our server instance
let server: Server;

// Validate required environment variables
function validateEnvironment(): void {
  const requiredVars = ['PORT', 'HOST'];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new ConfigurationError(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  const port = Number(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new ConfigurationError(
      `Invalid PORT value: ${process.env.PORT}. Must be a number between 1 and 65535`
    );
  }
}

// Main function to start everything
async function startServer(): Promise<void> {
  try {
    // First, validate environment configuration
    console.log('🔄 Validating environment configuration...');
    validateEnvironment();
    console.log('✅ Environment configuration valid');

    // Test database connection
    console.log('🔄 Testing database connection...');
    logger.info('Starting server initialization');

    const dbConnected = await testConnection();

    if (!dbConnected) {
      throw new DatabaseError('Database connection test failed');
    }

    console.log('✅ Database connection successful'.green.bold);
    logger.info('Database connection established');

    // Start the web server
    const PORT = Number(process.env.PORT);
    const HOST = process.env.HOST || 'localhost';

    server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📋 Health check: http://${HOST}:${PORT}/health`);
      console.log(`🔗 API endpoints: http://${HOST}:${PORT}/api/v1`);

      logger.info('Server started successfully', {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
        nodeVersion: process.version,
      });
    });

    // Handle server errors
    server.on('error', (error: any) => {
      let customError;

      if (error.code === 'EADDRINUSE') {
        customError = new ConfigurationError(`Port ${PORT} is already in use`);
        console.error(`❌ ${customError.message}`);
      } else if (error.code === 'EACCES') {
        customError = new ConfigurationError(
          `Permission denied to bind to port ${PORT}`
        );
        console.error(`❌ ${customError.message}`);
      } else {
        customError = new ExternalServiceError('HTTP Server', error.message);
        console.error('❌ Server error:', customError.message);
      }

      logger.error('Server error', {
        error: customError.message,
        code: customError.code,
        statusCode: customError.statusCode,
        originalError: error.message,
        stack: error.stack,
      });

      process.exit(1);
    });
  } catch (error: unknown) {
    if (error instanceof ConfigurationError || error instanceof DatabaseError) {
      console.error(`❌ ${error.constructor.name}: ${error.message}`);
      logger.error('Server startup failed', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
      });
    } else {
      const unknownError =
        error instanceof Error ? error.message : String(error);
      console.error('❌ Unknown startup error:', unknownError);
      logger.error('Server startup failed with unknown error', {
        error: unknownError,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    process.exit(1);
  }
}

// Function to shut down cleanly
async function shutdown(signal: string): Promise<void> {
  console.log(`\n📴 ${signal} received, shutting down gracefully...`);
  logger.info('Graceful shutdown initiated', { signal });

  try {
    // Set a timeout for graceful shutdown
    const shutdownTimeout = setTimeout(() => {
      const timeoutError = new ConfigurationError(
        'Graceful shutdown timeout exceeded'
      );
      console.error(`❌ ${timeoutError.message}`);
      logger.error('Shutdown timeout', {
        error: timeoutError.message,
        code: timeoutError.code,
      });
      process.exit(1);
    }, 30000); // 30 seconds timeout

    // Stop accepting new requests
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(
              new ExternalServiceError(
                'HTTP Server',
                `Failed to close server: ${error.message}`
              )
            );
          } else {
            console.log('✅ HTTP server closed');
            logger.info('HTTP server closed');
            resolve();
          }
        });
      });
    }

    // Close database connections
    console.log('🔄 Closing database connections...');
    try {
      await closeDatabase();
      console.log('✅ Database connections closed');
      logger.info('Database connections closed');
    } catch (error) {
      throw new DatabaseError(
        `Failed to close database connections: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Clear the timeout
    clearTimeout(shutdownTimeout);

    console.log('👋 Goodbye!');
    logger.info('Server shutdown completed successfully');
    process.exit(0);
  } catch (error: unknown) {
    if (
      error instanceof DatabaseError ||
      error instanceof ExternalServiceError
    ) {
      console.error(`❌ ${error.constructor.name}: ${error.message}`);
      logger.error('Error during shutdown', {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
      });
    } else {
      const unknownError =
        error instanceof Error ? error.message : String(error);
      console.error('❌ Unknown shutdown error:', unknownError);
      logger.error('Unknown error during shutdown', {
        error: unknownError,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    // Force exit if graceful shutdown fails
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const rejectionError = new ExternalServiceError(
    'Promise',
    `Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`
  );

  console.error('❌ Unhandled Rejection:', rejectionError.message);
  logger.error('Unhandled Rejection', {
    error: rejectionError.message,
    code: rejectionError.code,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const uncaughtError = new ExternalServiceError(
    'Process',
    `Uncaught exception: ${error.message}`
  );

  console.error('❌ Uncaught Exception:', uncaughtError.message);
  logger.error('Uncaught Exception', {
    error: uncaughtError.message,
    code: uncaughtError.code,
    originalError: error.message,
    stack: error.stack,
  });

  // For uncaught exceptions, we should exit
  process.exit(1);
});

// Start everything!
startServer();

// Listen for shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
