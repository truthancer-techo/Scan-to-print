import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { KpiCard } from '../../components/admin/KpiCard';
import { WeeklyOrdersChart } from '../../components/admin/WeeklyOrdersChart';
import { OrderStatusDonut } from '../../components/admin/OrderStatusDonut';
import { MonthlyRevenueChart } from '../../components/admin/MonthlyRevenueChart';
import { PrinterStatusWidget } from '../../components/admin/PrinterStatusWidget';
import { RecentOrdersTable } from '../../components/admin/RecentOrdersTable';
import { OrderDetailsModal } from '../../components/admin/OrderDetailsModal';
import { InvoiceModal } from '../../components/admin/InvoiceModal';
import { ManualOrderModal } from '../../components/admin/ManualOrderModal';
import { Order, Printer as PrinterType } from '../../types';
import { api } from '../../services/api';
import {
  DollarSign,
  ClipboardList,
  Clock,
  CheckCircle2,
  Plus,
  Printer,
  RefreshCw,
  Zap,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { stats, printers, refreshData, addToast, navigate } = useApp();

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDashboardOrders = async () => {
    try {
      const res = await api.getOrders({ limit: 8 });
      setRecentOrders(res.orders || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchDashboardOrders();
    const interval = setInterval(fetchDashboardOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    await fetchDashboardOrders();
    setIsRefreshing(false);
    addToast('info', 'Synced', 'Dashboard statistics and orders refreshed.');
  };

  const handleOneClickPrint = async (order: Order) => {
    try {
      const targetPrinter = printers[0]?.id || 'printer-1';
      const res = await api.oneClickPrint(order.id, targetPrinter, order.separator || 'None');
      addToast('success', 'Print Job Sent', `Order #${order.id} sent to ${printers[0]?.name || 'printer'}.`);
      fetchDashboardOrders();
    } catch (err: any) {
      addToast('error', 'Print Error', err?.message || 'Could not spool job');
    }
  };

  return (
    <AdminLayout pageTitle="Dashboard">
      <div className="space-y-6">
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Shop Overview & Live Spooler
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live orders, hardware printer telemetry, and revenue for Sonu Printer, Merta City
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => navigate('/admin/live-print')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl text-xs transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Live Spooler</span>
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Walk-in Order</span>
            </button>
          </div>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Today's Revenue"
            value={`₹${stats?.todayRevenue != null ? stats.todayRevenue.toFixed(2) : '0.00'}`}
            subtitle={`From ${stats ? stats.completedOrders : 0} completed orders`}
            icon={DollarSign}
            variant="amber"
            onClick={() => navigate('/admin/payments')}
          />
          <KpiCard
            title="Total Orders Processed"
            value={stats ? stats.totalOrders : 0}
            subtitle="Completed prints for your shop"
            icon={ClipboardList}
            variant="blue"
            onClick={() => navigate('/admin/orders')}
          />
          <KpiCard
            title="Pending Orders"
            value={stats ? stats.pendingOrders : 0}
            subtitle="Awaiting print action"
            icon={Clock}
            variant="purple"
            onClick={() => navigate('/admin/orders?status=Pending')}
          />
          <KpiCard
            title="Completed"
            value={stats ? stats.completedOrders : 0}
            subtitle="Orders printed & delivered"
            icon={CheckCircle2}
            variant="emerald"
            onClick={() => navigate('/admin/orders?status=Completed')}
          />
        </div>

        {/* Middle Charts: Weekly Chart + Status Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WeeklyOrdersChart data={stats?.weeklyStats || []} />
          </div>
          <div>
            <OrderStatusDonut statusCounts={stats?.statusCounts || {}} />
          </div>
        </div>

        {/* Monthly Revenue Chart + Printer Status Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyRevenueChart data={stats?.monthlyRevenue || []} />
          <PrinterStatusWidget printers={printers} />
        </div>

        {/* Recent Orders Table with One-Click Print */}
        <div>
          <RecentOrdersTable
            orders={recentOrders}
            onViewOrder={(ord) => setSelectedOrder(ord)}
            onOneClickPrint={handleOneClickPrint}
          />
        </div>
      </div>

      {/* Modals */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdated={(updated) => {
          setSelectedOrder(updated);
          fetchDashboardOrders();
        }}
        onOpenInvoice={(ord) => setInvoiceOrder(ord)}
      />

      <InvoiceModal
        order={invoiceOrder}
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />

      <ManualOrderModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onOrderCreated={(newOrd) => {
          fetchDashboardOrders();
          setSelectedOrder(newOrd);
        }}
      />
    </AdminLayout>
  );
};
