import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, ShoppingBag, ArrowLeft, RefreshCw } from 'lucide-react';

export const PaymentFailedPage = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const reason = searchParams.get('reason') || searchParams.get('error') || 'The transaction could not be processed by Paystack.';

  return (
    <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
      <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-sm">
        <AlertCircle className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-widest text-rose-700 font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          Payment Not Completed
        </span>
        <h1 className="font-serif text-3xl font-bold text-slate-900 pt-2">Payment Was Declined or Cancelled</h1>
        <p className="text-sm text-slate-500">{reason}</p>
        {reference && (
          <p className="text-xs text-slate-400 font-mono">Reference: {reference}</p>
        )}
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 text-left space-y-1">
        <p className="font-semibold text-slate-800">What happened?</p>
        <p>Your shopping bag items remain saved. No money was deducted from your card or account. You can retry checkout or use a different payment method.</p>
      </div>

      <div className="space-y-3 pt-2">
        <Link
          to="/cart"
          className="w-full bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold py-3.5 px-6 rounded-xl shadow-md text-sm transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Return to Shopping Bag & Retry</span>
        </Link>
        <Link
          to="/shop"
          className="w-full block bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl text-xs transition-colors"
        >
          Explore Boutique Products
        </Link>
      </div>
    </div>
  );
};
export default PaymentFailedPage;
