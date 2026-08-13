import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, Loader2 } from 'lucide-react';

export const StockUpdateModal = ({ open, product, onClose, onSave, loading }) => {
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('manual_adjustment');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (product && open) {
      setQuantity(product.quantity || 0);
      setReason('manual_adjustment');
      setNote('');
    }
  }, [product, open]);

  useEffect(() => {
    if (open) {
      const handle = (e) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handle);
      return () => document.removeEventListener('keydown', handle);
    }
  }, [open, onClose]);

  if (!open || !product) return null;

  const change = quantity - (product.quantity || 0);
  const changeLabel = change > 0 ? `+${change}` : `${change}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ quantity, reason, note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-serif text-xl font-bold text-slate-900 mb-1">Update Stock</h3>
        <p className="text-sm text-slate-500 mb-5">
          <span className="font-semibold text-slate-700">{product.name}</span>
          {product.sku && <span className="ml-2 text-xs text-slate-400">SKU: {product.sku}</span>}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity Control */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">New Quantity</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 text-center text-2xl font-bold text-slate-900 border border-slate-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {change !== 0 && (
              <p className={`text-xs mt-1.5 text-center font-semibold ${change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                Change: {changeLabel} units (was {product.quantity})
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="manual_adjustment">Manual Adjustment</option>
              <option value="stock_replenishment">Stock Replenishment</option>
              <option value="return">Customer Return</option>
              <option value="damage">Damage / Write-off</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a brief note about this adjustment..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || change === 0}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-amber-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockUpdateModal;
