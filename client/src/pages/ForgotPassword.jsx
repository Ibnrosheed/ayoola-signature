import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await authAPI.forgotPassword(email.trim());
      setMessage(res.message || 'If an account exists with this email, a password reset link has been sent.');
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-700">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Forgot Password?</h2>
          <p className="text-sm text-slate-500 mt-1">
            No worries! Enter your registered email address below and we'll send you a password reset link.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="text-center py-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl mb-6 text-sm flex items-start">
              <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-semibold mb-1">Check Your Inbox</p>
                <p>{message}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-6">
              Didn't receive an email? Check your spam folder or wait a few minutes before trying again.
            </p>

            <button
              onClick={() => { setSubmitted(false); setEmail(''); }}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold hover:underline"
            >
              Try another email address
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sending Request...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
