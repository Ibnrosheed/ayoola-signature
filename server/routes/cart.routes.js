import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
} from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeFromCart);
router.delete('/', clearCart);
router.post('/merge', mergeCart);

export default router;
