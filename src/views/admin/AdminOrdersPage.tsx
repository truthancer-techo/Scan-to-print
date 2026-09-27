import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { OrderDetailsModal } from '../../components/admin/OrderDetailsModal';
import { InvoiceModal } from '../../components/admin/InvoiceModal';
import { ManualOrderModal } from '../../components/admin/ManualOrderModal';
import {
  Search,
  Filter,
  Printer,
  Eye,
  Plus,
  RefreshCw,
  FileCheck2,
  AlertCircle,
  Check,
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const { printers, addToast } = useApp();

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isAcceptingToken, setIsAcceptingToken] = useState<boolean>(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({
        status: statusFilter !== 'All' ? (statusFilter as OrderStatus) : undefined,
        search: search.trim() || undefined,
      });
      setOrders(res.orders || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleAcceptOrder = async (orderIdOrToken: string) => {
    try {
      const res = await api.acceptOrder(orderIdOrToken);
      addToast('success', 'Order Accepted', `Order #${res.order.id} accepted. Customer portal redirected to home!`);
      fetchOrders();
    } catch (err: any) {
      addToast('error', 'Accept Failed', err?.message || 'Could not accept order');
    }
  };

  const handleQuickAcceptToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) return;
    try {
      setIsAcceptingToken(true);
      const res = await api.acceptOrder(token);
      addToast('success', 'Token Accepted', `Token ${res.order.id} accepted! Customer was automatically redirected to Home.`);
      setTokenInput('');
      fetchOrders();
    } catch (err: any) {
      addToast('error', 'Token Not Found', err?.message || `Could not accept token ${token}`);
    } finally {
      setIsAcceptingToken(false);
    }
  };

  const handleOneClickPrint = async (order: Order) => {
    try {
      const targetPrinter = printers[0]?.id || 'printer-1';
      await api.oneClickPrint(order.id, targetPrinter, order.separator || 'None');
      addToast('success', 'Print Job Sent', `Order #${order.id} sent to ${printers[0]?.name || 'printer'}.`);
      fetchOrders();
    } catch (err: any) {
      addToast('error', 'Print Error', err?.message || 'Failed to dispatch print job');
    }
  };

  const statuses = [
    'All',
    'Pending',
    'Processing',
    'Printing',
    'Ready',
    'Completed',
    'Rejected',
    'Print Failed',
    'Cancelled',
  ];

  return (
    <AdminLayout pageTitle="Orders">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Order Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter, search, review, and dispatch incoming print jobs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrders()}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition shadow-sm"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ New Walk-in Order</span>
            </button>
          </div>
        </div>

        {/* Quick Counter Token Accept Bar */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-[#0b162d] text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                Quick Counter Token Accept (काउंटर टोकन स्वीकार करें)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Enter customer's token (e.g. <span className="font-mono text-emerald-300 font-bold">8K2P</span> or <span className="font-mono text-emerald-300 font-bold">ORD-8K2P</span>). Accepting will automatically send the customer's portal back to Home!
            </p>
          </div>

          <form onSubmit={handleQuickAcceptToken} className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              placeholder="e.g. 8K2P or ORD-8K2P"
              maxLength={10}
              className="px-3.5 py-2.5 bg-slate-800/90 text-white placeholder-slate-400 border border-emerald-500/40 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-400 w-full sm:w-56"
            />
            <button
              type="submit"
              disabled={!tokenInput.trim() || isAcceptingToken}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isAcceptingToken ? 'Accepting...' : 'Accept Token'}</span>
            </button>
          </form>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Order ID, Customer Name, or Phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </form>

            <div className="text-xs text-slate-500 font-bold self-end sm:self-center">
              Total {totalCount} order{totalCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Documents</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No orders found matching this filter.
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
                        className="hover:bg-amber-50/20 transition cursor-pointer"
                        onClick={() => setSelectedOrder(ord)}
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono font-extrabold text-slate-900 block">
                            {ord.id}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString()} •{' '}
                            {new Date(ord.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {ord.customerPhone}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-800 block truncate max-w-[200px]">
                            {ord.documents[0]?.name || 'Print'}
                            {ord.documents.length > 1 ? ` (+${ord.documents.length - 1})` : ''}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {totalPages} pages • {ord.documents[0]?.paperSize} •{' '}
                            {ord.documents[0]?.colorMode}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              ord.orderStatus === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.orderStatus === 'Printing'
                                ? 'bg-purple-100 text-purple-800 animate-pulse'
                                : ord.orderStatus === 'Ready'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {ord.orderStatus}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-extrabold text-slate-900 text-sm">
                          ₹{(ord.totalAmount ?? 0).toFixed(2)}
                        </td>

                        <td
                          className="px-5 py-4 whitespace-nowrap text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {!ord.isAccepted && (
                              <button
                                type="button"
                                onClick={() => handleAcceptOrder(ord.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1 shadow-sm active:scale-95"
                                title="Accept Token & Return Customer to Home"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Accept</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOneClickPrint(ord)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm"
                              title="One-Click Print"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
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
      </div>

      {/* Modals */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdated={(upd) => {
          setSelectedOrder(upd);
          fetchOrders();
        }}
        onOpenInvoice={(ord) => setInvoiceOrder(ord)}
      />

      <InvoiceModal
        order={invoiceOrder}
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />

      <ManualOrderModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onOrderCreated={(newOrd) => {
          fetchOrders();
          setSelectedOrder(newOrd);
        }}
      />
    </AdminLayout>
  );
};
