import express from 'express';
import {
  getAdminNotifications,
  getAdminEmailSettings,
  sendTestEmail,
  retryNotification,
} from '../controllers/notification.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { testEmailLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// Admin and Superadmin routes
router.get('/', protect, authorize('admin', 'superadmin'), getAdminNotifications);
router.get('/settings', protect, authorize('admin', 'superadmin'), getAdminEmailSettings);
router.post('/retry/:id', protect, authorize('admin', 'superadmin'), retryNotification);

// Superadmin-only route for sending test emails
router.post('/test-email', protect, authorize('superadmin'), testEmailLimiter, sendTestEmail);

export default router;
