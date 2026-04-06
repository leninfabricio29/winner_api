import { Router } from 'express';
import { listPointSources, updatePointSource } from '../controllers/pointSource.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { updatePointSourceSchema } from '../schemas/pointSource.schemas';

const router = Router();

router.get('/', listPointSources);
router.put('/:id', authenticate, authorize('super_admin'), validate(updatePointSourceSchema), updatePointSource);

export default router;
