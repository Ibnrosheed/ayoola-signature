import Order from '../models/order.model.js';

/**
 * @desc    Get paginated payment records
 * @route   GET /api/admin/payments
 * @access  Admin, Superadmin
 */
export const getAdminPayments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      paymentStatus = '',
      sort = '-createdAt',
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { paymentReference: { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.firstName': { $regex: search, $options: 'i' } },
        { 'customer.lastName': { $regex: search, $options: 'i' } },
      ];
    }

    if (paymentStatus && ['pending', 'successful', 'failed', 'refunded'].includes(paymentStatus)) {
      filter.paymentStatus = paymentStatus;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let sortObj = { createdAt: -1 };
    if (sort === 'createdAt') sortObj = { createdAt: 1 };
    else if (sort === '-total') sortObj = { total: -1 };
    else if (sort === 'total') sortObj = { total: 1 };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select('orderNumber customer total currency paymentStatus paymentReference paymentProvider paidAt createdAt')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments: orders,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    next(error);
  }
};
