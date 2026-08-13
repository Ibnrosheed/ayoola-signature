import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['email', 'in_app'],
      default: 'email',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
      index: true,
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    relatedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
