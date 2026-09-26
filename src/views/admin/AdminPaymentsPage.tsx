import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Order, PaymentStatus } from '../../types';
import { api } from '../../services/api';
import { CreditCard, CheckCircle2, XCircle, Search, Wallet, ShieldCheck, RefreshCw } from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const { addToast } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({ limit: 50 });
      setOrders(res.orders || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerifyPayment = async (orderId: string) => {
    try {
      await api.updateOrder(orderId, {
        paymentStatus: 'Paid',
      });
      addToast('success', 'Verified', `Order #${orderId} marked as PAID.`);
      fetchPayments();
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Could not verify');
    }
  };

  const handleRefund = async (orderId: string) => {
    try {
      await api.updateOrder(orderId, {
        paymentStatus: 'Refunded',
      });
      addToast('info', 'Refunded', `Order #${orderId} marked as Refunded.`);
      fetchPayments();
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Could not refund');
    }
  };

  const filtered = orders.filter((o) => {
    if (filter === 'pending') return o.paymentStatus === 'Pending Verification';
    if (filter === 'paid') return o.paymentStatus === 'Paid';
    return true;
  });

  const totalCollected = orders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((a, b) => a + b.totalAmount, 0);

  const pendingVerificationCount = orders.filter(
    (o) => o.paymentStatus === 'Pending Verification'
  ).length;

  return (
    <AdminLayout pageTitle="Payments">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Payment Transactions & Verification
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Reconcile online UPI transactions, verify counter manual payments, and issue refunds
            </p>
          </div>

          <button
            onClick={fetchPayments}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition shadow-sm self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Ledger</span>
          </button>
        </div>

        {/* 2 Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Verified Collections
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1">
                ₹{(totalCollected ?? 0).toFixed(2)}
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                From verified UPI and counter cash payments
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Manual Verification
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono mt-1">
                {pendingVerificationCount} Order(s)
              </div>
              <p className="text-xs text-amber-700 font-semibold mt-1">
                Cash or UPI at counter awaiting staff confirmation
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Wallet className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'paid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                filter === f
                  ? 'bg-slate-900 text-amber-400'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'pending' ? 'Pending Verification' : f}
            </button>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Order ID & Date</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount (₹)</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono font-extrabold text-slate-900 block">
                        {ord.id}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {ord.customerPhone}
                      </span>
                    </td>

                    <td className="px-6 py-4 uppercase font-bold text-slate-700">
                      {ord.paymentMethod}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.paymentStatus === 'Pending Verification'
                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-mono font-extrabold text-slate-900">
                      ₹{(ord.totalAmount ?? 0).toFixed(2)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ord.paymentStatus !== 'Paid' && (
                          <button
                            onClick={() => handleVerifyPayment(ord.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                          >
                            Mark Paid
                          </button>
                        )}
                        {ord.paymentStatus === 'Paid' && (
                          <button
                            onClick={() => handleRefund(ord.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
