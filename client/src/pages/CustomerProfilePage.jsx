import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { User, Mail, Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export const CustomerProfilePage = () => {
  const { user, login } = useAuth(); // login from context updates cached user details

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
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

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      setError('Please provide all required profile fields.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await userAPI.updateProfile(formData);
      if (res.success && res.data?.user) {
        setSuccess(true);
        // We can reload or set user in context if needed.
        // Let's set token and user in localStorage to refresh current session state.
        const token = localStorage.getItem('ayoola_token');
        login(res.data.user, token);
      }
    } catch (err) {
      setError(err.message || 'Profile update failed. Please verify phone number format.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm max-w-xl">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="font-serif text-xl font-bold text-slate-900">Profile Information</h2>
        <p className="text-xs text-slate-500 font-medium">Update your name, contact phone number, and account details</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>Your profile information has been saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 uppercase">Contact Phone Number *</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Phone className="w-4 h-4" />
            </span>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+234 801 234 5678"
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 uppercase">Email Address (Immutable)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-500 font-semibold focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-slate-400 pt-0.5">Please contact concierge support to request a change to your primary login email address.</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-amber-300 font-bold py-3 px-6 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Save Profile Settings</span>
        </button>
      </form>
    </div>
  );
};
export default CustomerProfilePage;
