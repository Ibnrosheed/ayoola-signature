import express from 'express';
import {
  getAdminCustomers,
  getAdminCustomerById,
  updateCustomerStatus,
} from '../controllers/adminCustomer.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('admin', 'superadmin'));

router.get('/', getAdminCustomers);
router.get('/:id', getAdminCustomerById);
router.patch('/:id/status', updateCustomerStatus);

export default router;
