import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import type {
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
} from './src/types/index.ts';
import {
  DEFAULT_PRICING_RULES,
  DEFAULT_DISCOUNTS,
  calculateOrderSummary,
  calculateDocumentPricing,
} from './src/utils/pricing.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS for external HTML admin panels, mobile apps, or local client scripts
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve public directory (including admin.html)
app.use(express.static(path.join(process.cwd(), 'public')));

app.get(['/admin.html', '/counter'], (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'admin.html'));
});

// Storage directory for persistent state
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface AppStore {
  business: BusinessProfile;
  pricing: PricingRule[];
  discounts: DiscountRule[];
  printers: Printer[];
  services: ServiceItem[];
  employees: Employee[];
  orders: Order[];
  printJobs: PrintJob[];
  notifications: AppNotification[];
  nextOrderNumber: number;
}

const DEFAULT_BUSINESS: BusinessProfile = {
  shopName: 'Sonu Printer',
  tagline: 'Offline Printing • E-Mitra • Document Services',
  ownerName: 'Sonu Sharma',
  phone: '+91 98291 45678',
  alternatePhone: '+91 94140 12345',
  whatsappNumber: '+91 98291 45678',
  email: 'sonuprinter.merta@gmail.com',
  address: 'Shop No. 4, Near Meera Smarak, Station Road',
  landmark: 'Near Meera Smarak & Court Circle',
  city: 'Merta City',
  state: 'Rajasthan',
  pincode: '341510',
  openingHours: '8:30 AM - 8:30 PM (Mon - Sat), 10:00 AM - 4:00 PM (Sun)',
  upiId: 'sonuprinter@upi',
  qrPrintPortalUrl: 'https://ais-dev-rbw5ouebyb472fe3jdnm6c-29640077172.asia-southeast1.run.app/print',
  retentionDays: 7,
  demoMode: true,
};

const DEFAULT_PRINTERS: Printer[] = [
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
];

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'srv-emitra',
    title: 'E-Mitra Government Services',
    category: 'E-Mitra',
    description: 'Jan Aadhaar, Caste/Income Certificate, Ration Card, Pension verification, Electricity & Water Bills',
    startingPrice: 50,
    unit: 'per service',
    active: true,
    featured: true,
    iconName: 'FileText',
  },
  {
    id: 'srv-xerox',
    title: 'Xerox & High-Speed Photocopy',
    category: 'Printing',
    description: 'Crisp black & white and colour copies, legal / court documents, book photocopying',
    startingPrice: 2,
    unit: 'per page',
    active: true,
    featured: true,
    iconName: 'Copy',
  },
  {
    id: 'srv-print',
    title: 'Online & Shop Document Print',
    category: 'Printing',
    description: 'Instant PDF / Word / Excel / Image printing via QR code upload or WhatsApp',
    startingPrice: 3,
    unit: 'per page',
    active: true,
    featured: true,
    iconName: 'Printer',
  },
  {
    id: 'srv-photo',
    title: 'Urgent Passport Photos',
    category: 'Cards & Photos',
    description: 'Instant studio lighting photo shoot with white/blue background, 8 or 16 photo sheets',
    startingPrice: 60,
    unit: '8 photos',
    active: true,
    featured: true,
    iconName: 'Camera',
  },
  {
    id: 'srv-pvc',
    title: 'PVC Smart Card Printing',
    category: 'Cards & Photos',
    description: 'Waterproof high-durability plastic cards for Aadhaar, PAN, Voter ID, Driving License',
    startingPrice: 70,
    unit: 'per card',
    active: true,
    featured: true,
    iconName: 'CreditCard',
  },
  {
    id: 'srv-lamination',
    title: 'Hot Roll Document Lamination',
    category: 'Printing',
    description: 'Waterproof 125/250 micron protective lamination for Marksheets, Certificates, A4 & A3',
    startingPrice: 20,
    unit: 'per sheet',
    active: true,
    featured: false,
    iconName: 'Layers',
  },
  {
    id: 'srv-resume',
    title: 'Resume & Bio-Data Formatting',
    category: 'Online Services',
    description: 'Professional CV and marriage bio-data drafting, Hindi/English typing & printouts',
    startingPrice: 100,
    unit: 'per resume',
    active: true,
    featured: false,
    iconName: 'FileCode',
  },
  {
    id: 'srv-online-forms',
    title: 'Govt & Exam Online Form Filling',
    category: 'Online Services',
    description: 'REET, Police, SSC, RPSC, Railway online exam forms with photo/signature resize',
    startingPrice: 80,
    unit: 'per form',
    active: true,
    featured: true,
    iconName: 'Send',
  },
];

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Sonu Sharma',
    email: 'admin@sonuprinter.com',
    phone: '+91 98291 45678',
    role: 'Owner/Admin',
    active: true,
    createdAt: '2025-01-01T09:00:00.000Z',
  },
  {
    id: 'emp-2',
    name: 'Vikram Singh',
    email: 'vikram@sonuprinter.com',
    phone: '+91 94142 88990',
    role: 'Manager',
    active: true,
    createdAt: '2025-02-15T10:00:00.000Z',
  },
  {
    id: 'emp-3',
    name: 'Ramesh Kumar',
    email: 'ramesh@sonuprinter.com',
    phone: '+91 97845 11223',
    role: 'Operator',
    active: true,
    createdAt: '2025-03-01T11:00:00.000Z',
  },
];

