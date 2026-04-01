import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import categoryRoutes from './category.routes';
import placeRoutes from './place.routes';
import promotionRoutes from './promotion.routes';
import redemptionRoutes from './redemption.routes';
import visitRoutes from './visit.routes';
import reviewRoutes from './review.routes';
import favoriteRoutes from './favorite.routes';
import pointsRoutes from './points.routes';
import pointSourceRoutes from './pointSource.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/places', placeRoutes);
router.use('/promotions', promotionRoutes);
router.use('/redemptions', redemptionRoutes);
router.use('/visits', visitRoutes);
router.use('/reviews', reviewRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/points', pointsRoutes);
router.use('/point-sources', pointSourceRoutes);
router.use('/notifications', notificationRoutes);

export default router;
