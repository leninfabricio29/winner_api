import { Request, Response } from 'express';
import { Place } from '../models/Place';
import { Review } from '../models/Review';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { awardOrDeductPoints, getActivePointSource } from '../services/points.service';
import { NotificationService } from '../services/notification.service';



const notificationService = new NotificationService();

const parsePagination = (query: Request['query']): { page: number; limit: number; skip: number } => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  return { page, limit, skip: (page - 1) * limit };
};



export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const place = await Place.findById(req.body.place_id);
  if (!place) {
    throw new ApiError(404, 'Lugar no encontrado');
  }

  const existing = await Review.findOne({
    client_id: req.user?.userId,
    place_id: req.body.place_id
  });

  if (existing) {
    throw new ApiError(409, 'Ya realizaste una resena para este lugar');
  }

  const review = await Review.create({
    client_id: req.user?.userId,
    place_id: req.body.place_id,
    rating: req.body.rating,
    comment: req.body.comment,
    points_awarded: false
  });

  const reviewPoints = await getActivePointSource('REVIEW');
  if (reviewPoints) {
    await awardOrDeductPoints({
      clientId: req.user!.userId,
      sourceCode: 'REVIEW',
      points: reviewPoints,
      description: `Puntos por resena en ${place.name}`,
      referenceId: String(review._id)
    });

    review.points_awarded = true;
    await review.save();


    await notificationService.createNotification(
      String(req.user!.userId),
      'Puntos otorgados por resena',
      `Has recibido ${reviewPoints} puntos por tu resena en ${place.name}`,
      'points'
    );


  }

  res.status(201).json({ success: true, data: review, message: 'Resena creada' });
});

export const listPlaceReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { place_id: req.params.placeId };

  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate('client_id', 'first_name last_name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, client_id: req.user?.userId });

  if (!review) {
    throw new ApiError(404, 'Resena no encontrada');
  }

  res.status(200).json({ success: true, message: 'Resena eliminada' });
});
