import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * Lightweight pure-SVG area/line sales chart. No external library.
 * Props:
 *  - data: Array<{ sales: number, orders: number, _id: { day, month, year } | { month, year } | number }>
 *  - range: string (used for labelling)
 *  - height: number (default 160)
 */
export const SalesChart = ({ data = [], range = '7days', height = 160 }) => {
  const WIDTH = 600;
  const HEIGHT = height;
  const PAD = { top: 16, right: 16, bottom: 28, left: 48 };
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  const { points, maxSales, labels } = useMemo(() => {
    if (!data.length) return { points: [], maxSales: 0, labels: [] };

    const sales = data.map((d) => d.sales || 0);
    const maxSales = Math.max(...sales, 1);

    const points = data.map((d, i) => {
      const x = PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = PAD.top + innerH - ((d.sales || 0) / maxSales) * innerH;
      return { x, y, sales: d.sales, orders: d.orders, _id: d._id };
    });

    const labels = data.map((d) => {
      const id = d._id;
      if (typeof id === 'number') return `${id}:00`; // hour
      if (id?.day) return `${id.day}/${id.month}`;
      if (id?.month) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months[(id.month - 1)] || id.month;
      }
      return '';
    });

    return { points, maxSales, labels };
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400">
        <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm">No sales data for this period</p>
      </div>
    );
  }

  // Build SVG path for area
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
    .join(' ');

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x},${PAD.top + innerH} L ${points[0].x},${PAD.top + innerH} Z`
    : '';

  // Y-axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
    value: Math.round(maxSales * frac),
    y: PAD.top + innerH - frac * innerH,
  }));

  const fmt = (n) => {
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
    return `₦${n}`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ minWidth: 300, height }}
      >
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PAD.left}
              y1={tick.y}
              x2={PAD.left + innerW}
              y2={tick.y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={PAD.left - 6}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="9"
              fill="#94a3b8"
            >
              {fmt(tick.value)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill="url(#chartGrad)" />
        )}

        {/* Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points + tooltips */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#f59e0b" stroke="white" strokeWidth="2" />
            {/* X label */}
            {labels[i] && (
              <text
                x={p.x}
                y={PAD.top + innerH + 16}
                textAnchor="middle"
                fontSize="9"
                fill="#94a3b8"
              >
                {labels[i]}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default SalesChart;
