// import pool from '../../database/connection';
// import { Food, FoodQueryParams } from '../types';

// export class FoodRepository {
//   /**
//    * Get all foods with optional filtering
//    */
//   async findAll(
//     params: FoodQueryParams
//   ): Promise<{ foods: Food[]; total: number }> {
//     const { category, search, barcode, brand, limit = 20, offset = 0 } = params;

//     // Build dynamic query
//     let query = 'SELECT * FROM foods WHERE 1=1';
//     let countQuery = 'SELECT COUNT(*) FROM foods WHERE 1=1';
//     const values: any[] = [];
//     let paramCounter = 1;

//     // Add filters
//     if (category) {
//       query += ` AND category = $${paramCounter}`;
//       countQuery += ` AND category = $${paramCounter}`;
//       values.push(category);
//       paramCounter++;
//     }

//     if (search) {
//       query += ` AND (name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`;
//       countQuery += ` AND (name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`;
//       values.push(`%${search}%`);
//       paramCounter++;
//     }

//     if (barcode) {
//       query += ` AND barcode = $${paramCounter}`;
//       countQuery += ` AND barcode = $${paramCounter}`;
//       values.push(barcode);
//       paramCounter++;
//     }

//     if (brand) {
//       query += ` AND brand ILIKE $${paramCounter}`;
//       countQuery += ` AND brand ILIKE $${paramCounter}`;
//       values.push(`%${brand}%`);
//       paramCounter++;
//     }

//     // Add sorting and pagination
//     query += ` ORDER BY name ASC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;

//     // Execute both queries
//     const countValues = [...values];
//     values.push(limit, offset);

//     const [foodsResult, countResult] = await Promise.all([
//       pool.query(query, values),
//       pool.query(countQuery, countValues),
//     ]);

//     return {
//       foods: foodsResult.rows,
//       total: parseInt(countResult.rows[0].count),
//     };
//   }

//   /**
//    * Get a single food by ID
//    */
//   async findById(id: string): Promise<Food | null> {
//     const query = 'SELECT * FROM foods WHERE id = $1';
//     const result = await pool.query(query, [id]);

//     return result.rows[0] || null;
//   }
// }
