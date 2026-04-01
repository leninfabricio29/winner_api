import { z } from 'zod';
import { objectIdSchema } from './common.schemas';

export const createFavoriteSchema = z.object({
  body: z.object({
    place_id: objectIdSchema
  })
});

export const removeFavoriteSchema = z.object({
  params: z.object({
    placeId: objectIdSchema
  })
});