function createSeedOrders(): Order[] {
  const now = new Date();
  const todayIso = now.toISOString();

  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 48 * 3600 * 1000).toISOString();

  return [
    {
      id: 'ORD-0001',
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
      customerName: 'Mahesh Choudhary',
      customerPhone: '+91 98290 11223',
      customerEmail: 'mahesh.merta@gmail.com',
      documents: [
        {
          id: 'doc-seed-1',
          name: 'Land_Registry_Deed.pdf',
          size: 1450000,
          type: 'application/pdf',
          url: '',
          pageCount: 6,
          pageRange: 'all',
          printablePages: 6,
          copies: 2,
          paperSize: 'A4',
          colorMode: 'B&W',
          printStyle: 'Back-to-Back',
          orientation: 'Portrait',
          scaling: 'Fit to page',
          paperType: 'Plain Paper',
          collation: 'Collated',
          photoCollage: 'Original',
          sheetsCount: 3,
          ratePerPage: 3.0,
          totalPrice: 36.0,
        },
      ],
      subtotal: 36.0,
      discountAmount: 0,
      totalAmount: 36.0,
      paymentStatus: 'Paid',
      paymentMethod: 'upi',
      paymentTransactionId: 'UPI-TXN-9021849201',
      orderStatus: 'Completed',
      assignedPrinterId: 'prn-hp-525',
      separator: 'B&W Invoice',
      history: [
        {
          timestamp: twoDaysAgo,
          status: 'Pending',
          note: 'Order placed via Customer Print Portal',
          actor: 'Customer',
        },
        {
          timestamp: twoDaysAgo,
          status: 'Paid',
          note: 'Payment verified via UPI',
          actor: 'System',
        },
        {
          timestamp: twoDaysAgo,
          status: 'Printing',
          note: 'Sent to HP Smart Tank 525',
          actor: 'Sonu Sharma',
        },
        {
          timestamp: twoDaysAgo,
          status: 'Completed',
          note: 'Collected by customer',
          actor: 'Sonu Sharma',
        },
      ],
    },
    {
      id: 'ORD-0002',
      createdAt: yesterday,
      updatedAt: yesterday,
      customerName: 'Pooja Rathore',
      customerPhone: '+91 94145 66778',
      documents: [
        {
          id: 'doc-seed-2',
          name: 'College_Project_Report_Final.pdf',
          size: 3200000,
          type: 'application/pdf',
          url: '',
          pageCount: 14,
          pageRange: 'all',
          printablePages: 14,
          copies: 1,
          paperSize: 'A4',
          colorMode: 'Colour',
          printStyle: 'Single Sided',
          orientation: 'Portrait',
          scaling: 'Fit to page',
          paperType: 'Plain Paper',
          collation: 'Collated',
          photoCollage: 'Original',
          sheetsCount: 14,
          ratePerPage: 8.0,
          totalPrice: 112.0,
        },
      ],
      subtotal: 112.0,
      discountAmount: 11.2,
      discountCode: 'SONU10',
      totalAmount: 100.8,
      paymentStatus: 'Paid',
      paymentMethod: 'razorpay',
      paymentTransactionId: 'pay_Nz9Lw78Qwe',
      orderStatus: 'Completed',
      assignedPrinterId: 'prn-epson-l8050',
      separator: 'B&W Invoice',
      history: [
        {
          timestamp: yesterday,
          status: 'Pending',
          note: 'Order created',
          actor: 'Customer',
        },
        {
          timestamp: yesterday,
          status: 'Paid',
          note: 'Razorpay payment verified',
          actor: 'System',
        },
        {
          timestamp: yesterday,
          status: 'Completed',
          note: 'Print delivered',
          actor: 'Vikram Singh',
        },
      ],
    },
    {
      id: 'ORD-0003',
      createdAt: todayIso,
      updatedAt: todayIso,
      customerName: 'Kailash Gehlot',
      customerPhone: '+91 97841 22334',
      documents: [
        {
          id: 'doc-seed-3',
          name: 'Jan_Aadhaar_Card_Colour.jpg',
          size: 890000,
          type: 'image/jpeg',
          url: '',
          pageCount: 1,
          pageRange: '1',
          printablePages: 1,
          copies: 2,
          paperSize: 'A4',
          colorMode: 'Colour',
          printStyle: 'Single Sided',
          orientation: 'Landscape',
          scaling: 'Fit to page',
          paperType: 'Glossy Paper',
          collation: 'Collated',
          photoCollage: '2/page',
          sheetsCount: 1,
          ratePerPage: 12.0, // 8 + 4 glossy
          totalPrice: 24.0,
        },
      ],
      subtotal: 24.0,
      discountAmount: 0,
      totalAmount: 24.0,
      paymentStatus: 'Paid',
      paymentMethod: 'manual',
      paymentTransactionId: 'CASH-COUNTER-003',
      orderStatus: 'Ready',
      assignedPrinterId: 'prn-epson-l8050',
      separator: 'None',
      adminNotes: 'Customer will collect after Meera Smarak visit',
      history: [
        {
          timestamp: todayIso,
          status: 'Pending',
          note: 'Order created with Manual Pay option',
          actor: 'Customer',
        },
        {
          timestamp: todayIso,
          status: 'Paid',
          note: 'Cash verified at counter by Operator',
          actor: 'Ramesh Kumar',
        },
        {
          timestamp: todayIso,
          status: 'Ready',
          note: 'Printed on Glossy Paper, kept in pickup tray',
          actor: 'Ramesh Kumar',
        },
      ],
    },
  ];
}

