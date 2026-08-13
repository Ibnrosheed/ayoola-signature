import nodemailer from 'nodemailer';
import emailConfig from './email.config.js';
import * as templates from './email.templates.js';
import Notification from '../../models/notification.model.js';

let transporter = null;

/**
 * Initialize Nodemailer transporter if configured
 */
const getTransporter = async () => {
  if (!transporter && emailConfig.enabled) {
    let host = emailConfig.host;
    let port = emailConfig.port;
    let secure = emailConfig.secure;
    let user = emailConfig.user;
    let pass = emailConfig.password;

    // Auto-create an Ethereal test account if credentials are placeholder defaults or host is ethereal
    const isPlaceholder = !user || user === 'your_email@gmail.com' || user.includes('your_email') || !pass || pass === 'your_app_password';
    if (isPlaceholder || host === 'smtp.ethereal.email') {
      try {
        console.log('📧 Initializing Ethereal test email account for dev testing...');
        const testAccount = await nodemailer.createTestAccount();
        host = testAccount.smtp.host;
        port = testAccount.smtp.port;
        secure = testAccount.smtp.secure;
        user = testAccount.user;
        pass = testAccount.pass;
        console.log(`✅ Ethereal test account initialized (${user})`);
      } catch (err) {
        console.error('⚠️ Failed to create Ethereal test account:', err.message);
      }
    }

    if (host && user) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
    }
  }
  return transporter;
};

/**
 * Core Send Email Function
 * Non-blocking: catches exceptions internally so business transactions don't fail.
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  type = 'general',
  metadata = {},
  userId = null,
  orderId = null,
}) => {
  const recipientEmail = to || metadata?.recipientEmail;
  if (!recipientEmail) {
    console.warn('⚠️ sendEmail skipped: No recipient specified.');
    return { success: false, error: 'No recipient email specified' };
  }

  // 1. Safe Development Mode Logging if email is disabled
  if (!emailConfig.enabled) {
    console.log('\n=================== [DEV EMAIL SERVICE LOG] ===================');
    console.log(`[Time]: ${new Date().toISOString()}`);
    console.log(`[Type]: ${type}`);
    console.log(`[Recipient]: ${recipientEmail}`);
    console.log(`[Subject]: ${subject}`);
    console.log(`[Status]: DEV_MODE (EMAIL_ENABLED=false) - Email simulated successfully`);
    console.log('=================================================================\n');

    // Create a simulated Notification record in database
    try {
      await Notification.create({
        user: userId || null,
        recipientEmail,
        type,
        channel: 'email',
        subject,
        body: text || subject,
        status: 'sent',
        relatedOrder: orderId || null,
        metadata: { ...metadata, simulated: true },
        sentAt: new Date(),
      });
    } catch (dbErr) {
      console.error('Failed to log simulated notification in DB:', dbErr.message);
    }

    return { success: true, simulated: true };
  }

  // 2. Production / Live Transporter Attempt
  try {
    const transport = await getTransporter();
    if (!transport) {
      throw new Error('Nodemailer transporter failed to initialize. Check EMAIL_HOST/USER configuration.');
    }

    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
      to: recipientEmail,
      subject,
      html,
      text: text || subject,
    };

    const info = await transport.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`✅ Email sent successfully to ${recipientEmail} (${info.messageId})`);
    if (previewUrl) {
      console.log(`🔗 Preview sent email in browser: ${previewUrl}`);
    }

    // Log success in DB
    try {
      await Notification.create({
        user: userId || null,
        recipientEmail,
        type,
        channel: 'email',
        subject,
        body: text || subject,
        status: 'sent',
        relatedOrder: orderId || null,
        metadata: { ...metadata, messageId: info.messageId, previewUrl: previewUrl || null },
        sentAt: new Date(),
      });
    } catch (dbErr) {
      console.error('Failed to log notification in DB:', dbErr.message);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`❌ Email delivery failed for ${recipientEmail}:`, error.message);

    // Log failure in DB
    try {
      await Notification.create({
        user: userId || null,
        recipientEmail,
        type,
        channel: 'email',
        subject,
        body: text || subject,
        status: 'failed',
        errorMessage: error.message,
        relatedOrder: orderId || null,
        metadata,
      });
    } catch (dbErr) {
      console.error('Failed to log failed notification in DB:', dbErr.message);
    }

    // Return failure state without throwing error to prevent crash/rollback of order
    return { success: false, error: error.message };
  }
};

/**
 * Convenience Helper Functions for Specific Email Notifications
 */

