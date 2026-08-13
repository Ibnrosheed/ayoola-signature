import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import { validateAndApplyCoupon, calculateItemPrice } from '../services/pricing.service.js';

/**
 * @route  POST /api/coupons/validate
 * @desc   Validate a coupon code against the authenticated user's current cart
 * @access Private (Customer)
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode || !couponCode.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    // Get user's cart to calculate subtotal
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Build cartItems with product + variantId for pricing
    const cartItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const prod = item.product;
      if (!prod || prod.status !== 'active') continue;

      const pricing = calculateItemPrice(prod, item.variantId);
      const qty = item.quantity;
      subtotal += pricing.finalPrice * qty;
      cartItems.push({ product: prod, quantity: qty, variantId: item.variantId });
    }

    const { coupon, discountAmount, error } = await validateAndApplyCoupon(
      couponCode,
      req.user._id,
      subtotal,
      cartItems
    );

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    // Persist the coupon on the cart document for checkout reference
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { couponCode: coupon.code, couponDiscount: discountAmount }
    );

    res.status(200).json({
      success: true,
      message: `Coupon applied! You save ₦${discountAmount.toLocaleString()}`,
      data: {
        couponCode: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        description: coupon.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  DELETE /api/coupons/remove
 * @desc   Remove applied coupon from cart
 * @access Private (Customer)
 */
export const removeCoupon = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { couponCode: null, couponDiscount: 0 }
    );

    res.status(200).json({ success: true, message: 'Coupon removed' });
  } catch (error) {
    next(error);
  }
};
