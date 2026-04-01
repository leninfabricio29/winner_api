import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from './common.schemas';

export const listNotificationsQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    status: z.enum(['pending', 'read']).optional()
  })
});

export const markNotificationAsReadSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});
