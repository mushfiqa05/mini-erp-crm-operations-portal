import { Router } from 'express';
import { getChallans, getChallanById, createChallan, confirmChallan, cancelChallan } from '../controllers/challan.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['Admin', 'Sales', 'Accounts']), getChallans);
router.get('/:id', authorize(['Admin', 'Sales', 'Accounts']), getChallanById);

router.post('/', authorize(['Admin', 'Sales']), createChallan);
router.post('/:id/confirm', authorize(['Admin', 'Sales']), confirmChallan);
router.post('/:id/cancel', authorize(['Admin', 'Sales']), cancelChallan);

export default router;
