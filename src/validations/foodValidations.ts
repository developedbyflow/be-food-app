import { z } from 'zod';

export const GetFoodsQuerySchema = z.object({
  category: z
    .enum([
      'vegetable',
      'fruit',
      'meat',
      'dairy',
      'grain',
      'legume',
      'nut',
      'spice',
      'oil',
      'condiment',
      'beverage',
      'snack',
      'supplement',
    ])
    .optional(),
  search: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n >= 1 && n <= 100)
    .optional()
    .default('20'),
  offset: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n >= 0)
    .optional()
    .default('0'),
});
