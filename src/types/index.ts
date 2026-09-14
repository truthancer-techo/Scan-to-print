export type OrderStatus =
  | 'Pending'
  | 'Payment Pending'
  | 'Paid'
  | 'Processing'
  | 'Printing'
  | 'Print Failed'
  | 'Ready'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export type PaymentStatus =
  | 'Pending'
  | 'Manual Verification'
  | 'Paid'
  | 'Failed'
  | 'Refunded';

export type PaymentMethod = 'upi' | 'razorpay' | 'manual' | 'cash';

export type PaperSize = 'A4' | 'A3';
export type ColorMode = 'B&W' | 'Colour';
export type PrintStyle = 'Single Sided' | 'Back-to-Back';
export type Orientation = 'Auto' | 'Portrait' | 'Landscape';
export type Scaling = 'Fit to page' | 'Actual size' | 'Fill page';
export type PaperType = 'Plain Paper' | 'Glossy Paper';
export type Collation = 'Collated' | 'Uncollated';
export type PhotoCollage =
  | 'Original'
  | '2/page'
  | '4/page'
  | '6/page'
  | '9/page'
  | '12/page'
  | '16/page';

export type OrderSeparator = 'None' | 'B&W Invoice' | 'Blank Page';

export interface DocumentItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // Base64 or object URL or server URL
  previewUrl?: string;
  pageCount: number;
  pageRange: string; // 'all' or '1-3, 5'
  printablePages: number;
  copies: number;
  paperSize: PaperSize;
  colorMode: ColorMode;
  printStyle: PrintStyle;
  orientation: Orientation;
  scaling: Scaling;
  paperType: PaperType;
  collation: Collation;
  photoCollage: PhotoCollage;
  sheetsCount: number;
  ratePerPage: number;
  totalPrice: number;
  rotation?: number; // 0, 90, 180, 270
}

export interface OrderHistoryEntry {
  timestamp: string;
  status: OrderStatus;
  note: string;
  actor: string;
}

export interface Order {
  id: string; // e.g. ORD-0001
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  documents: DocumentItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentTransactionId?: string;
  orderStatus: OrderStatus;
  assignedPrinterId?: string;
  separator: OrderSeparator;
  adminNotes?: string;
  history: OrderHistoryEntry[];
}

export interface PricingRule {
  id: string;
  paperSize: PaperSize;
  colorMode: ColorMode;
  printStyle: PrintStyle;
  paperType: PaperType;
  ratePerPage: number;
}

export interface DiscountRule {
  id: string;
  code?: string;
  couponCode?: string;
  title: string;
  description?: string;
  type: 'bulk' | 'coupon' | 'percentage' | 'fixed' | 'volume';
  minPages?: number;
  minAmount?: number;
  percentage?: number;
  fixedAmount?: number;
  active: boolean;
  validUntil?: string;
}

export interface Printer {
  id: string;
  name: string;
  brand: string;
  model: string;
  connection: 'USB' | 'Wi-Fi' | 'LAN';
  type: 'Ink Tank' | 'Laser' | 'Photo Inkjet' | 'Digital Press';
  supportedSizes: PaperSize[];
  colorSupport: boolean;
  duplexSupport: boolean;
  status: 'Online' | 'Idle' | 'Printing' | 'Offline' | 'Error';
  currentJobId?: string;
  activeQueueCount: number;
  totalPagesPrintedToday: number;
  errorNote?: string;
}

export interface PrintJob {
  id: string;
  orderId: string;
  customerName: string;
  documentName: string;
  printerId: string;
  printerName: string;
  status: 'Queued' | 'Spooling' | 'Printing' | 'Completed' | 'Failed';
  progressPercent: number;
  pages: number;
  copies: number;
  paperSize: PaperSize;
  colorMode: ColorMode;
  separator: OrderSeparator;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  category: 'Printing' | 'E-Mitra' | 'Cards & Photos' | 'Online Services';
  description: string;
  startingPrice: number;
  unit: string; // e.g. 'per page', 'per card', 'per set', 'per service'
  active: boolean;
  featured?: boolean;
  iconName: string;
}

export interface BusinessProfile {
  shopName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  whatsappNumber: string;
  email: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  openingHours: string;
  upiId: string;
  qrPrintPortalUrl: string;
  retentionDays: number;
  demoMode: boolean;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Owner/Admin' | 'Manager' | 'Operator';
  active: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'printer' | 'system';
  targetUrl?: string;
  read: boolean;
  timestamp: string;
}

export type SeparatorType = OrderSeparator;

export interface WeeklyStat {
  day: string;
  orders: number;
  revenue: number;
}

export interface MonthlyStat {
  month: string;
  revenue: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

