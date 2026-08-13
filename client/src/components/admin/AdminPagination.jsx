import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminPagination = ({ page, pages, onPageChange, total, limit }) => {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Generate page numbers: show up to 5 around current
  const getPages = () => {
    const nums = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(pages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  };

  const pageNums = getPages();

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}–{to}</span> of{' '}
        <span className="font-semibold text-slate-700">{total}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageNums[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="w-8 h-8 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition">1</button>
            {pageNums[0] > 2 && <span className="text-slate-400 text-xs px-1">…</span>}
          </>
        )}

        {pageNums.map((n) => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
              n === page
                ? 'bg-slate-900 text-amber-300 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {n}
          </button>
        ))}

        {pageNums[pageNums.length - 1] < pages && (
          <>
            {pageNums[pageNums.length - 1] < pages - 1 && <span className="text-slate-400 text-xs px-1">…</span>}
            <button onClick={() => onPageChange(pages)} className="w-8 h-8 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition">{pages}</button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
