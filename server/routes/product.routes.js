import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/slug/:slug', getProductBySlug);

// Protected Admin/Superadmin routes
router.post('/', protect, authorize('admin', 'superadmin'), upload.array('images', 5), createProduct);
router.put('/:id', protect, authorize('admin', 'superadmin'), upload.array('images', 5), updateProduct);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteProduct);

export default router;
