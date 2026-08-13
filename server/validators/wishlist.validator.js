import mongoose from 'mongoose';

/**
 * Validate Wishlist Product ID Input
 */
export const validateWishlistInput = (productId) => {
  const errors = {};

  if (!productId) {
    errors.productId = 'Product ID is required';
  } else if (!mongoose.Types.ObjectId.isValid(productId)) {
    errors.productId = 'Invalid Product ID format';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};
