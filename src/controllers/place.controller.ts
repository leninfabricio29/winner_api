import { Request, Response } from 'express';
import fs from 'fs/promises';
import { uploadImage } from '../config/cloudinary';
import { Place } from '../models/Place';
import { PlaceCategory } from '../models/PlaceCategory';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { NotificationService } from '../services/notification.service';
import { User } from '../models/User';

const notificationService = new NotificationService();

const parsePagination = (query: Request['query']): { page: number; limit: number; skip: number } => {
  const rawPage = Number(query.page || 1);
  const rawLimit = Number(query.limit || 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), 50)
    : 10;

  return { page, limit, skip: (page - 1) * limit };
};

const parseImagesField = (images: unknown): string[] => {
  if (!images) {
    return [];
  }

  if (Array.isArray(images)) {
    return images.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  }

  if (typeof images === 'string') {
    const trimmed = images.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
      }
    } catch {
      // Permite enviar una unica URL como string en multipart.
    }

    return [trimmed];
  }

  return [];
};

const parseLocationField = (location: unknown): unknown => {
  if (typeof location !== 'string') {
    return location;
  }

  try {
    return JSON.parse(location);
  } catch {
    return location;
  }
};

const uploadPlaceFiles = async (files: Express.Multer.File[]): Promise<string[]> => {
  const uploads = files.map(async (file) => {
    try {
      const uploaded = await uploadImage(file.path, 'places');
      return uploaded.secure_url;
    } finally {
      await fs.unlink(file.path).catch(() => undefined);
    }
  });

  return Promise.all(uploads);
};

export const listPlaces = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter: Record<string, unknown> = {};

  if (req.query.category) {
    filter.category_id = req.query.category;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  } else {
    filter.status = 'active';
  }

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { address: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Place.find(filter)
      .populate('category_id', 'name icon')
      .populate('business_id', 'business_name first_name last_name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Place.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  });
});

export const getPlaceById = asyncHandler(async (req: Request, res: Response) => {
  const place = await Place.findById(req.params.id)
    .populate('category_id', 'name icon')
    .populate('business_id', 'business_name first_name last_name');

  if (!place) {
    throw new ApiError(404, 'Lugar no encontrado');
  }

  res.status(200).json({ success: true, data: place });
});

export const createPlace = asyncHandler(async (req: Request, res: Response) => {
  req.body.location = parseLocationField(req.body.location);

  const category = await PlaceCategory.findById(req.body.category_id);
  if (!category || category.status !== 'active') {
    throw new ApiError(400, 'Categoria invalida');
  }

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const uploadedImages = files.length > 0 ? await uploadPlaceFiles(files) : [];
  const bodyImages = parseImagesField(req.body.images);
  const allImages = [...bodyImages, ...uploadedImages];

  if (allImages.length > 4) {
    throw new ApiError(400, 'Solo se permiten maximo 4 imagenes por lugar');
  }

  const place = await Place.create({
    ...req.body,
    images: allImages,
    business_id: req.user?.userId
  });

  const receivers = await User.find({ role: 'client', status: 'active' });

  for (const receiver of receivers) {
    await notificationService.createNotification(
      String(receiver._id),
      'Nuevo lugar agregado',
      `Se ha agregado un nuevo lugar llamado ${place.name}. ¡Echale un vistazo!`,
      'social'
    );
  }

  res.status(201).json({ success: true, data: place, message: 'Lugar creado' });
});

export const updatePlace = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.location) {
    req.body.location = parseLocationField(req.body.location);
  }

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (Object.keys(req.body).length === 0 && files.length === 0) {
    throw new ApiError(400, 'Debes enviar al menos un campo o una imagen');
  }

  const currentPlace = await Place.findOne({ _id: req.params.id, business_id: req.user?.userId });
  if (!currentPlace) {
    throw new ApiError(404, 'Lugar no encontrado');
  }

  const uploadedImages = files.length > 0 ? await uploadPlaceFiles(files) : [];

  if (req.body.images !== undefined || uploadedImages.length > 0) {
    const bodyImages = parseImagesField(req.body.images);
    const nextImages = req.body.images !== undefined
      ? [...bodyImages, ...uploadedImages]
      : [...currentPlace.images, ...uploadedImages];

    if (nextImages.length > 4) {
      throw new ApiError(400, 'Solo se permiten maximo 4 imagenes por lugar');
    }

    req.body.images = nextImages;
  }

  const place = await Place.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.status(200).json({ success: true, data: place, message: 'Lugar actualizado' });
});

export const deactivatePlace = asyncHandler(async (req: Request, res: Response) => {
  const place = await Place.findOneAndUpdate(
    { _id: req.params.id, business_id: req.user?.userId },
    { status: 'inactive' },
    { new: true }
  );

  if (!place) {
    throw new ApiError(404, 'Lugar no encontrado');
  }

  res.status(200).json({ success: true, message: 'Lugar desactivado' });
});

export const getNearbyPlaces = asyncHandler(async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius || 1000);

  const places = await Place.find({
    status: 'active',
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius
      }
    }
  })
    .populate('category_id', 'name icon')
    .limit(100);

  res.status(200).json({ success: true, data: places });
});

export const getMyPlaces = asyncHandler(async (req: Request, res: Response) => {
  const places = await Place.find({ business_id: req.user?.userId }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: places });
});
