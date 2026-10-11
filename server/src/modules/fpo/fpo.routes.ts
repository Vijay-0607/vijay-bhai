import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin, requireFpo } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createFpoSchema, addFpoMemberSchema, verifyFpoSchema } from './fpo.schema';
import { createFpo, getMyFpo, addFpoMember, removeFpoMember, verifyFpo } from './fpo.controller';

const router = Router();

router.use(authenticate);

router.get('/mine', getMyFpo);
router.patch('/:fpoId/verification', requireAdmin, validate(verifyFpoSchema), verifyFpo);
router.post('/', requireFpo, validate(createFpoSchema), createFpo);
router.post('/:fpoId/members', requireFpo, validate(addFpoMemberSchema), addFpoMember);
router.delete('/:fpoId/members/:memberUserId', requireFpo, removeFpoMember);

export default router;
