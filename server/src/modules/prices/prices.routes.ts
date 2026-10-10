import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createPriceAlertSchema, updatePriceAlertSchema } from './prices.schema';
import {
  getAllPrices,
  getPriceByCrop,
  getPriceAlerts,
  createPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
} from './prices.controller';

const router = Router();

// Public price endpoints
router.get('/', getAllPrices);
router.get('/:crop', getPriceByCrop);

// Authenticated price alert endpoints
router.get('/alerts/me', authenticate, getPriceAlerts);
router.post('/alerts', authenticate, validate(createPriceAlertSchema), createPriceAlert);
router.patch('/alerts/:id', authenticate, validate(updatePriceAlertSchema), updatePriceAlert);
router.delete('/alerts/:id', authenticate, deletePriceAlert);

export default router;
