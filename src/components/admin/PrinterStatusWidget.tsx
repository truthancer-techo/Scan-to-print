import React from 'react';
import { Printer as PrinterType } from '../../types';
import { Printer as PrinterIcon, Wifi, WifiOff, AlertTriangle, Play, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PrinterStatusWidgetProps {
  printers: PrinterType[];
  onSelectPrinter?: (printer: PrinterType) => void;
}

export const PrinterStatusWidget: React.FC<PrinterStatusWidgetProps> = ({
  printers,
  onSelectPrinter,
}) => {
  const { navigate } = useApp();

  const getStatusBadge = (status: PrinterType['status']) => {
    switch (status) {
      case 'Online':
      case 'Idle':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Online / Idle
          </span>
        );
      case 'Printing':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Printing Now
          </span>
        );
      case 'Error':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Error / Check Paper
          </span>
        );
      case 'Offline':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            <WifiOff className="w-3 h-3" />
            Offline
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PrinterIcon className="w-5 h-5 text-amber-600" />
          <h3 className="font-extrabold text-base text-slate-900">Live Hardware Printers</h3>
        </div>
        <button
          onClick={() => navigate('/admin/live-print')}
          className="text-xs font-bold text-amber-700 hover:text-amber-800 transition"
        >
          View Live Spooler →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {printers.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectPrinter && onSelectPrinter(p)}
            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{p.name}</h4>
                <p className="text-[11px] text-slate-500">{p.model} • {p.ipAddress}</p>
              </div>
              {getStatusBadge(p.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block">Queue Count:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {p.queueCount} job{p.queueCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Printed Today:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {p.pagesPrintedToday} pages
                </span>
              </div>
            </div>

            {/* Ink & Paper status pills */}
            <div className="flex items-center gap-2 text-[10px] text-slate-600 pt-1">
              <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                Ink: {p.inkLevel}%
              </span>
              <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                Tray: {p.paperLevel}%
              </span>
              <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium capitalize">
                {p.supportedSizes.join(', ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
