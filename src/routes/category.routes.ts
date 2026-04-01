import { Router } from 'express';
import {
  createCategory,
  deactivateCategory,
  listCategories,
  updateCategory
} from '../controllers/category.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schemas';

const router = Router();

router.get('/', listCategories);
router.post('/', authenticate, authorize('super_admin'), validate(createCategorySchema), createCategory);
router.put('/:id', authenticate, authorize('super_admin'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', authenticate, authorize('super_admin'), deactivateCategory);

export default router;
