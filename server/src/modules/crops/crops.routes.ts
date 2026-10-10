import { Router } from 'express';
import { getCropByIdentifier, getCropCategories, getCrops } from './crops.controller';

const router = Router();

router.get('/', getCrops);
router.get('/categories', getCropCategories);
router.get('/:identifier', getCropByIdentifier);

export default router;
