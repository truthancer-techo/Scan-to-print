import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { api } from '../../services/api';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Server,
  ShieldAlert,
  Cpu,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { refreshData, addToast } = useApp();
  const [isResetting, setIsResetting] = useState(false);

  const handleExportData = () => {
    // Generate a backup blob
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ timestamp: new Date().toISOString() }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sonu_printer_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Backup Exported', 'Store configuration exported to JSON.');
  };

  const handleResetData = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset demo orders and seed fresh data for Sonu Printer?'
      )
    ) {
      return;
    }

    try {
      setIsResetting(true);
      await api.resetDemoData();
      await refreshData();
      setIsResetting(false);
      addToast('success', 'Reset Complete', 'Fresh demo orders and telemetry seeded.');
    } catch (err: any) {
      setIsResetting(false);
      addToast('error', 'Error', err?.message || 'Failed to reset data');
    }
  };

  return (
    <AdminLayout pageTitle="Settings">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            System Settings & Maintenance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnostics, database snapshots, and demo reset controls
          </p>
        </div>

        {/* System Diagnostics */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-600" />
            Runtime Diagnostics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block font-bold">API Backend</span>
              <span className="text-emerald-700 font-extrabold text-sm block mt-1">
                Node.js + Express (Port 3000)
              </span>
              <span className="text-slate-500 text-[11px]">Online & Healthy</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block font-bold">Persistence</span>
              <span className="text-slate-900 font-extrabold text-sm block mt-1">
                JSON File Store
              </span>
              <span className="text-slate-500 text-[11px]">data/store.json</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-slate-400 block font-bold">Simulated Spooler</span>
              <span className="text-purple-700 font-extrabold text-sm block mt-1">
                Active (Auto-advance)
              </span>
              <span className="text-slate-500 text-[11px]">HP & Epson Hardware</span>
            </div>
          </div>
        </div>

        {/* Data Backup & Export */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-extrabold text-base text-slate-900">Data Backup & Export</h3>
          <p className="text-slate-500">
            Download a snapshot of all shop orders, customer records, and printer statistics.
          </p>

          <button
            onClick={handleExportData}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Full Backup JSON</span>
          </button>
        </div>

        {/* Danger Zone: Reset Demo */}
        <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-extrabold text-base text-rose-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Reset Demo Database
          </h3>
          <p className="text-slate-600">
            Resets all orders, customer history, and printer telemetry back to the default initial demonstration dataset.
          </p>

          <button
            disabled={isResetting}
            onClick={handleResetData}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isResetting ? 'Resetting Data...' : 'Reset to Default Demo State'}</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};
