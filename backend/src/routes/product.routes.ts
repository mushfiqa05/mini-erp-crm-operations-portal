import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['Admin', 'Warehouse', 'Sales']), getProducts);
router.get('/:id', authorize(['Admin', 'Warehouse', 'Sales']), getProductById);

router.post('/', authorize(['Admin', 'Warehouse']), createProduct);
router.put('/:id', authorize(['Admin', 'Warehouse']), updateProduct);

export default router;
