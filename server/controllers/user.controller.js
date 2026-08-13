import User from '../models/user.model.js';
import Order from '../models/order.model.js';
import Wishlist from '../models/wishlist.model.js';
import Cart from '../models/cart.model.js';
import {
  validateUpdateProfileInput,
  validateChangePasswordInput,
} from '../validators/auth.validator.js';

/**
 * @desc    Get dashboard overview statistics and recent orders
 * @route   GET /api/users/dashboard
 * @access  Private
 */
export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Run queries in parallel for efficiency
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      wishlist,
      cart,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments({ user: userId }),
      Order.countDocuments({ user: userId, orderStatus: 'pending' }),
      Order.countDocuments({ user: userId, orderStatus: 'processing' }),
      Order.countDocuments({ user: userId, orderStatus: 'delivered' }),
      Wishlist.findOne({ user: userId }),
      Cart.findOne({ user: userId }),
      Order.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const wishlistCount = wishlist && wishlist.products ? wishlist.products.length : 0;
    const cartItemCount = cart && cart.items
      ? cart.items.reduce((acc, item) => acc + item.quantity, 0)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        wishlistCount,
        cartItemCount,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile info
 * @route   PUT /api/users/profile
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

    // Check email uniqueness if email is changed
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

    // Prevent updating role, status, etc.
    // The properties are already filtered out because we only pluck specific variables.

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
 * @desc    Change authenticated user's password
 * @route   PUT /api/users/change-password
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

    // Match password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    // Set new password (pre-save hook hashes it)
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
