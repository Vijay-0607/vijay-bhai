import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireFpo } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createFpoSchema, addFpoMemberSchema } from './fpo.schema';
import { createFpo, getMyFpo, addFpoMember, removeFpoMember } from './fpo.controller';

const router = Router();

router.use(authenticate);

router.get('/mine', getMyFpo);
router.post('/', requireFpo, validate(createFpoSchema), createFpo);
router.post('/:fpoId/members', requireFpo, validate(addFpoMemberSchema), addFpoMember);
router.delete('/:fpoId/members/:memberUserId', requireFpo, removeFpoMember);

export default router;
