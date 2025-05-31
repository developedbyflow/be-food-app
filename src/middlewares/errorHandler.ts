// import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
}

/**
Catches all errors from routes and middleware
Standardizes error responses
Logs errors for debugging
Hides sensitive details in production
 */
export const errorHandler = () =>
  //   err: CustomError,
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  {
    //   const statusCode = err.statusCode || 500;
    //   const message = err.message || 'Internal Server Error';
    //   console.error(`Error ${statusCode}: ${message}`);
    //   console.error(err.stack);
    //   res.status(statusCode).json({
    //     success: false,
    //     error: {
    //       message,
    //       ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    //     }
    //   });
  };
