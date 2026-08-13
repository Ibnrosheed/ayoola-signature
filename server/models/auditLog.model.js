import mongoose from 'mongoose';

/**
 * AuditLog — records important administrative actions for accountability
 */
const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performing user is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      index: true,
      // e.g. 'PRODUCT_CREATED', 'ORDER_STATUS_CHANGED', 'ADMIN_CREATED', 'CUSTOMER_DEACTIVATED'
    },
    resource: {
      type: String,
      required: [true, 'Resource type is required'],
      trim: true,
      // e.g. 'Product', 'Order', 'User', 'Category'
    },
    resourceId: {
      type: String,
      default: '',
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Stores relevant change data without sensitive info
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
