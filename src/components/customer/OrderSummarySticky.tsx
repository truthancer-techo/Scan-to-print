import React from 'react';
import { DocumentItem } from '../../types';
import { ArrowRight, ArrowLeft, Wallet, CreditCard, Check } from 'lucide-react';

interface OrderSummaryStickyProps {
  documents: DocumentItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  discountTitle?: string;
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  onConfirmManualPay?: () => void;
  onConfirmAndPay?: () => void;
}

export const OrderSummarySticky: React.FC<OrderSummaryStickyProps> = ({
  documents,
  subtotal,
  discountAmount,
  totalAmount,
  discountTitle,
  onBack,
  backLabel = 'Back',
  onNext,
  nextLabel = 'Continue to print',
  onConfirmManualPay,
  onConfirmAndPay,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#070e1c]/95 backdrop-blur-lg border-t border-blue-950/80 shadow-[0_-8px_25px_rgba(0,0,0,0.7)] p-3 sm:p-4 transition-all text-white">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Price & Summary Info */}
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex sm:hidden items-center justify-center gap-1 px-3 py-2.5 bg-[#112347] hover:bg-[#162c5a] text-slate-200 border border-blue-800/40 rounded-xl font-bold text-xs transition active:scale-95 shrink-0"
              aria-label="Go back to previous step"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-300" />
              <span>{backLabel}</span>
            </button>
          )}

          {/* Ready to print status indicator (replacing Total Payable box) */}
          <div className="flex items-center gap-2.5 py-1 px-1">
            <div className="w-5 h-5 rounded-full bg-[#00c58e] text-[#051124] flex items-center justify-center shrink-0 shadow-sm">
              <Check className="w-3.5 h-3.5 stroke-[3.5]" />
            </div>
            <span className="text-[15px] sm:text-base font-semibold text-[#8ca8d1] tracking-wide select-none whitespace-nowrap">
              Ready to print
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-[#112347] hover:bg-[#162c5a] text-slate-200 border border-blue-800/40 rounded-full font-bold text-xs sm:text-sm shadow-sm transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              <span>{backLabel}</span>
            </button>
          )}

          {onNext ? (
            <button
              type="button"
              onClick={onNext}
              className="flex-1 sm:flex-initial min-h-[46px] sm:min-h-[48px] flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-[0.98] text-white rounded-full font-black text-sm sm:text-base shadow-lg shadow-orange-500/25 transition-all tracking-wide"
            >
              <span className="whitespace-nowrap">{nextLabel.replace(/→/g, '').trim()}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.8]" />
            </button>
          ) : (
            <>
              {onConfirmManualPay && (
                <button
                  type="button"
                  onClick={onConfirmManualPay}
                  className="flex-1 sm:flex-initial min-h-[46px] sm:min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 bg-[#112347] hover:bg-[#162c5a] text-slate-200 border border-blue-800/40 rounded-full font-bold text-xs sm:text-sm shadow-sm transition active:scale-[0.98]"
                  title="Pay with cash or UPI at counter"
                >
                  <Wallet className="w-4 h-4 text-orange-400" />
                  <span className="whitespace-nowrap">Manual Pay</span>
                </button>
              )}

              {onConfirmAndPay && (
                <button
                  type="button"
                  onClick={onConfirmAndPay}
                  className="flex-1 sm:flex-initial min-h-[46px] sm:min-h-[48px] flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-[0.98] text-white rounded-full font-black text-sm sm:text-base shadow-lg shadow-orange-500/25 transition-all tracking-wide"
                >
                  <CreditCard className="w-4 h-4 stroke-[2.5]" />
                  <span className="whitespace-nowrap">Confirm & Pay</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

