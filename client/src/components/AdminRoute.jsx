import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Verifying administrator privileges...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-rose-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-slate-900">Access Denied. Admin Only.</h2>
          <p className="text-sm text-slate-600">
            Your customer account does not have authorization to view the administration portal.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-slate-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Home</span>
        </Link>
      </div>
    );
  }

  return children;
};
