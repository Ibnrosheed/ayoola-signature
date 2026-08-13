import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, Package } from 'lucide-react';
import { adminInventoryAPI } from '../services/api';
import { AdminPagination } from '../components/admin/AdminPagination';

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const reasonLabels = {
  order: 'Order Deduction',
  manual_adjustment: 'Manual Adjustment',
  stock_replenishment: 'Stock Replenishment',
  return: 'Customer Return',
  damage: 'Damage / Write-off',
  other: 'Other',
};

export const AdminInventoryHistoryPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminInventoryAPI.getInventoryHistory(productId, { page, limit: 20 });
      if (res.success) setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-7 h-7 text-amber-400 animate-spin" /></div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertTriangle className="w-8 h-8 text-rose-500" />
      <p className="text-slate-700 font-semibold">{error}</p>
      <button onClick={() => navigate('/admin/inventory')} className="text-sm text-amber-700 font-semibold hover:underline flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/inventory')} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Inventory History</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data?.product?.name} {data?.product?.sku && `· SKU: ${data.product.sku}`}</p>
        </div>
        <div className="ml-auto bg-slate-100 rounded-xl px-4 py-2 text-center">
          <p className="text-lg font-bold text-slate-900">{data?.product?.quantity}</p>
          <p className="text-xs text-slate-500">Current Stock</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {!data?.logs?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Package className="w-8 h-8 opacity-30" />
            <p className="text-sm">No inventory history yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.logs.map((log) => (
              <div key={log._id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${log.change > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {log.change > 0 ? '+' : ''}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      <span className={log.change > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {log.change > 0 ? `+${log.change}` : log.change}
                      </span>
                      {' '}units · {log.previousQuantity} → {log.newQuantity}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {reasonLabels[log.reason] || log.reason}
                      {log.note ? ` — ${log.note}` : ''}
                    </p>
                    {log.reference && <p className="text-xs text-slate-400 mt-0.5">{log.reference}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">{fmtDate(log.createdAt)}</p>
                  {log.createdBy && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {log.createdBy.firstName} {log.createdBy.lastName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data?.pagination && (
        <AdminPagination
          page={data.pagination.page}
          pages={data.pagination.pages}
          total={data.pagination.total}
          limit={data.pagination.limit}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default AdminInventoryHistoryPage;
