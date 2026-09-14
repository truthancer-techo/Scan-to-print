import React from 'react';
import { MonthlyStat } from '../../types';

interface MonthlyRevenueChartProps {
  data: MonthlyStat[];
}

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ data }) => {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const totalPeriodRevenue = data.reduce((acc, d) => acc + d.revenue, 0);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">Monthly Revenue</h3>
          <p className="text-xs text-slate-500">
            Past 7 months • Total <strong className="text-amber-700 font-mono">₹{totalPeriodRevenue.toLocaleString('en-IN')}</strong>
          </p>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Steady Growth
        </span>
      </div>

      <div className="h-48 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
        {data.map((item) => {
          const heightPercent = Math.max(10, Math.round((item.revenue / maxRevenue) * 100));

          return (
            <div
              key={item.month}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip on Hover */}
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow pointer-events-none transition z-10 whitespace-nowrap">
                ₹{item.revenue.toLocaleString('en-IN')} ({item.orders} orders)
              </div>

              {/* Bar */}
              <div
                style={{ height: `${heightPercent}%` }}
                className="w-full max-w-[42px] bg-gradient-to-t from-slate-900 to-amber-500 rounded-t-xl transition-all duration-300 group-hover:brightness-110"
              />

              {/* Month Label */}
              <span className="text-[11px] font-semibold text-slate-500 mt-2 group-hover:text-slate-900">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
