import express from 'express';
import {
  getInventory,
  updateProductStock,
  updateProductStatus,
  toggleProductFeatured,
  toggleProductBestSeller,
  getInventoryHistory,
  addVariant,
  updateVariant,
  deleteVariant,
} from '../controllers/adminProduct.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('admin', 'superadmin'));

// Inventory endpoints
router.get('/inventory', getInventory);
router.get('/inventory/:productId/history', getInventoryHistory);

// Product quick-action endpoints
router.patch('/products/:id/stock', updateProductStock);
router.patch('/products/:id/status', updateProductStatus);
router.patch('/products/:id/featured', toggleProductFeatured);
router.patch('/products/:id/bestseller', toggleProductBestSeller);

// Phase 8: Variant CRUD
router.post('/products/:id/variants', addVariant);
router.put('/products/:id/variants/:variantId', updateVariant);
router.delete('/products/:id/variants/:variantId', deleteVariant);

export default router;

