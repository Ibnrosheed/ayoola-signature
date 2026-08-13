import express from 'express';
import { getAdminPayments } from '../controllers/adminPayment.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('admin', 'superadmin'));

router.get('/', getAdminPayments);

export default router;
