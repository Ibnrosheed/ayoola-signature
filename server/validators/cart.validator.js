import mongoose from 'mongoose';

/**
 * Validate Add/Update Cart Item Input
 */
export const validateCartInput = (data) => {
  const errors = {};

  if (!data.productId) {
    errors.productId = 'Product ID is required';
  } else if (!mongoose.Types.ObjectId.isValid(data.productId)) {
    errors.productId = 'Invalid Product ID format';
  }

  if (data.quantity !== undefined) {
    const qty = Number(data.quantity);
    if (isNaN(qty) || !Number.isInteger(qty) || qty < 0) {
      errors.quantity = 'Quantity must be a non-negative integer';
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};
