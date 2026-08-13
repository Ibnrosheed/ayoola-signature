import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import {
  Package,
  Clock,
  RefreshCw,
  CheckCircle,
  Heart,
  ShoppingBag,
  ChevronRight,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const CustomerDashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.getDashboard();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard summary stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
        <p className="text-sm text-slate-500 font-medium font-serif">Loading your account summary...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-900">Dashboard Summary Error</h2>
        <p className="text-sm text-slate-500">{error || 'We could not fetch your dashboard metrics.'}</p>
        <button
          onClick={fetchDashboardStats}
          className="inline-flex items-center gap-2 bg-slate-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { name: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { name: 'Processing Orders', value: stats.processingOrders, icon: RefreshCw, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { name: 'Delivered Orders', value: stats.deliveredOrders, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { name: 'Wishlist items', value: stats.wishlistCount, icon: Heart, color: 'text-rose-600 bg-rose-50 border-rose-100' },
    { name: 'Shopping Bag Items', value: stats.cartItemCount, icon: ShoppingBag, color: 'text-slate-700 bg-slate-100 border-slate-200' },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm"
            >
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">{card.name}</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900">{card.value}</span>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex justify-between items-end border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Overview of your last 5 luxury orders</p>
          </div>
          <Link
            to="/account/orders"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentOrders && stats.recentOrders.length === 0 ? (
          <div className="text-center py-10 space-y-4">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-serif font-bold text-slate-900 text-lg">No Orders Placed</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Your recent transactions will appear here once you place your first order.
            </p>
            <Link
              to="/shop"
              className="inline-block bg-slate-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-xs"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="py-3 pr-4">Order #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {stats.recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-4 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-700">₦{ord.total?.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                          ord.paymentStatus === 'successful'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-100'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 uppercase tracking-wide">
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <Link
                        to={`/account/orders/${ord._id}`}
                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-3 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <ShoppingBag className="w-40 h-40" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">Ready to dispatch</span>
          <h3 className="font-serif text-xl font-bold">Shopping Bag</h3>
          <p className="text-xs text-slate-400">Review your current selected luxury creations and proceed to checkout.</p>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <span>View Shopping Bag</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-5 translate-x-4 translate-y-4">
            <Heart className="w-40 h-40 text-slate-900" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700">Wishlist</span>
          <h3 className="font-serif text-xl font-bold text-slate-900">Your Saved Items</h3>
          <p className="text-xs text-slate-500">Keep track of outstanding designs you plan to add to bag later.</p>
          <Link
            to="/wishlist"
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <span>View Wishlist</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default CustomerDashboardOverview;
