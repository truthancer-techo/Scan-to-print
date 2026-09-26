import React, { useState } from 'react';
import { Order, OrderStatus, PaymentStatus, SeparatorType } from '../../types';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  X,
  Printer,
  FileText,
  User,
  Phone,
  Mail,
  CreditCard,
  Layers,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Receipt,
  Download,
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: (updated: Order) => void;
  onOpenInvoice: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
  onOpenInvoice,
}) => {
  const { printers, addToast } = useApp();

  if (!isOpen || !order) return null;

  const [orderStatus, setOrderStatus] = useState<OrderStatus>(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [assignedPrinterId, setAssignedPrinterId] = useState<string>(
    order.assignedPrinterId || (printers[0]?.id ?? 'printer-1')
  );
  const [separator, setSeparator] = useState<SeparatorType>(order.separator || 'None');
  const [adminNotes, setAdminNotes] = useState<string>(order.adminNotes || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await api.updateOrder(order.id, {
        orderStatus,
        paymentStatus,
        assignedPrinterId,
        separator,
        adminNotes,
      });
      onOrderUpdated(res.order);
      addToast('success', 'Order Updated', `Order #${order.id} saved successfully.`);
      setIsSaving(false);
    } catch (err: any) {
      setIsSaving(false);
      addToast('error', 'Update Failed', err?.message || 'Could not update order');
    }
  };

  const handleOneClickPrint = async () => {
    try {
      setIsPrinting(true);
      const res = await api.oneClickPrint(order.id, assignedPrinterId, separator);
      onOrderUpdated(res.order);
      setOrderStatus('Printing');
      addToast('success', 'Print Job Sent', `Order #${order.id} spooled to ${printers.find(p => p.id === assignedPrinterId)?.name || 'printer'}.`);
      setIsPrinting(false);
    } catch (err: any) {
      setIsPrinting(false);
      addToast('error', 'Print Error', err?.message || 'Failed to dispatch print job');
    }
  };

  const totalPages = order.documents.reduce((a, d) => a + d.printablePages * d.copies, 0);
  const totalSheets = order.documents.reduce((a, d) => a + d.sheetsCount * d.copies, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-lg text-slate-900">
                {order.orderToken || order.id}
              </span>
              {order.orderToken && order.orderToken !== order.id && (
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  ({order.id})
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  order.orderStatus === 'Completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.orderStatus === 'Printing'
                    ? 'bg-purple-100 text-purple-800 animate-pulse'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenInvoice(order)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Tax Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 3 Columns Summary: Customer, Pricing, Print Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Customer Details
              </span>
              <p className="font-extrabold text-sm text-slate-900">{order.customerName}</p>
              <p className="text-slate-600 flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {order.customerPhone}
              </p>
              {order.customerEmail && (
                <p className="text-slate-500 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {order.customerEmail}
                </p>
              )}
            </div>

            {/* Payment Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Payment Info
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-extrabold text-base font-mono text-amber-700">
                  ₹{(order.totalAmount ?? 0).toFixed(2)}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
              {order.transactionId && (
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  Txn: {order.transactionId}
                </p>
              )}
            </div>

            {/* Print Output Metrics */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Print Specs
              </span>
              <p className="font-bold text-slate-900">
                {order.documents.length} Document{order.documents.length > 1 ? 's' : ''}
              </p>
              <p className="text-slate-600">
                Total Printable Pages:{' '}
                <strong className="text-slate-900 font-mono">{totalPages}</strong>
              </p>
              <p className="text-slate-600">
                Estimated Sheets:{' '}
                <strong className="text-slate-900 font-mono">{totalSheets}</strong>
              </p>
            </div>
          </div>

          {/* Documents Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-900">Ordered Documents</h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {order.documents.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">
                        {idx + 1}. {doc.name}
                      </h5>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {doc.paperSize}
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {doc.colorMode}
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {doc.printStyle}
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {doc.paperType}
                        </span>
                        <span>
                          {doc.printablePages} pages × {doc.copies} copy
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="font-bold font-mono text-sm text-slate-900">
                      ₹{(doc.totalPrice ?? 0).toFixed(2)}
                    </span>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="View Document"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Print Dispatch & Hardware Assignment */}
          <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 space-y-4">
            <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-600" />
              Hardware Print Dispatch Controls
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Assign Hardware Printer */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Target Printer
                </label>
                <select
                  value={assignedPrinterId}
                  onChange={(e) => setAssignedPrinterId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                >
                  {printers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Separator Sheet */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Job Separator Sheet
                </label>
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value as SeparatorType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="None">None</option>
                  <option value="Blank Page">Blank Page</option>
                  <option value="Slip">Slip (Customer & ID Banner)</option>
                  <option value="Color Sheet">Color Sheet</option>
                </select>
              </div>

              {/* Update Order Status */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Change Order Status
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Printing">Printing</option>
                  <option value="Ready">Ready for Pickup</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Print Failed">Print Failed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Internal Shop Notes / Counter Remarks
              </label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Keep separate in tray 2, customer will pick at 5pm"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleOneClickPrint}
            disabled={isPrinting}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>
              {isPrinting ? 'Spooling to Printer...' : 'One-Click Print Now'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
