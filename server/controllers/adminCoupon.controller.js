import Coupon from '../models/coupon.model.js';
import CouponUsage from '../models/couponUsage.model.js';
import AuditLog from '../models/auditLog.model.js';

/**
 * @route  GET /api/admin/coupons
 * @desc   List all coupons with search and filter
 * @access Admin, Superadmin
 */
export const getAdminCoupons = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.isActive === 'true') query.isActive = true;
    if (req.query.isActive === 'false') query.isActive = false;
    if (req.query.discountType) query.discountType = req.query.discountType;

    if (req.query.search?.trim()) {
      const s = req.query.search.trim();
      query.$or = [
        { code: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
      ];
    }

    // Filter: expired
    if (req.query.expired === 'true') {
      query.expiresAt = { $lt: new Date() };
    } else if (req.query.expired === 'false') {
      query.$or = query.$or || undefined;
      query.expiresAt = { $gt: new Date() };
    }

    const total = await Coupon.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Summary stats
    const now = new Date();
    const [active, expired, totalUsage] = await Promise.all([
      Coupon.countDocuments({ isActive: true }),
      Coupon.countDocuments({ expiresAt: { $lt: now } }),
      CouponUsage.countDocuments({}),
    ]);

    res.status(200).json({
      success: true,
      data: {
        coupons,
        summary: { active, expired, totalUsage },
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  POST /api/admin/coupons
 * @desc   Create a new coupon
 * @access Admin, Superadmin
 */
export const createCoupon = async (req, res, next) => {
  try {
    const {
      code, description, discountType, discountValue, minimumOrderAmount,
      maximumDiscount, usageLimit, perUserLimit, startsAt, expiresAt,
      isActive, applicableProducts, applicableCategories, excludedProducts,
    } = req.body;

    if (!code || !code.trim()) return res.status(400).json({ success: false, message: 'Coupon code is required' });
    if (!discountType || !['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ success: false, message: 'Discount type must be percentage or fixed' });
    }
    if (discountValue === undefined || discountValue === null || isNaN(discountValue) || Number(discountValue) < 0) {
      return res.status(400).json({ success: false, message: 'Valid discount value is required' });
    }
    if (discountType === 'percentage' && Number(discountValue) > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%' });
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      description: description?.trim() || '',
      discountType,
      discountValue: Number(discountValue),
      minimumOrderAmount: Number(minimumOrderAmount) || 0,
      maximumDiscount: maximumDiscount !== undefined && maximumDiscount !== '' ? Number(maximumDiscount) : null,
      usageLimit: usageLimit !== undefined && usageLimit !== '' ? Number(usageLimit) : null,
      perUserLimit: perUserLimit !== undefined ? Number(perUserLimit) : 1,
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      excludedProducts: excludedProducts || [],
      createdBy: req.user._id,
    });

    try {
      await AuditLog.create({
        user: req.user._id,
        action: 'COUPON_CREATED',
        resource: 'Coupon',
        resourceId: coupon._id.toString(),
        details: { code: coupon.code, discountType, discountValue },
        ipAddress: req.ip || '',
      });
    } catch {}

    res.status(201).json({ success: true, message: 'Coupon created successfully', data: { coupon } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A coupon with this code already exists' });
    }
    next(error);
  }
};

/**
 * @route  GET /api/admin/coupons/:id
 * @desc   Get single coupon details
 * @access Admin, Superadmin
 */
export const getCouponById = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('applicableProducts', 'name sku')
      .populate('applicableCategories', 'name')
      .populate('excludedProducts', 'name sku')
      .lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    const usageCount = await CouponUsage.countDocuments({ coupon: coupon._id });
    res.status(200).json({ success: true, data: { coupon: { ...coupon, usageCount } } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PUT /api/admin/coupons/:id
 * @desc   Update a coupon
 * @access Admin, Superadmin
 */
export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    const fields = [
      'description', 'discountType', 'discountValue', 'minimumOrderAmount',
      'maximumDiscount', 'usageLimit', 'perUserLimit', 'startsAt', 'expiresAt',
      'isActive', 'applicableProducts', 'applicableCategories', 'excludedProducts',
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (field === 'startsAt' || field === 'expiresAt') {
          coupon[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          coupon[field] = req.body[field];
        }
      }
    }

    // Don't allow changing the code after creation
    await coupon.save();
    res.status(200).json({ success: true, message: 'Coupon updated', data: { coupon } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  PATCH /api/admin/coupons/:id/toggle
 * @desc   Activate or deactivate a coupon
 * @access Admin, Superadmin
 */
export const toggleCouponStatus = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`,
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  DELETE /api/admin/coupons/:id
 * @desc   Delete a coupon (only if usageCount = 0)
 * @access Superadmin
 */
export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    if (coupon.usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a coupon that has been used. Deactivate it instead.',
      });
    }
    await coupon.deleteOne();
    res.status(200).json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route  GET /api/admin/coupons/:id/usage
 * @desc   Get usage history for a coupon
 * @access Admin, Superadmin
 */
export const getCouponUsage = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const coupon = await Coupon.findById(req.params.id).select('code discountType discountValue usageCount').lean();
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    const total = await CouponUsage.countDocuments({ coupon: coupon._id });
    const pages = Math.ceil(total / limit) || 1;

    const usages = await CouponUsage.find({ coupon: coupon._id })
      .sort({ usedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email')
      .populate('order', 'orderNumber total')
      .lean();

    res.status(200).json({
      success: true,
      data: { coupon, usages, pagination: { page, limit, total, pages } },
    });
  } catch (error) {
    next(error);
  }
};
