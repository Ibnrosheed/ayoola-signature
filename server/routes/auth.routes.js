import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  adminTest,
  superadminTest,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  forgotPasswordLimiter,
  resendVerificationLimiter,
} from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, resendVerification);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

// Protected user routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Role authorization test routes
router.get('/admin-test', protect, authorize('admin', 'superadmin'), adminTest);
router.get('/superadmin-test', protect, authorize('superadmin'), superadminTest);

export default router;