function loadInitialStore(): AppStore {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (data && data.orders && data.pricing) {
        // Sanitize existing orders so totalAmount, subtotal, and discountAmount are never null
        data.orders = data.orders.map((o: Order) => {
          const docSum = (o.documents || []).reduce((acc: number, d: any) => acc + (Number(d.totalPrice) || 0), 0);
          if (o.subtotal == null || Number.isNaN(o.subtotal)) {
            o.subtotal = docSum;
          }
          if (o.discountAmount == null || Number.isNaN(o.discountAmount)) {
            o.discountAmount = 0;
          }
          if (o.totalAmount == null || Number.isNaN(o.totalAmount)) {
            o.totalAmount = Math.max(0, Number((o.subtotal - o.discountAmount).toFixed(2)));
          }
          return o;
        });
        return data;
      }
    } catch (e) {
      console.warn('Could not read existing store, creating fresh store', e);
    }
  }

  const initialOrders = createSeedOrders();
  const store: AppStore = {
    business: DEFAULT_BUSINESS,
    pricing: DEFAULT_PRICING_RULES,
    discounts: DEFAULT_DISCOUNTS,
    printers: DEFAULT_PRINTERS,
    services: DEFAULT_SERVICES,
    employees: DEFAULT_EMPLOYEES,
    orders: initialOrders,
    printJobs: [
      {
        id: 'job-seed-1',
        orderId: 'ORD-0001',
        customerName: 'Mahesh Choudhary',
        documentName: 'Land_Registry_Deed.pdf',
        printerId: 'prn-hp-525',
        printerName: 'HP Smart Tank 525',
        status: 'Completed',
        progressPercent: 100,
        pages: 6,
        copies: 2,
        paperSize: 'A4',
        colorMode: 'B&W',
        separator: 'B&W Invoice',
        startedAt: initialOrders[0].createdAt,
        completedAt: initialOrders[0].createdAt,
      },
    ],
    notifications: [
      {
        id: 'notif-1',
        title: 'New Order Received',
        message: 'Kailash Gehlot placed order ORD-0003 for 2 copies',
        type: 'order',
        targetUrl: '/admin/orders',
        read: false,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'notif-2',
        title: 'Printers Online',
        message: 'HP Smart Tank 525 & Epson L8050 connected & ready',
        type: 'printer',
        targetUrl: '/admin/live-print',
        read: true,
        timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
    ],
    nextOrderNumber: 4,
  };

  saveStore(store);
  return store;
}

let store: AppStore = loadInitialStore();

function saveStore(s: AppStore) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(s, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store:', err);
  }
}

// Background Print Simulation Timer
// Whenever there is a PrintJob with status 'Printing' or 'Spooling',
// advance its progress and auto-complete it!
setInterval(() => {
  let changed = false;
  const activeJobs = store.printJobs.filter(
    (j) => j.status === 'Queued' || j.status === 'Spooling' || j.status === 'Printing'
  );

  for (const job of activeJobs) {
    if (job.status === 'Queued') {
      job.status = 'Spooling';
      job.progressPercent = 15;
      changed = true;
    } else if (job.status === 'Spooling') {
      job.status = 'Printing';
      job.progressPercent = 45;
      changed = true;
    } else if (job.status === 'Printing') {
      job.progressPercent = Math.min(100, (job.progressPercent || 45) + 30);
      if (job.progressPercent >= 100) {
        job.status = 'Completed';
        job.completedAt = new Date().toISOString();

        // Update corresponding order
        const targetOrder = store.orders.find((o) => o.id === job.orderId);
        if (targetOrder && targetOrder.orderStatus !== 'Completed') {
          targetOrder.orderStatus = 'Completed';
          targetOrder.updatedAt = new Date().toISOString();
          targetOrder.history.push({
            timestamp: targetOrder.updatedAt,
            status: 'Completed',
            note: `Print job completed successfully on ${job.printerName}`,
            actor: 'Printer Agent',
          });
        }

        // Update printer stats
        const targetPrinter = store.printers.find((p) => p.id === job.printerId);
        if (targetPrinter) {
          targetPrinter.totalPagesPrintedToday += job.pages * job.copies;
          targetPrinter.activeQueueCount = Math.max(0, targetPrinter.activeQueueCount - 1);
          targetPrinter.status = 'Online';
        }

        // Add notification
        store.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: 'Print Job Completed',
          message: `Order #${job.orderId} (${job.customerName}) printed on ${job.printerName}`,
          type: 'printer',
          targetUrl: '/admin/orders',
          read: false,
          timestamp: new Date().toISOString(),
        });
      }
      changed = true;
    }
  }

  if (changed) {
    saveStore(store);
  }
}, 3000);

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Business Profile
app.get('/api/business', (req, res) => {
  res.json(store.business);
});

