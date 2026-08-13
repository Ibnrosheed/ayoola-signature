import Shipment from '../models/shipment.model.js';
import Order from '../models/order.model.js';
import { generateTrackingNumber } from '../services/shipping.service.js';
import {
  sendShipmentCreatedNotification,
  sendOutForDeliveryNotification,
  sendOrderDeliveredNotification,
  sendDeliveryFailedNotification,
  sendOrderStatusNotification,
} from '../services/email/email.service.js';

// Shipment status ? matching order status
const SHIPMENT_TO_ORDER_STATUS = {
  pending: 'processing',
  processing: 'processing',
  ready_for_shipment: 'processing',
  shipped: 'shipped',
  in_transit: 'in_transit',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  delivery_failed: 'delivery_failed',
  returned: 'processing',
  cancelled: 'cancelled',
};

// Valid forward transitions
const VALID_TRANSITIONS = {
  pending: ['processing', 'ready_for_shipment', 'cancelled'],
  processing: ['ready_for_shipment', 'cancelled'],
  ready_for_shipment: ['shipped', 'cancelled'],
  shipped: ['in_transit', 'delivered', 'delivery_failed'],
  in_transit: ['out_for_delivery', 'delivered', 'delivery_failed'],
  out_for_delivery: ['delivered', 'delivery_failed'],
  delivered: [],
  delivery_failed: ['shipped', 'returned', 'cancelled'],
  returned: ['cancelled'],
  cancelled: [],
};

/**
 * POST /api/admin/shipments
 * Create a shipment for an order.
 */
