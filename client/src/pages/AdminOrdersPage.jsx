import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Loader2, AlertTriangle, Eye } from 'lucide-react';
import { adminOrderAPI } from '../services/api';
import { StatusBadge } from '../components/admin/StatusBadge';
import { AdminPagination } from '../components/admin/AdminPagination';

const fmt = (n) => n != null ? `₦${Number(n).toLocaleString()}` : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const ORDER_STATUSES = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['', 'pending', 'successful', 'failed', 'refunded'];
const DATE_RANGES = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
];

export const AdminOrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const search = searchParams.get('search') || '';
  const orderStatus = searchParams.get('orderStatus') || '';
  const paymentStatus = searchParams.get('paymentStatus') || '';
  const dateRange = searchParams.get('dateRange') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [searchInput, setSearchInput] = useState(search);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (orderStatus) params.orderStatus = orderStatus;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (dateRange) params.dateRange = dateRange;

      const res = await adminOrderAPI.getAdminOrders(params);
      if (res.success) {
        setOrders(res.data.orders || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0, limit: 15 });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [search, orderStatus, paymentStatus, dateRange, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setParam('search', searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Orders</h1>
        <p className="text-sm text-slate-500 mt-0.5">{pagination.total} total order{pagination.total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by order #, customer name, email, payment ref…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-slate-900 text-amber-300 rounded-xl text-sm font-bold hover:bg-slate-800 transition">
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Filters:</span>
          </div>
          <select value={orderStatus} onChange={(e) => setParam('orderStatus', e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400">
            <option value="">All Order Statuses</option>
            {ORDER_STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select value={paymentStatus} onChange={(e) => setParam('paymentStatus', e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400">
            <option value="">All Payment Statuses</option>
            {PAYMENT_STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select value={dateRange} onChange={(e) => setParam('dateRange', e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400">
            {DATE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 text-amber-400 animate-spin" /></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-rose-600">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-sm">No orders found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Order</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Payment</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{o.orderNumber}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-700">{o.customer?.firstName} {o.customer?.lastName}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[160px]">{o.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{fmt(o.total)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={o.paymentStatus} size="xs" /></td>
                    <td className="px-4 py-3.5"><StatusBadge status={o.orderStatus} size="xs" /></td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <Link to={`/admin/orders/${o._id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition inline-flex">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination
        page={pagination.page}
        pages={pagination.pages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={(p) => {
          const next = new URLSearchParams(searchParams);
          next.set('page', p);
          setSearchParams(next);
        }}
      />
    </div>
  );
};

export default AdminOrdersPage;
