import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderTrackingView } from '../../components/customer/OrderTrackingView';
import { Search, Package, Phone, ArrowRight, Clock, FileText, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

export const CustomerTrackPage: React.FC = () => {
  const { navigate } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [recentSearchResults, setRecentSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setSearchError(null);
    setIsSearching(true);

    try {
      // First attempt direct order ID lookup (e.g. 4-char token like 8K2P or ORD-0001)
      try {
        const order = await api.getOrder(q.toUpperCase());
        if (order?.id) {
          setActiveOrderId(order.id);
          return;
        }
      } catch {
        // Fall through to query-based search
      }

      // Search by phone or partial
      const res = await api.getOrders({ search: q });
      if (res.orders.length === 1) {
        setActiveOrderId(res.orders[0].id);
      } else if (res.orders.length > 1) {
        setRecentSearchResults(res.orders);
      } else {
        setSearchError(`No orders found matching "${q}".`);
      }
    } catch (err: any) {
      setSearchError('Could not find order. Please verify your Order ID or phone number.');
    } finally {
      setIsSearching(false);
    }
  };

  if (activeOrderId) {
    return (
      <div className="space-y-4 px-4 pt-4">
        <button
          onClick={() => setActiveOrderId(null)}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          ← Search another order
        </button>
        <OrderTrackingView orderId={activeOrderId} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-4 px-4 pb-16">
      <div>
        <button
          onClick={() => navigate('/print')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b162d] text-slate-300 hover:text-white border border-blue-900/50 text-xs font-bold transition active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
          <span>Back to Print Portal</span>
        </button>
      </div>

      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-md">
          <Package className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Track Your Print Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter your Order ID (e.g. <strong className="font-mono text-orange-400">ORD-0001</strong>)
          or 10-digit mobile number to see live status.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              required
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. ORD-0001 or 9829012345"
              className="w-full pl-11 pr-4 py-3.5 text-sm border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 font-medium"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          {searchError && (
            <p className="text-xs text-rose-600 font-semibold px-1">{searchError}</p>
          )}

          <button
            type="submit"
            disabled={isSearching}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSearching ? (
              <span>Checking live print queue...</span>
            ) : (
              <>
                <span>Check Order Status</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Multiple Matches Results */}
        {recentSearchResults.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">Orders found for your search:</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {recentSearchResults.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setActiveOrderId(ord.id)}
                  className="p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl cursor-pointer flex items-center justify-between text-xs transition"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-900">{ord.id}</span>
                    <p className="text-slate-500 text-[11px]">
                      {ord.customerName} • {ord.documents?.length || 0} doc(s) • ₹{(ord.totalAmount ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-full text-[10px]">
                    {ord.orderStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Helper Links */}
      <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
        <div>
          <p className="font-bold">Need a new print right now?</p>
          <p className="text-[11px] text-amber-700">Upload your PDF or photo in seconds.</p>
        </div>
        <button
          onClick={() => navigate('/print')}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm"
        >
          Print Portal
        </button>
      </div>
    </div>
  );
};
