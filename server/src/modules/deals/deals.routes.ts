import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateDealStatusSchema, dealQuerySchema, createDealReviewSchema, createDealPaymentSchema } from './deals.schema';
import { getDeals, getDeal, updateDealStatus, getDealStats, createDealReview, getPaymentHistory, getPaymentSettings, createDealPayment } from './deals.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(dealQuerySchema, 'query'), getDeals);
router.get('/stats', getDealStats);
router.get('/payment-settings', getPaymentSettings);
router.get('/payments/history', getPaymentHistory);
router.post('/:id/payment', validate(createDealPaymentSchema), createDealPayment);
router.post('/:id/reviews', validate(createDealReviewSchema), createDealReview);
router.get('/:id', getDeal);
router.patch('/:id/status', validate(updateDealStatusSchema), updateDealStatus);

export default router;
