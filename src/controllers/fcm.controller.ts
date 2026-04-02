import { Request, Response } from 'express';
import { FCMDevice } from '../models/FCMDevice';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Registrar o actualizar FCM token del dispositivo
 */
export const registerFCMToken = asyncHandler(async (req: Request, res: Response) => {
  const { fcm_token, device_name } = req.body;

  if (!fcm_token) {
    throw new ApiError(400, 'FCM token es requerido');
  }

  // Buscar si el token ya existe para este usuario
  let device = await FCMDevice.findOne({
    user_id: req.user!.userId,
    fcm_token
  });

  if (device) {
    // Actualizar existente
    device.device_name = device_name || device.device_name;
    device.is_active = true;
    device.last_used = new Date();
    await device.save();
  } else {
    // Crear nuevo
    device = await FCMDevice.create({
      user_id: req.user!.userId,
      fcm_token,
      device_name,
      is_active: true,
      last_used: new Date()
    });
  }

  res.status(201).json({
    success: true,
    data: device,
    message: 'Dispositivo registrado para notificaciones'
  });
});

/**
 * Desactivar FCM token
 */
export const unregisterFCMToken = asyncHandler(async (req: Request, res: Response) => {
  const { fcm_token } = req.body;

  if (!fcm_token) {
    throw new ApiError(400, 'FCM token es requerido');
  }

  const device = await FCMDevice.findOneAndUpdate(
    {
      user_id: req.user!.userId,
      fcm_token
    },
    { is_active: false },
    { new: true }
  );

  if (!device) {
    throw new ApiError(404, 'Dispositivo no encontrado');
  }

  res.status(200).json({
    success: true,
    data: device,
    message: 'Dispositivo desactivado'
  });
});

/**
 * Obtener dispositivos registrados del usuario
 */
export const listMyDevices = asyncHandler(async (req: Request, res: Response) => {
  const devices = await FCMDevice.find({
    user_id: req.user!.userId
  }).sort({ last_used: -1 });

  res.status(200).json({
    success: true,
    data: devices,
    message: 'Dispositivos listados'
  });
});
