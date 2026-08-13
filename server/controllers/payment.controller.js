import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import Cart from '../models/cart.model.js';
import Coupon from '../models/coupon.model.js';
import CouponUsage from '../models/couponUsage.model.js';
import InventoryLog from '../models/inventoryLog.model.js';
import { verifyTransaction } from '../services/paystack.service.js';
import {
  sendOrderConfirmationNotification,
  sendAdminNewOrderNotification,
  sendAdminLowStockNotification,
  sendAdminOutOfStockNotification,
  sendPaymentFailedNotification,
} from '../services/email/email.service.js';


/**
 * @route   GET /api/payments/verify/:reference
 * @desc    Verify Paystack transaction reference & confirm order
 * @access  Public / Private
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Payment reference is required' });
    }

    // 1. Retrieve the corresponding order
    const order = await Order.findOne({ paymentReference: reference });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found for specified payment reference' });
    }

    // 2. IDEMPOTENCY CHECK
    if (order.paymentStatus === 'successful') {
      return res.status(200).json({
        success: true,
        message: 'Payment verified (Already processed)',
        data: { order },
      });
    }

    // 3. Verify transaction with Paystack API
    const paystackRes = await verifyTransaction(reference);

    if (!paystackRes || paystackRes.data.status !== 'success') {
      order.paymentStatus = 'failed';
      await order.save();

      // Dispatch failed payment email non-blockingly
      sendPaymentFailedNotification({ order }).catch((err) => {
        console.error('Failed to dispatch payment failed email:', err.message);
      });

      return res.status(400).json({
        success: false,
        message: 'Paystack payment verification failed or payment was declined',
        data: { order },
      });
    }

    const paystackData = paystackRes.data;

    // 4. Verify Payment Amount
    const expectedAmountKobo = Math.round(order.total * 100);
    if (paystackData.amount !== null && paystackData.amount !== undefined) {
      if (Number(paystackData.amount) !== expectedAmountKobo) {
        console.error(`❌ Amount Mismatch for ${reference}: Expected ${expectedAmountKobo} Kobo, Got ${paystackData.amount} Kobo`);
        order.paymentStatus = 'failed';
        await order.save();

        sendPaymentFailedNotification({ order }).catch((err) => {
          console.error('Failed to dispatch payment failed email:', err.message);
        });

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: Amount paid does not match order total',
        });
      }
    }

    // 5. Verify Currency
    if (paystackData.currency && paystackData.currency.toUpperCase() !== 'NGN') {
      console.error(`❌ Currency Mismatch for ${reference}: Expected NGN, Got ${paystackData.currency}`);
      order.paymentStatus = 'failed';
      await order.save();

      sendPaymentFailedNotification({ order }).catch((err) => {
        console.error('Failed to dispatch payment failed email:', err.message);
      });

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Currency mismatch',
      });
    }

    // 6. Mark order as paid
    order.paymentStatus = 'successful';
    order.orderStatus = 'processing';
    order.paidAt = paystackData.paid_at ? new Date(paystackData.paid_at) : new Date();

    // Push initial statusHistory
    if (!order.statusHistory || order.statusHistory.length === 0) {
      order.statusHistory = [{ status: 'processing', changedAt: new Date() }];
    }
    await order.save();

    // Fire Customer Order Confirmation & Admin New Order Notifications (non-blocking)
    sendOrderConfirmationNotification({ user: null, order }).catch((err) => {
      console.error('Failed to dispatch customer order confirmation email:', err.message);
    });

    sendAdminNewOrderNotification({ order }).catch((err) => {
      console.error('Failed to dispatch admin new order notification:', err.message);
    });

    // 7. Variant-aware inventory deduction & Stock Alert checks
    const lowStockThreshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '5', 10);

    for (const item of order.items) {
      if (item.product) {
        const prod = await Product.findById(item.product);
        if (prod) {
          if (item.variantId && prod.variants && prod.variants.length > 0) {
            // Deduct variant stock
            const variantIdx = prod.variants.findIndex(
              (v) => v._id.toString() === item.variantId.toString()
            );
            if (variantIdx > -1) {
              const prevQty = prod.variants[variantIdx].quantity;
              const newQty = Math.max(0, prevQty - item.quantity);
              prod.variants[variantIdx].quantity = newQty;
              await prod.save();

              const variant = prod.variants[variantIdx];

              // Check Out of Stock / Low Stock thresholds for variant
              if (newQty === 0 && prevQty > 0) {
                sendAdminOutOfStockNotification({ product: prod, variant }).catch((err) => {
                  console.error('Failed to send out of stock email:', err.message);
                });
              } else if (newQty <= lowStockThreshold && prevQty > lowStockThreshold) {
                sendAdminLowStockNotification({
                  product: prod,
                  variant,
                  currentStock: newQty,
                  threshold: lowStockThreshold,
                }).catch((err) => {
                  console.error('Failed to send low stock email:', err.message);
                });
              }

              // Inventory log for variant
              try {
                await InventoryLog.create({
                  product: prod._id,
                  previousQuantity: prevQty,
                  newQuantity: newQty,
                  change: newQty - prevQty,
                  reason: 'order',
                  reference: order.orderNumber,
                  note: `Variant SKU: ${item.variantSku || item.variantId}`,
                });
              } catch {}
            }
          } else {
            // Non-variant product stock deduction
            const prevQty = prod.quantity;
            const newQty = Math.max(0, prevQty - item.quantity);
            prod.quantity = newQty;
            await prod.save();

            // Check Out of Stock / Low Stock thresholds for main product
            if (newQty === 0 && prevQty > 0) {
              sendAdminOutOfStockNotification({ product: prod, variant: null }).catch((err) => {
                console.error('Failed to send out of stock email:', err.message);
              });
            } else if (newQty <= lowStockThreshold && prevQty > lowStockThreshold) {
              sendAdminLowStockNotification({
                product: prod,
                variant: null,
                currentStock: newQty,
                threshold: lowStockThreshold,
              }).catch((err) => {
                console.error('Failed to send low stock email:', err.message);
              });
            }

            try {
              await InventoryLog.create({
                product: prod._id,
                previousQuantity: prevQty,
                newQuantity: newQty,
                change: newQty - prevQty,
                reason: 'order',
                reference: order.orderNumber,
              });
            } catch {}
          }
        }
      }
    }

    // 8. Record coupon usage (atomic increment to prevent race conditions)
    if (order.couponId && order.couponDiscount > 0) {
      try {
        // Upsert usage record (idempotent)
        await CouponUsage.findOneAndUpdate(
          { coupon: order.couponId, user: order.user, order: order._id },
          {
            $setOnInsert: {
              coupon: order.couponId,
              user: order.user,
              order: order._id,
              discountAmount: order.couponDiscount,
              usedAt: new Date(),
            },
          },
          { upsert: true }
        );
        // Atomically increment usage count
        await Coupon.findByIdAndUpdate(order.couponId, { $inc: { usageCount: 1 } });
      } catch (err) {
        console.error('Coupon usage recording failed:', err.message);
      }
    }

    // 9. Clear customer cart
    await Cart.findOneAndUpdate({ user: order.user }, { items: [], couponCode: null, couponDiscount: 0 });

    res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};
