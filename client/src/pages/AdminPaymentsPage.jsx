import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { adminPaymentAPI } from '../services/api';
import { StatusBadge } from '../components/admin/StatusBadge';
import { AdminPagination } from '../components/admin/AdminPagination';

const fmt = (n) => n != null ? `₦${Number(n).toLocaleString()}` : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const PAYMENT_STATUSES = ['', 'pending', 'successful', 'failed', 'refunded'];

export const AdminPaymentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const search = searchParams.get('search') || '';
  const paymentStatus = searchParams.get('paymentStatus') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const [searchInput, setSearchInput] = useState(search);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      const res = await adminPaymentAPI.getPayments(params);
      if (res.success) {
        setPayments(res.data.payments || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, search, paymentStatus]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500 mt-0.5">{pagination.total} payment record{pagination.total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <form onSubmit={(e) => { e.preventDefault(); setParam('search', searchInput.trim()); }} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by order #, reference, customer…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-slate-900 text-amber-300 rounded-xl text-sm font-bold hover:bg-slate-800 transition">Search</button>
        </form>
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <select value={paymentStatus} onChange={(e) => setParam('paymentStatus', e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400">
            <option value="">All Payment Statuses</option>
            {PAYMENT_STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 text-amber-400 animate-spin" /></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-rose-600">
            <AlertTriangle className="w-8 h-8" /><p className="text-sm font-semibold">{error}</p>
          </div>
        ) : payments.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-20">No payment records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Order</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Reference</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{p.orderNumber}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-700">{p.customer?.firstName} {p.customer?.lastName}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[160px]">{p.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{fmt(p.total)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={p.paymentStatus} size="xs" /></td>
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-500 max-w-[160px] truncate">{p.paymentReference || '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
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
        onPageChange={(p) => { const n = new URLSearchParams(searchParams); n.set('page', p); setSearchParams(n); }}
      />
    </div>
  );
};

export default AdminPaymentsPage;
