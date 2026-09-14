import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Printer as PrinterType } from '../../types';
import { api } from '../../services/api';
import { Printer, Wifi, RefreshCw, CheckCircle2, AlertTriangle, Play, Settings } from 'lucide-react';

export const AdminPrintersPage: React.FC = () => {
  const { printers, refreshData, addToast } = useApp();
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTestPrint = async (printerId: string) => {
    try {
      setTestingId(printerId);
      await api.testPrint(printerId);
      addToast('success', 'Test Page Sent', 'Hardware test sheet spooled.');
      refreshData();
    } catch (err: any) {
      addToast('error', 'Test Print Failed', err?.message || 'Check printer connection');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <AdminLayout pageTitle="Printers">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Hardware Printers Setup
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage shop printing hardware (HP Smart Tank 525, Epson L8050) & IP bindings
            </p>
          </div>

          <button
            onClick={() => refreshData()}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition shadow-sm self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll Hardware</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {printers.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Printer className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500">{p.model}</p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    p.status === 'Printing'
                      ? 'bg-purple-100 text-purple-800 animate-pulse'
                      : p.status === 'Online' || p.status === 'Idle'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {p.status}
                </span>
              </div>

              {/* Hardware specifications */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Local IP / Network Address:</span>
                  <span className="font-mono font-bold text-slate-900">{p.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supported Media:</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {p.supportedSizes.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pages Printed Today:</span>
                  <span className="font-mono font-bold text-amber-800">
                    {p.pagesPrintedToday} sheets
                  </span>
                </div>
              </div>

              {/* Ink & Paper Gauges */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>CMYK Ink Level:</span>
                    <span className="font-bold text-slate-900">{p.inkLevel}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${p.inkLevel}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Paper Cassette / Tray:</span>
                    <span className="font-bold text-slate-900">{p.paperLevel}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${p.paperLevel}%` }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  Queue: {p.queueCount} jobs waiting
                </span>

                <button
                  type="button"
                  disabled={testingId === p.id}
                  onClick={() => handleTestPrint(p.id)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{testingId === p.id ? 'Printing...' : 'Send Test Page'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};
