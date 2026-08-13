import React, { useState, useEffect, useCallback } from 'react';
import { adminCouponAPI } from '../services/api';
import {
  Tag, Plus, Loader2, AlertCircle, Search, XCircle, CheckCircle,
  Pencil, Trash2, ToggleLeft, ToggleRight, ChevronDown, X, Info,
} from 'lucide-react';

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minimumOrderAmount: '',
  maximumDiscount: '',
  usageLimit: '',
  perUserLimit: 1,
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

const FormField = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-slate-700">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [summary, setSummary] = useState({ active: 0, expired: 0, totalUsage: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchCoupons = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (activeFilter !== '') params.isActive = activeFilter;
      const res = await adminCouponAPI.getCoupons(params);
      if (res.success) {
        setCoupons(res.data.coupons);
        setSummary(res.data.summary || {});
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter]);

  useEffect(() => { fetchCoupons(1); }, [fetchCoupons]);

  const openCreate = () => {
    setEditingCoupon(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue ?? '',
      minimumOrderAmount: coupon.minimumOrderAmount || '',
      maximumDiscount: coupon.maximumDiscount ?? '',
      usageLimit: coupon.usageLimit ?? '',
      perUserLimit: coupon.perUserLimit ?? 1,
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : '',
      isActive: coupon.isActive,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minimumOrderAmount: formData.minimumOrderAmount !== '' ? Number(formData.minimumOrderAmount) : 0,
        maximumDiscount: formData.maximumDiscount !== '' ? Number(formData.maximumDiscount) : null,
        usageLimit: formData.usageLimit !== '' ? Number(formData.usageLimit) : null,
        perUserLimit: Number(formData.perUserLimit),
        startsAt: formData.startsAt || null,
        expiresAt: formData.expiresAt || null,
      };

      if (editingCoupon) {
        await adminCouponAPI.updateCoupon(editingCoupon._id, payload);
      } else {
        await adminCouponAPI.createCoupon(payload);
      }
      setShowModal(false);
      fetchCoupons(pagination.page);
    } catch (err) {
      setFormError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon) => {
    setToggling(coupon._id);
    try {
      await adminCouponAPI.toggleCoupon(coupon._id);
      fetchCoupons(pagination.page);
    } catch (err) {
      alert(err.message);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    setDeleting(coupon._id);
    try {
      await adminCouponAPI.deleteCoupon(coupon._id);
      fetchCoupons(pagination.page);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const isExpired = (coupon) => coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const isNotStarted = (coupon) => coupon.startsAt && new Date(coupon.startsAt) > new Date();
  const isUsageExhausted = (coupon) => coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">Coupon Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage discount codes and promotions</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-amber-300 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', count: summary.active, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
          { label: 'Expired', count: summary.expired, color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'Total Redemptions', count: summary.totalUsage, color: 'bg-amber-50 border-amber-200 text-amber-800' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-4`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">{s.label}</p>
            <p className="text-3xl font-bold">{s.count ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search coupon codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Coupon List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No coupons found</p>
          <button onClick={openCreate} className="mt-4 text-sm text-amber-700 font-semibold hover:underline">
            Create your first coupon →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const expired = isExpired(coupon);
            const notStarted = isNotStarted(coupon);
            const exhausted = isUsageExhausted(coupon);
            const effectivelyActive = coupon.isActive && !expired && !exhausted && !notStarted;
            return (
              <div key={coupon._id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">{coupon.code}</span>
                      {effectivelyActive ? (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300 font-semibold">Active</span>
                      ) : expired ? (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border font-semibold">Expired</span>
                      ) : exhausted ? (
                        <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full border border-rose-200 font-semibold">Exhausted</span>
                      ) : !coupon.isActive ? (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border font-semibold">Inactive</span>
                      ) : null}
                      <span className="text-xs text-slate-500 font-medium">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% off`
                          : `₦${coupon.discountValue?.toLocaleString()} off`}
                      </span>
                    </div>
                    {coupon.description && <p className="text-xs text-slate-500">{coupon.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
                      <span>Used: <strong className="text-slate-700">{coupon.usageCount ?? 0}{coupon.usageLimit !== null ? `/${coupon.usageLimit}` : ' (unlimited)'}</strong></span>
                      {coupon.minimumOrderAmount > 0 && <span>Min: ₦{coupon.minimumOrderAmount?.toLocaleString()}</span>}
                      {coupon.expiresAt && <span>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggle(coupon)}
                      disabled={toggling === coupon._id}
                      title={coupon.isActive ? 'Deactivate' : 'Activate'}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all disabled:opacity-50"
                    >
                      {toggling === coupon._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : coupon.isActive ? (
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(coupon)}
                      title="Edit"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon)}
                      disabled={deleting === coupon._id || coupon.usageCount > 0}
                      title={coupon.usageCount > 0 ? 'Cannot delete used coupons' : 'Delete'}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {deleting === coupon._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchCoupons(p)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                p === pagination.page
                  ? 'bg-slate-900 text-amber-300'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-amber-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="font-serif text-xl font-bold text-slate-900">
                {editingCoupon ? `Edit ${editingCoupon.code}` : 'Create New Coupon'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Coupon Code" required>
                  <input
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    disabled={!!editingCoupon}
                    required
                    placeholder="SUMMER25"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm uppercase focus:border-amber-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-mono"
                  />
                </FormField>
                <FormField label="Discount Type" required>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleFormChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Description">
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="e.g. Summer sale discount"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label={formData.discountType === 'percentage' ? 'Discount %' : 'Discount Amount (₦)'} required>
                  <input
                    name="discountValue"
                    type="number"
                    min="0"
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    value={formData.discountValue}
                    onChange={handleFormChange}
                    required
                    placeholder={formData.discountType === 'percentage' ? '25' : '5000'}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </FormField>
                <FormField label="Max Discount Cap (₦)">
                  <input
                    name="maximumDiscount"
                    type="number"
                    min="0"
                    value={formData.maximumDiscount}
                    onChange={handleFormChange}
                    placeholder="Optional"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Min. Order Amount (₦)">
                  <input
                    name="minimumOrderAmount"
                    type="number"
                    min="0"
                    value={formData.minimumOrderAmount}
                    onChange={handleFormChange}
                    placeholder="0 = no min"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </FormField>
                <FormField label="Per-User Usage Limit">
                  <input
                    name="perUserLimit"
                    type="number"
                    min="0"
                    value={formData.perUserLimit}
                    onChange={handleFormChange}
                    placeholder="1"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Total Usage Limit">
                  <input
                    name="usageLimit"
                    type="number"
                    min="0"
                    value={formData.usageLimit}
                    onChange={handleFormChange}
                    placeholder="Unlimited"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </FormField>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                    <span className="text-sm font-semibold text-slate-700">Active immediately</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Date">
                  <input
                    name="startsAt"
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={handleFormChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </FormField>
                <FormField label="Expiry Date">
                  <input
                    name="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={handleFormChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </FormField>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-amber-300 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
