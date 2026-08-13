import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { categoryAPI, productAPI, authAPI } from '../services/api';
import { ShieldCheck, BarChart3, Package, Users, Settings, AlertCircle, CheckCircle, Loader2, Layers, ArrowRight } from 'lucide-react';

export const AdminPage = () => {
  const { user } = useAuth();

  const [categoryCount, setCategoryCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const [adminTestResult, setAdminTestResult] = useState(null);
  const [superadminTestResult, setSuperadminTestResult] = useState(null);
  const [loadingAdminTest, setLoadingAdminTest] = useState(false);
  const [loadingSuperadminTest, setLoadingSuperadminTest] = useState(false);
  const [errorAdminTest, setErrorAdminTest] = useState(null);
  const [errorSuperadminTest, setErrorSuperadminTest] = useState(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoadingStats(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          categoryAPI.getCategories(true),
          productAPI.getProducts({ limit: 1 }),
        ]);

        if (catRes.success) setCategoryCount(catRes.data.categories?.length || 0);
        if (prodRes.success) setProductCount(prodRes.data.pagination?.total || 0);
      } catch (err) {
        console.warn('Failed to load admin stats:', err.message);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchAdminStats();
  }, []);

  const handleTestAdmin = async () => {
    setLoadingAdminTest(true);
    setErrorAdminTest(null);
    setAdminTestResult(null);
    try {
      const data = await authAPI.testAdminAccess();
      setAdminTestResult(data.message);
    } catch (err) {
      setErrorAdminTest(err.message);
    } finally {
      setLoadingAdminTest(false);
    }
  };

  const handleTestSuperadmin = async () => {
    setLoadingSuperadminTest(true);
    setErrorSuperadminTest(null);
    setSuperadminTestResult(null);
    try {
      const data = await authAPI.testSuperadminAccess();
      setSuperadminTestResult(data.message);
    } catch (err) {
      setErrorSuperadminTest(err.message);
    } finally {
      setLoadingSuperadminTest(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">Admin Control Center</h1>
          <p className="text-sm text-slate-500">Ayoola Signature platform management portal</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>{user?.role}</span>
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>Catalogue Categories</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{loadingStats ? '...' : categoryCount}</p>
          <Link to="/admin/categories" className="text-[11px] font-semibold text-amber-700 hover:underline flex items-center gap-1">
            <span>Manage Categories</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>Catalogue Products</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{loadingStats ? '...' : productCount}</p>
          <Link to="/admin/products" className="text-[11px] font-semibold text-amber-700 hover:underline flex items-center gap-1">
            <span>Manage Products</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>Logged User Role</span>
            <Users className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-xl font-bold text-slate-900 capitalize">{user?.role || 'Guest'}</p>
          <span className="text-[11px] text-slate-400 truncate block">{user?.email}</span>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>Catalogue System</span>
            <Settings className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">Phase 3 Live</p>
          <span className="text-[11px] text-slate-400">Search, Filters & Uploads Ready</span>
        </div>
      </div>

      {/* Admin Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-slate-900">Categories Portal</h3>
              <p className="text-xs text-slate-500">Create, edit, deactivate, or review category counts</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Link to="/admin/categories" className="bg-slate-900 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs">
              View Categories
            </Link>
            <Link to="/admin/categories/new" className="bg-slate-100 text-slate-800 font-semibold px-4 py-2 rounded-xl text-xs hover:bg-slate-200">
              Add Category
            </Link>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-slate-900">Products Portal</h3>
              <p className="text-xs text-slate-500">Catalogue products, upload images, manage prices & stock</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Link to="/admin/products" className="bg-slate-900 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs">
              View Products
            </Link>
            <Link to="/admin/products/new" className="bg-slate-100 text-slate-800 font-semibold px-4 py-2 rounded-xl text-xs hover:bg-slate-200">
              Add Product
            </Link>
          </div>
        </div>
      </div>

      {/* Role-Based Authorization Testing Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-bold text-slate-900">Backend RBAC Authorization Testing</h2>
          <p className="text-sm text-slate-500">Test server-side role protection endpoints directly using your current active session</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Endpoint Test */}
          <div className="border border-slate-200 p-5 rounded-2xl space-y-4 bg-slate-50">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-slate-900">Admin Authorization Check</h3>
              <p className="text-xs text-slate-500">Endpoint: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">GET /api/auth/admin-test</code></p>
              <p className="text-xs text-slate-500">Allowed Roles: Admin, Superadmin</p>
            </div>

            <button
              onClick={handleTestAdmin}
              disabled={loadingAdminTest}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              {loadingAdminTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Test Admin Endpoint</span>
            </button>

            {adminTestResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{adminTestResult}</span>
              </div>
            )}

            {errorAdminTest && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorAdminTest}</span>
              </div>
            )}
          </div>

          {/* Superadmin Endpoint Test */}
          <div className="border border-slate-200 p-5 rounded-2xl space-y-4 bg-slate-50">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-slate-900">Superadmin Authorization Check</h3>
              <p className="text-xs text-slate-500">Endpoint: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">GET /api/auth/superadmin-test</code></p>
              <p className="text-xs text-slate-500">Allowed Roles: Superadmin Only</p>
            </div>

            <button
              onClick={handleTestSuperadmin}
              disabled={loadingSuperadminTest}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              {loadingSuperadminTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Test Superadmin Endpoint</span>
            </button>

            {superadminTestResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{superadminTestResult}</span>
              </div>
            )}

            {errorSuperadminTest && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorSuperadminTest}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminPage;
