import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  CheckCircle2,
  Printer,
  PackageCheck,
  CreditCard,
  Phone,
  RefreshCw,
  MapPin,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface OrderTrackingViewProps {
  orderId: string;
  initialOrder?: Order;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orderId,
  initialOrder,
}) => {
  const { business, navigate } = useApp();
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [loading, setLoading] = useState<boolean>(!initialOrder);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchOrder = async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const data = await api.getOrder(orderId);
      setOrder(data);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Order not found');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Real-time polling every 3 seconds so customer tracking is genuinely live!
    const timer = setInterval(() => {
      fetchOrder(false);
    }, 3000);
    return () => clearInterval(timer);
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-[#0b162d] rounded-3xl shadow-xl border border-blue-900/50 text-white">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-semibold text-white">Loading Order #{orderId}...</p>
        <p className="text-xs text-slate-400 mt-1">Checking live status with Sonu Printer print server...</p>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-[#0b162d] rounded-3xl shadow-xl border border-blue-900/50 text-white space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="font-bold text-lg text-white">Order Not Found</h3>
        <p className="text-xs text-slate-400">
          We could not find an order matching <strong className="font-mono text-orange-400">{orderId}</strong>.
          Please check the Order ID or mobile number.
        </p>
        <button
          onClick={() => navigate('/track')}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-full text-xs shadow-md transition"
        >
          Track Another Order
        </button>
      </div>
    );
  }

  // Timeline Stages:
  // 1. Order Received
  // 2. Payment Confirmed
  // 3. Processing
  // 4. Printing
  // 5. Ready
  // 6. Completed
  const stages = [
    { key: 'received', label: 'Order Received', desc: 'Document uploaded & registered' },
    { key: 'paid', label: 'Payment Confirmed', desc: 'Verified via UPI / Counter' },
    { key: 'processing', label: 'Processing', desc: 'Print layout prepared & spooled' },
    { key: 'printing', label: 'Printing', desc: 'Currently printing on shop hardware' },
    { key: 'ready', label: 'Ready for Pickup', desc: 'Packed & placed in pickup tray' },
    { key: 'completed', label: 'Completed', desc: 'Handed over to customer' },
  ];

  const getStageIndex = (status: OrderStatus, paymentStatus: string): number => {
    if (status === 'Completed') return 5;
    if (status === 'Ready') return 4;
    if (status === 'Printing') return 3;
    if (status === 'Processing') return 2;
    if (paymentStatus === 'Paid') return 1;
    return 0;
  };

  const currentStageIdx = getStageIndex(order.orderStatus, order.paymentStatus);

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-white">
      {/* Top Header */}
      <div className="bg-[#0b162d] rounded-3xl p-6 border border-blue-900/50 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-blue-900/40">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Live Order Tracker
            </span>
            <h2 className="text-2xl font-extrabold text-orange-400 font-mono mt-0.5">
              {order.id}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer: <strong className="text-slate-200">{order.customerName}</strong> ({order.customerPhone})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrder(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#112347] hover:bg-[#162c5a] text-slate-200 border border-blue-800/40 rounded-xl text-xs font-semibold transition"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Live Sync</span>
            </button>

            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                order.orderStatus === 'Completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : order.orderStatus === 'Printing'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {order.orderStatus}
            </span>
          </div>
        </div>

        {/* Dynamic Status Progress Timeline */}
        <div className="py-6 px-2">
          <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-blue-900/60 ml-4">
            {stages.map((stage, idx) => {
              const isPast = currentStageIdx > idx;
              const isCurrent = currentStageIdx === idx;

              return (
                <div key={stage.key} className="relative">
                  {/* Status Circle Dot */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 ${
                      isPast
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white ring-4 ring-orange-500/30 scale-110'
                        : 'bg-[#091326] border-2 border-blue-900/60 text-slate-500'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Stage Details */}
                  <div className="pt-0.5">
                    <h4
                      className={`text-sm font-bold transition-colors ${
                        isCurrent
                          ? 'text-orange-400'
                          : isPast
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      {stage.label}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shop Pickup Card */}
        <div className="mt-4 p-4 bg-[#0e1b38] border border-orange-500/30 rounded-2xl flex items-start gap-3 text-xs">
          <MapPin className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-bold text-white">Pickup Counter: Sonu Printer</h5>
            <p className="text-slate-300 mt-0.5">
              {business?.address || 'Shop No. 4, Near Meera Smarak, Station Road, Merta City'}
            </p>
            <p className="text-slate-400 text-[11px] mt-1">
              Timings: {business?.openingHours || '8:30 AM - 8:30 PM'} • Phone:{' '}
              {business?.phone || '+91 98291 45678'}
            </p>
          </div>
        </div>
      </div>

      {/* Documents Breakdown Card */}
      <div className="bg-[#0b162d] rounded-3xl p-6 border border-blue-900/50 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-400" />
          Ordered Documents ({order.documents.length})
        </h3>

        <div className="divide-y divide-blue-900/30">
          {order.documents.map((doc, i) => (
            <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-white">
                  {i + 1}. {doc.name}
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {doc.paperSize} • {doc.colorMode} • {doc.printStyle} • {doc.copies} copy
                  {doc.copies > 1 ? 'ies' : ''} ({doc.printablePages} pages)
                </p>
              </div>
              <span className="font-mono font-bold text-orange-400">
                ₹{(doc.totalPrice ?? 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-blue-900/40 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300">Total Paid / Payable:</span>
          <span className="text-orange-400 font-mono text-base">
            ₹{(order.totalAmount ?? 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
