import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ServiceItem } from '../../types';
import {
  FileText,
  Copy,
  Printer,
  Camera,
  CreditCard,
  Layers,
  FileCode,
  Send,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  FileText,
  Copy,
  Printer,
  Camera,
  CreditCard,
  Layers,
  FileCode,
  Send,
};

export const CustomerServicesPage: React.FC = () => {
  const { navigate } = useApp();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getServices()
      .then((data) => setServices(data.services || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', 'Printing', 'E-Mitra', 'Cards & Photos', 'Online Services'];

  const filtered = services.filter(
    (s) => s.active && (selectedCategory === 'All' || s.category === selectedCategory)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 px-4 pt-4 text-white">
      <div>
        <button
          onClick={() => navigate('/print')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b162d] text-slate-300 hover:text-white border border-blue-900/50 text-xs font-bold transition active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
          <span>Back to Print Portal</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-400 bg-orange-500/15 px-3.5 py-1 rounded-full border border-orange-500/30">
          Sonu Printer Services
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Offline Printing & E-Mitra Hub
        </h1>
        <p className="text-sm text-slate-400">
          Professional document solutions, government certificates, urgent photos, and high-speed photocopying near Meera Smarak, Merta City.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-[#0b162d] hover:bg-[#112347] text-slate-300 border border-blue-900/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading services...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((srv) => {
            const IconComp = ICON_MAP[srv.iconName] || FileText;

            return (
              <div
                key={srv.id}
                className="bg-[#0b162d] rounded-3xl p-6 border border-blue-900/50 hover:border-orange-500/50 shadow-xl transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#122347] to-[#070e1c] border border-blue-800/60 text-orange-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-orange-500/50 transition duration-300 shadow-md">
                    <IconComp className="w-6 h-6 stroke-[2]" />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                    {srv.category}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-blue-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Starting from</span>
                    <div className="text-base font-extrabold text-orange-400 font-mono">
                      ₹{srv.startingPrice}{' '}
                      <span className="text-[11px] font-normal text-slate-400">/{srv.unit}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/print')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#112347] hover:bg-orange-500 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-blue-800/40 transition active:scale-95 shadow-sm"
                  >
                    <span>Print Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trust Guarantee Card */}
      <div className="bg-[#0b162d] border border-blue-900/50 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs text-orange-400 font-bold">
            <ShieldCheck className="w-4 h-4" /> Trusted Service in Merta City
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">Need Government E-Mitra Assistance?</h3>
          <p className="text-xs text-slate-400 max-w-lg">
            Aadhaar, Jan Aadhaar, Domicile, Caste certificate, Police verification, Land records, and online application filing at counter rates.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/contact')}
            className="px-5 py-3 bg-[#112347] hover:bg-[#162c5a] text-slate-200 hover:text-white border border-blue-800/40 font-bold text-xs rounded-xl transition"
          >
            Visit Counter
          </button>
          <button
            onClick={() => navigate('/print')}
            className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/25 transition active:scale-95"
          >
            Send Print
          </button>
        </div>
      </div>
    </div>
  );
};
