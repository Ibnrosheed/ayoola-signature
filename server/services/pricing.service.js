/**
 * Centralized Pricing Service — Ayoola Signature Phase 8
 *
 * Discount precedence (documented business rule):
 *   1. Variant-specific discount (if variant exists and discount > 0)
 *   2. Product-level discount (if no variant discount)
 *   3. Coupon discount applied on top of post-product-discount subtotal
 *
 * All monetary values are rounded to integer Naira.
 * Paystack conversion: total * 100 to get Kobo.
 */

import Coupon from '../models/coupon.model.js';
import CouponUsage from '../models/couponUsage.model.js';

/**
 * Calculate the effective price for a product (with optional variant)
 *
 * @param {Object} product — Mongoose product document
 * @param {string|null} variantId — variant _id string or null
 * @returns {{ unitPrice, discountPct, finalPrice, variantId, variantSku, variantAttributes }}
 */
export const calculateItemPrice = (product, variantId = null) => {
  if (variantId && product.variants && product.variants.length > 0) {
    const variant = product.variants.find(
      (v) => v._id.toString() === variantId.toString() && v.isActive
    );
    if (variant) {
      const unitPrice = variant.price !== null && variant.price !== undefined
        ? Number(variant.price)
        : Number(product.price);

      // Use variant discount if set > 0, otherwise fall back to product discount
      const discountPct = variant.discount > 0
        ? Number(variant.discount)
        : Number(product.discount) || 0;

      const finalPrice = Math.max(0, Math.round(unitPrice * (1 - discountPct / 100)));

      return {
        unitPrice,
        discountPct,
        finalPrice,
        variantId: variant._id,
        variantSku: variant.sku,
        variantAttributes: variant.attributes ? Object.fromEntries(variant.attributes) : {},
      };
    }
  }

  // No variant — use product-level pricing
  const unitPrice = Number(product.price) || 0;
  const discountPct = Number(product.discount) || 0;
  const finalPrice = Math.max(0, Math.round(unitPrice * (1 - discountPct / 100)));

  return {
    unitPrice,
    discountPct,
    finalPrice,
    variantId: null,
    variantSku: null,
    variantAttributes: null,
  };
};

/**
 * Calculate available stock for a product or specific variant
 *
 * @param {Object} product — product document
 * @param {string|null} variantId
 * @returns {number} available stock
 */
export const getAvailableStock = (product, variantId = null) => {
  if (variantId && product.variants && product.variants.length > 0) {
    const variant = product.variants.find(
      (v) => v._id.toString() === variantId.toString()
    );
    if (variant) return variant.quantity || 0;
  }
  return product.quantity || 0;
};

/**
 * Validate and compute coupon discount for a given subtotal + cart items
 *
 * @param {string} couponCode — raw code from user
 * @param {string} userId — ObjectId string
 * @param {number} subtotal — post-product-discount subtotal in NGN
 * @param {Array} cartItems — array of { product, quantity }
 * @returns {{ coupon, discountAmount, error }}
 */
