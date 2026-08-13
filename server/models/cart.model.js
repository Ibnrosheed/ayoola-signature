import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    // Phase 8: Variant support — null means no variant selected
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    variantSku: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    items: [cartItemSchema],
    // Phase 8: Applied coupon
    couponCode: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
