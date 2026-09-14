import React, { useState } from 'react';
import { WeeklyStat } from '../../types';

interface WeeklyOrdersChartProps {
  data: WeeklyStat[];
}

export const WeeklyOrdersChart: React.FC<WeeklyOrdersChartProps> = ({ data }) => {
  const [metric, setMetric] = useState<'orders' | 'revenue'>('orders');

  const totalOrders = data.reduce((acc, d) => acc + d.orders, 0);
  const totalRevenue = data.reduce((acc, d) => acc + d.revenue, 0);

  const maxValue = Math.max(...data.map((d) => (metric === 'orders' ? d.orders : d.revenue)), 1);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">Orders This Week</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Total <strong className="text-slate-800">{totalOrders} orders</strong> •{' '}
            <strong className="text-amber-700 font-mono">₹{totalRevenue.toFixed(2)} revenue</strong>
          </p>
        </div>

        {/* Metric Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric('orders')}
            className={`px-3 py-1.5 rounded-lg transition ${
              metric === 'orders'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orders
          </button>
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={`px-3 py-1.5 rounded-lg transition ${
              metric === 'revenue'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revenue (₹)
          </button>
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="h-52 w-full flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
        {data.map((item) => {
          const val = metric === 'orders' ? item.orders : item.revenue;
          const heightPercent = Math.max(8, Math.round((val / maxValue) * 100));

          return (
            <div
              key={item.day}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip on Hover */}
              <div className="opacity-0 group-hover:opacity-100 absolute -top-9 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow pointer-events-none transition z-10 whitespace-nowrap">
                {metric === 'orders' ? `${item.orders} orders` : `₹${item.revenue}`}
              </div>

              {/* Bar */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 group-hover:opacity-90 ${
                  metric === 'orders'
                    ? 'bg-amber-500 group-hover:bg-amber-600'
                    : 'bg-emerald-500 group-hover:bg-emerald-600'
                }`}
              />

              {/* Day Label */}
              <span className="text-[11px] font-semibold text-slate-500 mt-2 group-hover:text-slate-900">
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
