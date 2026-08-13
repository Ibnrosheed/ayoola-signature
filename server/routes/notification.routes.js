import express from 'express';
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Customer notification preference routes
router.get('/preferences', protect, getUserNotificationPreferences);
router.put('/preferences', protect, updateUserNotificationPreferences);

// In-app customer notification history routes
router.get('/my', protect, getMyNotifications);
router.put('/:id/read', protect, markNotificationAsRead);
router.put('/read-all', protect, markAllNotificationsAsRead);

export default router;
