import { Router } from 'express';
import { getPointTransactions, getPointsBalance } from '../controllers/points.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { listVisitsSchema } from '../schemas/visit.schemas';

const router = Router();

router.get('/balance', authenticate, authorize('client'), getPointsBalance);
router.get('/transactions', authenticate, authorize('client'), validate(listVisitsSchema), getPointTransactions);

export default router;