export const adminCreateShipment = async (req, res, next) => {
  try {
    const { orderId, carrier, notes } = req.body;

    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentStatus !== 'successful') {
      return res.status(400).json({ success: false, message: 'Cannot create shipment for an unpaid order' });
    }

    // Idempotency check
    const existing = await Shipment.findOne({ order: orderId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A shipment already exists for this order', data: { shipment: existing } });
    }

    const trackingNumber = generateTrackingNumber();

    const shipment = await Shipment.create({
      order: orderId,
      trackingNumber,
      carrier: carrier?.trim() || 'Ayoola Express Logistics',
      shippingMethodName: order.shipping?.method || '',
      status: 'pending',
      notes: notes?.trim() || '',
      trackingHistory: [{
        status: 'pending',
        note: 'Shipment created',
        changedBy: req.user._id,
        timestamp: new Date(),
      }],
    });

    // Send shipment created notification
    sendShipmentCreatedNotification({ order, shipment }).catch((err) => {
      console.error('Failed to send shipment created notification:', err.message);
    });

    // Audit log
    try {
      const AuditLog = (await import('../models/auditLog.model.js')).default;
      await AuditLog.create({
        user: req.user._id,
        action: 'SHIPMENT_CREATED',
        resource: 'Shipment',
        resourceId: shipment._id.toString(),
        details: { orderNumber: order.orderNumber, trackingNumber },
        ipAddress: req.ip || '',
      });
    } catch {}

    res.status(201).json({ success: true, message: 'Shipment created', data: { shipment } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/shipments
 * List all shipments with pagination, search, and status filter.
 */
export const adminGetShipments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const total = await Shipment.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const shipments = await Shipment.find(query)
      .populate({
        path: 'order',
        select: 'orderNumber customer shippingAddress shipping total',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Search filter (applied after populate)
    let filtered = shipments;
    if (req.query.search && req.query.search.trim()) {
      const s = req.query.search.trim().toLowerCase();
      filtered = shipments.filter((sh) =>
        (sh.trackingNumber || '').toLowerCase().includes(s) ||
        (sh.order?.orderNumber || '').toLowerCase().includes(s) ||
        (sh.order?.customer?.firstName || '').toLowerCase().includes(s) ||
        (sh.order?.customer?.lastName || '').toLowerCase().includes(s) ||
        (sh.order?.customer?.email || '').toLowerCase().includes(s)
      );
    }

    res.status(200).json({
      success: true,
      data: {
        shipments: filtered,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/shipments/:id
 */
export const adminGetShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate({ path: 'order', select: 'orderNumber customer shippingAddress shipping total orderStatus' })
      .lean();
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.status(200).json({ success: true, data: { shipment } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/shipments/:id
 * Update shipment details (carrier, notes, tracking number override, estimatedDeliveryAt)
 */
export const adminUpdateShipment = async (req, res, next) => {
  try {
    const { carrier, notes, estimatedDeliveryAt } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    if (carrier) shipment.carrier = carrier.trim();
    if (notes !== undefined) shipment.notes = notes.trim();
    if (estimatedDeliveryAt) shipment.estimatedDeliveryAt = new Date(estimatedDeliveryAt);
    await shipment.save();
    res.status(200).json({ success: true, message: 'Shipment updated', data: { shipment } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/shipments/:id/status
 * Validate transition, update shipment status, update order status, send notification.
 */
export const adminUpdateShipmentStatus = async (req, res, next) => {
  try {
    const { status, note, location } = req.body;

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    const currentStatus = shipment.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal)'}`,
      });
    }

    const order = await Order.findById(shipment.order);
    if (!order) return res.status(404).json({ success: false, message: 'Associated order not found' });

    const previousStatus = shipment.status;
    shipment.status = status;

    // Set timestamps
    if (status === 'shipped' && !shipment.shippedAt) shipment.shippedAt = new Date();
    if (status === 'delivered') shipment.deliveredAt = new Date();

    // Push tracking history event
    shipment.trackingHistory.push({
      status,
      note: note?.trim() || '',
      location: location?.trim() || '',
      changedBy: req.user._id,
      timestamp: new Date(),
    });

    await shipment.save();

    // Sync order status
    const newOrderStatus = SHIPMENT_TO_ORDER_STATUS[status];
    if (newOrderStatus && order.orderStatus !== newOrderStatus) {
      const prevOrderStatus = order.orderStatus;
      order.orderStatus = newOrderStatus;
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({ status: newOrderStatus, changedAt: new Date(), changedBy: req.user._id });
      await order.save();

      // Send order status notification for key milestones
      if (['shipped', 'delivered', 'cancelled'].includes(newOrderStatus)) {
        sendOrderStatusNotification({ order, newStatus: newOrderStatus }).catch(() => {});
      }
    }

    // Send specific shipping notifications
    if (status === 'shipped') {
      sendShipmentCreatedNotification({ order, shipment }).catch(() => {});
    } else if (status === 'out_for_delivery') {
      sendOutForDeliveryNotification({ order, shipment }).catch(() => {});
    } else if (status === 'delivered') {
      sendOrderDeliveredNotification({ order, shipment }).catch(() => {});
    } else if (status === 'delivery_failed') {
      sendDeliveryFailedNotification({ order, shipment }).catch(() => {});
    }

    // Audit log
    try {
      const AuditLog = (await import('../models/auditLog.model.js')).default;
      await AuditLog.create({
        user: req.user._id,
        action: 'SHIPMENT_STATUS_UPDATED',
        resource: 'Shipment',
        resourceId: shipment._id.toString(),
        details: { orderNumber: order.orderNumber, previousStatus, newStatus: status, note },
        ipAddress: req.ip || '',
      });
    } catch {}

    res.status(200).json({
      success: true,
      message: `Shipment status updated: ${previousStatus} -> ${status}`,
      data: { shipment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/shipments/track/:orderId
 * Customer tracking - enforces order ownership.
 */
export const customerTrackShipment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    let orderQuery = {};
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      orderQuery = { _id: orderId };
    } else {
      orderQuery = { orderNumber: orderId.toUpperCase() };
    }

    const order = await Order.findOne(orderQuery).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Enforce ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to track this order' });
    }

    const shipment = await Shipment.findOne({ order: order._id }).lean();

    res.status(200).json({
      success: true,
      data: { order, shipment: shipment || null },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/shipments/stats
 */
export const adminShipmentStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [awaitingShipment, inTransit, outForDelivery, deliveredToday, deliveryFailed] = await Promise.all([
      Shipment.countDocuments({ status: { $in: ['pending', 'processing', 'ready_for_shipment'] } }),
      Shipment.countDocuments({ status: 'in_transit' }),
      Shipment.countDocuments({ status: 'out_for_delivery' }),
      Shipment.countDocuments({ status: 'delivered', deliveredAt: { $gte: todayStart } }),
      Shipment.countDocuments({ status: 'delivery_failed' }),
    ]);

    res.status(200).json({
      success: true,
      data: { awaitingShipment, inTransit, outForDelivery, deliveredToday, deliveryFailed },
    });
  } catch (error) {
    next(error);
  }
};
