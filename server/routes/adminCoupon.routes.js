import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  getAdminCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  getCouponUsage,
} from '../controllers/adminCoupon.controller.js';

const router = express.Router();

router.use(protect, authorize('admin', 'superadmin'));

router.get('/', getAdminCoupons);
router.post('/', createCoupon);
router.get('/:id', getCouponById);
router.put('/:id', updateCoupon);
router.patch('/:id/toggle', toggleCouponStatus);
router.delete('/:id', deleteCoupon);
router.get('/:id/usage', getCouponUsage);

export default router;
