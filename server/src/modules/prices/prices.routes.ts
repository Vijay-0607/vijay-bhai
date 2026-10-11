import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createPriceAlertSchema, updatePriceAlertSchema, upsertMandiPriceSchema } from './prices.schema';
import {
  getAllPrices,
  getPriceByCrop,
  getPriceAlerts,
  createPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
  addMandiPrice,
} from './prices.controller';

const router = Router();

// Public price endpoints
router.get('/', getAllPrices);

// Authenticated price alert endpoints (register before the /:crop route)
router.get('/alerts/me', authenticate, getPriceAlerts);
router.post('/alerts', authenticate, validate(createPriceAlertSchema), createPriceAlert);
router.patch('/alerts/:id', authenticate, validate(updatePriceAlertSchema), updatePriceAlert);
router.delete('/alerts/:id', authenticate, deletePriceAlert);

router.post('/admin/records', authenticate, requireAdmin, validate(upsertMandiPriceSchema), addMandiPrice);
router.get('/:crop', getPriceByCrop);

export default router;
