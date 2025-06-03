// import { FoodRepository } from '../repositories/foodRepository';
// import { Food, FoodResponse, FoodQueryParams } from '../types';

// export class FoodService {
//   private foodRepository: FoodRepository;

//   constructor() {
//     this.foodRepository = new FoodRepository();
//   }

//   /**
//    * Transform database food to API response format
//    */
//   private transformFood(food: Food): FoodResponse {
//     return {
//       id: food.id,
//       name: food.name,
//       description: food.description,
//       category: food.category,
//       brand: food.brand,
//       barcode: food.barcode,
//       nutritional_info: {
//         calories: parseFloat(food.calories),
//         protein: parseFloat(food.protein),
//         carbs: parseFloat(food.carbs),
//         fat: parseFloat(food.fat),
//         fiber: food.fiber ? parseFloat(food.fiber) : null,
//         sugar: food.sugar ? parseFloat(food.sugar) : null,
//         sodium: food.sodium ? parseFloat(food.sodium) : null,
//       },
//       serving_size: {
//         amount: parseFloat(food.serving_size_amount),
//         unit: food.serving_size_unit,
//       },
//       created_at: food.created_at,
//       updated_at: food.updated_at,
//     };
//   }

//   /**
//    * Get all foods with pagination
//    */
//   async getAllFoods(params: FoodQueryParams) {
//     const { limit = 20, offset = 0 } = params;

//     // Get foods from repository
//     const { foods, total } = await this.foodRepository.findAll(params);

//     // Transform foods to response format
//     const transformedFoods = foods.map((food) => this.transformFood(food));

//     // Calculate pagination info
//     const page = Math.floor(offset / limit) + 1;
//     const totalPages = Math.ceil(total / limit);

//     return {
//       items: transformedFoods,
//       pagination: {
//         total,
//         limit,
//         offset,
//         has_more: offset + limit < total,
//         page,
//         total_pages: totalPages,
//       },
//     };
//   }

//   /**
//    * Get a single food by ID
//    */
//   async getFoodById(id: string): Promise<FoodResponse | null> {
//     const food = await this.foodRepository.findById(id);

//     if (!food) {
//       return null;
//     }

//     return this.transformFood(food);
//   }
// }
