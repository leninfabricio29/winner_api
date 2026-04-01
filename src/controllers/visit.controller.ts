import { Request, Response } from 'express';
import { Place } from '../models/Place';
import { Visit } from '../models/Visit';
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

export const createVisit = asyncHandler(async (req: Request, res: Response) => {
  const place = await Place.findOne({ _id: req.body.place_id, status: 'active' });
  if (!place) {
    throw new ApiError(404, 'Lugar no encontrado');
  }

  const visit = await Visit.create({
    client_id: req.user?.userId,
    place_id: req.body.place_id,
    points_awarded: false
  });

  const visitPoints = await getActivePointSource('VISIT');
  if (visitPoints) {
    await awardOrDeductPoints({
      clientId: req.user!.userId,
      sourceCode: 'VISIT',
      points: visitPoints,
      description: `Puntos por visita a ${place.name}`,
      referenceId: String(visit._id)
    });
    visit.points_awarded = true;
    await visit.save();

    await notificationService.createNotification(
      String(req.user!.userId),
      'Puntos otorgados por visita',
      `Has recibido ${visitPoints} puntos por tu visita a ${place.name}`,
      'points'
    );
  }

  res.status(201).json({ success: true, data: visit, message: 'Visita registrada' });
});

export const listMyVisits = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    Visit.find({ client_id: req.user?.userId })
      .populate('place_id', 'name address  images ')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Visit.countDocuments({ client_id: req.user?.userId })
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  });
});
