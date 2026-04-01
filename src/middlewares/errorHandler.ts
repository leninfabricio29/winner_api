import { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.details || []
    });
  }

  if (error instanceof MongooseError.ValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Error de validacion',
      errors: Object.values(error.errors).map((item) => item.message)
    });
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Error de subida de archivos: ${error.message}`
    });
  }

  if ((error as { code?: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Registro duplicado'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
};
