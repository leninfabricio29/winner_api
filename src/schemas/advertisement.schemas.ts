import { z } from 'zod';

export const createAdvertisementSchema = z.object({
  body: z.object({
    active: z.boolean().optional()
  })
});

export const listAdvertisementQuerySchema = z.object({
  query: z.object({})
});
