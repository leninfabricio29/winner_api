import { Router } from 'express';
import { createVisit, listMyVisits } from '../controllers/visit.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createVisitSchema, listVisitsSchema } from '../schemas/visit.schemas';

const router = Router();

router.post('/', authenticate, authorize('client'), validate(createVisitSchema), createVisit);
router.get('/my', authenticate, authorize('client'), validate(listVisitsSchema), listMyVisits);

export default router;