export const sendVerifyEmailNotification = async ({ user, verificationToken }) => {
  const verificationUrl = `${emailConfig.clientUrl}/verify-email?token=${verificationToken}`;
  const template = templates.templateVerifyEmail({
    firstName: user.firstName,
    verificationUrl,
  });

  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'email_verification',
    userId: user._id,
    metadata: { verificationUrl },
  });
};

export const sendWelcomeNotification = async ({ user }) => {
  const template = templates.templateWelcome({ firstName: user.firstName });

  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'welcome',
    userId: user._id,
  });
};

export const sendPasswordResetNotification = async ({ user, resetToken }) => {
  const resetUrl = `${emailConfig.clientUrl}/reset-password/${resetToken}`;
  const template = templates.templatePasswordReset({
    firstName: user.firstName,
    resetUrl,
  });

  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'password_reset',
    userId: user._id,
  });
};

export const sendOrderConfirmationNotification = async ({ user, order }) => {
  const template = templates.templateOrderConfirmation({ user, order });

  return sendEmail({
    to: order.customer?.email || user?.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'order_confirmation',
    userId: user?._id || order.user,
    orderId: order._id,
    metadata: { orderNumber: order.orderNumber, total: order.total },
  });
};

export const sendPaymentFailedNotification = async ({ order }) => {
  const template = templates.templatePaymentFailed({ order });

  return sendEmail({
    to: order.customer?.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'payment_failed',
    userId: order.user,
    orderId: order._id,
    metadata: { orderNumber: order.orderNumber },
  });
};

export const sendOrderStatusNotification = async ({ order, newStatus }) => {
  const template = templates.templateOrderStatusUpdate({ order, newStatus });

  return sendEmail({
    to: order.customer?.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: `order_${newStatus}`,
    userId: order.user,
    orderId: order._id,
    metadata: { orderNumber: order.orderNumber, newStatus },
  });
};

export const sendAdminNewOrderNotification = async ({ order }) => {
  const template = templates.templateAdminNewOrder({ order });

  return sendEmail({
    to: emailConfig.adminEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'new_order_admin',
    orderId: order._id,
    metadata: { orderNumber: order.orderNumber, total: order.total },
  });
};

export const sendAdminLowStockNotification = async ({ product, variant, currentStock, threshold }) => {
  const template = templates.templateAdminLowStock({ product, variant, currentStock, threshold });

  return sendEmail({
    to: emailConfig.adminEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'low_stock_admin',
    metadata: { productId: product._id, currentStock, threshold },
  });
};

export const sendAdminOutOfStockNotification = async ({ product, variant }) => {
  const template = templates.templateAdminOutOfStock({ product, variant });

  return sendEmail({
    to: emailConfig.adminEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'out_of_stock_admin',
    metadata: { productId: product._id },
  });
};

export const sendTestEmailNotification = async ({ recipient }) => {
  const template = templates.templateTestEmail({ recipient });

  return sendEmail({
    to: recipient,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'test_email',
  });
};

// --- Phase 10: Shipping Notification Helpers ---

export const sendShipmentCreatedNotification = async ({ order, shipment }) => {
  const template = templates.templateShipmentCreated({ order, shipment });
  return sendEmail({
    to: order.customer?.email || order.shippingAddress?.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'shipment_created',
    userId: order.user,
    orderId: order._id,
    metadata: { orderNumber: order.orderNumber, trackingNumber: shipment.trackingNumber },
  });
};

export const sendOutForDeliveryNotification = async ({ order, shipment }) => {
  const template = templates.templateOutForDelivery({ order, shipment });
  return sendEmail({
    to: order.customer?.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'out_for_delivery',
    userId: order.user,
    orderId: order._id,
    metadata: { orderNumber: order.orderNumber, trackingNumber: shipment.trackingNumber },
  });
};

export const sendOrderDeliveredNotification = async ({ order, shipment }) => {
  const template = templates.templateOrderDelivered({ order, shipment });
  return sendEmail({
    to: order.customer?.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'order_delivered',
    userId: order.user,
    orderId: order._id,
    metadata: { orderNumber: order.orderNumber },
  });
};

export const sendDeliveryFailedNotification = async ({ order, shipment }) => {
  const template = templates.templateDeliveryFailed({ order, shipment });
  return sendEmail({
    to: order.customer?.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: 'delivery_failed',
    userId: order.user,
    orderId: order._id,
    metadata: { orderNumber: order.orderNumber },
  });
};
