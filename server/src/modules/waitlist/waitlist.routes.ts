import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { waitlistLimiter } from '../../middleware/rateLimiter';
import { waitlistSchema } from './waitlist.schema';
import { joinWaitlist, getWaitlist } from './waitlist.controller';

const router = Router();

router.post('/', waitlistLimiter, validate(waitlistSchema), joinWaitlist);
router.get('/', authenticate, requireAdmin, getWaitlist);

export default router;
