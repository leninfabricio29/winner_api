import { Router } from 'express';
import {
  deleteUser,
  getMe,
  getUserById,
  listUsers,
  updateMe,
  updateUserStatus,
  statsClients
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { listUsersSchema, updateMeSchema, updateUserStatusSchema } from '../schemas/user.schemas';

const router = Router();

router.get('/me', authenticate, authorize('client', 'business'), getMe);
router.put('/me', authenticate, authorize('client', 'business'), validate(updateMeSchema), updateMe);
router.get('/stats', authenticate, authorize('client'), statsClients);

router.get('/', authenticate, authorize('super_admin'), validate(listUsersSchema), listUsers);
router.get('/:id', authenticate, authorize('super_admin'), getUserById);
router.put('/:id/status', authenticate, authorize('super_admin'), validate(updateUserStatusSchema), updateUserStatus);
router.delete('/:id', authenticate, authorize('super_admin'), deleteUser);

export default router;
