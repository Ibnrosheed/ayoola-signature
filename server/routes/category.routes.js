import express from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.get('/slug/:slug', getCategoryBySlug);

// Protected Admin/Superadmin routes
router.post('/', protect, authorize('admin', 'superadmin'), upload.single('categoryImage'), createCategory);
router.put('/:id', protect, authorize('admin', 'superadmin'), upload.single('categoryImage'), updateCategory);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteCategory);

export default router;
