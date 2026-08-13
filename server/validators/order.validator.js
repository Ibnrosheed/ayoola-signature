/**
 * Validate Checkout & Shipping Information Input
 */
export const validateCheckoutInput = (data) => {
  const errors = {};
  const shipping = data.shippingAddress || {};
  const fulfillmentMethod = data.fulfillmentMethod || 'delivery';

  const validMethods = ['delivery', 'pickup', 'stockpile'];
  if (!validMethods.includes(fulfillmentMethod)) {
    errors.fulfillmentMethod = `Fulfillment method must be one of: ${validMethods.join(', ')}`;
  }

  if (!shipping.fullName || !shipping.fullName.trim()) {
    errors['shippingAddress.fullName'] = 'Recipient full name is required';
  }

  if (!shipping.phone || !shipping.phone.trim()) {
    errors['shippingAddress.phone'] = 'Contact phone number is required';
  }

  // Address fields required for delivery and stockpile
  if (fulfillmentMethod === 'delivery' || fulfillmentMethod === 'stockpile') {
    if (!shipping.address || !shipping.address.trim()) {
      errors['shippingAddress.address'] = 'Street delivery address is required';
    }

    if (!shipping.city || !shipping.city.trim()) {
      errors['shippingAddress.city'] = 'City is required';
    }

    if (!shipping.state || !shipping.state.trim()) {
      errors['shippingAddress.state'] = 'State is required';
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};
