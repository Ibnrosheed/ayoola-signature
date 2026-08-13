import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminOrderRoutes from './routes/adminOrder.routes.js';
import addressRoutes from './routes/address.routes.js';
import userRoutes from './routes/user.routes.js';

// Phase 7 Admin Routes
import adminDashboardRoutes from './routes/adminDashboard.routes.js';
import adminProductRoutes from './routes/adminProduct.routes.js';
import adminCustomerRoutes from './routes/adminCustomer.routes.js';
import adminUserRoutes from './routes/adminUser.routes.js';
import adminPaymentRoutes from './routes/adminPayment.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';

// Phase 8 Routes
import reviewRoutes from './routes/review.routes.js';
import myReviewRoutes from './routes/myReview.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import adminReviewRoutes from './routes/adminReview.routes.js';
import adminCouponRoutes from './routes/adminCoupon.routes.js';

// Phase 9 Routes
import notificationRoutes from './routes/notification.routes.js';
import adminNotificationRoutes from './routes/adminNotification.routes.js';

// Phase 10 Routes
import shippingRoutes from './routes/shipping.routes.js';
import shipmentRoutes from './routes/shipment.routes.js';

// Phase 11 Routes
import questionRoutes from './routes/question.routes.js';
import adminQuestionRoutes from './routes/adminQuestion.routes.js';

import { errorHandler, notFound } from './middleware/error.middleware.js';

// Load environment variables
dotenv.config();

const app = express();

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev
      }
    },
    credentials: true,
  })
);

// Express JSON parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directory for file uploads if needed
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/users', userRoutes);

// Phase 7 Admin Routes
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin', adminProductRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/admin/audit-logs', auditLogRoutes);

// Phase 8 Routes
app.use('/api/products/:productId/reviews', reviewRoutes);
app.use('/api/reviews', myReviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin/reviews', adminReviewRoutes);
app.use('/api/admin/coupons', adminCouponRoutes);

// Phase 9 Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);

// Phase 10 Routes
app.use('/api/shipping', shippingRoutes);
app.use('/api/shipments', shipmentRoutes);

// Phase 11 Routes
app.use('/api/products/:productId/questions', questionRoutes);
app.use('/api/admin/questions', adminQuestionRoutes);


// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Ayoola Signature API',
    healthCheck: '/api/health'
  });
});

// Central Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
