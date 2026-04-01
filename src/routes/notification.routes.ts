import { Router } from 'express';
import { getMyNotifications, markNotificationAsRead } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import {
  listNotificationsQuerySchema,
  markNotificationAsReadSchema
} from '../schemas/notification.schemas';

const router = Router();

router.get('/my', authenticate, validate(listNotificationsQuerySchema), getMyNotifications);
router.patch('/:id/read', authenticate, validate(markNotificationAsReadSchema), markNotificationAsRead);

export default router;
