import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { NotificationService } from '../services/notification.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

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

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
	const { page, limit, skip } = parsePagination(req.query);

	const filter: Record<string, unknown> = {
		user_id: req.user?.userId
	};

	if (req.query.status === 'read' || req.query.status === 'pending') {
		filter.status = req.query.status;
	}

	const [items, total, unread] = await Promise.all([
		Notification.find(filter)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit),
		Notification.countDocuments(filter),
		Notification.countDocuments({ user_id: req.user?.userId, status: 'pending' })
	]);

	res.status(200).json({
		success: true,
		data: {
			items,
			unread,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			}
		}
	});
});

export const markNotificationAsRead = asyncHandler(async (req: Request, res: Response) => {
	const notification = await Notification.findById(req.params.id);

	if (!notification) {
		throw new ApiError(404, 'Notificacion no encontrada');
	}

	if (String(notification.user_id) !== req.user?.userId) {
		throw new ApiError(403, 'No tienes permisos para esta notificacion');
	}

	const updated = await notificationService.updateNotificationStatus(req.params.id, true);

	res.status(200).json({
		success: true,
		data: updated,
		message: 'Notificacion marcada como leida'
	});
});

