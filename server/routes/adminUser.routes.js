import express from 'express';
import {
  getAdminUsers,
  createAdmin,
  updateAdmin,
  deactivateAdmin,
} from '../controllers/adminUser.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Superadmin only
router.use(protect, authorize('superadmin'));

router.get('/', getAdminUsers);
router.post('/', createAdmin);
router.patch('/:id', updateAdmin);
router.delete('/:id', deactivateAdmin);

export default router;
