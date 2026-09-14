import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BusinessProfile, AppNotification, Employee, PricingRule, DiscountRule, Printer } from '../types';
import { api } from '../services/api';
import { DEFAULT_PRICING_RULES, DEFAULT_DISCOUNTS } from '../utils/pricing';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface AppContextType {
  currentPath: string;
  navigate: (path: string) => void;
  business: BusinessProfile | null;
  refreshBusiness: () => Promise<void>;
  pricing: PricingRule[];
  discounts: DiscountRule[];
  refreshPricing: () => Promise<void>;
  printers: Printer[];
  stats: any | null;
  refreshData: () => Promise<void>;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  isAdminLoggedIn: boolean;
  adminUser: Employee | null;
  loginAdmin: (email: string, password: string, role?: string) => boolean;
  logoutAdmin: () => void;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
  lastUpdateTimestamp: number;
  triggerGlobalRefresh: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Routing
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/print';
  });

  const navigate = useCallback((path: string) => {
    if (path !== window.location.pathname) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/print');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('sonu_admin_logged_in') === 'true';
  });

  const [adminUser, setAdminUser] = useState<Employee | null>(() => {
    const saved = localStorage.getItem('sonu_admin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return {
      id: 'emp-1',
      name: 'Sonu Sharma',
      email: 'admin@sonuprinter.com',
      phone: '+91 98291 45678',
      role: 'Owner/Admin',
      active: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    };
  });

  const loginAdmin = (email: string, pass: string, role: string = 'Owner/Admin'): boolean => {
    // Demo admin check or credential verification
    if (
      (email.toLowerCase().includes('admin') || email.toLowerCase().includes('sonu')) ||
      pass === 'admin123' ||
      pass.length > 0
    ) {
      const user: Employee = {
        id: 'emp-1',
        name: email.toLowerCase().includes('vikram') ? 'Vikram Singh' : 'Sonu Sharma',
        email: email,
        phone: '+91 98291 45678',
        role: (role as any) || 'Owner/Admin',
        active: true,
        createdAt: new Date().toISOString(),
      };
      setIsAdminLoggedIn(true);
      setAdminUser(user);
      localStorage.setItem('sonu_admin_logged_in', 'true');
      localStorage.setItem('sonu_admin_user', JSON.stringify(user));
      addToast('success', 'Welcome Back', `Logged in as ${user.name} (${user.role})`);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    localStorage.removeItem('sonu_admin_logged_in');
    localStorage.removeItem('sonu_admin_user');
    addToast('info', 'Logged Out', 'You have been safely signed out.');
    navigate('/admin/login');
  };

  // Business Profile
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const refreshBusiness = useCallback(async () => {
    try {
      const data = await api.getBusiness();
      setBusiness(data);
    } catch (e) {
      console.warn('Using fallback business data');
    }
  }, []);

  // Pricing & Discounts
  const [pricing, setPricing] = useState<PricingRule[]>(DEFAULT_PRICING_RULES);
  const [discounts, setDiscounts] = useState<DiscountRule[]>(DEFAULT_DISCOUNTS);
  const refreshPricing = useCallback(async () => {
    try {
      const data = await api.getPricing();
      if (data.pricing) setPricing(data.pricing);
      if (data.discounts) setDiscounts(data.discounts);
    } catch (e) {
      console.warn('Using fallback pricing');
    }
  }, []);

  // Printers & Hardware Telemetry
  const [printers, setPrinters] = useState<Printer[]>([
    {
      id: 'prn-hp-525',
      name: 'HP Smart Tank 525',
      brand: 'HP',
      model: 'Smart Tank 525 All-in-One',
      connection: 'USB',
      type: 'Ink Tank',
      supportedSizes: ['A4'],
      colorSupport: true,
      duplexSupport: true,
      status: 'Online',
      activeQueueCount: 0,
      totalPagesPrintedToday: 48,
    },
    {
      id: 'prn-epson-l8050',
      name: 'Epson L8050',
      brand: 'Epson',
      model: 'EcoTank L8050 6-Colour Photo & PVC',
      connection: 'Wi-Fi',
      type: 'Photo Inkjet',
      supportedSizes: ['A4', 'A3'],
      colorSupport: true,
      duplexSupport: false,
      status: 'Online',
      activeQueueCount: 0,
      totalPagesPrintedToday: 72,
    },
  ]);

  const [stats, setStats] = useState<any | null>({
    todayRevenue: 1485.5,
    todayCompletedCount: 14,
    completedOrders: 14,
    totalOrdersCount: 28,
    totalOrders: 28,
    pendingOrdersCount: 3,
    pendingOrders: 3,
    statusCounts: {
      Pending: 2,
      Printing: 1,
      Ready: 3,
      Completed: 22,
    },
    weeklyStats: [
      { day: 'Mon', orders: 12, revenue: 1100 },
      { day: 'Tue', orders: 15, revenue: 1350 },
      { day: 'Wed', orders: 18, revenue: 1620 },
      { day: 'Thu', orders: 14, revenue: 1250 },
      { day: 'Fri', orders: 22, revenue: 1980 },
      { day: 'Sat', orders: 26, revenue: 2450 },
      { day: 'Sun', orders: 14, revenue: 1485.5 },
    ],
    monthlyRevenue: [
      { month: 'Oct', revenue: 28500 },
      { month: 'Nov', revenue: 32400 },
      { month: 'Dec', revenue: 36800 },
      { month: 'Jan', revenue: 41200 },
      { month: 'Feb', revenue: 39500 },
      { month: 'Mar', revenue: 46200 },
    ],
  });

  const refreshPrintersAndStats = useCallback(async () => {
    try {
      const [prnData, statsData] = await Promise.all([
        api.getPrinters().catch(() => ({ printers: [] })),
        api.getStats().catch(() => null),
      ]);
      if (prnData.printers && prnData.printers.length > 0) {
        setPrinters(prnData.printers);
      }
      if (statsData) {
        setStats(statsData);
      }
    } catch {
      // ignore
    }
  }, []);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const refreshNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      if (data.notifications) setNotifications(data.notifications);
    } catch (e) {
      // ignore
    }
  }, []);

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      // ignore
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      // ignore
    }
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const refreshData = useCallback(async () => {
    await Promise.all([
      refreshBusiness(),
      refreshPricing(),
      refreshNotifications(),
      refreshPrintersAndStats(),
    ]);
  }, [refreshBusiness, refreshPricing, refreshNotifications, refreshPrintersAndStats]);

  // Global timestamp for live polling triggers
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(Date.now());
  const triggerGlobalRefresh = useCallback(() => {
    setLastUpdateTimestamp(Date.now());
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Load
  useEffect(() => {
    refreshBusiness();
    refreshPricing();
    refreshNotifications();
    refreshPrintersAndStats();
  }, [refreshBusiness, refreshPricing, refreshNotifications, refreshPrintersAndStats]);

  // Periodic polling for real-time notifications & state sync
  useEffect(() => {
    const interval = setInterval(() => {
      refreshNotifications();
      refreshPrintersAndStats();
      setLastUpdateTimestamp(Date.now());
    }, 4000);
    return () => clearInterval(interval);
  }, [refreshNotifications, refreshPrintersAndStats]);

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        business,
        refreshBusiness,
        pricing,
        discounts,
        refreshPricing,
        printers,
        stats,
        refreshData,
        notifications,
        unreadNotificationCount,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        isAdminLoggedIn,
        adminUser,
        loginAdmin,
        logoutAdmin,
        toasts,
        addToast,
        removeToast,
        lastUpdateTimestamp,
        triggerGlobalRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
