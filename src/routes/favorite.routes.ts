import { Router } from 'express';
import { addFavorite, listFavorites, removeFavorite } from '../controllers/favorite.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createFavoriteSchema, removeFavoriteSchema } from '../schemas/favorite.schemas';

const router = Router();

router.get('/', authenticate, authorize('client'), listFavorites);
router.post('/', authenticate, authorize('client'), validate(createFavoriteSchema), addFavorite);
router.delete('/:placeId', authenticate, authorize('client'), validate(removeFavoriteSchema), removeFavorite);

export default router;
