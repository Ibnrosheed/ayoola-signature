import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, AlertTriangle, ClipboardList } from 'lucide-react';
import { auditLogAPI } from '../services/api';
import { AdminPagination } from '../components/admin/AdminPagination';

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const ACTION_COLORS = {
  ORDER_STATUS_CHANGED: 'bg-blue-100 text-blue-800',
  STOCK_UPDATED: 'bg-amber-100 text-amber-800',
  PRODUCT_ACTIVATED: 'bg-emerald-100 text-emerald-800',
  PRODUCT_DEACTIVATED: 'bg-slate-100 text-slate-600',
  PRODUCT_CREATED: 'bg-violet-100 text-violet-800',
  PRODUCT_FEATURED: 'bg-yellow-100 text-yellow-800',
  ADMIN_CREATED: 'bg-indigo-100 text-indigo-800',
  ADMIN_UPDATED: 'bg-sky-100 text-sky-800',
  ADMIN_DEACTIVATED: 'bg-rose-100 text-rose-800',
  CUSTOMER_STATUS_CHANGED: 'bg-orange-100 text-orange-800',
};

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 30 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 30 };
      if (search) params.search = search;
      const res = await auditLogAPI.getAuditLogs(params);
      if (res.success) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0, limit: 30 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Complete record of all admin actions — superadmin only</p>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by action, resource, ID…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-slate-900 text-amber-300 rounded-xl text-sm font-bold hover:bg-slate-800 transition">Search</button>
        </form>
      </div>

      {/* Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 text-amber-400 animate-spin" /></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-rose-600">
            <AlertTriangle className="w-8 h-8" /><p className="text-sm font-semibold">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <ClipboardList className="w-8 h-8 opacity-30" />
            <p className="text-sm">No audit logs yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log._id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition">
                <div className="flex items-start gap-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}`}>
                    {log.action}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {log.resource} {log.resourceId ? `#${log.resourceId.slice(-6)}` : ''}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5 max-w-md truncate">
                        {JSON.stringify(log.details).replace(/[{}"]/g, '').replace(/,/g, ' · ')}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      by <span className="font-semibold text-slate-600">{log.user?.firstName} {log.user?.lastName}</span>
                      {' '}({log.user?.role})
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 shrink-0 whitespace-nowrap">{fmtDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminPagination
        page={pagination.page}
        pages={pagination.pages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={setPage}
      />
    </div>
  );
};

export default AdminAuditLogsPage;
