import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Loader2, AlertTriangle, Eye, Star, Zap, TrendingUp } from 'lucide-react';
import { adminInventoryAPI } from '../services/api';
import { StatusBadge } from '../components/admin/StatusBadge';
import { AdminPagination } from '../components/admin/AdminPagination';
import { StockUpdateModal } from '../components/admin/StockUpdateModal';
import { ConfirmDialog } from '../components/admin/ConfirmDialog';

const STOCK_FILTERS = [
  { value: '', label: 'All Stock' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

export const AdminInventoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inventory, setInventory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const [stockModal, setStockModal] = useState({ open: false, product: null });
  const [stockLoading, setStockLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [confirmToggle, setConfirmToggle] = useState({ open: false, product: null, type: '' });
  const [toggling, setToggling] = useState(false);

  const stockStatus = searchParams.get('stockStatus') || '';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const [searchInput, setSearchInput] = useState(search);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (stockStatus) params.stockStatus = stockStatus;
      const res = await adminInventoryAPI.getInventory(params);
      if (res.success) {
        setInventory(res.data.inventory || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
        if (res.data.lowStockThreshold) setLowStockThreshold(res.data.lowStockThreshold);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [page, search, stockStatus]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleStockSave = async ({ quantity, reason, note }) => {
    if (!stockModal.product) return;
    setStockLoading(true);
    try {
      const res = await adminInventoryAPI.updateStock(stockModal.product._id, { quantity, reason, note });
      if (res.success) {
        showToast(res.message || 'Stock updated successfully');
        setStockModal({ open: false, product: null });
        fetchInventory();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update stock', 'error');
    } finally {
      setStockLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!confirmToggle.product) return;
    setToggling(true);
    try {
      let res;
      if (confirmToggle.type === 'featured') {
        res = await adminInventoryAPI.toggleFeatured(confirmToggle.product._id);
      } else if (confirmToggle.type === 'bestseller') {
        res = await adminInventoryAPI.toggleBestSeller(confirmToggle.product._id);
      } else if (confirmToggle.type === 'status') {
        const newStatus = confirmToggle.product.status === 'active' ? 'inactive' : 'active';
        res = await adminInventoryAPI.updateStatus(confirmToggle.product._id, newStatus);
      }
      if (res?.success) {
        showToast(res.message || 'Updated successfully');
        fetchInventory();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setToggling(false);
      setConfirmToggle({ open: false, product: null, type: '' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-fade-in ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500 mt-0.5">Low stock threshold: {lowStockThreshold} units</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <form onSubmit={(e) => { e.preventDefault(); setParam('search', searchInput.trim()); }} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or SKU…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-slate-900 text-amber-300 rounded-xl text-sm font-bold hover:bg-slate-800 transition">Search</button>
        </form>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {STOCK_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setParam('stockStatus', f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${stockStatus === f.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f.label}
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
        ) : inventory.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-20">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Product</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">SKU</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Stock</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <Star className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{p.sku || '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold ${p.quantity === 0 ? 'text-rose-600' : p.quantity <= lowStockThreshold ? 'text-amber-600' : 'text-slate-900'}`}>
                          {p.quantity}
                        </span>
                        <StatusBadge status={p.stockStatus} size="xs" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={p.status} size="xs" /></td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setStockModal({ open: true, product: p })}
                          title="Update Stock"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" /> Stock
                        </button>
                        <button
                          onClick={() => setConfirmToggle({ open: true, product: p, type: 'status' })}
                          title={p.status === 'active' ? 'Deactivate' : 'Activate'}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            p.status === 'active'
                              ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {p.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <Link to={`/admin/inventory/${p._id}/history`} title="View History"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition inline-flex">
                          <Eye className="w-4 h-4" />
                        </Link>
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

      <StockUpdateModal
        open={stockModal.open}
        product={stockModal.product}
        onClose={() => setStockModal({ open: false, product: null })}
        onSave={handleStockSave}
        loading={stockLoading}
      />

      <ConfirmDialog
        open={confirmToggle.open}
        title={
          confirmToggle.type === 'status'
            ? `${confirmToggle.product?.status === 'active' ? 'Deactivate' : 'Activate'} Product?`
            : `Toggle ${confirmToggle.type}?`
        }
        message={`Are you sure you want to ${
          confirmToggle.type === 'status'
            ? `${confirmToggle.product?.status === 'active' ? 'deactivate' : 'activate'} "${confirmToggle.product?.name}"`
            : `toggle ${confirmToggle.type} for "${confirmToggle.product?.name}"`
        }?`}
        confirmLabel="Confirm"
        confirmClass="bg-slate-900 text-amber-300 hover:bg-slate-800"
        onConfirm={handleToggle}
        onCancel={() => setConfirmToggle({ open: false, product: null, type: '' })}
      />
    </div>
  );
};

export default AdminInventoryPage;
