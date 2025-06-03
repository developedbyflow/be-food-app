// src/routes/foodRoutes.ts

// Import Express router
import { Router, Request, Response } from 'express';

// Import our database functions
import {
  getAllFoods,
  getFoodById,
  countFoods,
} from '../../src/controllers/foodController';

// Create a new router instance
// Router is like a mini-app that handles routes
const router = Router();

/**
 * GET /api/foods
 * Get all foods with optional filters
 */
router.get('/foods', async (req: Request, res: Response) => {
  try {
    // Get query parameters from URL
    // Example: /api/foods?category=fruit&limit=10
    const queryParams: any = {
      category: req.query.category as string,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    // Call our database functions
    // Promise.all runs multiple async operations at the same time
    const [foods, total] = await Promise.all([
      getAllFoods(queryParams),
      countFoods(queryParams),
    ]);

    // Calculate pagination info
    const page = Math.floor(queryParams.offset / queryParams.limit) + 1;
    const totalPages = Math.ceil(total / queryParams.limit);

    // Transform database decimals (strings) to numbers
    // PostgreSQL returns DECIMAL as strings, we want numbers
    const transformedFoods = foods.map((food) => ({
      ...food, // Copy all existing properties
      nutritional_info: {
        calories: parseFloat(food.calories),
        protein: parseFloat(food.protein),
        carbs: parseFloat(food.carbs),
        fat: parseFloat(food.fat),
        fiber: food.fiber ? parseFloat(food.fiber) : null,
        sugar: food.sugar ? parseFloat(food.sugar) : null,
        sodium: food.sodium ? parseFloat(food.sodium) : null,
      },
      serving_size: {
        amount: parseFloat(food.serving_size_amount),
        unit: food.serving_size_unit,
      },
    }));

    // Send successful response
    res.json({
      success: true,
      data: {
        items: transformedFoods,
        pagination: {
          total,
          limit: queryParams.limit,
          offset: queryParams.offset,
          page,
          total_pages: totalPages,
          has_more: queryParams.offset + queryParams.limit < total,
        },
      },
    });
  } catch (error) {
    // If anything goes wrong, send error response
    console.error('Error in GET /foods:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get foods',
      },
    });
  }
});

/**
 * GET /api/foods/:id
 * Get a single food by ID
 */
//@ts-ignore
router.get('/foods/:id', async (req: Request, res: Response) => {
  try {
    // Get ID from URL parameter
    const { id } = req.params;

    // Get food from database
    const food = await getFoodById(id);

    // If no food found, send 404 error
    if (!food) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FOOD_NOT_FOUND',
          message: `Food with ID ${id} not found`,
        },
      });
    }

    // Transform the food data
    const transformedFood = {
      ...food,
      nutritional_info: {
        calories: parseFloat(food.calories),
        protein: parseFloat(food.protein),
        carbs: parseFloat(food.carbs),
        fat: parseFloat(food.fat),
        fiber: food.fiber ? parseFloat(food.fiber) : null,
        sugar: food.sugar ? parseFloat(food.sugar) : null,
        sodium: food.sodium ? parseFloat(food.sodium) : null,
      },
      serving_size: {
        amount: parseFloat(food.serving_size_amount),
        unit: food.serving_size_unit,
      },
    };

    // Send successful response
    res.json({
      success: true,
      data: transformedFood,
    });
  } catch (error) {
    // If anything goes wrong, send error response
    console.error('Error in GET /foods/:id:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get food',
      },
    });
  }
});

// Export the router to use in app.ts
export default router;
