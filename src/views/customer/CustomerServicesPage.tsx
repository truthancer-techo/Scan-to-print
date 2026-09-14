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
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
          Sonu Printer Services
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Offline Printing & E-Mitra Hub
        </h1>
        <p className="text-sm text-slate-600">
          Professional document solutions, government certificates, urgent photos, and high-speed photocopying near Meera Smarak, Merta City.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading services...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((srv) => {
            const IconComp = ICON_MAP[srv.iconName] || FileText;

            return (
              <div
                key={srv.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition duration-300">
                    <IconComp className="w-6 h-6 stroke-[2]" />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {srv.category}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Starting from</span>
                    <div className="text-base font-extrabold text-slate-900 font-mono">
                      ₹{srv.startingPrice}{' '}
                      <span className="text-[11px] font-normal text-slate-500">/{srv.unit}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/print')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-amber-500 text-slate-800 hover:text-slate-950 font-bold text-xs rounded-xl transition"
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
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4" /> Trusted Service in Merta City
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold">Need Government E-Mitra Assistance?</h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Visit our shop near Meera Smarak for quick Jan Aadhaar, domicile certificate, exam forms, and pension verifications.
          </p>
        </div>

        <button
          onClick={() => navigate('/contact')}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-xl shrink-0 transition"
        >
          View Shop Location & Contact
        </button>
      </div>
    </div>
  );
};
