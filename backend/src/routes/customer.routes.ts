import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, addFollowUpNote } from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['Admin', 'Sales', 'Accounts']), getCustomers);
router.get('/:id', authorize(['Admin', 'Sales', 'Accounts']), getCustomerById);

router.post('/', authorize(['Admin', 'Sales']), createCustomer);
router.put('/:id', authorize(['Admin', 'Sales']), updateCustomer);
router.post('/:id/followups', authorize(['Admin', 'Sales']), addFollowUpNote);

export default router;
