import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, ShoppingBag, Mail,
  Phone, MapPin, Calendar, CreditCard, TrendingUp,
} from 'lucide-react';
import { adminCustomerAPI } from '../services/api';
import { StatusBadge } from '../components/admin/StatusBadge';

const fmt = (n) => n != null ? `₦${Number(n).toLocaleString()}` : '₦0';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const AdminCustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminCustomerAPI.getCustomerById(id);
      if (res.success) setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Customer not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-7 h-7 text-amber-400 animate-spin" /></div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertTriangle className="w-8 h-8 text-rose-500" />
      <p className="text-slate-700 font-semibold">{error}</p>
      <button onClick={() => navigate('/admin/customers')} className="text-sm text-amber-700 font-semibold hover:underline flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
    </div>
  );

  const { customer, stats, recentOrders } = data;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/customers')} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">{customer.firstName} {customer.lastName}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Customer since {fmtDate(customer.createdAt)}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={customer.status || 'active'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-slate-900 text-sm">Profile</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Joined {fmtDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-slate-900 text-sm">Order Statistics</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{stats?.totalOrders || 0}</p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1"><ShoppingBag className="w-3 h-3" /> Orders</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-base font-bold text-emerald-800">{fmt(stats?.totalSpent)}</p>
                <p className="text-xs text-emerald-600 mt-0.5 flex items-center justify-center gap-1"><CreditCard className="w-3 h-3" /> Spent</p>
              </div>
              <div className="col-span-2 bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-base font-bold text-amber-800">{fmt(stats?.avgOrderValue)}</p>
                <p className="text-xs text-amber-600 mt-0.5 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> Avg. Order</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-4">Recent Orders</h2>
            {recentOrders?.length > 0 ? (
              <div className="space-y-2">
                {recentOrders.map((o) => (
                  <Link
                    key={o._id}
                    to={`/admin/orders/${o._id}`}
                    className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{o.orderNumber}</p>
                      <p className="text-xs text-slate-400">{fmtDate(o.createdAt)} · {o.items?.length || 0} item(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm">{fmt(o.total)}</p>
                      <div className="flex gap-1 justify-end mt-0.5">
                        <StatusBadge status={o.paymentStatus} size="xs" />
                        <StatusBadge status={o.orderStatus} size="xs" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No orders placed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerDetailPage;
