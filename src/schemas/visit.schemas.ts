import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from './common.schemas';

export const createVisitSchema = z.object({
  body: z.object({
    place_id: objectIdSchema
  })
});

export const listVisitsSchema = z.object({
  query: paginationQuerySchema
});
