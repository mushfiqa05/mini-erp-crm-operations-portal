import { Router } from 'express';
import { getInventorySummary, getStockMovements, createStockMovement } from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['Admin', 'Warehouse']), getInventorySummary);
router.get('/movements', authorize(['Admin', 'Warehouse']), getStockMovements);
router.post('/movements', authorize(['Admin', 'Warehouse']), createStockMovement);

export default router;
