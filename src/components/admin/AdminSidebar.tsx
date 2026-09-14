import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ClipboardList,
  Printer,
  DollarSign,
  Tag,
  Wrench,
  Users,
  CreditCard,
  FileCheck2,
  HardDrive,
  MessageSquare,
  UserCog,
  Store,
  QrCode,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentPath, navigate, logoutAdmin } = useApp();

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { label: 'Live Print', path: '/admin/live-print', icon: Printer },
    { label: 'Pricing', path: '/admin/pricing', icon: DollarSign },
    { label: 'Discounts', path: '/admin/discounts', icon: Tag },
    { label: 'Printers', path: '/admin/printers', icon: Wrench },
    { label: 'Services', path: '/admin/services', icon: FileCheck2 },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Invoices', path: '/admin/invoices', icon: FileCheck2 },
    { label: 'Storage', path: '/admin/storage', icon: HardDrive },
    { label: 'WhatsApp Setup', path: '/admin/whatsapp', icon: MessageSquare },
    { label: 'Employees', path: '/admin/employees', icon: UserCog },
    { label: 'Business Setup', path: '/admin/business', icon: Store },
    { label: 'Shop QR', path: '/admin/qr', icon: QrCode },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div
            onClick={() => handleNavigate('/admin/dashboard')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shrink-0 shadow">
              <Printer className="w-5 h-5 stroke-[2.5]" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-extrabold text-sm text-white tracking-tight block truncate">
                  SONU PRINTER
                </span>
                <span className="text-[10px] text-amber-400 font-semibold tracking-wide uppercase block truncate">
                  Admin Management
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800 shrink-0 space-y-1">
          {/* Customer Portal Link */}
          <button
            onClick={() => handleNavigate('/print')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
            title="Customer View (/print)"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Open Customer Portal</span>}
          </button>

          {/* Logout */}
          <button
            onClick={logoutAdmin}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
