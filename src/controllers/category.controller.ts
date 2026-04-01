import { Request, Response } from 'express';
import { PlaceCategory } from '../models/PlaceCategory';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await PlaceCategory.find({ status: 'active' }).sort({ name: 1 });
  res.status(200).json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const exists = await PlaceCategory.findOne({ name: req.body.name });
  if (exists) {
    throw new ApiError(409, 'La categoria ya existe');
  }

  const category = await PlaceCategory.create(req.body);
  res.status(201).json({ success: true, data: category, message: 'Categoria creada' });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await PlaceCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) {
    throw new ApiError(404, 'Categoria no encontrada');
  }

  res.status(200).json({ success: true, data: category, message: 'Categoria actualizada' });
});

export const deactivateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await PlaceCategory.findByIdAndUpdate(
    req.params.id,
    { status: 'inactive' },
    { new: true }
  );

  if (!category) {
    throw new ApiError(404, 'Categoria no encontrada');
  }

  res.status(200).json({ success: true, message: 'Categoria desactivada' });
});
