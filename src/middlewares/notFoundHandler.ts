// export const notFoundHandler = (req: any, res: any, next: any) => {};
import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  // Internal logging (not exposed to client)
  console.log(`404 - ${req.method} ${req.originalUrl} from IP: ${req.ip}`);

  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
  });
};
