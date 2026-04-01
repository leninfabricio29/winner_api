import { Request, Response } from 'express';
import { User } from '../models/User';
import { PointTransaction } from '../models/PointTransaction';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

const parsePagination = (query: Request['query']): { page: number; limit: number; skip: number } => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  return { page, limit, skip: (page - 1) * limit };
};

export const getPointsBalance = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId).select('points_balance');
  if (!user) {
    throw new ApiError(404, 'Cliente no encontrado');
  }

  res.status(200).json({
    success: true,
    data: { points_balance: user.points_balance || 0 }
  });
});

export const getPointTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    PointTransaction.find({ client_id: req.user?.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PointTransaction.countDocuments({ client_id: req.user?.userId })
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  });
});
