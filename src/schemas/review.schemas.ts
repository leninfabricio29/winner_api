import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from './common.schemas';

export const createReviewSchema = z.object({
  body: z.object({
    place_id: objectIdSchema,
    rating: z.number().min(1).max(5),
    comment: z.string().optional()
  })
});

export const placeReviewsSchema = z.object({
  params: z.object({
    placeId: objectIdSchema
  }),
  query: paginationQuerySchema
});
