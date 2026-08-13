/**
 * Validate Product payload
 */
export const validateProductInput = (data) => {
  const errors = {};

  const name = data.name?.trim();
  const sku = data.sku?.trim();
  const description = data.description?.trim();
  const price = Number(data.price);
  const discount = data.discount !== undefined ? Number(data.discount) : 0;
  const quantity = Number(data.quantity);
  const category = data.category;

  if (!name) errors.name = 'Product name is required';
  if (!sku) errors.sku = 'SKU is required';
  if (!description) errors.description = 'Product description is required';
  if (!category) errors.category = 'Category is required';

  if (isNaN(price) || price < 0) {
    errors.price = 'Price must be a number greater than or equal to 0';
  }

  if (isNaN(discount) || discount < 0 || discount > 100) {
    errors.discount = 'Discount must be a percentage between 0 and 100';
  }

  if (isNaN(quantity) || quantity < 0) {
    errors.quantity = 'Stock quantity must be a non-negative integer';
  }

  if (data.status && !['active', 'inactive'].includes(data.status)) {
    errors.status = 'Status must be active or inactive';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
