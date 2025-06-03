// ✅ Enum-like types for strict validation
export type FoodCategory =
  | 'vegetable'
  | 'fruit'
  | 'meat'
  | 'dairy'
  | 'grain'
  | 'legume'
  | 'nut'
  | 'spice'
  | 'oil'
  | 'condiment'
  | 'beverage'
  | 'snack'
  | 'supplement';

export type ServingUnit =
  | 'grams'
  | 'ml'
  | 'cup'
  | 'tablespoon'
  | 'teaspoon'
  | 'piece'
  | 'slice'
  | 'ounce'
  | 'pound';

// ✅ Database row type (what comes from PostgreSQL)
export interface Food {
  id: string;
  name: string;
  description: string | null;
  category: FoodCategory;
  brand: string | null;
  barcode: string | null;
  calories: string; // PostgreSQL DECIMAL comes as string
  protein: string;
  carbs: string;
  fat: string;
  fiber: string | null;
  sugar: string | null;
  sodium: string | null;
  serving_size_amount: string;
  serving_size_unit: ServingUnit;
  created_at: Date;
  updated_at: Date;
}

// ✅ API input for creating food
export interface CreateFoodDto {
  name: string;
  description?: string;
  category: FoodCategory;
  brand?: string;
  barcode?: string;
  nutritional_info: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  serving_size: {
    amount: number;
    unit: ServingUnit;
  };
}

// ✅ API input for updating food
export interface UpdateFoodDto {
  name?: string;
  description?: string;
  category?: FoodCategory;
  brand?: string;
  barcode?: string;
  nutritional_info?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  serving_size?: {
    amount?: number;
    unit?: ServingUnit;
  };
}

// ✅ Query parameters for filtering
export interface FoodQueryParams {
  category?: FoodCategory;
  search?: string;
  barcode?: string;
  brand?: string;
  limit?: number;
  offset?: number;
}

// ✅ Clean API response (with parsed numbers)
export interface FoodResponse {
  id: string;
  name: string;
  description: string | null;
  category: FoodCategory;
  brand: string | null;
  barcode: string | null;
  nutritional_info: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number | null;
    sugar: number | null;
    sodium: number | null;
  };
  serving_size: {
    amount: number;
    unit: ServingUnit;
  };
  created_at: Date;
  updated_at: Date;
}
