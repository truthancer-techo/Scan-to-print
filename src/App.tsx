import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/common/ToastContainer';

// Customer Views
import { CustomerPrintPortal } from './views/customer/CustomerPrintPortal';
import { CustomerTrackPage } from './views/customer/CustomerTrackPage';
import { CustomerServicesPage } from './views/customer/CustomerServicesPage';
import { CustomerContactPage } from './views/customer/CustomerContactPage';

// Admin Views
import { AdminLoginPage } from './views/admin/AdminLoginPage';
import { AdminDashboardPage } from './views/admin/AdminDashboardPage';
import { AdminOrdersPage } from './views/admin/AdminOrdersPage';
import { AdminLivePrintPage } from './views/admin/AdminLivePrintPage';
import { AdminPricingPage } from './views/admin/AdminPricingPage';
import { AdminDiscountsPage } from './views/admin/AdminDiscountsPage';
import { AdminPrintersPage } from './views/admin/AdminPrintersPage';
import { AdminServicesPage } from './views/admin/AdminServicesPage';
import { AdminCustomersPage } from './views/admin/AdminCustomersPage';
import { AdminPaymentsPage } from './views/admin/AdminPaymentsPage';
import { AdminInvoicesPage } from './views/admin/AdminInvoicesPage';
import { AdminStoragePage } from './views/admin/AdminStoragePage';
import { AdminWhatsAppPage } from './views/admin/AdminWhatsAppPage';
import { AdminEmployeesPage } from './views/admin/AdminEmployeesPage';
import { AdminBusinessPage } from './views/admin/AdminBusinessPage';
import { AdminShopQrPage } from './views/admin/AdminShopQrPage';
import { AdminSettingsPage } from './views/admin/AdminSettingsPage';

const AppRouter: React.FC = () => {
  const { currentPath, isAdminLoggedIn } = useApp();

  // Normalize path without trailing slash or query params
  const cleanPath = currentPath.split('?')[0].replace(/\/$/, '') || '/';

  // Admin Route Protection
  if (cleanPath.startsWith('/admin') && cleanPath !== '/admin/login') {
    if (!isAdminLoggedIn) {
      return <AdminLoginPage />;
    }
  }

  // Admin routes mapping
  switch (cleanPath) {
    case '/admin/login':
      return <AdminLoginPage />;
    case '/admin':
    case '/admin/dashboard':
      return <AdminDashboardPage />;
    case '/admin/orders':
      return <AdminOrdersPage />;
    case '/admin/live-print':
      return <AdminLivePrintPage />;
    case '/admin/pricing':
      return <AdminPricingPage />;
    case '/admin/discounts':
      return <AdminDiscountsPage />;
    case '/admin/printers':
      return <AdminPrintersPage />;
    case '/admin/services':
      return <AdminServicesPage />;
    case '/admin/customers':
      return <AdminCustomersPage />;
    case '/admin/payments':
      return <AdminPaymentsPage />;
    case '/admin/invoices':
      return <AdminInvoicesPage />;
    case '/admin/storage':
      return <AdminStoragePage />;
    case '/admin/whatsapp':
      return <AdminWhatsAppPage />;
    case '/admin/employees':
      return <AdminEmployeesPage />;
    case '/admin/business':
      return <AdminBusinessPage />;
    case '/admin/qr':
      return <AdminShopQrPage />;
    case '/admin/settings':
      return <AdminSettingsPage />;

    // Customer routes mapping
    case '/':
    case '/print':
      return <CustomerPrintPortal />;
    case '/track':
      return <CustomerTrackPage />;
    case '/services':
      return <CustomerServicesPage />;
    case '/contact':
      return <CustomerContactPage />;

    default:
      // Fallback
      if (cleanPath.startsWith('/admin')) {
        return <AdminDashboardPage />;
      }
      return <CustomerPrintPortal />;
  }
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#060b17] text-slate-100 selection:bg-orange-500 selection:text-white">
        <AppRouter />
        <ToastContainer />
      </div>
    </AppProvider>
  );
}
