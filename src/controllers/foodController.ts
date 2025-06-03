// src/database/foodQueries.ts

// Import the pool (our database connection bucket)
import { pool } from '../../database/scripts/connection.ts';
// Import types (these describe the shape of our data)
import { Food, FoodQueryParams } from '../../src/types/foodTypes.ts';

/**
 * Get all foods from the database
 * This is a simple function that returns a Promise<Food[]>
 * Promise<Food[]> means "I promise to give you an array of foods later"
 */
export async function getAllFoods(params: FoodQueryParams) {
  // Destructure parameters with default values
  // If limit isn't provided, use 20
  // If offset isn't provided, use 0
  const {
    category, // optional filter by category
    search, // optional search term
    limit = 20, // how many results to return
    offset = 0, // how many results to skip
  } = params;

  // Start building our SQL query
  // $1, $2, etc. are placeholders for safe value insertion
  let query = 'SELECT * FROM foods WHERE 1=1'; // 1=1 is always true, makes adding conditions easier

  // Array to hold the values for our placeholders
  const values: any[] = [];

  // Counter to track placeholder numbers ($1, $2, $3...)
  let paramCounter = 1;

  // If category filter is provided, add it to query
  if (category) {
    query += ` AND category = $${paramCounter}`;
    values.push(category);
    paramCounter++;
  }

  // If search term is provided, search in name and description
  // ILIKE means case-insensitive LIKE (searching)
  // %search% means the search term can appear anywhere
  if (search) {
    query += ` AND (name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`;
    values.push(`%${search}%`); // Add % wildcards for partial matching
    paramCounter++;
  }

  // Add sorting and pagination
  // ORDER BY name ASC = sort alphabetically by name
  // LIMIT = how many results to return
  // OFFSET = how many results to skip (for pagination)
  query += ` ORDER BY name ASC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
  values.push(limit, offset);

  try {
    // Execute the query with our values
    // await means "wait for database to respond"
    const result = await pool.query(query, values);

    // result.rows contains the array of foods
    return result.rows as Food[];
  } catch (error) {
    // If something goes wrong, log it and throw the error
    console.error('Error getting foods:', error);
    throw error;
  }
}

/**
 * Get a single food by its ID
 * Returns one food or null if not found
 */
export async function getFoodById(id: string): Promise<Food | null> {
  // Simple query with one placeholder
  const query = 'SELECT * FROM foods WHERE id = $1';

  try {
    // Execute query with the ID
    const result = await pool.query(query, [id]);

    // If no rows returned, food doesn't exist
    if (result.rows.length === 0) {
      return null;
    }

    // Return the first (and only) row
    return result.rows[0] as Food;
  } catch (error) {
    console.error('Error getting food by ID:', error);
    throw error;
  }
}

/**
 * Count total foods (useful for pagination)
 */
export async function countFoods(params: FoodQueryParams): Promise<number> {
  const { category, search } = params;

  // Similar to getAllFoods but we only count
  let query = 'SELECT COUNT(*) FROM foods WHERE 1=1';
  const values: any[] = [];
  let paramCounter = 1;

  if (category) {
    query += ` AND category = $${paramCounter}`;
    values.push(category);
    paramCounter++;
  }

  if (search) {
    query += ` AND (name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`;
    values.push(`%${search}%`);
    paramCounter++;
  }

  try {
    const result = await pool.query(query, values);
    // COUNT returns a string, so we convert to number
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error counting foods:', error);
    throw error;
  }
}

/**
 * Create a new food in the database
 */
export async function createFood(foodData: any): Promise<Food> {
  // INSERT query with RETURNING * to get the created food back
  const query = `
    INSERT INTO foods (
      name, description, category, brand, barcode,
      calories, protein, carbs, fat, fiber, sugar, sodium,
      serving_size_amount, serving_size_unit
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *
  `;

  // Array of values in the same order as the query
  const values = [
    foodData.name,
    foodData.description,
    foodData.category,
    foodData.brand,
    foodData.barcode,
    foodData.nutritional_info.calories,
    foodData.nutritional_info.protein,
    foodData.nutritional_info.carbs,
    foodData.nutritional_info.fat,
    foodData.nutritional_info.fiber,
    foodData.nutritional_info.sugar,
    foodData.nutritional_info.sodium,
    foodData.serving_size.amount,
    foodData.serving_size.unit,
  ];

  try {
    const result = await pool.query(query, values);
    // Return the newly created food
    return result.rows[0] as Food;
  } catch (error) {
    console.error('Error creating food:', error);
    throw error;
  }
}