app.put('/api/business', (req, res) => {
  store.business = { ...store.business, ...req.body };
  saveStore(store);
  res.json({ success: true, business: store.business });
});

// 2. Pricing & Price Calculation Engine
app.get('/api/pricing', (req, res) => {
  res.json({
    pricing: store.pricing,
    discounts: store.discounts,
  });
});

app.put('/api/pricing', (req, res) => {
  if (Array.isArray(req.body.pricing)) {
    store.pricing = req.body.pricing;
    saveStore(store);
    res.json({ success: true, pricing: store.pricing });
  } else {
    res.status(400).json({ error: 'pricing array expected' });
  }
});

app.post('/api/calculate-price', (req, res) => {
  const { documents, couponCode } = req.body;
  if (!Array.isArray(documents)) {
    return res.status(400).json({ error: 'documents array required' });
  }

  const summary = calculateOrderSummary(
    documents,
    store.pricing,
    store.discounts,
    couponCode
  );

  res.json(summary);
});

// 3. Orders Management
app.get('/api/orders', (req, res) => {
  const { status, search, limit } = req.query;
  let result = [...store.orders];

  if (status && status !== 'all') {
    result = result.filter((o) => o.orderStatus.toLowerCase() === (status as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    result = result.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.documents.some((d) => d.name.toLowerCase().includes(q))
    );
  }

  // Sort latest first
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (limit) {
    result = result.slice(0, parseInt(limit as string, 10));
  }

  res.json({ orders: result, total: result.length });
});

// Helper to find an order by ID or token (handles 'ORD-XXXX' or 'XXXX' case-insensitively)
function findOrderByIdOrToken(idOrToken: string): Order | undefined {
  if (!idOrToken) return undefined;
  const clean = idOrToken.trim().toUpperCase();
  return store.orders.find((o) => {
    const oid = o.id.toUpperCase();
    return oid === clean || oid === `ORD-${clean}` || oid.replace('ORD-', '') === clean;
  });
}

app.get('/api/orders/:id', (req, res) => {
  const order = findOrderByIdOrToken(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// Fast real-time status check for customer confirm screen
app.get('/api/orders/:id/status', (req, res) => {
  const order = findOrderByIdOrToken(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found', isAccepted: false });
  }
  const isAccepted =
    order.isAccepted === true ||
    ['Accepted', 'Processing', 'Printing', 'Ready', 'Completed'].includes(order.orderStatus);

  res.json({
    id: order.id,
    orderStatus: order.orderStatus,
    isAccepted,
    acceptedAt: order.acceptedAt,
    updatedAt: order.updatedAt,
  });
});

// Accept order endpoint (by URL parameter)
app.post('/api/orders/:id/accept', (req, res) => {
  const order = findOrderByIdOrToken(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const now = new Date().toISOString();
  order.isAccepted = true;
  order.acceptedAt = now;
  order.orderStatus = (req.body.orderStatus as OrderStatus) || 'Accepted';
  order.updatedAt = now;
  order.history.push({
    timestamp: now,
    status: order.orderStatus,
    note: req.body.note || `Order accepted by shopkeeper at counter (Token: ${order.id})`,
    actor: req.body.actor || 'Shopkeeper',
  });
  saveStore(store);

  res.json({
    success: true,
    message: `Order #${order.id} accepted successfully`,
    order,
  });
});

// Accept order endpoint (by JSON body { token: "..." } or { id: "..." })
app.post('/api/orders/accept', (req, res) => {
  const token = (req.body.token || req.body.id || req.body.tokenCode || '').toString();
  if (!token) {
    return res.status(400).json({ error: 'Token or Order ID is required' });
  }
  const order = findOrderByIdOrToken(token);
  if (!order) {
    return res.status(404).json({ error: `Order with token "${token}" not found` });
  }
  const now = new Date().toISOString();
  order.isAccepted = true;
  order.acceptedAt = now;
  order.orderStatus = (req.body.orderStatus as OrderStatus) || 'Accepted';
  order.updatedAt = now;
  order.history.push({
    timestamp: now,
    status: order.orderStatus,
    note: req.body.note || `Order accepted by shopkeeper at counter (Token: ${order.id})`,
    actor: req.body.actor || 'Shopkeeper',
  });
  saveStore(store);

  res.json({
    success: true,
    message: `Order #${order.id} accepted successfully`,
    order,
  });
});

app.post('/api/orders', (req, res) => {
  const {
    id,
    tokenCode,
    customerName,
    customerPhone,
    customerEmail,
    documents,
    paymentMethod,
    discountCode,
    separator,
    adminNotes,
  } = req.body;

  const finalCustomerName = (customerName && typeof customerName === 'string' && customerName.trim())
    ? customerName.trim()
    : 'Counter Customer';
  const finalCustomerPhone = (customerPhone && typeof customerPhone === 'string' && customerPhone.trim())
    ? customerPhone.trim()
    : 'Counter';

  if (!Array.isArray(documents) || documents.length === 0) {
    return res.status(400).json({ error: 'At least one document is required' });
  }

  // Server-side recalculation of each document pricing and total to prevent tampering
  const verifiedDocs: DocumentItem[] = documents.map((doc, idx) => {
    const pricing = calculateDocumentPricing(doc, store.pricing);
    return {
      ...doc,
      id: doc.id || `doc-${Date.now()}-${idx}`,
      printablePages: pricing.printablePages,
      sheetsCount: pricing.sheetsCount,
      ratePerPage: pricing.ratePerPage,
      totalPrice: pricing.totalPrice,
    };
  });

  const verifiedSummary = calculateOrderSummary(
    verifiedDocs,
    store.pricing,
    store.discounts,
    discountCode
  );

  // Helper to generate a 4-character token combining letters & numbers (e.g. 7B4X, 8K2P)
  const generate4CharToken = (): string => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits = '23456789';
    const allChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

    const letterPos = Math.floor(Math.random() * 4);
    let digitPos = Math.floor(Math.random() * 4);
    while (digitPos === letterPos) {
      digitPos = Math.floor(Math.random() * 4);
    }

    let code = '';
    for (let i = 0; i < 4; i++) {
      if (i === letterPos) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
      } else if (i === digitPos) {
        code += digits.charAt(Math.floor(Math.random() * digits.length));
      } else {
        code += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
    }
    return code;
  };

  const requestedId = (id || tokenCode || '').toString().trim().toUpperCase();
  let orderId = (requestedId && (requestedId.startsWith('ORD-') || requestedId.length === 4))
    ? (requestedId.startsWith('ORD-') ? requestedId : `ORD-${requestedId}`)
    : `ORD-${generate4CharToken()}`;
  while (store.orders.some((o) => o.id.toUpperCase() === orderId.toUpperCase())) {
    orderId = `ORD-${generate4CharToken()}`;
  }
  store.nextOrderNumber += 1;

  const now = new Date().toISOString();
  const isCashOrManual = paymentMethod === 'manual' || paymentMethod === 'cash';

  const newOrder: Order = {
    id: orderId,
    createdAt: now,
    updatedAt: now,
    customerName: finalCustomerName,
    customerPhone: finalCustomerPhone,
    customerEmail: customerEmail ? customerEmail.trim() : undefined,
    documents: verifiedDocs,
    subtotal: verifiedSummary.subtotal,
    discountAmount: verifiedSummary.discountAmount,
    discountCode: verifiedSummary.appliedDiscountTitle ? discountCode : undefined,
    totalAmount: verifiedSummary.totalAmount,
    paymentStatus: isCashOrManual ? 'Pending' : 'Pending',
    paymentMethod: paymentMethod || 'cash',
    orderStatus: 'Pending',
    separator: separator || 'None',
    adminNotes: adminNotes || undefined,
    history: [
      {
        timestamp: now,
        status: 'Pending',
        note: isCashOrManual
          ? 'Order created with Cash / Counter pickup option'
          : 'Order created, awaiting payment verification',
        actor: 'Customer',
      },
    ],
  };

  store.orders.unshift(newOrder);

  // Trigger notification
  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'New Customer Order',
    message: `${newOrder.customerName} placed order #${newOrder.id} for ₹${newOrder.totalAmount}`,
    type: 'order',
    targetUrl: `/admin/orders`,
    read: false,
    timestamp: now,
  });

  saveStore(store);

  res.status(201).json({
    success: true,
    order: newOrder,
  });
});

app.patch('/api/orders/:id', (req, res) => {
  const order = findOrderByIdOrToken(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { orderStatus, paymentStatus, assignedPrinterId, separator, adminNotes, noteActor } = req.body;
  const now = new Date().toISOString();

  let changed = false;

  if (orderStatus && orderStatus !== order.orderStatus) {
    const prev = order.orderStatus;
    order.orderStatus = orderStatus as OrderStatus;
    if (['Accepted', 'Processing', 'Printing', 'Ready', 'Completed'].includes(orderStatus)) {
      order.isAccepted = true;
      if (!order.acceptedAt) {
        order.acceptedAt = now;
      }
    }
    order.updatedAt = now;
    order.history.push({
      timestamp: now,
      status: orderStatus,
      note: req.body.statusNote || `Order status updated from ${prev} to ${orderStatus}`,
      actor: noteActor || 'Admin',
    });
    changed = true;
  }

  if (paymentStatus && paymentStatus !== order.paymentStatus) {
    order.paymentStatus = paymentStatus as PaymentStatus;
    order.updatedAt = now;
    order.history.push({
      timestamp: now,
      status: order.orderStatus,
      note: `Payment status updated to ${paymentStatus}`,
      actor: noteActor || 'Admin',
    });
    changed = true;
  }

  if (assignedPrinterId !== undefined) {
    order.assignedPrinterId = assignedPrinterId;
    order.updatedAt = now;
    changed = true;
  }

  if (separator !== undefined) {
    order.separator = separator;
    order.updatedAt = now;
    changed = true;
  }

  if (adminNotes !== undefined) {
    order.adminNotes = adminNotes;
    order.updatedAt = now;
    changed = true;
  }

  if (changed) {
    saveStore(store);
  }

  res.json({ success: true, order });
});

// 4. Payment processing & verification
app.post('/api/orders/:id/payment', (req, res) => {
  const order = store.orders.find((o) => o.id.toUpperCase() === req.params.id.toUpperCase());
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { testResult, paymentMethod, transactionId } = req.body;
  const now = new Date().toISOString();

  if (testResult === 'FAILED') {
    order.paymentStatus = 'Failed';
    order.updatedAt = now;
    order.history.push({
      timestamp: now,
      status: order.orderStatus,
      note: 'Payment attempt failed or was declined',
      actor: 'Payment Gateway',
    });
    saveStore(store);
    return res.json({ success: false, status: 'Failed', order });
  }

  if (testResult === 'CANCELLED') {
    order.paymentStatus = 'Pending';
    order.updatedAt = now;
    order.history.push({
      timestamp: now,
      status: order.orderStatus,
      note: 'Customer cancelled payment window',
      actor: 'Customer',
    });
    saveStore(store);
    return res.json({ success: false, status: 'Cancelled', order });
  }

  // SUCCESS / Paid
  order.paymentStatus = 'Paid';
  order.paymentMethod = paymentMethod || order.paymentMethod || 'upi';
  order.paymentTransactionId =
    transactionId || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`;
  order.orderStatus = 'Pending'; // Ready for print queue
  order.updatedAt = now;
  order.history.push({
    timestamp: now,
    status: 'Paid',
    note: `Payment of ₹${order.totalAmount} verified successfully (${order.paymentMethod.toUpperCase()}) [Txn: ${order.paymentTransactionId}]`,
    actor: 'Payment Gateway',
  });

  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'Payment Confirmed',
    message: `Payment received for #${order.id}: ₹${order.totalAmount} via ${order.paymentMethod.toUpperCase()}`,
    type: 'payment',
    targetUrl: `/admin/orders`,
    read: false,
    timestamp: now,
  });

  saveStore(store);

  res.json({ success: true, status: 'Paid', order });
});

// 5. Print Jobs & One-Click Print API
app.get('/api/print-jobs', (req, res) => {
  res.json({ jobs: store.printJobs });
});

app.post('/api/print-jobs', (req, res) => {
  const { orderId, printerId, separator } = req.body;
  const order = store.orders.find((o) => o.id.toUpperCase() === (orderId || '').toUpperCase());

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Find printer
  let printer = store.printers.find((p) => p.id === printerId);
  if (!printer) {
    // Default to first online printer
    printer = store.printers.find((p) => p.status === 'Online') || store.printers[0];
  }

  const now = new Date().toISOString();
  const primaryDoc = order.documents[0] || {
    name: 'Print_Job.pdf',
    printablePages: 1,
    copies: 1,
    paperSize: 'A4',
    colorMode: 'B&W',
  };

  const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
  const newJob: PrintJob = {
    id: jobId,
    orderId: order.id,
    customerName: order.customerName,
    documentName: order.documents.map((d) => d.name).join(', '),
    printerId: printer.id,
    printerName: printer.name,
    status: 'Queued',
    progressPercent: 5,
    pages: order.documents.reduce((acc, d) => acc + d.printablePages, 0),
    copies: order.documents.reduce((acc, d) => acc + d.copies, 0),
    paperSize: primaryDoc.paperSize,
    colorMode: primaryDoc.colorMode,
    separator: separator || order.separator || 'None',
    startedAt: now,
  };

  store.printJobs.unshift(newJob);

  // Update order status to Printing
  order.orderStatus = 'Printing';
  order.isAccepted = true;
  if (!order.acceptedAt) order.acceptedAt = now;
  order.assignedPrinterId = printer.id;
  order.updatedAt = now;
  order.history.push({
    timestamp: now,
    status: 'Printing',
    note: `One-Click Print executed. Assigned to ${printer.name} (Job #${jobId})`,
    actor: 'Admin',
  });

  // Update printer status
  printer.activeQueueCount += 1;
  printer.status = 'Printing';

  saveStore(store);

  res.status(201).json({ success: true, printJob: newJob, order });
});

app.patch('/api/print-jobs/:id', (req, res) => {
  const job = store.printJobs.find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Print job not found' });
  }

  const { status, progressPercent, errorMessage } = req.body;
  if (status) job.status = status;
  if (progressPercent !== undefined) job.progressPercent = progressPercent;
  if (errorMessage) job.errorMessage = errorMessage;

  if (status === 'Completed') {
    job.completedAt = new Date().toISOString();
    const order = store.orders.find((o) => o.id === job.orderId);
    if (order && order.orderStatus !== 'Completed') {
      order.orderStatus = 'Completed';
      order.updatedAt = new Date().toISOString();
      order.history.push({
        timestamp: order.updatedAt,
        status: 'Completed',
        note: `Print job completed on ${job.printerName}`,
        actor: 'Printer Agent',
      });
    }
  }

  saveStore(store);
  res.json({ success: true, job });
});

