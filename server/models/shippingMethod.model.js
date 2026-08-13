import mongoose from 'mongoose';

const shippingMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shipping method name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShippingZone',
      required: [true, 'Shipping zone is required'],
      index: true,
    },
    feeType: {
      type: String,
      enum: { values: ['fixed', 'free'], message: '{VALUE} is not a valid fee type' },
      default: 'fixed',
    },
    baseFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryEstimate: {
      type: String,
      default: '3–5 business days',
      trim: true,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPickup: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

shippingMethodSchema.index({ zone: 1, isActive: 1 });

const ShippingMethod = mongoose.model('ShippingMethod', shippingMethodSchema);

export default ShippingMethod;
