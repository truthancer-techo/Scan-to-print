import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { HardDrive, Trash2, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export const AdminStoragePage: React.FC = () => {
  const { addToast } = useApp();
  const [retentionDays, setRetentionDays] = useState<number>(7);
  const [autoPurgeEnabled, setAutoPurgeEnabled] = useState<boolean>(true);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  const handleManualPurge = () => {
    setIsPurging(true);
    setTimeout(() => {
      setIsPurging(false);
      addToast('success', 'Storage Purged', 'Temporary customer print documents older than retention window removed.');
    }, 1000);
  };

  return (
    <AdminLayout pageTitle="Storage">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Document Storage & Privacy
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated file purging to protect citizen documents and manage disk usage
          </p>
        </div>

        {/* Meter Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <HardDrive className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Current Spooler Storage</h3>
                <p className="text-xs text-slate-500">142.4 MB of 10.0 GB utilized</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Optimal (1.4%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full w-[1.4%]" />
          </div>
        </div>

        {/* Retention Policy Setting */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 text-xs">
          <h3 className="font-extrabold text-base text-slate-900">Confidentiality & Auto-Purge Policy</h3>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-amber-950">
              <span className="font-bold block">100% Confidentiality Guarantee</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Government documents, Aadhaar cards, and marksheets uploaded for printing are strictly kept private and auto-purged following shop policy.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Auto-Purge Window</label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-bold"
              >
                <option value={1}>1 Day (Urgent delete)</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (Recommended for pickup)</option>
                <option value={15}>15 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Purge Schedule Status</label>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="autopurge"
                  checked={autoPurgeEnabled}
                  onChange={(e) => setAutoPurgeEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="autopurge" className="font-bold text-slate-800 cursor-pointer">
                  Enable Daily 12:00 AM Cron Cleanup
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-slate-500 text-[11px]">
              Files older than {retentionDays} days are irreversibly unlinked from storage.
            </p>

            <button
              type="button"
              disabled={isPurging}
              onClick={handleManualPurge}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isPurging ? 'Purging...' : 'Purge Old Files Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
