import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Loader2, AlertTriangle, Eye, UserCheck, UserX } from 'lucide-react';
import { adminCustomerAPI } from '../services/api';
import { StatusBadge } from '../components/admin/StatusBadge';
import { AdminPagination } from '../components/admin/AdminPagination';
import { ConfirmDialog } from '../components/admin/ConfirmDialog';

const fmt = (n) => n != null ? `₦${Number(n).toLocaleString()}` : '₦0';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_FILTERS = ['', 'active', 'inactive', 'suspended'];

export const AdminCustomersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, customer: null, newStatus: '' });
  const [updating, setUpdating] = useState(false);

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const [searchInput, setSearchInput] = useState(search);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await adminCustomerAPI.getCustomers(params);
      if (res.success) {
        setCustomers(res.data.customers || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleStatusUpdate = async () => {
    if (!confirm.customer || !confirm.newStatus) return;
    setUpdating(true);
    try {
      const res = await adminCustomerAPI.updateCustomerStatus(confirm.customer._id, confirm.newStatus);
      if (res.success) {
        showToast(res.message || 'Customer status updated');
        fetchCustomers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setUpdating(false);
      setConfirm({ open: false, customer: null, newStatus: '' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500 mt-0.5">{pagination.total} registered customer{pagination.total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <form onSubmit={(e) => { e.preventDefault(); setParam('search', searchInput.trim()); }} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-slate-900 text-amber-300 rounded-xl text-sm font-bold hover:bg-slate-800 transition">Search</button>
        </form>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setParam('status', s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${status === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {s || 'All'}
            </button>
          ))}
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
        ) : customers.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-20">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Phone</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Orders</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Total Spent</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Joined</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">{c.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">{c.phone || '—'}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{c.orderStats?.totalOrders ?? 0}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{fmt(c.orderStats?.totalSpent)}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{fmtDate(c.createdAt)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={c.status || 'active'} size="xs" /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/admin/customers/${c._id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition inline-flex" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {c.status !== 'suspended' ? (
                          <button
                            onClick={() => setConfirm({ open: true, customer: c, newStatus: 'suspended' })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Suspend Customer"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirm({ open: true, customer: c, newStatus: 'active' })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            title="Reinstate Customer"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
        onPageChange={(p) => { const n = new URLSearchParams(searchParams); n.set('page', p); setSearchParams(n); }}
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.newStatus === 'suspended' ? 'Suspend Customer?' : 'Reinstate Customer?'}
        message={`Are you sure you want to ${confirm.newStatus === 'suspended' ? 'suspend' : 'reinstate'} ${confirm.customer?.firstName} ${confirm.customer?.lastName}?`}
        confirmLabel={confirm.newStatus === 'suspended' ? 'Suspend' : 'Reinstate'}
        confirmClass={confirm.newStatus === 'suspended' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
        onConfirm={handleStatusUpdate}
        onCancel={() => setConfirm({ open: false, customer: null, newStatus: '' })}
      />
    </div>
  );
};

export default AdminCustomersPage;
