import React, { useState, useEffect, useRef } from 'react';
import { DocumentItem, Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Check,
  Copy,
  Home,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
  onOrderCompleted?: (order: Order) => void;
  onPrintAnother?: () => void;
}

// Helper to generate a 4-character token combining letters & numbers (e.g. 7B4X, 8K2P)
function generate4CharToken(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const allChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  const letterPos = Math.floor(Math.random() * 4);
  let digitPos = Math.floor(Math.random() * 4);
  while (digitPos === letterPos) {
    digitPos = Math.floor(Math.random() * 4);
  }

  let code = '';
  for (let i = 0; i < 4; i++) {
    if (i === letterPos) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    } else if (i === digitPos) {
      code += digits.charAt(Math.floor(Math.random() * digits.length));
    } else {
      code += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
  }
  return code;
}

export const ConfirmAndPayStep: React.FC<ConfirmAndPayStepProps> = ({
  documents,
  subtotal,
  discountAmount,
  totalAmount,
  appliedDiscountTitle,
  initialCustomerName = '',
  initialCustomerPhone = '',
  initialCustomerEmail = '',
  onBack,
  onBackToConfigure,
  onOrderCompleted,
  onPrintAnother,
}) => {
  const { business } = useApp();

  // 4-character token (abc+123 mix) with ORD- prefix generated ONCE per print job - never changes/flickers
  const [tokenCode] = useState<string>(() => `ORD-${generate4CharToken()}`);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isAccepted, setIsAccepted] = useState<boolean>(false);

  // Prevention of multiple celebration animations and submissions
  const celebrationFiredRef = useRef<boolean>(false);
  const orderCreatedRef = useRef<boolean>(false);
  const acceptedRedirectFiredRef = useRef<boolean>(false);

  // Poll for shopkeeper order acceptance and instantly redirect to home page
  useEffect(() => {
    let isMounted = true;
    let pollInterval: any = null;

    const pollStatus = async () => {
      if (!tokenCode || acceptedRedirectFiredRef.current) return;
      try {
        const res = await api.getOrderStatus(tokenCode);
        if (res && res.isAccepted && !acceptedRedirectFiredRef.current) {
          acceptedRedirectFiredRef.current = true;
          if (isMounted) {
            setIsAccepted(true);
          }
          // Redirect immediately to Home page ("हाथों-हाथ होम पेज आ जाना चाहिए")
          setTimeout(() => {
            if (isMounted) {
              handlePrintAnother();
            }
          }, 600);
        }
      } catch (e) {
        // Silently retry next second
      }
    };

    // Poll every 1000ms
    pollInterval = setInterval(pollStatus, 1000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [tokenCode]);

  useEffect(() => {
    // 1. Launch celebratory confetti burst EXACTLY ONCE
    if (!celebrationFiredRef.current) {
      celebrationFiredRef.current = true;
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.55 },
        });
      } catch (e) {
        // ignore
      }
    }

    // 2. Automatically register order in the shopkeeper's queue / backend EXACTLY ONCE
    if (!orderCreatedRef.current && documents.length > 0) {
      orderCreatedRef.current = true;
      setIsCreating(true);

      api.createOrder({
        id: tokenCode,
        customerName: initialCustomerName.trim() || 'Counter Customer',
        customerPhone: initialCustomerPhone.trim() || 'Counter Pickup',
        customerEmail: initialCustomerEmail.trim() || undefined,
        documents,
        paymentMethod: 'cash',
        separator: 'None',
      })
        .then((res) => {
          if (res?.order) {
            setCreatedOrder(res.order);
            onOrderCompleted?.(res.order);
          }
        })
        .catch((err) => {
          console.warn('Order recorded in local mode:', err);
        })
        .finally(() => {
          setIsCreating(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(tokenCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      // fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handlePrintAnother = () => {
    if (onPrintAnother) {
      onPrintAnother();
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pt-1 sm:pt-2">
      {/* Top subtle back to configure button (optional convenience) */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onBackToConfigure || onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-[#0b162d]/80 hover:bg-[#122347] border border-blue-900/40 px-3 py-1.5 rounded-xl transition active:scale-95"
          aria-label="Back to Configure"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-300" />
          <span>Back to Configure</span>
        </button>

        <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
          Step 3 of 3: Confirmed
        </span>
      </div>

      {/* Main Clean White Card Matching The User's Reference Image */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-9 shadow-2xl border border-gray-100/90 text-center text-gray-900 transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Soft Green Checkmark Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#ecfdf5] border-4 border-[#d1fae5] flex items-center justify-center shadow-xs">
          <Check className="w-8 h-8 sm:w-10 sm:h-10 text-[#10b981] stroke-[3]" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-[28px] font-extrabold text-[#111827] tracking-tight mt-5">
          Order Sent Successfully!
        </h2>

        {/* Paragraph */}
        <div className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed mt-2.5 max-w-md mx-auto">
          Your print order is ready. Please show your token at the counter.
        </div>

        {/* Dashed Border Box with YOUR PRINT TOKEN */}
        <div className="mt-6 border-2 border-dashed border-gray-300 rounded-2xl p-5 sm:p-6 bg-[#fafafa] text-center relative">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 block">
            YOUR PRINT TOKEN
          </span>

          <div className="mt-2 flex items-center justify-center gap-2.5">
            <span className="font-mono font-black text-3xl sm:text-4xl text-[#3b82f6] tracking-wider select-all">
              {tokenCode}
            </span>

            <button
              type="button"
              onClick={handleCopyToken}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition active:scale-95"
              title="Copy Token"
            >
              {copied ? (
                <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          {copied && (
            <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-block animate-in fade-in">
              Token copied to clipboard!
            </span>
          )}
        </div>

        {/* Live Shopkeeper Acceptance Status Banner (shown only when order is accepted) */}
        {isAccepted && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center gap-2 font-black text-sm sm:text-base text-emerald-700">
              <Check className="w-5 h-5 text-emerald-600 stroke-[3] animate-bounce" />
              <span>ऑर्डर स्वीकार कर लिया गया! (Order Accepted)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-emerald-600 mt-1">
              हाथों-हाथ होम पेज पर ले जाया जा रहा है... (Returning to Home Page...)
            </p>
          </div>
        )}

        {/* Dark Action Button: Print Another Document */}
        <button
          type="button"
          onClick={handlePrintAnother}
          className="mt-6 w-full max-w-sm mx-auto py-3.5 px-6 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] active:scale-[0.98] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-black/15 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          <span>Print Another Document</span>
        </button>
      </div>
    </div>
  );
};
