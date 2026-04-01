import { z } from 'zod';
import { objectIdSchema } from './common.schemas';

export const updatePointSourceSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      points: z.number().int().optional(),
      is_active: z.boolean().optional(),
      description: z.string().optional()
    })
    .refine((value) => Object.keys(value).length > 0, { message: 'Body vacio' })
});
