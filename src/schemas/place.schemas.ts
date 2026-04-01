import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from './common.schemas';

const imagesSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return [trimmed];
  }
}, z.array(z.string().url()));

const locationSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
},
z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.tuple([z.coerce.number(), z.coerce.number()])
}));

export const createPlaceSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().min(2),
    category_id: objectIdSchema,
    address: z.string().min(3),
    phone: z.string().min(7).max(30).optional(),
    website: z.string().url().optional(),
    schedule: z.string().min(2).max(120).optional(),
    images: imagesSchema.optional(),
    location: locationSchema
  })
});

export const updatePlaceSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(2).optional(),
    category_id: objectIdSchema.optional(),
    address: z.string().min(3).optional(),
    phone: z.string().min(7).max(30).optional(),
    website: z.string().url().optional(),
    schedule: z.string().min(2).max(120).optional(),
    images: imagesSchema.optional(),
    status: z.enum(['active', 'inactive']).optional(),
    location: locationSchema.optional()
  })
});

export const listPlacesQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    category: objectIdSchema.optional(),
    search: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional()
  })
});

export const nearbyPlacesSchema = z.object({
  query: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    radius: z.coerce.number().positive().default(1000)
  })
});
