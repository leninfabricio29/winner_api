import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  login,
  registerBusiness,
  registerClient,
  resetPassword,
  validateResetPasswordToken
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerBusinessSchema,
  registerClientSchema,
  resetPasswordSchema,
  validateResetTokenSchema
} from '../schemas/auth.schemas';

const router = Router();

router.post('/register/client', validate(registerClientSchema), registerClient);
router.post('/register/business', validate(registerBusinessSchema), registerBusiness);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/validate-reset-token', validate(validateResetTokenSchema), validateResetPasswordToken);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.put('/change-password', authenticate, authorize('client', 'business'), validate(changePasswordSchema), changePassword);

export default router;
