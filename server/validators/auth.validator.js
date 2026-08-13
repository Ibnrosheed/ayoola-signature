/**
 * Helper to validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
  return emailRegex.test(email);
};

/**
 * Validate Registration Payload
 */
export const validateRegisterInput = (data) => {
  const errors = {};

  const firstName = data.firstName?.trim();
  const lastName = data.lastName?.trim();
  const email = data.email?.trim();
  const phone = data.phone?.trim();
  const password = data.password;
  const confirmPassword = data.confirmPassword;

  if (!firstName) errors.firstName = 'First name is required';
  if (!lastName) errors.lastName = 'Last name is required';

  if (!email) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!phone) errors.phone = 'Phone number is required';

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate Login Payload
 */
export const validateLoginInput = (data) => {
  const errors = {};

  const email = data.email?.trim();
  const password = data.password;

  if (!email) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate Profile Update Payload
 */
export const validateUpdateProfileInput = (data) => {
  const errors = {};

  const firstName = data.firstName?.trim();
  const lastName = data.lastName?.trim();
  const email = data.email?.trim();
  const phone = data.phone?.trim();

  if (!firstName) errors.firstName = 'First name is required';
  if (!lastName) errors.lastName = 'Last name is required';
  if (!phone) errors.phone = 'Phone number is required';

  if (email && !isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate Password Change Payload
 */
export const validateChangePasswordInput = (data) => {
  const errors = {};

  const currentPassword = data.currentPassword;
  const newPassword = data.newPassword;
  const confirmPassword = data.confirmPassword;

  if (!currentPassword) errors.currentPassword = 'Current password is required';

  if (!newPassword) {
    errors.newPassword = 'New password is required';
  } else if (newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters long';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'New passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate Forgot Password Payload
 */
export const validateForgotPasswordInput = (data) => {
  const errors = {};
  const email = data.email?.trim();

  if (!email) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate Reset Password Payload
 */
export const validateResetPasswordInput = (data) => {
  const errors = {};
  const token = data.token?.trim();
  const password = data.password;
  const confirmPassword = data.confirmPassword;

  if (!token) {
    errors.token = 'Reset token is required';
  }

  if (!password) {
    errors.password = 'New password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

