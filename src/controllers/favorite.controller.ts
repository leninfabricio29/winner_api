import { Request, Response } from 'express';
import { Favorite } from '../models/Favorite';
import { Place } from '../models/Place';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const listFavorites = asyncHandler(async (req: Request, res: Response) => {
  const favorites = await Favorite.find({ client_id: req.user?.userId })
    .populate({ path: 'place_id', populate: { path: 'category_id', select: 'name icon' } })
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: favorites });
});

export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  const place = await Place.findById(req.body.place_id);
  if (!place || place.status !== 'active') {
    throw new ApiError(404, 'Lugar no encontrado');
  }

  const exists = await Favorite.findOne({
    client_id: req.user?.userId,
    place_id: req.body.place_id
  });

  if (exists) {
    throw new ApiError(409, 'El lugar ya esta en favoritos');
  }

  const favorite = await Favorite.create({
    client_id: req.user?.userId,
    place_id: req.body.place_id
  });

  res.status(201).json({ success: true, data: favorite, message: 'Favorito agregado' });
});

export const removeFavorite = asyncHandler(async (req: Request, res: Response) => {
  const favorite = await Favorite.findOneAndDelete({
    client_id: req.user?.userId,
    place_id: req.params.placeId
  });

  if (!favorite) {
    throw new ApiError(404, 'Favorito no encontrado');
  }

  res.status(200).json({ success: true, message: 'Favorito eliminado' });
});
