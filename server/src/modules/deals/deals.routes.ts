import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateDealStatusSchema, dealQuerySchema } from './deals.schema';
import { getDeals, getDeal, updateDealStatus, getDealStats } from './deals.controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(dealQuerySchema, 'query'), getDeals);
router.get('/stats', getDealStats);
router.get('/:id', getDeal);
router.patch('/:id/status', validate(updateDealStatusSchema), updateDealStatus);

export default router;
