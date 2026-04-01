import { Request, Response } from 'express';
import { PointSource } from '../models/PointSource';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const listPointSources = asyncHandler(async (_req: Request, res: Response) => {
  const sources = await PointSource.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: sources });
});

export const updatePointSource = asyncHandler(async (req: Request, res: Response) => {
  const source = await PointSource.findByIdAndUpdate(req.params.id, req.body, { new: true });

  if (!source) {
    throw new ApiError(404, 'Fuente de puntos no encontrada');
  }

  res.status(200).json({
    success: true,
    data: source,
    message: 'Fuente de puntos actualizada'
  });
});
