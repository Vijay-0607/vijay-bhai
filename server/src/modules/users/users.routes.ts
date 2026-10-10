import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { updateUserProfileSchema } from './users.schema';
import { getMe, updateMe, getUserPublicProfile } from './users.controller';

const router = Router();

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validate(updateUserProfileSchema), updateMe);
router.get('/:id', getUserPublicProfile);

export default router;
