import mongoose from 'mongoose';

/**
 * InventoryLog — records every stock quantity change on a product
 * Reasons: 'order', 'manual_adjustment', 'stock_replenishment', 'return', 'damage'
 */
const inventoryLogSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    change: {
      type: Number,
      required: [true, 'Change amount is required'],
      // Positive = added, Negative = deducted
    },
    previousQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    newQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      enum: {
        values: ['order', 'manual_adjustment', 'stock_replenishment', 'return', 'damage', 'other'],
        message: '{VALUE} is not a valid reason',
      },
      default: 'manual_adjustment',
      index: true,
    },
    reference: {
      // e.g. order number, admin name, note
      type: String,
      default: '',
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

inventoryLogSchema.index({ product: 1, createdAt: -1 });
inventoryLogSchema.index({ createdBy: 1, createdAt: -1 });

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);

export default InventoryLog;
