import express from 'express';
import {
  createOrder,
  getUserOrders,
  getUserOrderById,
} from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Customer order routes require authentication
router.use(protect);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', getUserOrderById);

export default router;
