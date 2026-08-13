import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import {
  validateRegisterInput,
  validateLoginInput,
  validateUpdateProfileInput,
  validateChangePasswordInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
} from '../validators/auth.validator.js';
import {
  sendVerifyEmailNotification,
  sendWelcomeNotification,
  sendPasswordResetNotification,
} from '../services/email/email.service.js';


/**
 * Generate JWT token helper
 */
const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'ayoola_signature_secret_jwt_key_phase_1';
  return jwt.sign({ userId, role }, secret, {
    expiresIn: '7d',
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer account
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { isValid, errors } = validateRegisterInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const { firstName, lastName, email, phone, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Generate email verification token (raw token sent to user email, hash stored in DB)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create User (default role: customer, status: active, isEmailVerified: false)
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      password,
      role: 'customer',
      status: 'active',
      isEmailVerified: false,
      emailVerificationTokenHash: verificationTokenHash,
      emailVerificationExpiresAt: verificationTokenExpiresAt,
    });

    // Fire non-blocking email verification notification
    sendVerifyEmailNotification({ user, verificationToken }).catch((err) => {
      console.error('Failed to dispatch registration verification email:', err.message);
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. A verification link has been sent to your email address.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get JWT token
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { isValid, errors } = validateLoginInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user and explicitly include password field for comparison
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check account status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Please contact support.`,
      });
    }

    // Compare Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user details
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile info
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { isValid, errors } = validateUpdateProfileInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const { firstName, lastName, phone, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email is changing and if new email is already taken
    if (email && email.toLowerCase().trim() !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const emailExists = await User.findOne({ email: normalizedEmail });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'The requested email address is already in use',
        });
      }
      user.email = normalizedEmail;
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone) user.phone = phone.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { isValid, errors } = validateChangePasswordInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/admin-test
 * @desc    Test admin authorization
 * @access  Private (Admin & Superadmin)
 */
export const adminTest = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted. Admin authorization test successful.',
    data: {
      user: req.user.toJSON(),
    },
  });
};

/**
 * @route   GET /api/auth/superadmin-test
 * @desc    Test superadmin authorization
 * @access  Private (Superadmin only)
 */
export const superadminTest = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted. Superadmin authorization test successful.',
    data: {
      user: req.user.toJSON(),
    },
  });
};

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify customer email address using token
 * @access  Public
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const rawToken = req.body.token || req.query.token;

    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    // Hash incoming token
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Find user by verification token hash
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
    }).select('+emailVerificationTokenHash');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or already used email verification token',
      });
    }

    // Check expiration
    if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please request a new verification email.',
      });
    }

    // Mark email as verified & clear verification fields
    user.isEmailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;

    // Send Welcome email idempotently
    if (!user.welcomeEmailSent) {
      sendWelcomeNotification({ user }).catch((err) => {
        console.error('Failed to send welcome email:', err.message);
      });
      user.welcomeEmailSent = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Your email has been verified successfully',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public / Private
 */
export const resendVerification = async (req, res, next) => {
  try {
    let email = req.user ? req.user.email : req.body.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Safe response to prevent enumeration
      return res.status(200).json({
        success: true,
        message: 'If an unverified account exists for this email, a verification link has been sent.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already verified',
      });
    }

    // Generate new token & hash
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.emailVerificationTokenHash = verificationTokenHash;
    user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Dispatch email
    sendVerifyEmailNotification({ user, verificationToken }).catch((err) => {
      console.error('Failed to resend verification email:', err.message);
    });

    res.status(200).json({
      success: true,
      message: 'If an unverified account exists for this email, a verification link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { isValid, errors } = validateForgotPasswordInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Enforce generic response for security (prevent email enumeration)
    const genericResponse = {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate 32-byte reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetTokenHash = resetTokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    // Send reset email
    sendPasswordResetNotification({ user, resetToken }).catch((err) => {
      console.error('Failed to send password reset email:', err.message);
    });

    res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset user password using token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { isValid, errors } = validateResetPasswordInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token and unexpired reset window
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+passwordResetTokenHash');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    // Set new password (user schema pre-save hook will hash it)
    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Your password has been changed successfully. You may now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

