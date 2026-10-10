import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireBuyer } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createDemandSchema, updateDemandSchema, demandQuerySchema } from './demands.schema';
import {
  createDemand, getDemands, getDemand,
  updateDemand, deleteDemand, getMyDemands,
} from './demands.controller';

const router = Router();

router.get('/', validate(demandQuerySchema, 'query'), getDemands);
router.get('/mine', authenticate, getMyDemands);
router.get('/:id', getDemand);
router.post('/', authenticate, requireBuyer, validate(createDemandSchema), createDemand);
router.patch('/:id', authenticate, requireBuyer, validate(updateDemandSchema), updateDemand);
router.delete('/:id', authenticate, requireBuyer, deleteDemand);

export default router;
