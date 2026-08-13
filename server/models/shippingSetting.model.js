import mongoose from 'mongoose';

const shippingSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
    },
    shippingEnabled: {
      type: Boolean,
      default: true,
    },
    freeShippingEnabled: {
      type: Boolean,
      default: false,
    },
    freeShippingThreshold: {
      type: Number,
      default: 100000,
      min: 0,
    },
    freeShippingZones: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'ShippingZone',
      default: [],
    },
    pickupEnabled: {
      type: Boolean,
      default: true,
    },
    trackingEnabled: {
      type: Boolean,
      default: true,
    },
    defaultDeliveryEstimate: {
      type: String,
      default: '3–5 business days',
    },
    currency: {
      type: String,
      default: 'NGN',
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

const ShippingSetting = mongoose.model('ShippingSetting', shippingSettingSchema);

export default ShippingSetting;
