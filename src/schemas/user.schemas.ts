import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from './common.schemas';

export const updateMeSchema = z.object({
  body: z
    .object({
      first_name: z.string().min(1).optional(),
      last_name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(4).optional(),
      avatar_url: z.string().url().optional(),
      ci: z.string().min(3).optional(),
      business_name: z.string().min(2).optional(),
      business_category: z.string().min(2).optional()
    })
    .refine((value) => Object.keys(value).length > 0, { message: 'Body vacio' })
});

export const listUsersSchema = z.object({
  query: paginationQuerySchema.extend({
    role: z.enum(['super_admin', 'business', 'client']).optional(),
    status: z.enum(['active', 'suspended', 'deleted']).optional()
  })
});

export const updateUserStatusSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    status: z.enum(['active', 'suspended'])
  })
});
