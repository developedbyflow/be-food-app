import { Router } from 'express';

import { getAllFoods } from '../../controllers/foodController.ts';

// EXAMPLE REQUESTS
// GET /api/v1/foods - Get all foods with optional filtering
// router.get('/', foodController.getAllFoods);

// GET /api/v1/foods/category/:category - Get foods by category
// router.get('/category/:category', foodController.getFoodsByCategory);

const foodRoutes = Router();

/**
 * GET /api/v1/foods
 * Get all foods with optional filters
 */
foodRoutes.get('/', getAllFoods);

/**
 * GET /api/v1/foods/:id
 * Get a single food by ID
 */
// foodRoutes.get('/:id', async (req: Request, res: Response) => {});

// Export the router to use in app.ts
export default foodRoutes;
