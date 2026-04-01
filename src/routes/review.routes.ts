import { Router } from 'express';
import { createReview, deleteReview, listPlaceReviews } from '../controllers/review.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createReviewSchema, placeReviewsSchema } from '../schemas/review.schemas';

const router = Router();

router.post('/', authenticate, authorize('client'), validate(createReviewSchema), createReview);
router.get('/place/:placeId', validate(placeReviewsSchema), listPlaceReviews);
router.delete('/:id', authenticate, authorize('client'), deleteReview);

export default router;
