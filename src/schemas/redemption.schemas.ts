import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from './common.schemas';

export const createRedemptionSchema = z.object({
  body: z.object({
    promotion_id: objectIdSchema
  })
});

export const validateRedemptionSchema = z.object({
  body: z.object({
    redemption_code: z.string().min(4)
  })
});

export const listRedemptionQuerySchema = z.object({
  query: paginationQuerySchema
});
