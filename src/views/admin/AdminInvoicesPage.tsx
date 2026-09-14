import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Order } from '../../types';
import { api } from '../../services/api';
import { InvoiceModal } from '../../components/admin/InvoiceModal';
import { Receipt, Search, Printer, Eye, Download } from 'lucide-react';

export const AdminInvoicesPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    api
      .getOrders({ limit: 50 })
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout pageTitle="Invoices">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Tax Invoices & Billing Archive
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Print or reprint official customer tax invoices for Sonu Printer, Merta City
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice by order ID or name..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Invoice No.</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Grand Total (₹)</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      INV-{ord.id.replace('ORD-', '')}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {ord.customerPhone}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[10px] border border-emerald-200">
                        {ord.paymentStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-mono font-extrabold text-slate-900">
                      ₹{ord.totalAmount.toFixed(2)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedInvoice(ord)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <InvoiceModal
        order={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </AdminLayout>
  );
};
