import React from 'react';
import { DocumentItem } from '../../types';
import { ArrowRight, ArrowLeft, Wallet, CreditCard } from 'lucide-react';

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
  nextLabel = 'Continue to Pay',
  onConfirmManualPay,
  onConfirmAndPay,
}) => {
  const totalPages = documents.reduce((acc, d) => acc + d.printablePages * d.copies, 0);
  const totalSheets = documents.reduce((acc, d) => acc + d.sheetsCount * d.copies, 0);

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

          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Payable
              </span>
              {discountAmount > 0 && (
                <span className="text-xs line-through text-slate-500 font-mono">
                  ₹{subtotal.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                ₹{totalAmount.toFixed(2)}
              </span>
              {discountTitle && (
                <span className="text-[10px] font-extrabold text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/30">
                  {discountTitle}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 font-medium truncate">
              {documents.length} doc{documents.length > 1 ? 's' : ''} • {totalPages} page{totalPages > 1 ? 's' : ''} • {totalSheets} sheet{totalSheets > 1 ? 's' : ''}
            </p>
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
              <span className="whitespace-nowrap">{nextLabel}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
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

