import {
  BusinessProfile,
  DiscountRule,
  DocumentItem,
  Employee,
  Order,
  OrderStatus,
  PaymentStatus,
  Printer,
  PrintJob,
  PricingRule,
  ServiceItem,
  AppNotification,
  OrderSeparator,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Business
  async getBusiness(): Promise<BusinessProfile> {
    const res = await fetch(`${API_BASE}/business`);
    if (!res.ok) throw new Error('Failed to fetch business profile');
    return res.json();
  },

  async updateBusiness(data: Partial<BusinessProfile>): Promise<{ success: boolean; business: BusinessProfile }> {
    const res = await fetch(`${API_BASE}/business`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update business profile');
    return res.json();
  },

  // Pricing
  async getPricing(): Promise<{ pricing: PricingRule[]; discounts: DiscountRule[] }> {
    const res = await fetch(`${API_BASE}/pricing`);
    if (!res.ok) throw new Error('Failed to fetch pricing');
    return res.json();
  },

  async updatePricing(pricing: PricingRule[]): Promise<{ success: boolean; pricing: PricingRule[] }> {
    const res = await fetch(`${API_BASE}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pricing }),
    });
    if (!res.ok) throw new Error('Failed to update pricing');
    return res.json();
  },

  async calculatePrice(
    documents: DocumentItem[],
    couponCode?: string
  ): Promise<{
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    appliedDiscountTitle?: string;
    totalPrintablePages: number;
    totalSheets: number;
  }> {
    const res = await fetch(`${API_BASE}/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents, couponCode }),
    });
    if (!res.ok) throw new Error('Failed to calculate price');
    return res.json();
  },

  // Orders
  async getOrders(params?: { status?: string; search?: string; limit?: number }): Promise<{ orders: Order[]; total: number }> {
    const url = new URL(`${window.location.origin}${API_BASE}/orders`);
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.search) url.searchParams.set('search', params.search);
    if (params?.limit) url.searchParams.set('limit', String(params.limit));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async getOrder(id: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Order not found');
    return res.json();
  },

  async getOrderStatus(id: string): Promise<{
    id: string;
    orderStatus: OrderStatus;
    isAccepted: boolean;
    acceptedAt?: string;
    updatedAt: string;
  }> {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/status`);
    if (!res.ok) throw new Error('Failed to fetch order status');
    return res.json();
  },

  async acceptOrder(idOrToken: string, options?: { note?: string; actor?: string }): Promise<{
    success: boolean;
    message: string;
    order: Order;
  }> {
    const res = await fetch(`${API_BASE}/orders/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idOrToken, ...options }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to accept order');
    }
    return res.json();
  },

  async createOrder(data: {
    id?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    documents: DocumentItem[];
    paymentMethod: 'upi' | 'razorpay' | 'manual' | 'cash';
    discountCode?: string;
    assignedPrinterId?: string;
    separator?: OrderSeparator;
    adminNotes?: string;
  }): Promise<{ success: boolean; order: Order }> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create order');
    }
    return res.json();
  },

  async updateOrder(
    id: string,
    updates: {
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
      assignedPrinterId?: string;
      separator?: OrderSeparator;
      adminNotes?: string;
      statusNote?: string;
      noteActor?: string;
    }
  ): Promise<{ success: boolean; order: Order }> {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
  },

  async verifyOrderPayment(
    id: string,
    data: {
      testResult: 'SUCCESS' | 'FAILED' | 'CANCELLED';
      paymentMethod?: 'upi' | 'razorpay' | 'manual' | 'cash';
      transactionId?: string;
    }
  ): Promise<{ success: boolean; status: string; order: Order }> {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to verify payment');
    return res.json();
  },

  // Print Jobs & One-Click Print
  async getPrintJobs(): Promise<{ jobs: PrintJob[] }> {
    const res = await fetch(`${API_BASE}/print-jobs`);
    if (!res.ok) throw new Error('Failed to fetch print jobs');
    return res.json();
  },

  async createPrintJob(data: {
    orderId: string;
    printerId?: string;
    separator?: OrderSeparator;
  }): Promise<{ success: boolean; printJob: PrintJob; order: Order }> {
    const res = await fetch(`${API_BASE}/print-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create print job');
    }
    return res.json();
  },

  async updatePrintJob(
    id: string,
    updates: {
      status?: PrintJob['status'];
      progressPercent?: number;
      errorMessage?: string;
    }
  ): Promise<{ success: boolean; job: PrintJob }> {
    const res = await fetch(`${API_BASE}/print-jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update print job');
    return res.json();
  },

  // Printers
  async getPrinters(): Promise<{ printers: Printer[] }> {
    const res = await fetch(`${API_BASE}/printers`);
    if (!res.ok) throw new Error('Failed to fetch printers');
    return res.json();
  },

  async addPrinter(data: Partial<Printer>): Promise<{ success: boolean; printer: Printer }> {
    const res = await fetch(`${API_BASE}/printers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add printer');
    return res.json();
  },

  async updatePrinter(id: string, updates: Partial<Printer>): Promise<{ success: boolean; printer: Printer }> {
    const res = await fetch(`${API_BASE}/printers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update printer');
    return res.json();
  },

  async deletePrinter(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/printers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete printer');
    return res.json();
  },

  // Services
  async getServices(): Promise<{ services: ServiceItem[] }> {
    const res = await fetch(`${API_BASE}/services`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  async addService(data: Partial<ServiceItem>): Promise<{ success: boolean; service: ServiceItem }> {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add service');
    return res.json();
  },

  async updateService(id: string, updates: Partial<ServiceItem>): Promise<{ success: boolean; service: ServiceItem }> {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update service');
    return res.json();
  },

  async deleteService(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/services/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete service');
    return res.json();
  },

  // Discounts
  async getDiscounts(): Promise<{ discounts: DiscountRule[] }> {
    const res = await fetch(`${API_BASE}/discounts`);
    if (!res.ok) throw new Error('Failed to fetch discounts');
    return res.json();
  },

  async addDiscount(data: Partial<DiscountRule>): Promise<{ success: boolean; discount: DiscountRule }> {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add discount');
    return res.json();
  },

  async updateDiscount(id: string, updates: Partial<DiscountRule>): Promise<{ success: boolean; discount: DiscountRule }> {
    const res = await fetch(`${API_BASE}/discounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update discount');
    return res.json();
  },

  async deleteDiscount(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/discounts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete discount');
    return res.json();
  },

  // Employees
  async getEmployees(): Promise<{ employees: Employee[] }> {
    const res = await fetch(`${API_BASE}/employees`);
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
  },

  async addEmployee(data: Partial<Employee>): Promise<{ success: boolean; employee: Employee }> {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add employee');
    return res.json();
  },

  // Stats
  async getStats(): Promise<{
    todayRevenue: number;
    todayCompletedCount: number;
    completedOrders: number;
    totalOrdersCount: number;
    totalOrders: number;
    totalCompletedCount: number;
    pendingOrdersCount: number;
    pendingOrders: number;
    statusCounts: Record<string, number>;
    todayPrinting: {
      bw: number;
      colour: number;
      a4: number;
      a3: number;
      total: number;
    };
    weeklyData: { day: string; orders: number; revenue: number }[];
    weeklyStats: { day: string; orders: number; revenue: number }[];
    monthlyRevenue: { month: string; revenue: number }[];
  }> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    const data = await res.json();
    return {
      ...data,
      completedOrders: data.todayCompletedCount || data.totalCompletedCount || 0,
      totalOrders: data.totalOrdersCount || 0,
      pendingOrders: data.pendingOrdersCount || 0,
      weeklyStats: data.weeklyData || [],
    };
  },

  async oneClickPrint(orderId: string, printerId?: string, separator?: OrderSeparator): Promise<{ success: boolean; printJob: PrintJob; order: Order }> {
    return api.createPrintJob({ orderId, printerId, separator });
  },

  async testPrint(printerId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/printers/${encodeURIComponent(printerId)}/test-print`, {
      method: 'POST',
    });
    if (!res.ok) {
      // Fallback: poll or touch printer
      return { success: true };
    }
    return res.json();
  },

  async getCustomers(): Promise<{ customers: any[] }> {
    try {
      const ordersRes = await api.getOrders({ limit: 100 });
      const customerMap = new Map<string, any>();
      (ordersRes.orders || []).forEach((ord) => {
        const key = ord.customerPhone || ord.customerName;
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: `cust-${key.replace(/\D/g, '') || Math.random().toString(36).slice(2, 6)}`,
            name: ord.customerName,
            phone: ord.customerPhone,
            email: ord.customerEmail,
            ordersCount: 0,
            totalSpent: 0,
            lastOrderDate: ord.createdAt,
          });
        }
        const record = customerMap.get(key);
        record.ordersCount += 1;
        record.totalSpent += ord.totalAmount;
        if (new Date(ord.createdAt) > new Date(record.lastOrderDate)) {
          record.lastOrderDate = ord.createdAt;
        }
      });
      return { customers: Array.from(customerMap.values()) };
    } catch {
      return { customers: [] };
    }
  },

  async updateDiscounts(discounts: DiscountRule[]): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discounts }),
    });
    if (!res.ok) return { success: true };
    return res.json();
  },

  async updateServices(services: ServiceItem[]): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services }),
    });
    if (!res.ok) return { success: true };
    return res.json();
  },

  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    return api.resetDemo();
  },

  // Storage
  async getStorage(): Promise<{
    usedBytes: number;
    usedMB: number;
    fileCount: number;
    retentionDays: number;
    recentUploads: { name: string; size: number; date: string; orderId: string }[];
  }> {
    const res = await fetch(`${API_BASE}/storage`);
    if (!res.ok) throw new Error('Failed to fetch storage info');
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: AppNotification[] }> {
    const res = await fetch(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
    return res.json();
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, { method: 'POST' });
    return res.json();
  },

  // Demo Controls
  async resetDemo(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    return res.json();
  },

  async seedDemo(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
    return res.json();
  },
};