export const validateAndApplyCoupon = async (couponCode, userId, subtotal, cartItems = []) => {
  if (!couponCode) return { coupon: null, discountAmount: 0, error: null };

  const code = couponCode.toString().trim().toUpperCase();

  const coupon = await Coupon.findOne({ code });

  if (!coupon) {
    return { coupon: null, discountAmount: 0, error: 'Coupon code not found' };
  }

  if (!coupon.isActive) {
    return { coupon: null, discountAmount: 0, error: 'This coupon is no longer active' };
  }

  const now = new Date();

  if (coupon.startsAt && now < coupon.startsAt) {
    return { coupon: null, discountAmount: 0, error: 'This coupon is not yet valid' };
  }

  if (coupon.expiresAt && now > coupon.expiresAt) {
    return { coupon: null, discountAmount: 0, error: 'This coupon has expired' };
  }

  // Usage limit check
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { coupon: null, discountAmount: 0, error: 'This coupon has reached its usage limit' };
  }

  // Per-user limit check
  if (coupon.perUserLimit !== null && coupon.perUserLimit > 0) {
    const userUsageCount = await CouponUsage.countDocuments({
      coupon: coupon._id,
      user: userId,
    });
    if (userUsageCount >= coupon.perUserLimit) {
      return {
        coupon: null,
        discountAmount: 0,
        error: `You have already used this coupon ${coupon.perUserLimit === 1 ? '' : `${coupon.perUserLimit} times`}`.trim(),
      };
    }
  }

  // Minimum order amount check
  if (coupon.minimumOrderAmount > 0 && subtotal < coupon.minimumOrderAmount) {
    return {
      coupon: null,
      discountAmount: 0,
      error: `Minimum order amount of ₦${coupon.minimumOrderAmount.toLocaleString()} required for this coupon`,
    };
  }

  // Product/category scope validation
  if (
    coupon.applicableProducts.length > 0 ||
    coupon.applicableCategories.length > 0 ||
    coupon.excludedProducts.length > 0
  ) {
    const applicableProductIds = coupon.applicableProducts.map((p) => p.toString());
    const applicableCategoryIds = coupon.applicableCategories.map((c) => c.toString());
    const excludedProductIds = coupon.excludedProducts.map((p) => p.toString());

    const hasApplicableItem = cartItems.some((item) => {
      const productId = item.product?._id?.toString() || item.product?.toString();
      const categoryId = item.product?.category?.toString();

      // Check excluded
      if (excludedProductIds.length > 0 && excludedProductIds.includes(productId)) return false;

      // If scoped to products or categories, at least one must match
      if (applicableProductIds.length > 0 || applicableCategoryIds.length > 0) {
        return (
          applicableProductIds.includes(productId) ||
          (categoryId && applicableCategoryIds.includes(categoryId))
        );
      }

      return true;
    });

    if (!hasApplicableItem) {
      return {
        coupon: null,
        discountAmount: 0,
        error: 'This coupon does not apply to any items in your cart',
      };
    }
  }

  // Calculate discount amount
  let discountAmount = 0;

  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round(subtotal * coupon.discountValue / 100);
    if (coupon.maximumDiscount !== null && discountAmount > coupon.maximumDiscount) {
      discountAmount = coupon.maximumDiscount;
    }
  } else {
    // fixed
    discountAmount = Math.min(coupon.discountValue, subtotal);
  }

  discountAmount = Math.max(0, Math.round(discountAmount));

  return { coupon, discountAmount, error: null };
};

/**
 * Calculate full cart totals including product discounts and optional coupon
 *
 * @param {Array} items — array of { product, variantId, quantity }
 * @param {{ coupon, discountAmount }} couponResult — from validateAndApplyCoupon
 * @param {number} deliveryFee
 * @returns {{ subtotal, productDiscount, couponDiscount, deliveryFee, total }}
 */
export const calculateCartTotals = (items, couponResult = null, deliveryFee = 0) => {
  let subtotal = 0;
  let productDiscount = 0;

  for (const item of items) {
    const { unitPrice, discountPct, finalPrice } = calculateItemPrice(
      item.product,
      item.variantId || null
    );
    const qty = item.quantity || 1;
    subtotal += unitPrice * qty;
    productDiscount += (unitPrice - finalPrice) * qty;
  }

  const couponDiscount = couponResult?.discountAmount || 0;
  const afterProductDiscount = Math.max(0, subtotal - productDiscount);
  const total = Math.max(0, Math.round(afterProductDiscount - couponDiscount + deliveryFee));

  return {
    subtotal: Math.round(subtotal),
    productDiscount: Math.round(productDiscount),
    couponDiscount: Math.round(couponDiscount),
    deliveryFee: Math.round(deliveryFee),
    total,
  };
};
