import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { Package, ArrowLeft, Loader2, AlertCircle, Calendar, CreditCard, ChevronRight } from 'lucide-react';

export const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderAPI.getUserOrders({ page, limit: 10 });
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
        setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (err) {
      setError(err.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link to="/account" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-700 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Account</span>
      </Link>

      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-amber-700" />
            <span>My Orders</span>
          </h1>
          <p className="text-sm text-slate-500">Track and review your past signature purchases</p>
        </div>
        <span className="text-xs bg-amber-50 border border-amber-200 text-amber-800 font-semibold px-3 py-1 rounded-full">
          {pagination.total} Orders Total
        </span>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Fetching order history...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-slate-900">No Orders Yet</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            You have not placed any orders with Ayoola Signature yet.
          </p>
          <Link to="/shop" className="inline-block bg-slate-900 text-amber-300 font-bold px-6 py-2.5 rounded-xl text-sm">
            Explore Boutique Catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord._id}
              className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3 text-xs">
                <div>
                  <span className="text-slate-400 font-mono block">Order #</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{ord.orderNumber}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${
                      ord.paymentStatus === 'successful'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : ord.paymentStatus === 'failed'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    Payment: {ord.paymentStatus}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                    Order: {ord.orderStatus}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">
                    Placed on {new Date(ord.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-700 font-semibold">
                    {ord.items?.length || 0} Item(s): {ord.items?.map((i) => i.name).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total</span>
                    <span className="font-serif font-bold text-amber-700 text-lg">₦{ord.total?.toLocaleString()}</span>
                  </div>

                  <Link
                    to={`/account/orders/${ord._id}`}
                    className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-all"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-200">
              <span>Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 font-semibold"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default CustomerOrdersPage;