// 6. Printers Management
app.get('/api/printers', (req, res) => {
  res.json({ printers: store.printers });
});

app.post('/api/printers', (req, res) => {
  const { name, brand, model, connection, type, supportedSizes, colorSupport, duplexSupport } = req.body;
  if (!name || !model) {
    return res.status(400).json({ error: 'Printer name and model required' });
  }

  const newPrinter: Printer = {
    id: `prn-${Date.now()}`,
    name,
    brand: brand || 'Generic',
    model,
    connection: connection || 'USB',
    type: type || 'Ink Tank',
    supportedSizes: supportedSizes || ['A4'],
    colorSupport: colorSupport !== false,
    duplexSupport: duplexSupport || false,
    status: 'Online',
    activeQueueCount: 0,
    totalPagesPrintedToday: 0,
  };

  store.printers.push(newPrinter);
  saveStore(store);
  res.status(201).json({ success: true, printer: newPrinter });
});

app.patch('/api/printers/:id', (req, res) => {
  const printer = store.printers.find((p) => p.id === req.params.id);
  if (!printer) {
    return res.status(404).json({ error: 'Printer not found' });
  }

  Object.assign(printer, req.body);
  saveStore(store);
  res.json({ success: true, printer });
});

app.delete('/api/printers/:id', (req, res) => {
  store.printers = store.printers.filter((p) => p.id !== req.params.id);
  saveStore(store);
  res.json({ success: true });
});

