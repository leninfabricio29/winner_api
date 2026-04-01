import { Request, Response } from 'express';
import fs from 'fs/promises';
import { uploadImage } from '../config/cloudinary';
import { Place } from '../models/Place';
import { Promotion } from '../models/Promotion';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { NotificationService } from '../services/notification.service';
import { User } from '../models/User';

const notificationService = new NotificationService();


const parsePagination = (query: Request['query']): { page: number; limit: number; skip: number } => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  return { page, limit, skip: (page - 1) * limit };
};

const uploadPromotionFile = async (file: Express.Multer.File): Promise<string> => {
  try {
    const uploaded = await uploadImage(file.path, 'promotions');
    return uploaded.secure_url;
  } finally {
    await fs.unlink(file.path).catch(() => undefined);
  }
};

export const listPromotions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const now = new Date();

  const filter = {
    status: 'active',
    start_date: { $lte: now },
    end_date: { $gte: now }
  };

  const [items, total] = await Promise.all([
    Promotion.find(filter)
      .populate('place_id', 'name address images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Promotion.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  });
});

export const getPromotionById = asyncHandler(async (req: Request, res: Response) => {
  const promotion = await Promotion.findById(req.params.id).populate('place_id', 'name address images');

  if (!promotion) {
    throw new ApiError(404, 'Promocion no encontrada');
  }

  res.status(200).json({ success: true, data: promotion });
});

export const createPromotion = asyncHandler(async (req: Request, res: Response) => {
  const place = await Place.findOne({ _id: req.body.place_id, business_id: req.user?.userId });
  if (!place) {
    throw new ApiError(403, 'No puedes crear promociones para este lugar');
  }

  const file = req.file;
  const uploadedImage = file ? await uploadPromotionFile(file) : undefined;
  const image = uploadedImage ?? req.body.image;

  if (!image) {
    throw new ApiError(400, 'Debes enviar una imagen para la promocion');
  }

  if (new Date(req.body.start_date) > new Date(req.body.end_date)) {
    throw new ApiError(400, 'La fecha de inicio debe ser menor o igual a la fecha fin');
  }

  const promotion = await Promotion.create({
    ...req.body,
    image,
    business_id: req.user?.userId
  });

    const receivers = await User.find({ role: 'client', status: 'active' });

    for (const receiver of receivers) {
      await notificationService.createNotification(
        String(receiver._id),
        `Nueva promocion disponible: ${promotion.title}`,
        `Acumula ${promotion.points_required} puntos visitando ${place.name} y canjealos por esta promocion`,
        'promotion'
      );
    }

  res.status(201).json({ success: true, data: promotion, message: 'Promocion creada' });
});

export const updatePromotion = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (file) {
    req.body.image = await uploadPromotionFile(file);
  }

  const currentPromotion = await Promotion.findOne({
    _id: req.params.id,
    business_id: req.user?.userId
  });

  if (!currentPromotion) {
    throw new ApiError(404, 'Promocion no encontrada');
  }

  const startDate = req.body.start_date ? new Date(req.body.start_date) : currentPromotion.start_date;
  const endDate = req.body.end_date ? new Date(req.body.end_date) : currentPromotion.end_date;

  if (startDate > endDate) {
    throw new ApiError(400, 'La fecha de inicio debe ser menor o igual a la fecha fin');
  }

  const promotion = await Promotion.findOneAndUpdate(
    { _id: req.params.id, business_id: req.user?.userId },
    req.body,
    { new: true }
  );

  res.status(200).json({ success: true, data: promotion, message: 'Promocion actualizada' });
});

export const deactivatePromotion = asyncHandler(async (req: Request, res: Response) => {
  const promotion = await Promotion.findOneAndUpdate(
    { _id: req.params.id, business_id: req.user?.userId },
    { status: 'inactive' },
    { new: true }
  );

  if (!promotion) {
    throw new ApiError(404, 'Promocion no encontrada');
  }

  res.status(200).json({ success: true, message: 'Promoción desactivada correctamente' });
});

export const getMyPromotions = asyncHandler(async (req: Request, res: Response) => {
  const promotions = await Promotion.find({ business_id: req.user?.userId }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: promotions });
});
