import { pool } from '../../database/scripts/connection.js';
import { Food, FoodQueryParams } from '../types/foodTypes.js';

// Function: Find foods with filtering
export const findFoods = async (params: FoodQueryParams): Promise<Food[]> => {
  let query = 'SELECT * FROM foods WHERE 1=1';
  const values: any[] = [];
  let paramCounter = 1;

  if (params.category) {
    query += ` AND category = $${paramCounter}`;
    values.push(params.category);
    paramCounter++;
  }

  if (params.search) {
    query += ` AND (name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`;
    values.push(`%${params.search}%`);
    paramCounter++;
  }

  if (params.barcode) {
    query += ` AND barcode = $${paramCounter}`;
    values.push(params.barcode);
    paramCounter++;
  }

  if (params.brand) {
    query += ` AND brand ILIKE $${paramCounter}`;
    values.push(`%${params.brand}%`);
    paramCounter++;
  }

  query += ` ORDER BY name ASC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
  values.push(params.limit, params.offset);

  const result = await pool.query(query, values);
  return result.rows as Food[];
};

// Function: Count foods with same filters
export const countFoods = async (
  params: Omit<FoodQueryParams, 'limit' | 'offset'>
): Promise<number> => {
  let query = 'SELECT COUNT(*) FROM foods WHERE 1=1';
  const values: any[] = [];
  let paramCounter = 1;

  if (params.category) {
    query += ` AND category = $${paramCounter}`;
    values.push(params.category);
    paramCounter++;
  }

  if (params.search) {
    query += ` AND (name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`;
    values.push(`%${params.search}%`);
    paramCounter++;
  }

  if (params.barcode) {
    query += ` AND barcode = $${paramCounter}`;
    values.push(params.barcode);
    paramCounter++;
  }

  if (params.brand) {
    query += ` AND brand ILIKE $${paramCounter}`;
    values.push(`%${params.brand}%`);
    paramCounter++;
  }

  const result = await pool.query(query, values);
  return parseInt(result.rows[0].count);
};

// Function: Find food by ID
export const findFoodById = async (id: string): Promise<Food | null> => {
  const query = 'SELECT * FROM foods WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows.length > 0 ? (result.rows[0] as Food) : null;
};

// Function: Create new food
export const createFood = async (foodData: any): Promise<Food> => {
  const query = `
    INSERT INTO foods (
      name, description, category, brand, barcode,
      calories, protein, carbs, fat, fiber, sugar, sodium,
      serving_size_amount, serving_size_unit
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *
  `;

  const values = [
    foodData.name,
    foodData.description || null,
    foodData.category,
    foodData.brand || null,
    foodData.barcode || null,
    foodData.nutritional_info.calories,
    foodData.nutritional_info.protein,
    foodData.nutritional_info.carbs,
    foodData.nutritional_info.fat,
    foodData.nutritional_info.fiber || null,
    foodData.nutritional_info.sugar || null,
    foodData.nutritional_info.sodium || null,
    foodData.serving_size.amount,
    foodData.serving_size.unit,
  ];

  const result = await pool.query(query, values);
  return result.rows[0] as Food;
};
