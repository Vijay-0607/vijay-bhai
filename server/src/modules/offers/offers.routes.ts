import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createOfferSchema, counterOfferSchema } from './offers.schema';
import {
  createOffer,
  getOffers,
  getOffer,
  counterOffer,
  acceptOffer,
  rejectOffer,
  withdrawOffer,
  getOfferHistory,
} from './offers.controller';

const router = Router();

// All offer endpoints require authentication
router.use(authenticate);

router.get('/', getOffers);
router.post('/', validate(createOfferSchema), createOffer);
router.get('/:id', getOffer);
router.get('/:id/history', getOfferHistory);
router.post('/:id/counter', validate(counterOfferSchema), counterOffer);
router.post('/:id/accept', acceptOffer);
router.post('/:id/reject', rejectOffer);
router.post('/:id/withdraw', withdrawOffer);

export default router;
