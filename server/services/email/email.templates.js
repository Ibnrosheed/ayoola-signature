import emailConfig from './email.config.js';

/**
 * Base Email Wrapper with Ayoola Signature Styling
 */
const wrapTemplate = (contentHtml, previewText = '') => {
  const clientUrl = emailConfig.clientUrl;
  const brandName = emailConfig.fromName;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #334155;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 30px 0;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #0f172a;
      padding: 24px;
      text-align: center;
      border-bottom: 3px solid #d97706;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      letter-spacing: 1px;
      font-weight: 700;
    }
    .header p {
      color: #94a3b8;
      margin: 4px 0 0 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .content {
      padding: 32px 24px;
    }
    .btn {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin: 20px 0;
      text-align: center;
      border: 1px solid #0f172a;
    }
    .btn-gold {
      background-color: #d97706;
      border-color: #d97706;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #0f172a;
      text-decoration: underline;
    }
    .table-order {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .table-order th, .table-order td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .table-order th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
    }
    .total-row {
      font-weight: 700;
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-success { background-color: #dcfce7; color: #166534; }
    .badge-warning { background-color: #fef3c7; color: #92400e; }
    .badge-danger { background-color: #fee2e2; color: #991b1b; }
    .badge-info { background-color: #e0f2fe; color: #075985; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <h1>AYOOLA SIGNATURE</h1>
        <p>Quality products. Signature shopping experience.</p>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;"><strong>Ayoola Signature</strong> &bull; Luxury E-Commerce</p>
        <p style="margin: 0 0 8px 0;">
          <a href="${clientUrl}">Visit Store</a> | 
          <a href="${clientUrl}/account/orders">My Orders</a> | 
          <a href="${clientUrl}/account/notifications">Notification Settings</a>
        </p>
        <p style="margin: 0;">Need assistance? Contact <a href="mailto:support@ayoolasignature.com">support@ayoolasignature.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * 1. Email Verification Template
 */
export const templateVerifyEmail = ({ firstName, verificationUrl }) => {
  const content = `
    <h2 style="color: #0f172a; margin-top: 0;">Verify Your Email Address</h2>
    <p>Hello ${firstName},</p>
    <p>Thank you for registering with <strong>Ayoola Signature</strong>. To complete your account registration and unlock full access, please verify your email address by clicking the button below:</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="btn btn-gold">Verify Email Address</a>
    </div>
    <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your web browser:<br>
    <a href="${verificationUrl}" style="color: #d97706; word-break: break-all;">${verificationUrl}</a></p>
    <p style="font-size: 13px; color: #64748b;">This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
  `;
  return {
    subject: 'Verify Your Email — Ayoola Signature',
    html: wrapTemplate(content, 'Please verify your email address to complete registration.'),
    text: `Hello ${firstName},\n\nPlease verify your email address by clicking the link below:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
  };
};

/**
 * 2. Welcome Email Template
 */
export const templateWelcome = ({ firstName }) => {
  const clientUrl = emailConfig.clientUrl;
  const content = `
    <h2 style="color: #0f172a; margin-top: 0;">Welcome to Ayoola Signature!</h2>
    <p>Dear ${firstName},</p>
    <p>We are thrilled to welcome you to the Ayoola Signature family. Your account is now verified and active.</p>
    <p>Explore our curated collections of luxury footwear, clothing, and accessories designed to give you a signature style.</p>
    <div style="text-align: center;">
      <a href="${clientUrl}/products" class="btn">Explore Collections</a>
    </div>
    <p>If you have any questions or need personalized assistance, our customer support team is always ready to help.</p>
    <p>Best regards,<br><strong>The Ayoola Signature Team</strong></p>
  `;
  return {
    subject: 'Welcome to Ayoola Signature',
    html: wrapTemplate(content, 'Welcome to Ayoola Signature! Explore our signature collections.'),
    text: `Dear ${firstName},\n\nWelcome to Ayoola Signature! Your account is verified and ready.\nStart shopping at: ${clientUrl}/products`,
  };
};

/**
 * 3. Password Reset Template
 */
export const templatePasswordReset = ({ firstName, resetUrl }) => {
  const content = `
    <h2 style="color: #0f172a; margin-top: 0;">Reset Your Password</h2>
    <p>Hello ${firstName || 'Valued Customer'},</p>
    <p>We received a request to reset the password for your <strong>Ayoola Signature</strong> account.</p>
    <p>Click the button below to set a new password:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn btn-gold">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your browser:<br>
    <a href="${resetUrl}" style="color: #d97706; word-break: break-all;">${resetUrl}</a></p>
    <p style="font-size: 13px; color: #ef4444;">This link will expire in 30 minutes for security reasons.</p>
    <p style="font-size: 13px; color: #64748b;">If you did not request a password reset, please ignore this message or contact support immediately.</p>
  `;
  return {
    subject: 'Password Reset Request — Ayoola Signature',
    html: wrapTemplate(content, 'Reset your password for Ayoola Signature.'),
    text: `Hello ${firstName || 'Valued Customer'},\n\nReset your password by visiting:\n${resetUrl}\n\nThis link expires in 30 minutes.`,
  };
};

/**
 * 4. Order Confirmation Template
 */
export const templateOrderConfirmation = ({ user, order }) => {
  const clientUrl = emailConfig.clientUrl;
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td>
          <strong>${item.name}</strong>
          ${item.variantSku ? `<br><small style="color: #64748b;">SKU: ${item.variantSku}</small>` : ''}
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">&#8358;${(item.finalPrice || 0).toLocaleString()}</td>
        <td style="text-align: right;">&#8358;${(item.total || 0).toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const content = `
    <h2 style="color: #0f172a; margin-top: 0;">Order Confirmation</h2>
    <p>Hello ${order.customer?.firstName || user?.firstName || 'Valued Customer'},</p>
    <p>Thank you for your order! We have received your payment and your order is now being processed.</p>
    
    <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 4px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p style="margin: 0 0 4px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
      <p style="margin: 0 0 4px 0;"><strong>Payment Status:</strong> <span class="badge badge-success">Successful</span></p>
      <p style="margin: 0;"><strong>Fulfillment:</strong> ${order.fulfillmentMethod ? order.fulfillmentMethod.toUpperCase() : 'DELIVERY'}</p>
    </div>

    <h3>Order Items</h3>
    <table class="table-order">
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <table style="width: 100%; font-size: 14px; margin-top: 12px;">
      <tr>
        <td style="text-align: right; width: 70%;">Subtotal:</td>
        <td style="text-align: right; font-weight: 600;">&#8358;${(order.subtotal || 0).toLocaleString()}</td>
      </tr>
      ${
        order.couponDiscount > 0
          ? `
      <tr>
        <td style="text-align: right; color: #166534;">Coupon Discount (${order.couponCode || ''}):</td>
        <td style="text-align: right; color: #166534; font-weight: 600;">-&#8358;${(order.couponDiscount || 0).toLocaleString()}</td>
      </tr>
      `
          : ''
      }
      <tr>
        <td style="text-align: right;">Delivery Fee:</td>
        <td style="text-align: right; font-weight: 600;">&#8358;${(order.deliveryFee || 0).toLocaleString()}</td>
      </tr>
      <tr class="total-row">
        <td style="text-align: right; font-size: 16px; padding-top: 8px;">Grand Total:</td>
        <td style="text-align: right; font-size: 16px; padding-top: 8px; color: #0f172a;">&#8358;${(order.total || 0).toLocaleString()}</td>
      </tr>
    </table>

    <div style="margin-top: 20px;">
      <h4>Shipping Address</h4>
      <p style="margin: 0; font-size: 14px; color: #475569;">
        ${order.shippingAddress?.fullName || ''}<br>
        ${order.shippingAddress?.address || ''}<br>
        ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}<br>
        Phone: ${order.shippingAddress?.phone || ''}
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${clientUrl}/account/orders/${order._id}" class="btn">View My Order</a>
    </div>
  `;
  return {
    subject: `Order Confirmation — ${order.orderNumber}`,
    html: wrapTemplate(content, `Order ${order.orderNumber} confirmed. Thank you for your purchase!`),
    text: `Thank you for your order ${order.orderNumber}! Total: NGN ${(order.total || 0).toLocaleString()}. View details at ${clientUrl}/account/orders/${order._id}`,
  };
};

/**
 * 5. Payment Failed Template
 */
export const templatePaymentFailed = ({ order }) => {
  const clientUrl = emailConfig.clientUrl;
  const content = `
    <h2 style="color: #ef4444; margin-top: 0;">Payment Unsuccessful</h2>
    <p>Hello ${order.customer?.firstName || 'Valued Customer'},</p>
    <p>We were unable to complete the payment verification for your order <strong>${order.orderNumber}</strong>.</p>
    <div style="background-color: #fee2e2; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #ef4444; color: #991b1b;">
      <p style="margin: 0 0 4px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p style="margin: 0 0 4px 0;"><strong>Amount:</strong> &#8358;${(order.total || 0).toLocaleString()}</p>
      <p style="margin: 0;"><strong>Status:</strong> Payment Failed / Declined</p>
    </div>
    <p>Don't worry, your cart items are safe. You can retry paying for your order by visiting your order details page.</p>
    <div style="text-align: center;">
      <a href="${clientUrl}/account/orders/${order._id}" class="btn btn-gold">Retry Payment</a>
    </div>
  `;
  return {
    subject: `Payment Unsuccessful — ${order.orderNumber}`,
    html: wrapTemplate(content, `Payment attempt for order ${order.orderNumber} failed.`),
    text: `Payment attempt for order ${order.orderNumber} failed. Please retry at ${clientUrl}/account/orders/${order._id}`,
  };
};

/**
 * 6. Order Status Update Templates
 */
export const templateOrderStatusUpdate = ({ order, newStatus }) => {
  const clientUrl = emailConfig.clientUrl;
  const statusTitles = {
    processing: 'Your Order Is Being Processed',
    shipped: 'Your Order Has Been Shipped!',
    delivered: 'Your Order Has Been Delivered!',
    cancelled: 'Your Order Has Been Cancelled',
  };

  const statusBadges = {
    processing: '<span class="badge badge-warning">Processing</span>',
    shipped: '<span class="badge badge-info">Shipped</span>',
    delivered: '<span class="badge badge-success">Delivered</span>',
    cancelled: '<span class="badge badge-danger">Cancelled</span>',
  };

  const statusMessages = {
    processing: 'Our team is carefully preparing your order for dispatch. We will notify you once your package ships.',
    shipped: 'Great news! Your order is on its way. You can track your package status from your account dashboard.',
    delivered: 'Your order has been delivered successfully. We hope you love your new signature items!',
    cancelled: 'Your order has been cancelled. If you have any questions regarding refunds or replacements, please contact our support team.',
  };

  const title = statusTitles[newStatus] || `Order Status Updated: ${newStatus}`;
  const badge = statusBadges[newStatus] || `<span class="badge badge-info">${newStatus}</span>`;
  const message = statusMessages[newStatus] || `Your order status has changed to ${newStatus}.`;

  const content = `
    <h2 style="color: #0f172a; margin-top: 0;">${title}</h2>
    <p>Hello ${order.customer?.firstName || 'Valued Customer'},</p>
    <p>${message}</p>
    
    <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 4px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p style="margin: 0 0 4px 0;"><strong>New Status:</strong> ${badge}</p>
      <p style="margin: 0;"><strong>Total Amount:</strong> &#8358;${(order.total || 0).toLocaleString()}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${clientUrl}/account/orders/${order._id}" class="btn">View Order Details</a>
    </div>
  `;

  return {
    subject: `${title} — ${order.orderNumber}`,
    html: wrapTemplate(content, `Update on your order ${order.orderNumber}: ${newStatus}`),
    text: `Update on order ${order.orderNumber}: ${newStatus}.\nView details at ${clientUrl}/account/orders/${order._id}`,
  };
};

/**
 * 7. Admin New Order Alert Template
 */
export const templateAdminNewOrder = ({ order }) => {
  const clientUrl = emailConfig.clientUrl;
  const content = `
    <h2 style="color: #0f172a; margin-top: 0;">New Order Received</h2>
    <p>A new order has been placed and payment confirmed on Ayoola Signature.</p>
    
    <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #0f172a;">
      <p style="margin: 0 0 4px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p style="margin: 0 0 4px 0;"><strong>Customer:</strong> ${order.customer?.firstName || ''} ${order.customer?.lastName || ''} (${order.customer?.email || ''})</p>
      <p style="margin: 0 0 4px 0;"><strong>Total Amount:</strong> &#8358;${(order.total || 0).toLocaleString()}</p>
      <p style="margin: 0 0 4px 0;"><strong>Items Count:</strong> ${(order.items || []).reduce((sum, item) => sum + item.quantity, 0)} items</p>
      <p style="margin: 0;"><strong>Payment Ref:</strong> ${order.paymentReference}</p>
    </div>

    <div style="text-align: center; margin-top: 20px;">
      <a href="${clientUrl}/admin/orders/${order._id}" class="btn btn-gold">Manage Order in Admin Panel</a>
    </div>
  `;
  return {
    subject: `New Order Alert — ${order.orderNumber}`,
    html: wrapTemplate(content, `New order ${order.orderNumber} received. Amount: NGN ${(order.total || 0).toLocaleString()}`),
    text: `New order ${order.orderNumber} received. Customer: ${order.customer?.email}, Total: NGN ${(order.total || 0).toLocaleString()}`,
  };
};

/**
 * 8. Admin Low Stock Alert Template
 */
export const templateAdminLowStock = ({ product, variant, currentStock, threshold }) => {
  const clientUrl = emailConfig.clientUrl;
  const productName = product.name;
  const sku = variant ? variant.sku : product.sku;
  const detail = variant ? `Variant (${sku})` : `Main Product`;

  const content = `
    <h2 style="color: #d97706; margin-top: 0;">Low Stock Warning</h2>
    <p>Attention Admin,</p>
    <p>Inventory for <strong>${productName}</strong> has fallen below the configured threshold (${threshold} units).</p>
    
    <div style="background-color: #fef3c7; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #d97706; color: #92400e;">
      <p style="margin: 0 0 4px 0;"><strong>Product:</strong> ${productName}</p>
      <p style="margin: 0 0 4px 0;"><strong>Target:</strong> ${detail}</p>
      <p style="margin: 0 0 4px 0;"><strong>SKU:</strong> ${sku}</p>
      <p style="margin: 0;"><strong>Current Remaining Stock:</strong> <strong style="font-size: 16px; color: #b45309;">${currentStock}</strong></p>
    </div>

    <p>Please restock this item soon to avoid missing potential customer sales.</p>
    <div style="text-align: center;">
      <a href="${clientUrl}/admin/products" class="btn">Update Inventory</a>
    </div>
  `;
  return {
    subject: `Low Stock Alert — ${productName} (${sku})`,
    html: wrapTemplate(content, `Low stock alert: ${productName} has only ${currentStock} units remaining.`),
    text: `Low stock alert: ${productName} (${sku}) has only ${currentStock} units left. Restock at ${clientUrl}/admin/products`,
  };
};

/**
 * 9. Admin Out of Stock Alert Template
 */
export const templateAdminOutOfStock = ({ product, variant }) => {
  const clientUrl = emailConfig.clientUrl;
  const productName = product.name;
  const sku = variant ? variant.sku : product.sku;

  const content = `
    <h2 style="color: #ef4444; margin-top: 0;">Product Out of Stock!</h2>
    <p>Attention Admin,</p>
    <p><strong>${productName}</strong> is now completely out of stock.</p>
    
    <div style="background-color: #fee2e2; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #ef4444; color: #991b1b;">
      <p style="margin: 0 0 4px 0;"><strong>Product:</strong> ${productName}</p>
      <p style="margin: 0 0 4px 0;"><strong>SKU:</strong> ${sku}</p>
      <p style="margin: 0;"><strong>Remaining Stock:</strong> <strong style="font-size: 16px; color: #dc2626;">0</strong></p>
    </div>

    <div style="text-align: center;">
      <a href="${clientUrl}/admin/products" class="btn btn-gold">Replenish Stock</a>
    </div>
  `;
  return {
    subject: `Out of Stock Alert — ${productName} (${sku})`,
    html: wrapTemplate(content, `Out of stock: ${productName} reached 0 stock.`),
    text: `Out of stock: ${productName} (${sku}) has 0 remaining stock. Replenish at ${clientUrl}/admin/products`,
  };
};

/**
 * 10. Admin System Test Email Template
 */
export const templateTestEmail = ({ recipient }) => {
  const content = `
    <h2 style="color: #0f172a; margin-top: 0;">Test Email</h2>
    <p>Hello Superadmin,</p>
    <p>This is a test notification from the <strong>Ayoola Signature Communication System</strong>.</p>
    <div style="background-color: #dcfce7; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #10b981; color: #166534;">
      <p style="margin: 0;"><strong>Status:</strong> Email configuration is working correctly!</p>
      <p style="margin: 4px 0 0 0;"><strong>Recipient:</strong> ${recipient}</p>
    </div>
  `;
  return {
    subject: 'System Test Email — Ayoola Signature',
    html: wrapTemplate(content, 'Ayoola Signature Email Service Test.'),
    text: `Ayoola Signature Email Service Test. Configuration is working properly for ${recipient}.`,
  };
};

// --- Phase 10: Shipping Notification Templates ---

export const templateShipmentCreated = ({ order, shipment }) => {
  const clientUrl = emailConfig.clientUrl;
  const trackUrl = `${clientUrl}/account/orders/${order._id}/track`;
  const content = `
    <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px 0;">Your Order Has Shipped!</h2>
    <p style="margin:0 0 20px 0;color:#64748b;">Great news! Your Ayoola Signature order is on its way.</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Order:</strong> ${order.orderNumber}</p>
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Tracking Number:</strong> <span style="font-family:monospace;background:#e2e8f0;padding:2px 8px;border-radius:4px;">${shipment.trackingNumber}</span></p>
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Shipping Method:</strong> ${shipment.shippingMethodName}</p>
      <p style="margin:0 0 0 0;font-size:14px;"><strong>Estimated Delivery:</strong> ${order.shipping && order.shipping.estimatedDelivery ? order.shipping.estimatedDelivery : '3-5 business days'}</p>
    </div>
    <a href="${trackUrl}" style="display:inline-block;background:#0f172a;color:#fbbf24;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:20px;">Track Your Order</a>
  `;
  return {
    subject: `Your Order #${order.orderNumber} Has Shipped`,
    html: wrapTemplate(content, `Your Ayoola Signature order ${order.orderNumber} has shipped.`),
    text: `Your order ${order.orderNumber} has shipped. Tracking: ${shipment.trackingNumber}. Track at: ${trackUrl}`,
  };
};

export const templateOutForDelivery = ({ order, shipment }) => {
  const clientUrl = emailConfig.clientUrl;
  const trackUrl = `${clientUrl}/account/orders/${order._id}/track`;
  const content = `
    <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px 0;">Your Order Is Out for Delivery</h2>
    <p style="margin:0 0 20px 0;color:#64748b;">Your Ayoola Signature order is out for delivery today.</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Order:</strong> ${order.orderNumber}</p>
      <p style="margin:0 0 0 0;font-size:14px;"><strong>Tracking Number:</strong> <span style="font-family:monospace;background:#e2e8f0;padding:2px 8px;border-radius:4px;">${shipment.trackingNumber}</span></p>
    </div>
    <a href="${trackUrl}" style="display:inline-block;background:#0f172a;color:#fbbf24;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:20px;">Track Order</a>
  `;
  return {
    subject: `Your Order #${order.orderNumber} Is Out for Delivery`,
    html: wrapTemplate(content, `Your Ayoola Signature order ${order.orderNumber} is out for delivery.`),
    text: `Your order ${order.orderNumber} is out for delivery today. Tracking: ${shipment.trackingNumber}. Track at: ${trackUrl}`,
  };
};

export const templateOrderDelivered = ({ order, shipment }) => {
  const clientUrl = emailConfig.clientUrl;
  const orderUrl = `${clientUrl}/account/orders/${order._id}`;
  const deliveryDate = shipment && shipment.deliveredAt
    ? new Date(shipment.deliveredAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  const content = `
    <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px 0;">Your Order Has Been Delivered!</h2>
    <p style="margin:0 0 20px 0;color:#64748b;">Your Ayoola Signature order was delivered on ${deliveryDate}. We hope you love your purchase!</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 8px 0;font-size:14px;"><strong>Order:</strong> ${order.orderNumber}</p>
      <p style="margin:0 0 0 0;font-size:14px;"><strong>Delivered:</strong> ${deliveryDate}</p>
    </div>
    <p style="color:#64748b;font-size:14px;margin-bottom:20px;">Consider leaving a review on your purchased items.</p>
    <a href="${orderUrl}" style="display:inline-block;background:#0f172a;color:#fbbf24;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:20px;">View Order</a>
  `;
  return {
    subject: `Order #${order.orderNumber} Has Been Delivered`,
    html: wrapTemplate(content, `Your Ayoola Signature order ${order.orderNumber} has been delivered.`),
    text: `Your order ${order.orderNumber} was delivered on ${deliveryDate}. View at: ${orderUrl}`,
  };
};

export const templateDeliveryFailed = ({ order }) => {
  const content = `
    <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px 0;">Delivery Attempt Unsuccessful</h2>
    <p style="margin:0 0 20px 0;color:#64748b;">We were unable to complete the delivery for your Ayoola Signature order. Our logistics team will contact you with the next steps.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 0 0;font-size:14px;"><strong>Order:</strong> ${order.orderNumber}</p>
    </div>
    <p style="color:#64748b;font-size:14px;margin-bottom:20px;">If you have any questions, please contact our support team.</p>
  `;
  return {
    subject: `Delivery Update for Order #${order.orderNumber}`,
    html: wrapTemplate(content, `Delivery update for Ayoola Signature order ${order.orderNumber}.`),
    text: `We were unable to complete delivery for order ${order.orderNumber}. Our team will contact you shortly.`,
  };
};