// 7. Services Management
app.get('/api/services', (req, res) => {
  res.json({ services: store.services });
});

app.post('/api/services', (req, res) => {
  const { title, category, description, startingPrice, unit, iconName } = req.body;
  const newService: ServiceItem = {
    id: `srv-${Date.now()}`,
    title,
    category: category || 'Printing',
    description: description || '',
    startingPrice: Number(startingPrice) || 10,
    unit: unit || 'per service',
    active: true,
    iconName: iconName || 'Printer',
  };
  store.services.push(newService);
  saveStore(store);
  res.status(201).json({ success: true, service: newService });
});

app.patch('/api/services/:id', (req, res) => {
  const srv = store.services.find((s) => s.id === req.params.id);
  if (!srv) return res.status(404).json({ error: 'Service not found' });
  Object.assign(srv, req.body);
  saveStore(store);
  res.json({ success: true, service: srv });
});

app.delete('/api/services/:id', (req, res) => {
  store.services = store.services.filter((s) => s.id !== req.params.id);
  saveStore(store);
  res.json({ success: true });
});

// 8. Discounts Management
app.get('/api/discounts', (req, res) => {
  res.json({ discounts: store.discounts });
});

app.post('/api/discounts', (req, res) => {
  const newDiscount: DiscountRule = {
    id: `disc-${Date.now()}`,
    title: req.body.title || 'New Discount',
    description: req.body.description || '',
    type: req.body.type || 'percentage',
    code: req.body.code,
    minPages: req.body.minPages,
    minAmount: req.body.minAmount,
    percentage: req.body.percentage,
    fixedAmount: req.body.fixedAmount,
    active: true,
  };
  store.discounts.push(newDiscount);
  saveStore(store);
  res.status(201).json({ success: true, discount: newDiscount });
});

