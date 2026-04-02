import { Request, Response } from 'express';
import fs from 'fs/promises';
import { uploadImage } from '../config/cloudinary';
import { Advertisement } from '../models/Advertisement';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

const uploadAdvertisementFile = async (file: Express.Multer.File): Promise<string> => {
  try {
    const uploaded = await uploadImage(file.path, 'advertisements');
    return uploaded.secure_url;
  } finally {
    await fs.unlink(file.path).catch(() => undefined);
  }
};

export const createAdvertisement = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    throw new ApiError(400, 'Debes enviar una imagen para el anuncio');
  }

  const uploadedImage = await uploadAdvertisementFile(file);

  const advertisement = new Advertisement({
    image: uploadedImage,
    active: req.body.active !== undefined ? req.body.active : true
  });

  await advertisement.save();

  res.status(201).json({
    success: true,
    message: 'Anuncio creado exitosamente',
    data: advertisement
  });
});

export const listAdvertisements = asyncHandler(async (req: Request, res: Response) => {
    
  const advertisements = await Advertisement.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: advertisements
  });
});
