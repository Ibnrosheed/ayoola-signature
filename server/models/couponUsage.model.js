import mongoose from 'mongoose';

/**
 * CouponUsage — tracks individual coupon redemptions for per-user limit enforcement
 */
const couponUsageSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // usedAt is sufficient
  }
);

// Prevent duplicate records per user + order (idempotency)
couponUsageSchema.index({ coupon: 1, user: 1, order: 1 }, { unique: true });

const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);

export default CouponUsage;
