import express from 'express';
import {
  getAdminDashboard,
  getSalesOverview,
} from '../controllers/adminDashboard.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('admin', 'superadmin'));

router.get('/', getAdminDashboard);
router.get('/sales', getSalesOverview);

export default router;
