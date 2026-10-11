import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateDealStatusSchema, dealQuerySchema, createDealReviewSchema } from './deals.schema';
import { getDeals, getDeal, updateDealStatus, getDealStats, createDealReview } from './deals.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(dealQuerySchema, 'query'), getDeals);
router.get('/stats', getDealStats);
router.post('/:id/reviews', validate(createDealReviewSchema), createDealReview);
router.get('/:id', getDeal);
router.patch('/:id/status', validate(updateDealStatusSchema), updateDealStatus);

export default router;
