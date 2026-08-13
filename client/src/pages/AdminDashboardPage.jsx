import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Package, Users, CreditCard, TrendingUp,
  AlertTriangle, RotateCcw, ArrowRight, Clock, CheckCircle2,
  Truck, XCircle, Loader2, RefreshCw, Boxes, Star, MessageSquare,
} from 'lucide-react';
import { adminDashboardAPI } from '../services/api';
import { StatusBadge } from '../components/admin/StatusBadge';
import { SalesChart } from '../components/admin/SalesChart';

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
};

const StatCard = ({ label, value, icon: Icon, iconBg, linkTo, linkLabel, sublabel, danger }) => (
  <div className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col gap-3 ${danger ? 'border-rose-200' : 'border-slate-200'}`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div>
      <p className={`text-2xl font-bold ${danger ? 'text-rose-700' : 'text-slate-900'}`}>{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
    </div>
    {linkTo && (
      <Link to={linkTo} className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1 mt-auto">
        {linkLabel} <ArrowRight className="w-3 h-3" />
      </Link>
    )}
  </div>
);

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: 'year', label: 'This Year' },
];

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesRange, setSalesRange] = useState('7days');
  const [salesData, setSalesData] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminDashboardAPI.getDashboard();
      if (res.success) setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSales = useCallback(async (range) => {
    setSalesLoading(true);
    try {
      const res = await adminDashboardAPI.getSalesOverview(range);
      if (res.success) setSalesData(res.data);
    } catch {
      // silently fail — chart just shows empty state
    } finally {
      setSalesLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchSales(salesRange); }, [salesRange, fetchSales]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-slate-700 font-semibold">{error}</p>
        <button onClick={fetchStats} className="flex items-center gap-2 bg-slate-900 text-amber-300 px-4 py-2 rounded-xl text-sm font-bold">
          <RotateCcw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome to Ayoola Signature Admin Portal</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Alert banners */}
      {(stats?.outOfStockProducts > 0 || stats?.failedPaymentsLast7Days > 0) && (
        <div className="space-y-2">
          {stats.outOfStockProducts > 0 && (
            <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-rose-700 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4" />
                {stats.outOfStockProducts} product{stats.outOfStockProducts > 1 ? 's' : ''} are out of stock
              </div>
              <Link to="/admin/inventory?stockStatus=out_of_stock" className="text-xs font-bold text-rose-700 hover:underline">View →</Link>
            </div>
          )}
          {stats.failedPaymentsLast7Days > 0 && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4" />
                {stats.failedPaymentsLast7Days} failed payment{stats.failedPaymentsLast7Days > 1 ? 's' : ''} in the last 7 days
              </div>
              <Link to="/admin/payments?paymentStatus=failed" className="text-xs font-bold text-amber-700 hover:underline">View →</Link>
            </div>
          )}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Revenue"
          value={fmt(stats?.totalSales)}
          icon={CreditCard}
          iconBg="bg-emerald-100 text-emerald-700"
          sublabel="Successful payments"
          linkTo="/admin/payments"
          linkLabel="View"
        />
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders ?? '—'}
          icon={ShoppingBag}
          iconBg="bg-blue-100 text-blue-700"
          linkTo="/admin/orders"
          linkLabel="Manage"
        />
        <StatCard
          label="Customers"
          value={stats?.customers ?? '—'}
          icon={Users}
          iconBg="bg-violet-100 text-violet-700"
          linkTo="/admin/customers"
          linkLabel="View"
        />
        <StatCard
          label="Active Products"
          value={stats?.products ?? '—'}
          icon={Package}
          iconBg="bg-amber-100 text-amber-700"
          linkTo="/admin/products"
          linkLabel="Manage"
        />
        <StatCard
          label="Pending Reviews"
          value={stats?.pendingReviews ?? 0}
          icon={Star}
          iconBg="bg-amber-100 text-amber-800"
          linkTo="/admin/reviews?status=pending"
          linkLabel="Moderate"
        />
        <StatCard
          label="Unanswered Q&A"
          value={stats?.unansweredQuestions ?? 0}
          icon={MessageSquare}
          iconBg="bg-rose-100 text-rose-800"
          linkTo="/admin/questions?answered=false"
          linkLabel="Answer"
        />
      </div>

      {/* Order Status Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Pending', key: 'pendingOrders', icon: Clock, bg: 'bg-yellow-50 text-yellow-700', link: '/admin/orders?orderStatus=pending' },
          { label: 'Processing', key: 'processingOrders', icon: RotateCcw, bg: 'bg-blue-50 text-blue-700', link: '/admin/orders?orderStatus=processing' },
          { label: 'Shipped', key: 'shippedOrders', icon: Truck, bg: 'bg-violet-50 text-violet-700', link: '/admin/orders?orderStatus=shipped' },
          { label: 'Delivered', key: 'deliveredOrders', icon: CheckCircle2, bg: 'bg-emerald-50 text-emerald-700', link: '/admin/orders?orderStatus=delivered' },
          { label: 'Cancelled', key: 'cancelledOrders', icon: XCircle, bg: 'bg-rose-50 text-rose-700', link: '/admin/orders?orderStatus=cancelled' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.key} to={s.link} className={`flex flex-col gap-1 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition group`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.bg}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats?.[s.key] ?? '—'}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Sales Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" /> Sales Overview
            </h2>
            {salesData && (
              <p className="text-xs text-slate-500 mt-0.5">
                {fmt(salesData.totalSales)} · {salesData.totalOrders} orders
              </p>
            )}
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setSalesRange(r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  salesRange === r.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {salesLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : (
          <SalesChart data={salesData?.chartData || []} range={salesRange} height={160} />
        )}
      </div>

      {/* Bottom grid: Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-slate-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {stats?.recentOrders?.length > 0 ? stats.recentOrders.slice(0, 6).map((o) => (
              <Link
                key={o._id}
                to={`/admin/orders/${o._id}`}
                className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{o.orderNumber}</p>
                  <p className="text-xs text-slate-400">
                    {o.customer?.firstName} {o.customer?.lastName} · {o.customer?.email || ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{fmt(o.total)}</p>
                  <StatusBadge status={o.orderStatus} size="xs" />
                </div>
              </Link>
            )) : (
              <p className="text-sm text-slate-400 text-center py-6">No orders yet</p>
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-500" /> Low Stock Alert
            </h2>
            <Link to="/admin/inventory?stockStatus=low_stock" className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {stats?.lowStockItems?.length > 0 ? stats.lowStockItems.map((p) => (
              <div key={p._id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Star className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                    {p.sku && <p className="text-xs text-slate-400">{p.sku}</p>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-amber-700">{p.quantity} left</p>
                  <StatusBadge status={p.quantity === 0 ? 'out_of_stock' : 'low_stock'} size="xs" />
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-400 text-center py-6">
                🎉 All products are well stocked!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
