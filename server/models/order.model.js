import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name snapshot is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU snapshot is required'],
      trim: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price snapshot is required'],
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    finalPrice: {
      type: Number,
      required: [true, 'Final unit price snapshot is required'],
      min: 0,
    },
    total: {
      type: Number,
      required: [true, 'Item total is required'],
      min: 0,
    },
    image: {
      type: String,
      default: '',
    },
    // Phase 8: Variant snapshot — preserved even if product variants change later
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    variantSku: {
      type: String,
      default: null,
    },
    variantAttributes: {
      // Snapshot of variant attributes e.g. { size: "42", color: "Black" }
      type: Map,
      of: String,
      default: null,
    },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, 'Shipping full name is required'], trim: true },
    phone: { type: String, required: [true, 'Shipping phone is required'], trim: true },
    address: { type: String, required: [true, 'Shipping street address is required'], trim: true },
    city: { type: String, required: [true, 'Shipping city is required'], trim: true },
    state: { type: String, required: [true, 'Shipping state is required'], trim: true },
    country: { type: String, default: 'Nigeria', trim: true },
    deliveryInstructions: { type: String, default: '', trim: true },
  },
  { _id: false }
);

// Phase 10: Shipping snapshot — preserved even if shipping config changes later
const shippingSnapshotSchema = new mongoose.Schema(
  {
    zoneId: { type: mongoose.Schema.Types.ObjectId, default: null },
    zone: { type: String, default: '' },
    methodId: { type: mongoose.Schema.Types.ObjectId, default: null },
    method: { type: String, default: '' },
    fee: { type: Number, default: 0, min: 0 },
    estimatedDelivery: { type: String, default: '' },
    // For pickup orders
    pickupLocationId: { type: mongoose.Schema.Types.ObjectId, default: null },
    pickupLocation: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      phone: { type: String, default: '' },
      openingHours: { type: String, default: '' },
    },
  },
  { _id: false }
);

const customerSnapshotSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    items: [orderItemSchema],
    customer: customerSnapshotSchema,
    shippingAddress: shippingAddressSchema,
    fulfillmentMethod: {
      type: String,
      enum: {
        values: ['delivery', 'pickup', 'stockpile'],
        message: '{VALUE} is not a valid fulfillment method',
      },
      default: 'delivery',
      index: true,
    },
    stockpileUntil: {
      type: Date,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Phase 8: Coupon fields — preserved historically even if coupon is deleted
    couponCode: {
      type: String,
      default: null,
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'NGN',
      uppercase: true,
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'successful', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: {
        values: [
          'pending',
          'processing',
          'shipped',
          'in_transit',
          'out_for_delivery',
          'delivered',
          'delivery_failed',
          'cancelled',
        ],
        message: '{VALUE} is not a valid order status',
      },
      default: 'pending',
      index: true,
    },
    // Phase 10: Shipping snapshot
    shipping: {
      type: shippingSnapshotSchema,
      default: () => ({}),
    },
    paymentProvider: {
      type: String,
      default: 'paystack',
    },
    paidAt: {
      type: Date,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index compound queries for search & user order history
orderSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
