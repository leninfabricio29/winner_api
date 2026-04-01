import { z } from 'zod';
import { objectIdSchema } from './common.schemas';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    icon: z.string().url().optional()
  })
});

export const updateCategorySchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      name: z.string().min(2).optional(),
      icon: z.string().url().optional(),
      status: z.enum(['active', 'inactive']).optional()
    })
    .refine((value) => Object.keys(value).length > 0, { message: 'Body vacio' })
});
