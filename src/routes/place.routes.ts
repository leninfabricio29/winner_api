import { Router } from 'express';
import upload from '../config/multer';
import {
  createPlace,
  deactivatePlace,
  getMyPlaces,
  getNearbyPlaces,
  getPlaceById,
  listPlaces,
  updatePlace
} from '../controllers/place.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createPlaceSchema,
  listPlacesQuerySchema,
  nearbyPlacesSchema,
  updatePlaceSchema
} from '../schemas/place.schemas';

const router = Router();

router.get('/', validate(listPlacesQuerySchema), listPlaces);
router.get('/nearby', validate(nearbyPlacesSchema), getNearbyPlaces);
router.get('/my', authenticate, authorize('business'), getMyPlaces);
router.get('/:id', getPlaceById);
router.post('/', authenticate, authorize('business'), upload.array('images', 4), validate(createPlaceSchema), createPlace);
router.put('/:id', authenticate, authorize('business'), upload.array('images', 4), validate(updatePlaceSchema), updatePlace);
router.delete('/:id', authenticate, authorize('business'), deactivatePlace);

export default router;
