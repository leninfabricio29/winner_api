import { Request, Response } from 'express';
import { Redemption } from '../models/Redemption';
import { Review } from '../models/Review';
import { User } from '../models/User';
import { Visit } from '../models/Visit';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

const parsePagination = (query: Request['query']): { page: number; limit: number; skip: number } => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  return { page, limit, skip: (page - 1) * limit };
};

const formatUserStartDate = (dateValue: Date): string => {
  const day = dateValue.getDate();
  const monthRaw = dateValue.toLocaleDateString('es-EC', { month: 'long' });
  const month = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
  const year = dateValue.getFullYear();
  return `${day} de ${month} ${year}`;
};

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId).select('-password -reset_password_token -reset_password_expires_at');
  if (!user || user.status === 'deleted') {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  res.status(200).json({ success: true, data: user });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOneAndUpdate(
    { _id: req.user?.userId, status: { $ne: 'deleted' } },
    req.body,
    { new: true }
  ).select('-password -reset_password_token -reset_password_expires_at');

  if (!user) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  res.status(200).json({ success: true, data: user, message: 'Perfil actualizado' });
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter: Record<string, unknown> = { status: { $ne: 'deleted' } };

  if (req.query.role) {
    filter.role = req.query.role;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('-password -reset_password_token -reset_password_expires_at')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select('-password -reset_password_token -reset_password_expires_at');
  if (!user || user.status === 'deleted') {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  res.status(200).json({ success: true, data: user });
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  ).select('-password -reset_password_token -reset_password_expires_at');

  if (!user) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  res.status(200).json({ success: true, data: user, message: 'Estado actualizado' });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'deleted' }, { new: true });

  if (!user) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  res.status(200).json({ success: true, message: 'Usuario eliminado' });
});


/*Este controlador me permite obtener data {
    user_start: "Desde cuando es cliente",
    total_points: "Total de puntos acumulados",
    total_visits: "Total de visitas realizadas",
    total_redemptions: "Total de canjes realizados"
    total_referrals: "Total de referidos realizados"
    total_reviews: "Total de reseñas realizadas"
}*/
export const statsClients = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'No autorizado');
  }

  const client = await User.findOne({ _id: userId, role: 'client', status: { $ne: 'deleted' } })
    .select('createdAt points_balance referral_code');

  if (!client) {
    throw new ApiError(404, 'Cliente no encontrado');
  }

  const [total_visits, total_redemptions, total_reviews, total_referrals] = await Promise.all([
    Visit.countDocuments({ client_id: userId }),
    Redemption.countDocuments({ client_id: userId }),
    Review.countDocuments({ client_id: userId }),
    client.referral_code
      ? User.countDocuments({ referral_used: client.referral_code, status: { $ne: 'deleted' } })
      : Promise.resolve(0)
  ]);

  res.status(200).json({
    success: true,
    data: {
      user_start: formatUserStartDate(client.createdAt),
      total_points: client.points_balance ?? 0,
      total_visits,
      total_redemptions,
      total_referrals,
      total_reviews
    }
  });
});



