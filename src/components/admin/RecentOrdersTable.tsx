import React from 'react';
import { Order, OrderStatus } from '../../types';
import { Printer, Eye, Phone, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface RecentOrdersTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onOneClickPrint: (order: Order) => void;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
  orders,
  onViewOrder,
  onOneClickPrint,
}) => {
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
            Completed
          </span>
        );
      case 'Printing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            Printing
          </span>
        );
      case 'Ready':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
            Ready
          </span>
        );
      case 'Processing':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
            Processing
          </span>
        );
      case 'Rejected':
      case 'Print Failed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
            {status}
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-extrabold text-base text-slate-900">Recent Print Orders</h3>
        <span className="text-xs text-slate-500 font-medium">
          Showing latest {orders.length} orders
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Order ID & Date</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Documents</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((ord) => {
                const totalPages = ord.documents.reduce(
                  (a, d) => a + d.printablePages * d.copies,
                  0
                );

                return (
                  <tr
                    key={ord.id}
                    className="hover:bg-amber-50/30 transition cursor-pointer"
                    onClick={() => onViewOrder(ord)}
                  >
                    {/* Order ID & Date */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-extrabold text-slate-900 text-xs block">
                        {ord.id}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        •{' '}
                        {new Date(ord.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Customer Info */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                        {ord.customerName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {ord.customerPhone}
                      </span>
                    </td>

                    {/* Document Breakdown */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800 truncate block max-w-[180px]">
                        {ord.documents[0]?.name || 'Document'}
                        {ord.documents.length > 1 ? ` (+${ord.documents.length - 1} more)` : ''}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {totalPages} pages total • {ord.documents[0]?.paperSize || 'A4'} •{' '}
                        {ord.documents[0]?.colorMode || 'B&W'}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(ord.orderStatus)}
                    </td>

                    {/* Payment Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ord.paymentStatus} ({ord.paymentMethod.toUpperCase()})
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-extrabold text-slate-900 text-sm">
                      ₹{ord.totalAmount.toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td
                      className="px-5 py-4 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOneClickPrint(ord)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm"
                          title="One-Click Print"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>One-Click Print</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onViewOrder(ord)}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
