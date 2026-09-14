import React from 'react';

interface OrderStatusDonutProps {
  statusCounts: Record<string, number>;
}

export const OrderStatusDonut: React.FC<OrderStatusDonutProps> = ({ statusCounts }) => {
  const statusMeta: Record<string, { label: string; color: string; hex: string }> = {
    Pending: { label: 'Pending', color: 'bg-amber-500', hex: '#f59e0b' },
    Processing: { label: 'Processing', color: 'bg-blue-500', hex: '#3b82f6' },
    Printing: { label: 'Printing', color: 'bg-purple-500', hex: '#a855f7' },
    Ready: { label: 'Ready', color: 'bg-indigo-500', hex: '#6366f1' },
    Completed: { label: 'Completed', color: 'bg-emerald-500', hex: '#10b981' },
    Rejected: { label: 'Rejected', color: 'bg-rose-500', hex: '#f43f5e' },
    'Print Failed': { label: 'Print Failed', color: 'bg-red-600', hex: '#dc2626' },
    Cancelled: { label: 'Cancelled', color: 'bg-slate-400', hex: '#94a3b8' },
  };

  const total =
    Object.values(statusCounts).reduce<number>(
      (a, b) => (Number(a) || 0) + (Number(b) || 0),
      0
    ) || 1;

  // Build SVG donut stroke segments
  let cumulativePercent = 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-slate-900">Order Status Breakdown</h3>
        <span className="text-xs font-bold text-slate-500">{total} total</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
        {/* SVG Donut */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="12"
            />
            {Object.entries(statusCounts).map(([status, count]) => {
              const numericCount = Number(count) || 0;
              if (numericCount === 0) return null;
              const percent = numericCount / total;
              const strokeDasharray = `${percent * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativePercent * circumference;
              cumulativePercent += percent;
              const hex = statusMeta[status]?.hex || '#94a3b8';

              return (
                <circle
                  key={status}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={hex}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold font-mono text-slate-900 leading-tight">
              {total}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Orders</span>
          </div>
        </div>

        {/* Legend Grid */}
        <div className="flex-1 grid grid-cols-2 gap-2 text-xs w-full">
          {Object.entries(statusMeta).map(([status, meta]) => {
            const count = statusCounts[status] || 0;
            return (
              <div
                key={status}
                className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.color}`} />
                  <span className="text-slate-600 truncate text-[11px] font-medium">
                    {meta.label}
                  </span>
                </div>
                <span className="font-bold text-slate-900 font-mono text-xs shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
