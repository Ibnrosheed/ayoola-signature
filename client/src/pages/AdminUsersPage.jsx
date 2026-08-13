import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Loader2, AlertTriangle, ShieldCheck, UserX } from 'lucide-react';
import { adminUsersAPI } from '../services/api';
import { StatusBadge } from '../components/admin/StatusBadge';
import { AdminPagination } from '../components/admin/AdminPagination';
import { ConfirmDialog } from '../components/admin/ConfirmDialog';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const AdminUsersPage = () => {
  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'admin' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const [deactivateConfirm, setDeactivateConfirm] = useState({ open: false, admin: null });
  const [deactivating, setDeactivating] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminUsersAPI.getAdminUsers({ page, limit: 20 });
      if (res.success) {
        setAdmins(res.data.admins || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await adminUsersAPI.createAdmin(formData);
      if (res.success) {
        showToast('Admin user created successfully');
        setShowForm(false);
        setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'admin' });
        fetchAdmins();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateConfirm.admin) return;
    setDeactivating(true);
    try {
      const res = await adminUsersAPI.deactivateAdmin(deactivateConfirm.admin._id);
      if (res.success) {
        showToast('Admin access revoked');
        fetchAdmins();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to deactivate', 'error');
    } finally {
      setDeactivating(false);
      setDeactivateConfirm({ open: false, admin: null });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">Admin Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">Superadmin only — manage portal access</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-amber-300 rounded-xl text-sm font-bold hover:bg-slate-800 transition"
        >
          <Plus className="w-4 h-4" />
          New Admin
        </button>
      </div>

      {/* Create Admin Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="font-serif text-lg font-bold text-slate-900 mb-4">Create Admin User</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'firstName', label: 'First Name' },
              { name: 'lastName', label: 'Last Name' },
              { name: 'email', label: 'Email', type: 'email' },
              { name: 'phone', label: 'Phone' },
              { name: 'password', label: 'Password', type: 'password' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  required
                  value={formData[f.name]}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [f.name]: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
            {formError && (
              <div className="col-span-2 flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}
            <div className="col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition">Cancel</button>
              <button type="submit" disabled={formLoading} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-amber-300 hover:bg-slate-800 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Admin
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 text-amber-400 animate-spin" /></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-rose-600">
            <AlertTriangle className="w-8 h-8" /><p className="text-sm font-semibold">{error}</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <ShieldCheck className="w-8 h-8 opacity-30" />
            <p className="text-sm">No admin users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Admin</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Added</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{a.firstName} {a.lastName}</p>
                      <p className="text-xs text-slate-400">{a.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${a.role === 'superadmin' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {a.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={a.status || 'active'} size="xs" /></td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{fmtDate(a.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setDeactivateConfirm({ open: true, admin: a })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Revoke Access"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
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
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={deactivateConfirm.open}
        title="Revoke Admin Access?"
        message={`This will permanently revoke admin access for ${deactivateConfirm.admin?.firstName} ${deactivateConfirm.admin?.lastName}. Their role will be downgraded to customer.`}
        confirmLabel="Revoke Access"
        confirmClass="bg-rose-600 text-white hover:bg-rose-700"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateConfirm({ open: false, admin: null })}
      />
    </div>
  );
};

export default AdminUsersPage;
