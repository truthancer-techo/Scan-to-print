import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PricingRule } from '../../types';
import { api } from '../../services/api';
import { DollarSign, Save, RotateCcw, CheckCircle2, ShieldCheck } from 'lucide-react';

export const AdminPricingPage: React.FC = () => {
  const { pricing, refreshData, addToast } = useApp();

  const [rules, setRules] = useState<PricingRule[]>(pricing);
  const [glossySurcharge, setGlossySurcharge] = useState<number>(4.0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleRateChange = (id: string, newRate: number) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ratePerPage: Math.max(0, newRate) } : r))
    );
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await api.updatePricing(rules);
      await refreshData();
      setIsSaving(false);
      addToast('success', 'Pricing Saved', 'New rates are immediately live across the shop portal.');
    } catch (err: any) {
      setIsSaving(false);
      addToast('error', 'Save Failed', err?.message || 'Could not update pricing');
    }
  };

  const handleResetDefaults = () => {
    setRules([
      { id: 'p1', paperSize: 'A4', colorMode: 'B&W', printStyle: 'Single Sided', ratePerPage: 3.0 },
      { id: 'p2', paperSize: 'A4', colorMode: 'B&W', printStyle: 'Back-to-Back', ratePerPage: 2.5 },
      { id: 'p3', paperSize: 'A4', colorMode: 'Colour', printStyle: 'Single Sided', ratePerPage: 8.0 },
      { id: 'p4', paperSize: 'A4', colorMode: 'Colour', printStyle: 'Back-to-Back', ratePerPage: 7.0 },
      { id: 'p5', paperSize: 'A3', colorMode: 'B&W', printStyle: 'Single Sided', ratePerPage: 8.0 },
      { id: 'p6', paperSize: 'A3', colorMode: 'B&W', printStyle: 'Back-to-Back', ratePerPage: 7.0 },
      { id: 'p7', paperSize: 'A3', colorMode: 'Colour', printStyle: 'Single Sided', ratePerPage: 20.0 },
      { id: 'p8', paperSize: 'A3', colorMode: 'Colour', printStyle: 'Back-to-Back', ratePerPage: 18.0 },
    ]);
    addToast('info', 'Defaults Loaded', 'Click "Save Rates" to apply defaults.');
  };

  return (
    <AdminLayout pageTitle="Pricing">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Print Pricing Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set per-page customer print rates. Rates update live on the customer calculation engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Rates Live'}</span>
            </button>
          </div>
        </div>

        {/* Pricing Matrix Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <span className="font-extrabold text-sm text-slate-900">Standard Paper Pricing</span>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Active in Merta City
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Paper Size</th>
                  <th className="px-6 py-3">Color Mode</th>
                  <th className="px-6 py-3">Print Style</th>
                  <th className="px-6 py-3 text-right">Rate per Page (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{rule.paperSize}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                          rule.colorMode === 'Colour'
                            ? 'bg-pink-50 text-pink-700 border border-pink-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rule.colorMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{rule.printStyle}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={rule.ratePerPage}
                          onChange={(e) =>
                            handleRateChange(rule.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-24 px-2.5 py-1.5 border border-slate-300 rounded-xl text-right font-mono font-extrabold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paper Surcharges Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">Specialty Paper Surcharges</h3>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <p className="font-bold text-slate-900 text-xs">Glossy Photo Paper Add-on</p>
              <p className="text-[11px] text-slate-500">
                Applied per sheet when customer selects Glossy Paper for certificates or high-res photos
              </p>
            </div>
            <div className="inline-flex items-center gap-1">
              <span className="text-slate-400 font-bold text-xs">+₹</span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={glossySurcharge}
                onChange={(e) => setGlossySurcharge(parseFloat(e.target.value) || 0)}
                className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-xl text-right font-mono font-bold text-xs bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
