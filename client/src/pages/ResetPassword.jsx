import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { KeyRound, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, Check, X } from 'lucide-react';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Password Strength Indicators
  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Password reset token is missing.');
      return;
    }
    if (!isMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await authAPI.resetPassword({
        token,
        password,
        confirmPassword,
      });
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password. Link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500 shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Set New Password</h2>
          <p className="text-sm text-slate-500 mt-1">
            Please enter your new password below.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Password Reset Successful!</h3>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Your password has been changed successfully. You can now log in using your new credentials.
            </p>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
            >
              Proceed to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {/* Password Requirement Checks */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <p className="font-semibold text-slate-700 mb-1">Password Requirements:</p>
              <div className="flex items-center text-slate-600">
                {isMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" /> : <X className="w-3.5 h-3.5 text-slate-400 mr-1.5" />}
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center text-slate-600">
                {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" /> : <X className="w-3.5 h-3.5 text-slate-400 mr-1.5" />}
                <span>Contains an uppercase letter</span>
              </div>
              <div className="flex items-center text-slate-600">
                {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" /> : <X className="w-3.5 h-3.5 text-slate-400 mr-1.5" />}
                <span>Contains a number</span>
              </div>
              <div className="flex items-center text-slate-600">
                {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" /> : <X className="w-3.5 h-3.5 text-slate-400 mr-1.5" />}
                <span>Passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isMinLength || !passwordsMatch}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Updating Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
