import mongoose from 'mongoose';

const trackingEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    location: { type: String, default: '' },
    note: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const shipmentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      unique: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      index: true,
    },
    carrier: {
      type: String,
      default: 'Ayoola Express Logistics',
      trim: true,
    },
    shippingMethodName: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'processing',
          'ready_for_shipment',
          'shipped',
          'in_transit',
          'out_for_delivery',
          'delivered',
          'delivery_failed',
          'returned',
          'cancelled',
        ],
        message: '{VALUE} is not a valid shipment status',
      },
      default: 'pending',
      index: true,
    },
    estimatedDeliveryAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    notes: { type: String, default: '', trim: true },
    trackingHistory: { type: [trackingEventSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

shipmentSchema.index({ order: 1 });
shipmentSchema.index({ status: 1, createdAt: -1 });
shipmentSchema.index({ trackingNumber: 1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);

export default Shipment;
