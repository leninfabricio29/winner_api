import { Request, Response } from 'express';
import { Redemption } from '../models/Redemption';
import { asyncHandler } from '../utils/asyncHandler';
import { createPromotionRedemption, validateBusinessRedemption } from '../services/redemption.service';

const parsePagination = (query: Request['query']): { page: number; limit: number; skip: number } => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  return { page, limit, skip: (page - 1) * limit };
};

export const createRedemption = asyncHandler(async (req: Request, res: Response) => {
  const result = await createPromotionRedemption(req.user!.userId, req.body.promotion_id);

  res.status(201).json({
    success: true,
    data: {
      redemption_code: result.redemption.redemption_code,
      expires_at: result.redemption.expires_at,
      promotion: {
        title: result.promotionTitle,
        points_required: result.pointsRequired
      }
    },
    message: 'Canje generado correctamente'
  });
});

export const listMyRedemptions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    Redemption.find({ client_id: req.user?.userId })
      .populate('promotion_id', ' title image points_required')
      .populate('business_id', 'business_name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Redemption.countDocuments({ client_id: req.user?.userId })
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  });
});

export const validateRedemption = asyncHandler(async (req: Request, res: Response) => {
  const redemption = await validateBusinessRedemption(req.user!.userId, req.body.redemption_code);

  res.status(200).json({
    success: true,
    data: redemption,
    message: 'Codigo validado exitosamente'
  });
});

export const listBusinessRedemptions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {
    business_id: req.user?.userId,
    status: 'validated'
  };

  const [items, total] = await Promise.all([
    Redemption.find(filter)
      .populate('client_id', 'first_name last_name email')
      .populate('promotion_id', 'title points_required')
      .sort({ validated_at: -1 })
      .skip(skip)
      .limit(limit),
    Redemption.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  });
});
