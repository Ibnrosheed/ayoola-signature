import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { validateCoupon, removeCoupon } from '../controllers/coupon.controller.js';

const router = express.Router();

router.post('/validate', protect, validateCoupon);
router.delete('/remove', protect, removeCoupon);

export default router;
