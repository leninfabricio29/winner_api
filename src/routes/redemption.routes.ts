import { Router } from 'express';
import {
  createRedemption,
  listBusinessRedemptions,
  listMyRedemptions,
  validateRedemption
} from '../controllers/redemption.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createRedemptionSchema,
  listRedemptionQuerySchema,
  validateRedemptionSchema
} from '../schemas/redemption.schemas';

const router = Router();

router.post('/', authenticate, authorize('client'), validate(createRedemptionSchema), createRedemption);
router.get('/my', authenticate, authorize('client'), validate(listRedemptionQuerySchema), listMyRedemptions);
router.post('/validate', authenticate, authorize('business'), validate(validateRedemptionSchema), validateRedemption);
router.get('/business', authenticate, authorize('business'), validate(listRedemptionQuerySchema), listBusinessRedemptions);

export default router;
