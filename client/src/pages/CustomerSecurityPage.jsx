import React, { useState } from 'react';
import { userAPI } from '../services/api';
import { Lock, ShieldAlert, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export const CustomerSecurityPage = () => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setPasswords((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setError('Please fill in all password fields.');
      setSubmitting(false);
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      setSubmitting(false);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match. Please verify.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await userAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });

      if (res.success) {
        setSuccess(true);
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      setError(err.message || 'Incorrect current password specified.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm max-w-xl">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          <span>Account Security</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">Modify your current password to secure your personal account</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>Your login password has been changed successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 uppercase">Current Password *</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 uppercase">New Password *</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
            />
          </div>
          <p className="text-[10px] text-slate-400 pt-0.5">Password must be at least 6 characters in length.</p>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 uppercase">Confirm New Password *</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-amber-300 font-bold py-3 px-6 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Update Account Password</span>
        </button>
      </form>
    </div>
  );
};
export default CustomerSecurityPage;
