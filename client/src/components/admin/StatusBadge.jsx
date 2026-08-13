import React from 'react';

const statusConfig = {
  // Order statuses
  pending:    { label: 'Pending',    bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  processing: { label: 'Processing', bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300' },
  shipped:    { label: 'Shipped',    bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
  delivered:  { label: 'Delivered',  bg: 'bg-emerald-100',text: 'text-emerald-800',border: 'border-emerald-300' },
  cancelled:  { label: 'Cancelled',  bg: 'bg-rose-100',   text: 'text-rose-800',   border: 'border-rose-300' },
  // Payment statuses
  successful: { label: 'Successful', bg: 'bg-emerald-100',text: 'text-emerald-800',border: 'border-emerald-300' },
  failed:     { label: 'Failed',     bg: 'bg-rose-100',   text: 'text-rose-800',   border: 'border-rose-300' },
  refunded:   { label: 'Refunded',   bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-300' },
  // User / account statuses
  active:     { label: 'Active',     bg: 'bg-emerald-100',text: 'text-emerald-800',border: 'border-emerald-300' },
  inactive:   { label: 'Inactive',   bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-300' },
  suspended:  { label: 'Suspended',  bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  // Stock statuses
  in_stock:   { label: 'In Stock',   bg: 'bg-emerald-100',text: 'text-emerald-800',border: 'border-emerald-300' },
  low_stock:  { label: 'Low Stock',  bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300' },
  out_of_stock:{ label: 'Out of Stock',bg: 'bg-rose-100', text: 'text-rose-800',   border: 'border-rose-300' },
};

export const StatusBadge = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
  };

  const sizeClass = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClass} capitalize`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