app.patch('/api/discounts/:id', (req, res) => {
  const d = store.discounts.find((item) => item.id === req.params.id);
  if (!d) return res.status(404).json({ error: 'Discount not found' });
  Object.assign(d, req.body);
  saveStore(store);
  res.json({ success: true, discount: d });
});

app.delete('/api/discounts/:id', (req, res) => {
  store.discounts = store.discounts.filter((item) => item.id !== req.params.id);
  saveStore(store);
  res.json({ success: true });
});

// 9. Employees
app.get('/api/employees', (req, res) => {
  res.json({ employees: store.employees });
});

app.post('/api/employees', (req, res) => {
  const { name, email, phone, role } = req.body;
  const newEmp: Employee = {
    id: `emp-${Date.now()}`,
    name,
    email,
    phone,
    role: role || 'Operator',
    active: true,
    createdAt: new Date().toISOString(),
  };
  store.employees.push(newEmp);
  saveStore(store);
  res.status(201).json({ success: true, employee: newEmp });
});

// 10. Dashboard Analytics & KPIs
app.get('/api/stats', (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // 1. Today's Revenue (only Paid or Completed orders today)
  const todayOrders = store.orders.filter(
    (o) => new Date(o.createdAt).getTime() >= startOfToday && o.paymentStatus === 'Paid'
  );
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // 2. Total Completed Orders
  const totalCompleted = store.orders.filter((o) => o.orderStatus === 'Completed').length;

  // 3. Pending Orders (awaiting print or verification)
  const pendingOrders = store.orders.filter(
    (o) => o.orderStatus === 'Pending' || o.orderStatus === 'Processing'
  ).length;

  // 4. Status breakdown
  const statusCounts: Record<string, number> = {
    Pending: 0,
    Processing: 0,
    Printing: 0,
    Completed: 0,
    Rejected: 0,
    'Print Failed': 0,
    Cancelled: 0,
  };

  for (const o of store.orders) {
    if (statusCounts[o.orderStatus] !== undefined) {
      statusCounts[o.orderStatus] += 1;
    }
  }

  // 5. Today's printing summary (B&W, Colour, A4, A3)
  let todayBWPages = 0;
  let todayColourPages = 0;
  let todayA4Pages = 0;
  let todayA3Pages = 0;

  for (const o of todayOrders) {
    for (const d of o.documents) {
      const pages = d.printablePages * d.copies;
      if (d.colorMode === 'B&W') todayBWPages += pages;
      else todayColourPages += pages;

      if (d.paperSize === 'A4') todayA4Pages += pages;
      else if (d.paperSize === 'A3') todayA3Pages += pages;
    }
  }

  // 6. Orders This Week (Sun -> Sat)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = dayNames.map((day) => ({ day, orders: 0, revenue: 0 }));

  const oneWeekAgo = now.getTime() - 7 * 24 * 3600 * 1000;
  for (const o of store.orders) {
    const oDate = new Date(o.createdAt);
    if (oDate.getTime() >= oneWeekAgo) {
      const dayIndex = oDate.getDay();
      weeklyData[dayIndex].orders += 1;
      if (o.paymentStatus === 'Paid') {
        weeklyData[dayIndex].revenue += o.totalAmount;
      }
    }
  }

  // 7. Monthly Revenue (Last 7 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = monthNames[d.getMonth()];
    const mYear = d.getFullYear();
    const startM = new Date(mYear, d.getMonth(), 1).getTime();
    const endM = new Date(mYear, d.getMonth() + 1, 1).getTime();

    const mOrders = store.orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= startM && t < endM && o.paymentStatus === 'Paid';
    });

    const mTotal = mOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    monthlyRevenue.push({ month: mName, revenue: Number(mTotal.toFixed(2)) });
  }

  res.json({
    todayRevenue: Number(todayRevenue.toFixed(2)),
    todayCompletedCount: todayOrders.filter((o) => o.orderStatus === 'Completed').length,
    totalOrdersCount: store.orders.length,
    totalCompletedCount: totalCompleted,
    pendingOrdersCount: pendingOrders,
    statusCounts,
    todayPrinting: {
      bw: todayBWPages,
      colour: todayColourPages,
      a4: todayA4Pages,
      a3: todayA3Pages,
      total: todayBWPages + todayColourPages,
    },
    weeklyData,
    monthlyRevenue,
  });
});

