import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import CouponUsage from '../models/couponUsage.model.js';
import ShippingMethod from '../models/shippingMethod.model.js';
import PickupLocation from '../models/pickupLocation.model.js';
import { validateCheckoutInput } from '../validators/order.validator.js';
import { initializeTransaction } from '../services/paystack.service.js';
import {
  calculateItemPrice,
  getAvailableStock,
  validateAndApplyCoupon,
} from '../services/pricing.service.js';
import {
  resolveZoneForAddress,
  calculateShippingFee,
} from '../services/shipping.service.js';
import { sendOrderStatusNotification } from '../services/email/email.service.js';


/**
 * Helper to generate unique order number
 */
const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const timestampPart = String(Date.now()).slice(-6);
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `AYS-${year}-${timestampPart}${randomPart}`;
};

/**
 * Helper to generate unique payment reference
 */
const generatePaymentReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AYS-PAY-${dateStr}-${randomStr}`;
};

/**
 * @route   POST /api/orders
 * @desc    Create a new order & initialize Paystack payment
 * @access  Private (Customer)
 */
export const createOrder = async (req, res, next) => {
  try {
    const { isValid, errors } = validateCheckoutInput(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Shipping address validation failed', errors });
    }

    const { shippingAddress, fulfillmentMethod = 'delivery' } = req.body;

    // 1. Retrieve user's cart (with populated products)
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping bag is empty' });
    }

    // 2. Stockpile expiration
    let stockpileUntilDate = null;
    if (fulfillmentMethod === 'stockpile') {
      stockpileUntilDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    // Pickup address defaults
    const isPickup = fulfillmentMethod === 'pickup';
    const finalAddress = isPickup && !shippingAddress.address
      ? 'Ayoola Signature Flagship Boutique, Victoria Island'
      : shippingAddress.address?.trim() || '';
    const finalCity = isPickup && !shippingAddress.city ? 'Victoria Island, Lagos' : shippingAddress.city?.trim() || '';
    const finalState = isPickup && !shippingAddress.state ? 'Lagos' : shippingAddress.state?.trim() || '';

    // 3. Validate every cart item and build order items using pricing service
    const orderItems = [];
    let subtotal = 0;
    let totalProductDiscount = 0;

    for (const item of cart.items) {
      const prod = item.product;

      if (!prod) {
        return res.status(400).json({ success: false, message: 'A product in your cart is no longer available' });
      }
      if (prod.status !== 'active') {
        return res.status(400).json({ success: false, message: `Product '${prod.name}' is currently unavailable` });
      }

      // Variant-aware stock check
      const availableStock = getAvailableStock(prod, item.variantId?.toString() || null);
      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `'${prod.name}' ${item.variantSku ? `(${item.variantSku})` : ''} has insufficient stock. Requested: ${item.quantity}, Available: ${availableStock}.`,
          productId: prod._id,
          availableStock,
        });
      }

      // Pricing service — variant-aware
      const pricing = calculateItemPrice(prod, item.variantId?.toString() || null);
      const qty = item.quantity;
      const itemSubtotal = pricing.unitPrice * qty;
      const itemDiscountAmt = (pricing.unitPrice - pricing.finalPrice) * qty;
      const itemTotal = pricing.finalPrice * qty;

      subtotal += itemSubtotal;
      totalProductDiscount += itemDiscountAmt;

      orderItems.push({
        product: prod._id,
        name: prod.name,
        sku: pricing.variantSku || prod.sku,
        quantity: qty,
        unitPrice: pricing.unitPrice,
        discount: pricing.discountPct,
        finalPrice: pricing.finalPrice,
        total: itemTotal,
        image: pricing.variantId
          ? (prod.variants.find(v => v._id.toString() === pricing.variantId.toString())?.image || prod.images?.[0] || '')
          : (prod.images?.[0] || ''),
        variantId: pricing.variantId || null,
        variantSku: pricing.variantSku || null,
        variantAttributes: pricing.variantAttributes || null,
      });
    }

    // 4. Server-side coupon validation (revalidate — don't trust cart couponCode blindly)
    const cartCouponCode = cart.couponCode || null;
    let couponResult = { coupon: null, discountAmount: 0, error: null };

    if (cartCouponCode) {
      const postDiscountSubtotal = subtotal - totalProductDiscount;
      couponResult = await validateAndApplyCoupon(
        cartCouponCode,
        req.user._id,
        postDiscountSubtotal,
        cart.items.map(i => ({ product: i.product, quantity: i.quantity, variantId: i.variantId }))
      );
      if (couponResult.error) {
        console.warn(`Coupon ${cartCouponCode} became invalid at order creation: ${couponResult.error}`);
        couponResult = { coupon: null, discountAmount: 0, error: null };
      }
    }

    // 5. Phase 10: Server-side shipping fee calculation (never trust frontend)
    // shippingMethodId is sent from the frontend checkout selection
    const { shippingMethodId, pickupLocationId } = req.body;
    let shippingFee = 0;
    let shippingSnapshot = {};

    if (!isPickup) {
      // Determine zone from shipping address (backend-authoritative)
      const resolvedZone = await resolveZoneForAddress({
        state: finalState,
        city: finalCity,
        country: shippingAddress.country || 'Nigeria',
      });

      if (!resolvedZone) {
        return res.status(400).json({
          success: false,
          message: 'No shipping zone found for the provided delivery address. Please check your address.',
        });
      }

      if (!shippingMethodId) {
        return res.status(400).json({ success: false, message: 'Shipping method is required' });
      }

      const postDiscountSubtotal = subtotal - totalProductDiscount;
      const shippingResult = await calculateShippingFee(shippingMethodId, resolvedZone, postDiscountSubtotal);

      if (shippingResult.error || !shippingResult.method) {
        return res.status(400).json({ success: false, message: shippingResult.error || 'Invalid shipping method' });
      }

      shippingFee = shippingResult.fee;
      shippingSnapshot = {
        zoneId: resolvedZone._id,
        zone: resolvedZone.name,
        methodId: shippingResult.method._id,
        method: shippingResult.method.name,
        fee: shippingFee,
        estimatedDelivery: shippingResult.method.deliveryEstimate,
      };
    } else {
      // Pickup order — fee is 0 unless pickup method has a fee configured
      // Resolve pickup location snapshot
      if (pickupLocationId) {
        const pickupLoc = await PickupLocation.findById(pickupLocationId);
        if (pickupLoc) {
          shippingSnapshot = {
            method: 'Store Pickup',
            fee: 0,
            estimatedDelivery: 'Ready within 24 hours',
            pickupLocationId: pickupLoc._id,
            pickupLocation: {
              name: pickupLoc.name,
              address: pickupLoc.address,
              city: pickupLoc.city,
              state: pickupLoc.state,
              phone: pickupLoc.phone,
              openingHours: pickupLoc.openingHours,
            },
          };
        }
      } else {
        shippingSnapshot = { method: 'Store Pickup', fee: 0, estimatedDelivery: 'Ready within 24 hours' };
      }
      shippingFee = 0;
    }
    const couponDiscount = couponResult.discountAmount || 0;
    const grandTotal = Math.max(
      0,
      Math.round(subtotal - totalProductDiscount - couponDiscount + shippingFee)
    );

    // 6. Generate unique keys
    const orderNumber = generateOrderNumber();
    const paymentReference = generatePaymentReference();

    // 8. Customer snapshot
    const customerSnapshot = {
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      phone: req.user.phone || shippingAddress.phone,
    };

    // 9. Create Order document
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: orderItems,
      customer: customerSnapshot,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        address: finalAddress,
        city: finalCity,
        state: finalState,
        country: shippingAddress.country || 'Nigeria',
        deliveryInstructions: shippingAddress.deliveryInstructions?.trim() || '',
      },
      fulfillmentMethod,
      stockpileUntil: stockpileUntilDate,
      subtotal: Math.round(subtotal),
      discount: Math.round(totalProductDiscount),
      couponCode: couponResult.coupon ? couponResult.coupon.code : null,
      couponId: couponResult.coupon ? couponResult.coupon._id : null,
      couponDiscount,
      deliveryFee: shippingFee,
      shipping: shippingSnapshot,
      total: grandTotal,
      currency: 'NGN',
      paymentReference,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      paymentProvider: 'paystack',
    });

    // 10. Initialize Paystack Transaction
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const callback_url = `${clientUrl}/payment/callback`;

    const paystackRes = await initializeTransaction({
      email: req.user.email,
      amount: grandTotal,
      reference: paymentReference,
      callback_url,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        couponCode: order.couponCode || '',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully. Proceed to payment.',
      data: {
        order,
        authorization_url: paystackRes.data.authorization_url,
        access_code: paystackRes.data.access_code,
        reference: paymentReference,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders
 * @desc    Get customer order history
 * @access  Private (Customer)
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    const total = await Order.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order details by ID or orderNumber
 * @access  Private (Customer & Admin)
 */
export const getUserOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = {};
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { orderNumber: id.toUpperCase() };
    }

    const order = await Order.findOne(query).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security check: Customer can only view their own order; Admins can view any
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isAdmin && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to order' });
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders for admin management with search & filters
 * @access  Private (Admin & Superadmin)
 */
export const getAdminOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.orderStatus) query.orderStatus = req.query.orderStatus;
    if (req.query.paymentStatus) query.paymentStatus = req.query.paymentStatus;

    if (req.query.search && req.query.search.trim() !== '') {
      const searchTerm = req.query.search.trim();
      query.$or = [
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { paymentReference: { $regex: searchTerm, $options: 'i' } },
        { 'customer.email': { $regex: searchTerm, $options: 'i' } },
        { 'customer.firstName': { $regex: searchTerm, $options: 'i' } },
        { 'customer.lastName': { $regex: searchTerm, $options: 'i' } },
        { 'customer.phone': { $regex: searchTerm, $options: 'i' } },
        { couponCode: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Date range filtering
    if (req.query.dateRange) {
      const now = new Date();
      let startDate;
      if (req.query.dateRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (req.query.dateRange === '7days') {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else if (req.query.dateRange === '30days') {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else if (req.query.startDate && req.query.endDate) {
        query.createdAt = {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate),
        };
      }
      if (startDate && !query.createdAt) {
        query.createdAt = { $gte: startDate };
      }
    }

    const total = await Order.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Allowed order status transitions
const ALLOWED_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Update order status with validated transitions and audit logging
 * @access  Private (Admin & Superadmin)
 */
export const updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!orderStatus || !validStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status specified' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = order.orderStatus;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${currentStatus}' to '${orderStatus}'. Allowed: ${allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)'}`,
      });
    }

    if (orderStatus === 'cancelled' && order.paymentStatus === 'successful' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Superadmin can cancel a paid order. Contact your Superadmin.',
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = orderStatus;

    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: orderStatus,
      changedAt: new Date(),
      changedBy: req.user._id,
    });

    await order.save();

    // Send customer email notification idempotently (only if status changed)
    if (previousStatus !== orderStatus) {
      sendOrderStatusNotification({ order, newStatus: orderStatus }).catch((err) => {
        console.error('Failed to send order status notification:', err.message);
      });
    }

    try {
      const AuditLog = (await import('../models/auditLog.model.js')).default;
      await AuditLog.create({
        user: req.user._id,
        action: 'ORDER_STATUS_CHANGED',
        resource: 'Order',
        resourceId: order._id.toString(),
        details: {
          orderNumber: order.orderNumber,
          previousStatus,
          newStatus: orderStatus,
        },
        ipAddress: req.ip || '',
      });
    } catch (auditErr) {
      console.error('Audit log failed:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Order status updated: ${previousStatus} → ${orderStatus}`,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};
