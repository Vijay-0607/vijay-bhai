import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireSeller } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createListingSchema, updateListingSchema, listingQuerySchema } from './listings.schema';
import {
  createListing, getListings, getListing,
  updateListing, deleteListing, getMyListings,
} from './listings.controller';

const router = Router();

router.get('/', validate(listingQuerySchema, 'query'), getListings);
router.get('/mine', authenticate, getMyListings);
router.get('/:id', getListing);
router.post('/', authenticate, requireSeller, validate(createListingSchema), createListing);
router.patch('/:id', authenticate, requireSeller, validate(updateListingSchema), updateListing);
router.delete('/:id', authenticate, requireSeller, deleteListing);

export default router;
