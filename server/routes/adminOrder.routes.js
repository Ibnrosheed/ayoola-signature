import express from 'express';
import {
  getAdminOrders,
  getUserOrderById,
  updateAdminOrderStatus,
} from '../controllers/order.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Admin order management requires admin or superadmin authorization
router.use(protect, authorize('admin', 'superadmin'));

router.get('/', getAdminOrders);
router.get('/:id', getUserOrderById);
router.put('/:id/status', updateAdminOrderStatus);

export default router;
