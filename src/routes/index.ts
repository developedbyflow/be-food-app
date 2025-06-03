import { Router } from 'express';

import foodRoutes from './foodRoutes.ts';
import { ApiResponse } from '../types/index.ts';

const router = Router();

// Mount food routes
router.use('/foods', foodRoutes);

// Health check
// TODO: Add database connection check
// Health check
router.get('/health', (req, res) => {
  const response: ApiResponse<any> = {
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };
  res.json(response);
});

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
