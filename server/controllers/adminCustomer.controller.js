import User from '../models/user.model.js';
import Order from '../models/order.model.js';
import AuditLog from '../models/auditLog.model.js';

/**
 * @desc    Get paginated customer list with search and order stats
 * @route   GET /api/admin/customers
 * @access  Admin, Superadmin
 */
export const getAdminCustomers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      sort = '-createdAt',
    } = req.query;

    const filter = { role: 'customer' };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && ['active', 'inactive', 'suspended'].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let sortObj = { createdAt: -1 };
    if (sort === 'createdAt') sortObj = { createdAt: 1 };
    else if (sort === 'firstName') sortObj = { firstName: 1 };
    else if (sort === '-firstName') sortObj = { firstName: -1 };

    const [customers, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Get order stats for each customer in one query
    const customerIds = customers.map((c) => c._id);
    const orderStats = await Order.aggregate([
      { $match: { user: { $in: customerIds }, paymentStatus: 'successful' } },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
    ]);

    const statsMap = {};
    orderStats.forEach((s) => {
      statsMap[s._id.toString()] = { totalOrders: s.totalOrders, totalSpent: s.totalSpent };
    });

    const customersWithStats = customers.map((c) => ({
      ...c,
      orderStats: statsMap[c._id.toString()] || { totalOrders: 0, totalSpent: 0 },
    }));

    res.status(200).json({
      success: true,
      data: {
        customers: customersWithStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer with details and recent orders
 * @route   GET /api/admin/customers/:id
 * @access  Admin, Superadmin
 */
export const getAdminCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await User.findOne({ _id: id, role: 'customer' })
      .select('-password')
      .lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const [recentOrders, orderAgg] = await Promise.all([
      Order.find({ user: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber total paymentStatus orderStatus createdAt items')
        .lean(),
      Order.aggregate([
        { $match: { user: customer._id, paymentStatus: 'successful' } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' },
          },
        },
      ]),
    ]);

    const stats = orderAgg.length > 0
      ? orderAgg[0]
      : { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 };

    res.status(200).json({
      success: true,
      data: {
        customer,
        stats: {
          totalOrders: stats.totalOrders,
          totalSpent: stats.totalSpent,
          avgOrderValue: Math.round(stats.avgOrderValue || 0),
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer account status
 * @route   PATCH /api/admin/customers/:id/status
 * @access  Admin, Superadmin
 */
export const updateCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active, inactive, or suspended' });
    }

    const customer = await User.findOne({ _id: id, role: 'customer' });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const previousStatus = customer.status;
    customer.status = status;
    await customer.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'CUSTOMER_STATUS_CHANGED',
      resource: 'User',
      resourceId: customer._id.toString(),
      details: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        previousStatus,
        newStatus: status,
      },
      ipAddress: req.ip || '',
    });

    res.status(200).json({
      success: true,
      message: `Customer account ${status}`,
      data: {
        customer: {
          _id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          status: customer.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
