import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { CheckCircle, AlertCircle, RefreshCw, ShoppingBag, ArrowRight } from 'lucide-react';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Verification token is missing from the link.');
      return;
    }

    const verify = async () => {
      try {
        setLoading(true);
        const res = await authAPI.verifyEmail(token);
        if (res.success) {
          setSuccess(true);
        } else {
          setError(res.message || 'Verification failed');
        }
      } catch (err) {
        setError(err.message || 'Verification failed. Link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    try {
      setResending(true);
      setResendMessage('');
      const res = await authAPI.resendVerification();
      setResendMessage(res.message || 'Verification link sent to your email.');
    } catch (err) {
      setResendMessage(err.message || 'Failed to resend verification link.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center">
        {loading ? (
          <div className="py-12">
            <RefreshCw className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Verifying Your Email...</h2>
            <p className="text-slate-500 text-sm">Please wait while we confirm your email address.</p>
          </div>
        ) : success ? (
          <div className="py-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Email Verified!</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Your email address has been verified successfully. Welcome to <strong>Ayoola Signature</strong>!
            </p>

            <div className="space-y-3">
              <Link
                to="/shop"
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Continue Shopping
              </Link>
              <Link
                to="/account"
                className="w-full inline-flex items-center justify-center px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Go to My Account
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Verification Failed</h2>
            <p className="text-rose-600 font-medium text-sm mb-4">{error}</p>
            <p className="text-slate-500 text-xs mb-6">
              The verification link may have expired or already been used. You can request a new verification link below.
            </p>

            {resendMessage && (
              <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
                {resendMessage}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {resending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Resend Verification Email
              </button>

              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
