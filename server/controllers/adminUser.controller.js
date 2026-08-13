import User from '../models/user.model.js';
import AuditLog from '../models/auditLog.model.js';

/**
 * @desc    Get all admin/superadmin users
 * @route   GET /api/admin/users
 * @access  Superadmin only
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const filter = { role: { $in: ['admin', 'superadmin'] } };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [admins, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        admins,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new admin user
 * @route   POST /api/admin/users
 * @access  Superadmin only
 */
export const createAdmin = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role = 'admin' } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required: firstName, lastName, email, phone, password' });
    }

    if (!['admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or superadmin' });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const admin = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role,
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'ADMIN_CREATED',
      resource: 'User',
      resourceId: admin._id.toString(),
      details: { adminName: `${admin.firstName} ${admin.lastName}`, adminEmail: admin.email, role },
      ipAddress: req.ip || '',
    });

    res.status(201).json({
      success: true,
      message: `${role === 'superadmin' ? 'Superadmin' : 'Admin'} account created successfully`,
      data: { admin: admin.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update admin user (role, status)
 * @route   PATCH /api/admin/users/:id
 * @access  Superadmin only
 */
export const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    const admin = await User.findOne({ _id: id, role: { $in: ['admin', 'superadmin'] } });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    // Prevent superadmin from removing their own superadmin role
    if (id === req.user._id.toString() && role && role !== 'superadmin') {
      // Check if there are other superadmins
      const otherSuperadmins = await User.countDocuments({
        _id: { $ne: id },
        role: 'superadmin',
        status: 'active',
      });
      if (otherSuperadmins === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove your superadmin role — you are the only active superadmin',
        });
      }
    }

    const changes = {};

    if (role && ['admin', 'superadmin'].includes(role)) {
      changes.previousRole = admin.role;
      admin.role = role;
      changes.newRole = role;
    }

    if (status && ['active', 'inactive'].includes(status)) {
      // Prevent deactivating yourself
      if (id === req.user._id.toString() && status !== 'active') {
        return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
      }
      changes.previousStatus = admin.status;
      admin.status = status;
      changes.newStatus = status;
    }

    await admin.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'ADMIN_UPDATED',
      resource: 'User',
      resourceId: admin._id.toString(),
      details: { adminName: `${admin.firstName} ${admin.lastName}`, ...changes },
      ipAddress: req.ip || '',
    });

    res.status(200).json({
      success: true,
      message: 'Admin user updated successfully',
      data: { admin: admin.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate admin user
 * @route   DELETE /api/admin/users/:id
 * @access  Superadmin only
 */
export const deactivateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    const admin = await User.findOne({ _id: id, role: { $in: ['admin', 'superadmin'] } });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    admin.status = 'inactive';
    admin.role = 'customer'; // Revoke admin access
    await admin.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'ADMIN_DEACTIVATED',
      resource: 'User',
      resourceId: admin._id.toString(),
      details: { adminName: `${admin.firstName} ${admin.lastName}`, adminEmail: admin.email },
      ipAddress: req.ip || '',
    });

    res.status(200).json({
      success: true,
      message: 'Admin access revoked and account deactivated',
    });
  } catch (error) {
    next(error);
  }
};
