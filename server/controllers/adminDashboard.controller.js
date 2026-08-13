import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import Review from '../models/review.model.js';
import ProductQuestion from '../models/productQuestion.model.js';

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD || '5', 10);

/**
 * @desc    Get comprehensive admin dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Admin, Superadmin
 */
export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      salesAgg,
      recentOrders,
      lowStockProducts,
      failedPayments,
      pendingReviewsCount,
      totalReviewsCount,
      unansweredQuestionsCount,
    ] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ orderStatus: 'pending' }),
      Order.countDocuments({ orderStatus: 'processing' }),
      Order.countDocuments({ orderStatus: 'shipped' }),
      Order.countDocuments({ orderStatus: 'delivered' }),
      Order.countDocuments({ orderStatus: 'cancelled' }),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ quantity: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
      Product.countDocuments({ quantity: 0 }),

      // Total sales from successful payments only
      Order.aggregate([
        { $match: { paymentStatus: 'successful' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Recent 10 orders
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber customer total paymentStatus orderStatus createdAt')
        .populate('user', 'firstName lastName email')
        .lean(),

      // Low stock products (quantity between 1 and threshold)
      Product.find({ quantity: { $gt: 0, $lte: LOW_STOCK_THRESHOLD }, status: 'active' })
        .select('name sku quantity images status')
        .sort({ quantity: 1 })
        .limit(10)
        .lean(),

      // Failed payments in last 7 days
      Order.countDocuments({
        paymentStatus: 'failed',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),

      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({}),
      ProductQuestion.countDocuments({ isAnswered: false }),
    ]);

    const totalSales = salesAgg.length > 0 ? salesAgg[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        customers: totalCustomers,
        products: totalProducts,
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
        recentOrders,
        lowStockItems: lowStockProducts,
        failedPaymentsLast7Days: failedPayments,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
        pendingReviews: pendingReviewsCount,
        totalReviews: totalReviewsCount,
        unansweredQuestions: unansweredQuestionsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get sales overview by date range
 * @route   GET /api/admin/dashboard/sales?range=7days|30days|year|today
 * @access  Admin, Superadmin
 */
export const getSalesOverview = async (req, res, next) => {
  try {
    const { range = '7days' } = req.query;

    let startDate;
    let groupFormat;
    const now = new Date();

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      groupFormat = { $hour: '$createdAt' };
    } else if (range === '7days') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
    } else if (range === '30days') {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
    } else if (range === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
    } else {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'successful',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupFormat,
          sales: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id': 1 } },
    ]);

    // Summary totals
    const totalSales = salesData.reduce((acc, d) => acc + d.sales, 0);
    const totalOrders = salesData.reduce((acc, d) => acc + d.orders, 0);

    res.status(200).json({
      success: true,
      data: {
        range,
        totalSales,
        totalOrders,
        chartData: salesData,
      },
    });
  } catch (error) {
    next(error);
  }
};
