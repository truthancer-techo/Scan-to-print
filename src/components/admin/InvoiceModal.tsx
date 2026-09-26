import React from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Printer, Download, MapPin, Phone, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  const { business } = useApp();

  if (!isOpen || !order) return null;

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden on print) */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 print:hidden">
          <span className="font-bold text-xs text-slate-700">Tax Invoice Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800 print:p-0 print:text-black">
          {/* Shop Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                SONU PRINTER
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Offline Document Printing, Xerox & E-Mitra Hub
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                {business?.address || 'Shop No. 4, Near Meera Smarak, Station Road'},{' '}
                {business?.city || 'Merta City'} - {business?.pincode || '341510'}, Rajasthan
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Phone: {business?.phone || '+91 98291 45678'} • Email: {business?.email || 'sonuprinter.merta@gmail.com'}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs uppercase tracking-wider rounded-md">
                TAX INVOICE
              </span>
              <p className="font-mono font-bold text-sm text-slate-900 mt-2">
                INV-{order.id.replace('ORD-', '')}
              </p>
              <p className="text-[11px] text-slate-500">
                Date: {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Order ID: {order.id}
              </p>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Billed To:
              </span>
              <p className="font-bold text-sm text-slate-900 mt-0.5">{order.customerName}</p>
              <p className="text-slate-600 font-mono mt-0.5">Phone: {order.customerPhone}</p>
              {order.customerEmail && (
                <p className="text-slate-500">{order.customerEmail}</p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Payment Details:
              </span>
              <p className="font-bold text-slate-900 mt-0.5">
                Method: <span className="uppercase">{order.paymentMethod}</span>
              </p>
              <p className="text-emerald-700 font-bold mt-0.5">
                Status: {order.paymentStatus}
              </p>
              {order.transactionId && (
                <p className="text-[10px] text-slate-500 font-mono">
                  Txn ID: {order.transactionId}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[11px] font-extrabold text-slate-900 uppercase">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Specs</th>
                <th className="py-2 text-center">Pages</th>
                <th className="py-2 text-center">Copies</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.documents.map((doc, idx) => (
                <tr key={doc.id} className="py-2">
                  <td className="py-2 font-medium">
                    <span className="font-bold text-slate-900 block">{doc.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {doc.paperType} • {doc.scaling}
                    </span>
                  </td>
                  <td className="py-2 text-center text-[11px] text-slate-600">
                    {doc.paperSize} • {doc.colorMode} • {doc.printStyle}
                  </td>
                  <td className="py-2 text-center font-mono">{doc.printablePages}</td>
                  <td className="py-2 text-center font-mono">{doc.copies}</td>
                  <td className="py-2 text-right font-mono">₹{(doc.ratePerPage ?? 0).toFixed(2)}</td>
                  <td className="py-2 text-right font-mono font-bold">
                    ₹{(doc.totalPrice ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pricing Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{(order.subtotal ?? 0).toFixed(2)}</span>
              </div>
              {(order.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{(order.discountAmount ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Taxes (GST Exempt/Included):</span>
                <span className="font-mono">₹0.00</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 border-t-2 border-slate-900 pt-2">
                <span>Grand Total:</span>
                <span className="font-mono text-amber-800">
                  ₹{(order.totalAmount ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="border-t border-slate-200 pt-6 flex items-end justify-between text-[10px] text-slate-500">
            <div>
              <p className="font-bold text-slate-700">Terms & Conditions:</p>
              <p>1. Please verify all printed pages before leaving the counter.</p>
              <p>2. Unclaimed prints will be retained securely for 7 days.</p>
              <p>3. Thank you for choosing Sonu Printer, Merta City!</p>
            </div>

            <div className="text-center">
              <div className="w-32 border-b border-slate-400 mb-1" />
              <span className="font-bold text-slate-700">Authorized Signatory</span>
              <p className="text-slate-400">Sonu Printer, Merta City</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
