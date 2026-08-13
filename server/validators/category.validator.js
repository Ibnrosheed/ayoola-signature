/**
 * Validate Category payload
 */
export const validateCategoryInput = (data) => {
  const errors = {};
  const name = data.name?.trim();

  if (!name) {
    errors.name = 'Category name is required';
  } else if (name.length < 2) {
    errors.name = 'Category name must be at least 2 characters';
  } else if (name.length > 100) {
    errors.name = 'Category name cannot exceed 100 characters';
  }

  if (data.status && !['active', 'inactive'].includes(data.status)) {
    errors.status = 'Status must be active or inactive';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