// 11. Storage & Files stats
app.get('/api/storage', (req, res) => {
  let totalBytes = 0;
  let fileCount = 0;
  const recentUploads: { name: string; size: number; date: string; orderId: string }[] = [];

  for (const o of store.orders) {
    for (const d of o.documents) {
      fileCount += 1;
      totalBytes += d.size || 500000;
      recentUploads.push({
        name: d.name,
        size: d.size || 500000,
        date: o.createdAt,
        orderId: o.id,
      });
    }
  }

  res.json({
    usedBytes: totalBytes,
    usedMB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
    fileCount,
    retentionDays: store.business.retentionDays || 7,
    recentUploads: recentUploads.slice(0, 15),
  });
});

// 12. Notifications
app.get('/api/notifications', (req, res) => {
  res.json({ notifications: store.notifications });
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const notif = store.notifications.find((n) => n.id === req.params.id);
  if (notif) notif.read = true;
  saveStore(store);
  res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  store.notifications.forEach((n) => (n.read = true));
  saveStore(store);
  res.json({ success: true });
});

// 13. Demo Reset and Seed
app.post('/api/demo/reset', (req, res) => {
  store.orders = [];
  store.printJobs = [];
  store.nextOrderNumber = 1;
  saveStore(store);
  res.json({ success: true, message: 'All demo orders and print jobs cleared.' });
});

app.post('/api/demo/seed', (req, res) => {
  store.orders = createSeedOrders();
  store.nextOrderNumber = store.orders.length + 1;
  saveStore(store);
  res.json({ success: true, message: 'Sample demo orders seeded.' });
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sonu Printer Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
