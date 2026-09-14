import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Order, DocumentItem } from '../../types';
import { X, Plus, Printer, User, Phone, Trash2, CheckCircle2 } from 'lucide-react';
import { calculateOrderSummary } from '../../utils/pricing';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const { pricing, discounts, printers, addToast } = useApp();

  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('9829000000');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [assignedPrinterId, setAssignedPrinterId] = useState<string>(printers[0]?.id || 'printer-1');

  // Walk-in documents
  const [items, setItems] = useState<DocumentItem[]>([
    {
      id: `doc-${Date.now()}-1`,
      name: 'Walk-in Photocopy / Print',
      size: 1024,
      type: 'application/pdf',
      pageCount: 1,
      pageRange: 'all',
      printablePages: 1,
      copies: 1,
      paperSize: 'A4',
      colorMode: 'B&W',
      printStyle: 'Single Sided',
      orientation: 'Auto',
      scaling: 'Fit to page',
      paperType: 'Plain Paper',
      collation: 'Collated',
      photoCollage: 'Original',
      sheetsCount: 1,
      ratePerPage: 3.0,
      totalPrice: 3.0,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const updateItem = (index: number, patch: Partial<DocumentItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], ...patch };
      // Recalculate price
      const rate =
        target.paperSize === 'A3'
          ? target.colorMode === 'Colour'
            ? 20
            : 8
          : target.colorMode === 'Colour'
          ? target.paperType === 'Glossy Paper'
            ? 12
            : 8
          : target.printStyle === 'Back-to-Back'
          ? 2.5
          : 3.0;
      target.ratePerPage = rate;
      target.sheetsCount =
        target.printStyle === 'Back-to-Back'
          ? Math.ceil(target.printablePages / 2)
          : target.printablePages;
      target.totalPrice = rate * target.printablePages * target.copies;
      copy[index] = target;
      return copy;
    });
  };

  const addItem = () => {
    const newItem: DocumentItem = {
      id: `doc-${Date.now()}-${items.length + 1}`,
      name: `Walk-in Print ${items.length + 1}`,
      size: 1024,
      type: 'application/pdf',
      url: '',
      pageCount: 1,
      pageRange: 'all',
      printablePages: 1,
      copies: 1,
      paperSize: 'A4',
      colorMode: 'B&W',
      printStyle: 'Single Sided',
      orientation: 'Auto',
      scaling: 'Fit to page',
      paperType: 'Plain Paper',
      collation: 'Collated',
      photoCollage: 'Original',
      sheetsCount: 1,
      ratePerPage: 3.0,
      totalPrice: 3.0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const summary = calculateOrderSummary(items, pricing, discounts);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.createOrder({
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || '9829000000',
        documents: items,
        paymentMethod,
        assignedPrinterId,
        separator: 'None',
      });

      // If marked paid, update payment status
      if (isPaid) {
        await api.updateOrder(res.order.id, {
          paymentStatus: 'Paid',
          orderStatus: 'Printing',
        });
      }

      addToast('success', 'Walk-in Order Created', `Order #${res.order.id} registered.`);
      onOrderCreated(res.order);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      addToast('error', 'Error', err?.message || 'Could not create order');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              New Walk-in Counter Order
            </h3>
            <p className="text-xs text-slate-500">
              Quick billing for customers standing at Sonu Printer counter
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Customer Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-medium font-mono"
              />
            </div>
          </div>

          {/* Documents configuration list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Print Items & Specs</span>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-amber-700 font-bold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(idx, { name: e.target.value })}
                    className="font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-amber-500 w-2/3"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Color Mode</label>
                    <select
                      value={item.colorMode}
                      onChange={(e) => updateItem(idx, { colorMode: e.target.value as any })}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="B&W">B&W</option>
                      <option value="Colour">Colour</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Print Style</label>
                    <select
                      value={item.printStyle}
                      onChange={(e) => updateItem(idx, { printStyle: e.target.value as any })}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="Single Sided">Single Sided</option>
                      <option value="Back-to-Back">Back-to-Back</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Pages</label>
                    <input
                      type="number"
                      min={1}
                      value={item.printablePages}
                      onChange={(e) =>
                        updateItem(idx, { printablePages: parseInt(e.target.value) || 1 })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Copies</label>
                    <input
                      type="number"
                      min={1}
                      value={item.copies}
                      onChange={(e) =>
                        updateItem(idx, { copies: parseInt(e.target.value) || 1 })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-600">
                  Rate: ₹{item.ratePerPage.toFixed(2)} • Item Total:{' '}
                  <strong className="text-amber-800 font-bold">
                    ₹{item.totalPrice.toFixed(2)}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          {/* Payment & Hardware Dispatch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
              <div className="flex items-center gap-2">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold"
                >
                  <option value="cash">Counter Cash</option>
                  <option value="upi">Counter UPI / QR</option>
                </select>
                <label className="flex items-center gap-1.5 font-bold text-slate-800 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Collected</span>
                </label>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Printer</label>
              <select
                value={assignedPrinterId}
                onChange={(e) => setAssignedPrinterId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold"
              >
                {printers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Total Bar */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <span className="font-bold text-sm">Total Payable</span>
            <span className="text-xl font-black font-mono text-amber-400">
              ₹{summary.totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Create & Spool Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
