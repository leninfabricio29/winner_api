import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from './common.schemas';

export const createPromotionSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    image: z.string().url().optional(),
    place_id: objectIdSchema,
    points_required: z.coerce.number().int().min(1),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    max_claims_per_user: z.coerce.number().int().min(1),
    total_max_claims: z.coerce.number().int().min(1).optional()
  })
});

export const updatePromotionSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      title: z.string().min(3).optional(),
      description: z.string().optional(),
      image: z.string().url().optional(),
      points_required: z.coerce.number().int().min(1).optional(),
      start_date: z.coerce.date().optional(),
      end_date: z.coerce.date().optional(),
      max_claims_per_user: z.coerce.number().int().min(1).optional(),
      total_max_claims: z.coerce.number().int().min(1).optional(),
      status: z.enum(['active', 'inactive', 'expired']).optional()
    })
    .refine((value) => Object.keys(value).length > 0, { message: 'Body vacio' })
});

export const listPromotionQuerySchema = z.object({
  query: paginationQuerySchema
});
