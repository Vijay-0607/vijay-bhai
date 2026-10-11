import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createSupportReportSchema } from './support.schema';
import { createSupportReport, getMyReports } from './support.controller';

const router = Router();
router.use(authenticate);
router.get('/', getMyReports);
router.post('/', validate(createSupportReportSchema), createSupportReport);
export default router;
