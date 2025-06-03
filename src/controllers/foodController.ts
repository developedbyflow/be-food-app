import { Request, Response, NextFunction } from 'express';

import { countFoods, findFoods } from '../services/foodService.ts';
import {
  PaginatedResponse,
  ApiError,
  PaginationInfo,
} from '../types/apiTypes.ts';
import { Food, FoodResponse, FoodQueryParams } from '../types/foodTypes.js';
import { GetFoodsQuerySchema } from '../validations/foodValidations.ts';

// Helper function: Transform Food to FoodResponse
const transformFood = (dbFood: Food): FoodResponse => {
  return {
    id: dbFood.id,
    name: dbFood.name,
    description: dbFood.description,
    category: dbFood.category,
    brand: dbFood.brand,
    barcode: dbFood.barcode,
    nutritional_info: {
      calories: parseFloat(dbFood.calories),
      protein: parseFloat(dbFood.protein),
      carbs: parseFloat(dbFood.carbs),
      fat: parseFloat(dbFood.fat),
      fiber: dbFood.fiber ? parseFloat(dbFood.fiber) : null,
      sugar: dbFood.sugar ? parseFloat(dbFood.sugar) : null,
      sodium: dbFood.sodium ? parseFloat(dbFood.sodium) : null,
    },
    serving_size: {
      amount: parseFloat(dbFood.serving_size_amount),
      unit: dbFood.serving_size_unit,
    },
    created_at: dbFood.created_at,
    updated_at: dbFood.updated_at,
  };
};

// Helper function: Calculate pagination
const calculatePagination = (
  total: number,
  limit: number,
  offset: number
): PaginationInfo => {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    limit,
    offset,
    has_more: offset + limit < total,
    page,
    total_pages: totalPages,
  };
};

/*
  @desc    Get all foods with optional filters and pagination
  @route   GET /api/v1/foods
  @access  Public
*/
export const getAllFoods = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate with Zod
    const validationResult = GetFoodsQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Convert to FoodQueryParams
    const queryParams: FoodQueryParams = validationResult.data;

    // Get data from service functions
    const [dbFoods, total] = await Promise.all([
      findFoods(queryParams),
      countFoods({
        category: queryParams.category,
        search: queryParams.search,
        barcode: queryParams.barcode,
        brand: queryParams.brand,
      }),
    ]);

    // Transform database foods to API response format
    const foods = dbFoods.map((food) => transformFood(food));

    // Calculate pagination info
    const pagination = calculatePagination(
      total,
      queryParams.limit!,
      queryParams.offset!
    );

    // Build final response
    const response: PaginatedResponse<FoodResponse> = {
      success: true,
      data: {
        items: foods,
        pagination,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
