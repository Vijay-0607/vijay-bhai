import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { getMatches, getMatch, getMatchesForListing, getMatchesForDemand } from './matches.controller';

const router = Router();

router.get('/', optionalAuth, getMatches);
router.get('/:id', authenticate, getMatch);

export default router;

// Sub-routers mounted from listings/demands routes
export { getMatchesForListing, getMatchesForDemand };
