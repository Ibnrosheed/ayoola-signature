import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import emailConfig from '../services/email/email.config.js';
import { sendEmail, sendTestEmailNotification } from '../services/email/email.service.js';

/**
 * @route   GET /api/users/notification-preferences
 * @desc    Get logged in user's notification preferences
 * @access  Private (Customer)
 */
export const getUserNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        preferences: user.notificationPreferences || {
          orderUpdates: true,
          promotionalEmails: true,
          recommendations: true,
          newsletter: false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/notification-preferences
 * @desc    Update logged in user's notification preferences
 * @access  Private (Customer)
 */
export const updateUserNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const { orderUpdates, promotionalEmails, recommendations, newsletter } = req.body;

    if (!user.notificationPreferences) {
      user.notificationPreferences = {};
    }

    if (typeof orderUpdates === 'boolean') user.notificationPreferences.orderUpdates = orderUpdates;
    if (typeof promotionalEmails === 'boolean') user.notificationPreferences.promotionalEmails = promotionalEmails;
    if (typeof recommendations === 'boolean') user.notificationPreferences.recommendations = recommendations;
    if (typeof newsletter === 'boolean') user.notificationPreferences.newsletter = newsletter;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        preferences: user.notificationPreferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notifications/my
 * @desc    Get in-app notifications for authenticated user
 * @access  Private (Customer)
 */
export const getMyNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    const pages = Math.ceil(total / limit) || 1;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedOrder', 'orderNumber total orderStatus')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a specific notification as read
 * @access  Private (Customer)
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all user notifications as read
 * @access  Private (Customer)
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/notifications
 * @desc    Get operational notifications feed for Admin / Superadmin
 * @access  Private (Admin & Superadmin)
 */
export const getAdminNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) query.status = req.query.status;
    if (req.query.type) query.type = req.query.type;

    const total = await Notification.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email')
      .populate('relatedOrder', 'orderNumber total orderStatus paymentStatus')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/notifications/settings
 * @desc    Get safe email service configuration status
 * @access  Private (Admin & Superadmin)
 */
export const getAdminEmailSettings = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        enabled: emailConfig.enabled,
        host: emailConfig.host || 'Not configured',
        port: emailConfig.port,
        secure: emailConfig.secure,
        fromEmail: emailConfig.from,
        fromName: emailConfig.fromName,
        adminNotificationEmail: emailConfig.adminEmail,
        clientUrl: emailConfig.clientUrl,
        mode: emailConfig.enabled ? 'Live SMTP Transport' : 'Development Simulation Mode',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/notifications/test-email
 * @desc    Send test email to specified recipient
 * @access  Private (Superadmin only)
 */
export const sendTestEmail = async (req, res, next) => {
  try {
    const { recipient } = req.body;

    const targetRecipient = recipient || emailConfig.adminEmail || req.user.email;

    const result = await sendTestEmailNotification({ recipient: targetRecipient });

    res.status(200).json({
      success: true,
      message: `Test email processed successfully for ${targetRecipient}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/notifications/:id/retry
 * @desc    Retry sending a failed notification email
 * @access  Private (Admin & Superadmin)
 */
export const retryNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Re-dispatch email
    const result = await sendEmail({
      to: notification.recipientEmail,
      subject: notification.subject,
      text: notification.body,
      html: notification.body,
      type: notification.type,
      metadata: notification.metadata,
      userId: notification.user,
      orderId: notification.relatedOrder,
    });

    res.status(200).json({
      success: true,
      message: 'Notification retry initiated',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
