import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Package, MapPin,
  CreditCard, ShoppingBag, CheckCircle2, Truck, Clock,
  XCircle, ChevronRight, Loader,
} from 'lucide-react';
import { adminOrderAPI } from '../services/api';
import { StatusBadge } from '../components/admin/StatusBadge';
import { ConfirmDialog } from '../components/admin/ConfirmDialog';

const fmt = (n) => n != null ? `₦${Number(n).toLocaleString()}` : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// Allowed transitions per status
const TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const statusIcons = {
  pending: Clock,
  processing: Loader,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

export const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [confirm, setConfirm] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminOrderAPI.getAdminOrderById(id);
      if (res.success) setOrder(res.data.order);
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const allowedTransitions = order ? (TRANSITIONS[order.orderStatus] || []) : [];

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      const res = await adminOrderAPI.updateOrderStatus(id, selectedStatus);
      if (res.success) {
        setOrder((prev) => ({ ...prev, orderStatus: selectedStatus }));
        setUpdateSuccess(res.message);
        setSelectedStatus('');
      }
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
      setConfirm(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-7 h-7 text-amber-400 animate-spin" /></div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertTriangle className="w-8 h-8 text-rose-500" />
      <p className="text-slate-700 font-semibold">{error}</p>
      <button onClick={() => navigate('/admin/orders')} className="flex items-center gap-2 text-sm text-amber-700 font-semibold hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/orders')} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Order {order.orderNumber}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{fmtDate(order.createdAt)}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <StatusBadge status={order.paymentStatus} />
          <StatusBadge status={order.orderStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items + Summary */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order Items */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-slate-900 text-sm">Order Items</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-xl border border-slate-200" />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                    {item.sku && <p className="text-xs text-slate-400">SKU: {item.sku}</p>}
                    <p className="text-xs text-slate-500">Qty: {item.quantity} × {fmt(item.price)}</p>
                  </div>
                  <p className="font-bold text-slate-900 shrink-0">{fmt(item.total)}</p>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span><span>-{fmt(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total</span><span>{fmt(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-slate-900 text-sm">Shipping Address</h2>
            </div>
            {order.shippingAddress ? (
              <div className="text-sm text-slate-600 space-y-0.5">
                <p className="font-semibold text-slate-800">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>{order.shippingAddress.country || 'Nigeria'}</p>
                {order.shippingAddress.phone && <p>📞 {order.shippingAddress.phone}</p>}
              </div>
            ) : <p className="text-sm text-slate-400">No shipping address recorded</p>}

            {order.fulfillmentMethod && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                <span className="text-xs text-slate-500">Fulfillment:</span>
                <span className="text-xs font-semibold text-slate-800 capitalize">{order.fulfillmentMethod}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Customer + Payment + Status Update */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-3">Customer</h2>
            <div className="space-y-1 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">{order.customer?.firstName} {order.customer?.lastName}</p>
              {order.customer?.email && <p className="text-xs text-slate-500">{order.customer.email}</p>}
              {order.customer?.phone && <p className="text-xs text-slate-500">📞 {order.customer.phone}</p>}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-slate-900 text-sm">Payment</h2>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={order.paymentStatus} size="xs" /></div>
              {order.paymentReference && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Reference</span>
                  <span className="font-mono text-xs text-slate-700 truncate">{order.paymentReference}</span>
                </div>
              )}
              {order.paidAt && (
                <div className="flex justify-between"><span className="text-slate-500">Paid At</span><span className="text-xs">{fmtDate(order.paidAt)}</span></div>
              )}
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-1">Update Order Status</h2>
            <p className="text-xs text-slate-400 mb-3">
              Current: <StatusBadge status={order.orderStatus} size="xs" />
            </p>
            {allowedTransitions.length > 0 ? (
              <div className="space-y-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Select new status…</option>
                  {allowedTransitions.map((s) => (
                    <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                {selectedStatus && (
                  <button
                    onClick={() => setConfirm(true)}
                    disabled={updating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-amber-300 hover:bg-slate-800 disabled:opacity-60 transition"
                  >
                    {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Update to {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2.5">
                This order is in a terminal state ({order.orderStatus}) and cannot be changed.
              </p>
            )}
            {updateSuccess && (
              <div className="mt-3 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {updateSuccess}
              </div>
            )}
            {updateError && (
              <div className="mt-3 flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> {updateError}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Update Order Status?"
        message={`This will change the order status from "${order?.orderStatus}" to "${selectedStatus}". This action may not be reversible.`}
        confirmLabel={`Mark as ${selectedStatus}`}
        confirmClass="bg-slate-900 text-amber-300 hover:bg-slate-800"
        onConfirm={handleStatusChange}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
};

export default AdminOrderDetailPage;
