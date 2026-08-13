import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import { Package, ArrowLeft, Loader2, AlertCircle, MapPin, Calendar, ShieldCheck } from 'lucide-react';

export const CustomerOrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await orderAPI.getUserOrderById(id);
        if (res.success && res.data?.order) {
          setOrder(res.data.order);
        }
      } catch (err) {
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-sm text-slate-500">The requested order details could not be retrieved.</p>
        <Link to="/account/orders" className="inline-block bg-slate-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-sm">
          Return to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Link */}
      <Link to="/account/orders" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-700 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Order History</span>
      </Link>

      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
            <span>Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full font-bold uppercase text-xs border ${
              order.paymentStatus === 'successful'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : order.paymentStatus === 'failed'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            Payment: {order.paymentStatus}
          </span>
          <span className="px-3 py-1 rounded-full font-bold uppercase text-xs bg-slate-100 text-slate-700 border border-slate-200">
            Status: {order.orderStatus}
          </span>
          <span className="px-3 py-1 rounded-full font-bold uppercase text-xs bg-indigo-50 text-indigo-800 border border-indigo-200">
            Method: {order.fulfillmentMethod || 'delivery'}
          </span>
        </div>
      </div>

      {order.fulfillmentMethod === 'stockpile' && order.stockpileUntil && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 flex items-center justify-between">
          <div>
            <p className="font-bold">📦 7-Day Stockpile Reservation</p>
            <p className="text-indigo-700">Held in store vault until {new Date(order.stockpileUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
          </div>
          <span className="font-mono bg-indigo-100 font-bold px-3 py-1 rounded-lg text-indigo-900">7 DAYS HOLD</span>
        </div>
      )}

      {/* Visual Order Status Timeline */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <h3 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
          Delivery Status Tracker
        </h3>
        <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0 pt-2 text-xs">
          {/* Progress Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 hidden md:block z-0" />
          
          {[
            { label: 'Order Placed', active: true },
            { label: 'Payment Confirmed', active: order.paymentStatus === 'successful' },
            { label: 'Processing', active: ['processing', 'shipped', 'delivered'].includes(order.orderStatus) },
            { label: 'Shipped', active: ['shipped', 'delivered'].includes(order.orderStatus) },
            { label: 'Delivered', active: order.orderStatus === 'delivered' }
          ].map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center space-y-2 flex-1">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                step.active
                  ? 'bg-slate-900 border-amber-500 text-amber-300'
                  : 'bg-white border-slate-350 text-slate-400'
              }`}>
                {step.active ? '✓' : idx + 1}
              </div>
              <span className={`font-semibold ${step.active ? 'text-slate-950 font-bold' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
          Purchased Items
        </h2>

        <div className="divide-y divide-slate-100">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">SKU: {item.sku}</p>
                  <p className="text-xs text-slate-600">Unit Price: ₦{item.finalPrice?.toLocaleString()} × Qty: {item.quantity}</p>
                </div>
              </div>

              <div className="text-right font-bold text-slate-900 text-sm">
                ₦{item.total?.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address Snapshot */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm text-xs">
          <h3 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-700" />
            <span>Shipping Address</span>
          </h3>
          <p className="font-bold text-slate-900 text-sm">{order.shippingAddress?.fullName}</p>
          <p className="text-slate-600">{order.shippingAddress?.address}</p>
          <p className="text-slate-600">{order.shippingAddress?.city}, {order.shippingAddress?.state}, {order.shippingAddress?.country}</p>
          <p className="text-slate-500 font-mono pt-1">Phone: {order.shippingAddress?.phone}</p>
          {order.shippingAddress?.deliveryInstructions && (
            <p className="text-slate-500 italic pt-1">Instructions: "{order.shippingAddress.deliveryInstructions}"</p>
          )}
        </div>

        {/* Financial Calculation Snapshot */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm text-xs">
          <h3 className="font-serif text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            Financial Breakdown
          </h3>
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">₦{order.subtotal?.toLocaleString()}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-amber-700">
              <span>Discount</span>
              <span>-₦{order.discount?.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span className="font-semibold text-emerald-700">₦{order.deliveryFee?.toLocaleString()}</span>
          </div>
          <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-sm text-slate-900">
            <span>Grand Total</span>
            <span className="text-amber-700 text-base">₦{order.total?.toLocaleString()}</span>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 font-mono border-t border-slate-100 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Paystack Reference: {order.paymentReference}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CustomerOrderDetailPage;
