import { Router } from 'express';
import upload from '../config/multer';
import {
  createAdvertisement,
  listAdvertisements
} from '../controllers/advertisement.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createAdvertisementSchema } from '../schemas/advertisement.schemas';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('super_admin'),
  upload.single('image'),
  validate(createAdvertisementSchema),
  createAdvertisement
);

router.get('/', authenticate, listAdvertisements);

export default router;
