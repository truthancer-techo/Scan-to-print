import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Printer as PrinterType, Order } from '../../types';
import { api } from '../../services/api';
import {
  Printer,
  Wifi,
  Play,
  Pause,
  RotateCcw,
  StopCircle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  Clock,
  RefreshCw,
} from 'lucide-react';

export const AdminLivePrintPage: React.FC = () => {
  const { printers, refreshData, addToast } = useApp();

  const [activeJobs, setActiveJobs] = useState<Order[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>(printers[0]?.id || 'printer-1');
  const [isQueuePaused, setIsQueuePaused] = useState<boolean>(false);

  const fetchQueue = async () => {
    try {
      const res = await api.getOrders({ limit: 20 });
      // Filter orders that are currently printing or processing
      const queue = (res.orders || []).filter(
        (o) => o.orderStatus === 'Printing' || o.orderStatus === 'Processing'
      );
      setActiveJobs(queue);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchQueue();
    const timer = setInterval(fetchQueue, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleTestPrint = async (printerId: string) => {
    try {
      await api.testPrint(printerId);
      addToast('success', 'Test Page Spooled', 'Test calibration sheet sent to printer.');
      refreshData();
    } catch (err: any) {
      addToast('error', 'Test Print Failed', err?.message || 'Error printing test page');
    }
  };

  const handleCancelJob = async (orderId: string) => {
    try {
      await api.updateOrder(orderId, { orderStatus: 'Cancelled' });
      addToast('info', 'Job Cancelled', `Print job #${orderId} was removed from spooler.`);
      fetchQueue();
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Could not cancel job');
    }
  };

  const handleReprintJob = async (order: Order) => {
    try {
      await api.oneClickPrint(order.id, selectedPrinterId, order.separator || 'None');
      addToast('success', 'Job Re-spooled', `Order #${order.id} sent back to queue.`);
      fetchQueue();
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Could not reprint');
    }
  };

  const selectedPrinter = printers.find((p) => p.id === selectedPrinterId) || printers[0];

  return (
    <AdminLayout pageTitle="Live Print">
      <div className="space-y-6">
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Live Hardware Spooler & Print Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor active print jobs, hardware status, and paper trays in real-time
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQueuePaused(!isQueuePaused)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isQueuePaused
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
              }`}
            >
              {isQueuePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isQueuePaused ? 'Resume Spooler' : 'Pause All Queues'}</span>
            </button>

            <button
              onClick={() => handleTestPrint(selectedPrinterId)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl text-xs transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Hardware Test Page</span>
            </button>
          </div>
        </div>

        {/* Hardware Printers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {printers.map((p) => {
            const isSel = p.id === selectedPrinterId;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPrinterId(p.id)}
                className={`bg-white rounded-3xl p-6 border transition-all cursor-pointer shadow-sm ${
                  isSel
                    ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <Printer className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-500">{p.model} • {p.ipAddress}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      p.status === 'Printing'
                        ? 'bg-purple-100 text-purple-800 animate-pulse'
                        : p.status === 'Online' || p.status === 'Idle'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {p.status}
                  </span>
                </div>

                {/* Gauges: Ink & Paper */}
                <div className="grid grid-cols-2 gap-4 pt-5 mt-4 border-t border-slate-100 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Ink Levels:</span>
                      <span className="font-bold text-slate-900">{p.inkLevel}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${p.inkLevel}%` }}
                        className={`h-full rounded-full ${
                          p.inkLevel > 20 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Paper Tray:</span>
                      <span className="font-bold text-slate-900">{p.paperLevel}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${p.paperLevel}%` }}
                        className={`h-full rounded-full ${
                          p.paperLevel > 25 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Queue count & today's sheets */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Queue: <strong className="text-slate-900">{p.queueCount} job(s)</strong>
                  </span>
                  <span>
                    Printed today: <strong className="text-slate-900">{p.pagesPrintedToday} sheets</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Print Queue List */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Active Print Queue ({activeJobs.length} jobs)
              </h3>
              <p className="text-xs text-slate-500">
                Automatic spooler simulation updates job status every few seconds
              </p>
            </div>
            <button
              onClick={fetchQueue}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition"
              title="Refresh Queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {activeJobs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              <Printer className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">Spooler is currently idle</p>
              <p className="mt-0.5">All customer orders have been completed and printed!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 space-y-1">
              {activeJobs.map((job) => {
                const totalPages = job.documents.reduce(
                  (a, d) => a + d.printablePages * d.copies,
                  0
                );

                return (
                  <div
                    key={job.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-slate-900">
                          {job.id}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          • {job.customerName}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800 animate-pulse">
                          {job.orderStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {job.documents[0]?.name || 'Document'} • {totalPages} pages total •{' '}
                        {job.documents[0]?.paperSize} {job.documents[0]?.colorMode}
                      </p>

                      {/* Simulated Print Progress Bar */}
                      <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-amber-500 rounded-full animate-pulse w-3/4" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleReprintJob(job)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reprint
                      </button>

                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1 border border-rose-200"
                      >
                        <StopCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
