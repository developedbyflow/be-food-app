import { Request, Response, NextFunction } from 'express';

import { AppError } from '../utils/customErrors.ts';

export interface CustomError extends Error {
  statusCode?: number;
}

/**
Catches all errors from routes and middleware
Standardizes error responses
Logs errors for debugging
Hides sensitive details in production
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // This handles ALL AppError instances, regardless of specific type
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code, // ← This automatically includes the code from any AppError
      },
    });
    return;
  }

  // Handle unexpected errors
  console.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal Server Error',
    },
  });
};
