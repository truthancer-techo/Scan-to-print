import React, { useEffect } from 'react';
import { Order } from '../../types';
import { CheckCircle2, ArrowRight, Printer, Phone, MapPin, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';

interface OrderConfirmationProps {
  order: Order;
  onTrackOrder: () => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  order,
  onTrackOrder,
}) => {
  const { business } = useApp();

  useEffect(() => {
    // Launch celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto bg-[#0b162d] rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-900/50 text-center space-y-6 text-white">
      {/* Animated Success Badge */}
      <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 border-4 border-emerald-500/20 flex items-center justify-center shadow-inner">
        <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
      </div>

      <div>
        <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
          ✓ Order Confirmed
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white mt-2.5">
          Thank you, {order.customerName}!
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Your print order has been received and queued for printing.
        </p>
      </div>

      {/* Order Info Card */}
      <div className="bg-[#070e1c] rounded-2xl p-5 border border-blue-950 text-left space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Order ID</span>
            <div className="font-black font-mono text-xl text-orange-400">{order.id}</div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Total Amount</span>
            <div className="font-black font-mono text-xl text-white">
              ₹{order.totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
          <div>
            <span className="text-slate-400">Payment Status:</span>
            <div className="font-bold text-white mt-0.5">
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-orange-400 border border-orange-500/30'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>
          <div>
            <span className="text-slate-400">Print Status:</span>
            <div className="font-bold text-white mt-0.5">{order.orderStatus}</div>
          </div>
          <div>
            <span className="text-slate-400">Documents:</span>
            <div className="font-bold text-white mt-0.5">
              {order.documents.length} item(s)
            </div>
          </div>
          <div>
            <span className="text-slate-400">Pickup Location:</span>
            <div className="font-bold text-white mt-0.5 truncate">
              {business?.landmark || 'Print Shop Counter'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={onTrackOrder}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-sm rounded-full shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 active:scale-95"
        >
          <span>Track Live Order Progress</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <a
          href={`https://wa.me/91${business?.whatsappNumber?.replace(/\D/g, '').slice(-10)}?text=Hi,%20I%20have%20placed%20print%20order%20${order.id}%20for%20pickup.`}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 px-4 bg-[#112347] hover:bg-[#162c5a] text-emerald-400 font-bold text-xs rounded-full border border-blue-800/40 transition flex items-center justify-center gap-2 active:scale-95"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Notify on WhatsApp</span>
        </a>
      </div>

      {/* Footer helper */}
      <p className="text-[11px] text-slate-400">
        🔒 Secure & Private — Your documents are automatically deleted after order completion.
      </p>
    </div>
  );
};
