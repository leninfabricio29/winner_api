import { Router } from 'express';
import upload from '../config/multer';
import {
  createPromotion,
  deactivatePromotion,
  getMyPromotions,
  getPromotionById,
  listPromotions,
  updatePromotion
} from '../controllers/promotion.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createPromotionSchema,
  listPromotionQuerySchema,
  updatePromotionSchema
} from '../schemas/promotion.schemas';

const router = Router();

router.get('/', validate(listPromotionQuerySchema), listPromotions);
router.get('/my', authenticate, authorize('business'), getMyPromotions);
router.get('/:id', getPromotionById);
router.post('/', authenticate, authorize('business'), upload.single('image'), validate(createPromotionSchema), createPromotion);
router.put('/:id', authenticate, authorize('business'), upload.single('image'), validate(updatePromotionSchema), updatePromotion);
router.delete('/:id', authenticate, authorize('business'), deactivatePromotion);

export default router;
