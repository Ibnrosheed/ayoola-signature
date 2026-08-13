import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmDialog = ({ open, title, message, confirmLabel = 'Confirm', confirmClass = 'bg-rose-600 text-white hover:bg-rose-700', onConfirm, onCancel }) => {
  useEffect(() => {
    if (open) {
      const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
