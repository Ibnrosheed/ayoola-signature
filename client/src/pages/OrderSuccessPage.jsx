import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import { CheckCircle2, Package, ShieldCheck, ArrowRight, Loader2, AlertCircle, MapPin, Calendar, CreditCard } from 'lucide-react';

export const OrderSuccessPage = () => {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const res = await orderAPI.getUserOrderById(orderNumber);
        if (res.success && res.data?.order) {
          setOrder(res.data.order);
        }
      } catch (err) {
        setError(err.message || 'Unable to retrieve order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Generating your official receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-sm text-slate-500">We could not find the requested order receipt.</p>
        <Link to="/shop" className="inline-block bg-slate-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-sm">
          Return to Boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Success Hero Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Payment Verified & Order Confirmed
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 pt-2">
            Thank You For Your Order!
          </h1>
          <p className="text-sm text-slate-500">
            Order Number: <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
          </p>
        </div>
      </div>

      {/* Official Receipt Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-4 text-xs gap-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span>Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
              {order.paymentStatus}
            </span>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
              {order.orderStatus}
            </span>
            <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
              Fulfillment: {order.fulfillmentMethod || 'delivery'}
            </span>
          </div>
        </div>

        {order.fulfillmentMethod === 'stockpile' && order.stockpileUntil && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 flex items-center justify-between">
            <div>
              <p className="font-bold">📦 7-Day Stockpile Reservation Active</p>
              <p className="text-indigo-700">Your order is held in vault until {new Date(order.stockpileUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
            </div>
            <span className="font-mono bg-indigo-100 font-bold px-3 py-1 rounded-lg text-indigo-900">7 DAYS HOLD</span>
          </div>
        )}

        {/* Item Snapshots */}
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-slate-900">Purchased Items</h2>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-slate-400 font-mono">SKU: {item.sku} | Qty: {item.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 text-sm">₦{item.total?.toLocaleString()}</span>
                  {item.discount > 0 && (
                    <span className="block text-[11px] text-slate-400 line-through">
                      ₦{(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 pt-6 text-xs">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-amber-700" />
              <span>Shipping Address</span>
            </h3>
            <p className="font-bold text-slate-800">{order.shippingAddress?.fullName}</p>
            <p className="text-slate-600">{order.shippingAddress?.address}</p>
            <p className="text-slate-600">{order.shippingAddress?.city}, {order.shippingAddress?.state}, {order.shippingAddress?.country}</p>
            <p className="text-slate-500 font-mono pt-1">Phone: {order.shippingAddress?.phone}</p>
          </div>

          <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="font-semibold text-slate-900">Financial Summary</h3>
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
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
              <span>Amount Paid</span>
              <span className="text-amber-700">₦{order.total?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Paystack Payment Reference: <span className="font-mono">{order.paymentReference}</span></span>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/account/orders"
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold py-3.5 rounded-xl shadow-md text-sm transition-all text-center"
        >
          View My Orders
        </Link>
        <Link
          to="/shop"
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3.5 rounded-xl text-sm transition-colors text-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};
export default OrderSuccessPage;
