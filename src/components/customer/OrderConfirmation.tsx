import React, { useEffect, useState } from 'react';
import { Order } from '../../types';
import { Check, Copy, Home, ArrowRight, Phone, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';

interface OrderConfirmationProps {
  order: Order;
  onTrackOrder: () => void;
  onNewOrder?: () => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  order,
  onTrackOrder,
  onNewOrder,
}) => {
  const { business } = useApp();
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.55 },
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pt-1 sm:pt-4 px-3 sm:px-0">
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

        {/* Description */}
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
              {order.id}
            </span>

            <button
              type="button"
              onClick={handleCopyCode}
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

        {/* Cash Payment Mode Alert Banner */}
        <div className="mt-5 bg-[#fef9c3] border border-[#fef08a] rounded-xl p-3.5 sm:p-4 text-center">
          <div className="text-xs sm:text-sm font-bold text-[#b45309]">
            ₹ Payment Mode: Cash.
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-[#b45309]/90 mt-0.5">
            Please pay directly at the counter to get your print.
          </div>
        </div>

        {/* Action Button: Print Another Document */}
        {onNewOrder && (
          <button
            type="button"
            onClick={onNewOrder}
            className="mt-6 w-full max-w-sm mx-auto py-3.5 px-6 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] active:scale-[0.98] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-black/15 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span>Print Another Document</span>
          </button>
        )}

        {/* Secondary options */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={onTrackOrder}
            className="text-blue-600 hover:text-blue-800 transition inline-flex items-center gap-1"
          >
            <span>Track Order Progress</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {business?.whatsappNumber && (
            <>
              <span className="text-gray-300">•</span>
              <a
                href={`https://wa.me/91${business.whatsappNumber.replace(/\D/g, '').slice(-10)}?text=Hi,%20I%20have%20placed%20print%20order%20${order.id}.`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:text-emerald-700 transition inline-flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span>WhatsApp Shop</span>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
