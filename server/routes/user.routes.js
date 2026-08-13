import express from 'express';
import {
  getUserDashboard,
  updateProfile,
  changePassword,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getUserDashboard);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

export default router;
