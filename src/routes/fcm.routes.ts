import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { registerFCMToken, unregisterFCMToken, listMyDevices } from '../controllers/fcm.controller';

const router = Router();

/**
 * POST /fcm-devices/register
 * Registrar o actualizar FCM token
 */
router.post('/register', authenticate, registerFCMToken);

/**
 * POST /fcm-devices/unregister
 * Desactivar FCM token
 */
router.post('/unregister', authenticate, unregisterFCMToken);

/**
 * GET /fcm-devices/my
 * Listar dispositivos del usuario autenticado
 */
router.get('/my', authenticate, listMyDevices);

export default router;
