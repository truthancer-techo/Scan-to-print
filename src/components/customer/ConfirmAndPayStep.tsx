import React, { useState } from 'react';
import { DocumentItem, Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  CreditCard,
  QrCode,
  Wallet,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

interface ConfirmAndPayStepProps {
  documents: DocumentItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  appliedDiscountTitle?: string;
  initialManualPay?: boolean;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialCustomerEmail?: string;
  initialPaymentMethod?: 'upi' | 'razorpay' | 'manual';
  onUpdateCustomerInfo?: (info: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    paymentMethod: 'upi' | 'razorpay' | 'manual';
  }) => void;
  onBack: () => void;
  onBackToConfigure?: () => void;
  onOrderCompleted: (order: Order) => void;
}

export const ConfirmAndPayStep: React.FC<ConfirmAndPayStepProps> = ({
  documents,
  subtotal,
  discountAmount,
  totalAmount,
  appliedDiscountTitle,
  initialManualPay = false,
  initialCustomerName = '',
  initialCustomerPhone = '',
  initialCustomerEmail = '',
  initialPaymentMethod,
  onUpdateCustomerInfo,
  onBack,
  onBackToConfigure,
  onOrderCompleted,
}) => {
  const { business, addToast } = useApp();

  const [customerName, setCustomerName] = useState<string>(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState<string>(initialCustomerPhone);
  const [customerEmail, setCustomerEmail] = useState<string>(initialCustomerEmail);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'razorpay' | 'manual'>(
    initialPaymentMethod || (initialManualPay ? 'manual' : 'upi')
  );
  const [couponCode, setCouponCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Duplicate submission lock
  const hasSubmittedRef = React.useRef<boolean>(false);

  const handleNameChange = (val: string) => {
    setCustomerName(val);
    onUpdateCustomerInfo?.({ customerName: val, customerPhone, customerEmail, paymentMethod });
  };

  const handlePhoneChange = (val: string) => {
    setCustomerPhone(val);
    onUpdateCustomerInfo?.({ customerName, customerPhone: val, customerEmail, paymentMethod });
  };

  const handleEmailChange = (val: string) => {
    setCustomerEmail(val);
    onUpdateCustomerInfo?.({ customerName, customerPhone, customerEmail: val, paymentMethod });
  };

  const handlePaymentMethodChange = (method: 'upi' | 'razorpay' | 'manual') => {
    setPaymentMethod(method);
    onUpdateCustomerInfo?.({ customerName, customerPhone, customerEmail, paymentMethod: method });
  };

  // Demo Payment Simulation Selector (SUCCESS, FAILED, CANCELLED)
  const [demoOutcome, setDemoOutcome] = useState<'SUCCESS' | 'FAILED' | 'CANCELLED'>('SUCCESS');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || hasSubmittedRef.current) return;

    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number for order pickup.');
      return;
    }

    try {
      hasSubmittedRef.current = true;
      setIsProcessing(true);

      // 1. Submit order to backend (server recalculates verified amount and creates order)
      const res = await api.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        documents,
        paymentMethod,
        discountCode: couponCode || undefined,
        separator: 'None',
      });

      const order = res.order;

      // If manual pay, order is ready with status "Pending / Manual Verification"
      if (paymentMethod === 'manual') {
        setIsProcessing(false);
        addToast('success', 'Order Placed', `Order #${order.id} registered for counter payment.`);
        onOrderCompleted(order);
        return;
      }

      // Online Payment flow (UPI / Razorpay simulator)
      if (business?.demoMode || true) {
        // Execute server payment verification endpoint
        const payRes = await api.verifyOrderPayment(order.id, {
          testResult: demoOutcome,
          paymentMethod,
          transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`,
        });

        setIsProcessing(false);

        if (demoOutcome === 'SUCCESS' && payRes.success) {
          addToast('success', 'Payment Verified', `Order #${order.id} paid successfully!`);
          onOrderCompleted(payRes.order);
        } else if (demoOutcome === 'FAILED') {
          hasSubmittedRef.current = false;
          setErrorMsg('Test Payment Simulation: Payment was declined or failed.');
          addToast('error', 'Payment Failed', 'Test payment failure recorded.');
        } else {
          hasSubmittedRef.current = false;
          setErrorMsg('Test Payment Simulation: Payment window was cancelled by customer.');
          addToast('info', 'Payment Cancelled', 'You can retry or choose Manual Pay.');
        }
      }
    } catch (err: any) {
      hasSubmittedRef.current = false;
      setIsProcessing(false);
      setErrorMsg(err?.message || 'Failed to process order. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Top Back button & Title */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-[#112347] hover:bg-[#162c5a] border border-blue-800/40 px-3.5 py-2.5 rounded-xl transition shadow-sm active:scale-95"
            aria-label="Back to Preview"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300" />
            <span>← Back to Preview</span>
          </button>

          {onBackToConfigure && (
            <button
              type="button"
              onClick={onBackToConfigure}
              className="text-xs text-orange-400 hover:text-orange-300 underline px-1 py-1"
            >
              Edit Options (Step 2)
            </button>
          )}
        </div>

        <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/30">
          Step 4 of 4: Order Confirmation
        </span>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-2xl text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePay} className="space-y-6">
        {/* Customer Information Card */}
        <div className="bg-[#0b162d] rounded-2xl p-6 border border-blue-900/50 shadow-xl space-y-4">
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <User className="w-4 h-4 text-orange-400" />
            Customer Information
          </h3>
          <p className="text-xs text-slate-400">
            No account required. Used for order identification and pickup at the print counter.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Your Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Ramesh Singh"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-blue-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-[#070e1c] text-white placeholder:text-slate-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Mobile Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="e.g. 98290 12345"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-blue-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-[#070e1c] text-white placeholder:text-slate-500"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 block">
                Email Address <span className="text-slate-400 font-normal">(Optional, for digital receipt)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="e.g. ramesh@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-blue-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-[#070e1c] text-white placeholder:text-slate-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Order Review Card */}
        <div className="bg-[#0b162d] rounded-2xl p-6 border border-blue-900/50 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              Order Review & Specifications
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {documents.length} document{documents.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="divide-y divide-blue-900/30 max-h-64 overflow-y-auto pr-1">
            {documents.map((doc, idx) => (
              <div key={doc.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">
                    DOC {idx + 1}: {doc.name}
                  </p>
                  <p className="text-slate-300 mt-0.5">
                    {doc.paperSize} • {doc.colorMode} • {doc.printStyle} • {doc.paperType}
                  </p>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    Orientation: {doc.orientation} • Scaling: {doc.scaling} • {doc.printablePages} pages × {doc.copies} copy
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold font-mono text-orange-400 text-sm">
                    ₹{doc.totalPrice.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-slate-400">₹{doc.ratePerPage.toFixed(2)}/pg</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing summary table */}
          <div className="pt-3 border-t border-blue-900/40 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal</span>
              <span className="font-mono text-white">₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-orange-400 font-semibold">
                <span>Discount ({appliedDiscountTitle || 'Applied'})</span>
                <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-blue-900/40">
              <span>Final Payable Amount</span>
              <span className="text-orange-400 font-mono text-lg">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="bg-[#0b162d] rounded-2xl p-6 border border-blue-900/50 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-400" />
              Select Payment Method
            </h3>
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/30">
              100% Secure
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* UPI Option */}
            <button
              type="button"
              onClick={() => handlePaymentMethodChange('upi')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                paymentMethod === 'upi'
                  ? 'border-orange-500 bg-orange-500/15 ring-1 ring-orange-500/40 shadow-sm'
                  : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326]'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[#112347] text-orange-400 border border-blue-800/40 flex items-center justify-center mb-2 font-bold text-xs">
                UPI
              </div>
              <div className="font-bold text-xs text-white">Instant UPI</div>
              <p className="text-[11px] text-slate-400 mt-0.5">GPay, PhonePe, Paytm, BHIM</p>
            </button>

            {/* Razorpay Gateway */}
            <button
              type="button"
              onClick={() => handlePaymentMethodChange('razorpay')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                paymentMethod === 'razorpay'
                  ? 'border-orange-500 bg-orange-500/15 ring-1 ring-orange-500/40 shadow-sm'
                  : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326]'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[#112347] text-blue-400 border border-blue-800/40 flex items-center justify-center mb-2 font-bold text-xs">
                CARD
              </div>
              <div className="font-bold text-xs text-white">Online Gateway</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Debit/Credit Card, NetBanking</p>
            </button>

            {/* Manual Counter Pay */}
            <button
              type="button"
              onClick={() => handlePaymentMethodChange('manual')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                paymentMethod === 'manual'
                  ? 'border-orange-500 bg-orange-500/15 ring-1 ring-orange-500/40 shadow-sm'
                  : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326]'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[#112347] text-emerald-400 border border-blue-800/40 flex items-center justify-center mb-2">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-white">Manual Pay at Shop</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Pay cash or counter UPI on pickup</p>
            </button>
          </div>

          {/* Demo Mode / Simulation Outcome Controller */}
          <div className="mt-4 p-3.5 bg-[#081124] border border-blue-900/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                DEMO / TEST PAYMENT SIMULATOR
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Sandbox Mode Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Choose the simulated gateway response to test end-to-end payment outcomes:
            </p>
            <div className="flex items-center gap-2 pt-1">
              {(['SUCCESS', 'FAILED', 'CANCELLED'] as const).map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => setDemoOutcome(outcome)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    demoOutcome === outcome
                      ? outcome === 'SUCCESS'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : outcome === 'FAILED'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-700 text-white shadow-sm'
                      : 'bg-[#112347] border border-blue-800/40 text-slate-300 hover:bg-[#162c5a]'
                  }`}
                >
                  {outcome}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Pay Button & Bottom Back Button */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#112347] hover:bg-[#162c5a] text-slate-200 border border-blue-800/40 rounded-full font-bold text-sm shadow-sm transition active:scale-95 disabled:opacity-50 shrink-0"
              aria-label="Back to Preview"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              <span>← Back</span>
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-[0.99] text-white font-black text-base rounded-full shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending Print Order...
                </span>
              ) : paymentMethod === 'manual' ? (
                <span>Send Print Order (Pay ₹{totalAmount.toFixed(2)} at Counter)</span>
              ) : (
                <span>Send Print Order (Pay Now ₹{totalAmount.toFixed(2)})</span>
              )}
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>🔒 Secure & Private — Your documents are automatically deleted after order completion.</span>
          </p>
        </div>
      </form>
    </div>
  );
};
