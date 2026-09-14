import {
  ColorMode,
  DiscountRule,
  DocumentItem,
  PaperSize,
  PaperType,
  PhotoCollage,
  PricingRule,
  PrintStyle,
} from '../types';

export const DEFAULT_PRICING_RULES: PricingRule[] = [
  {
    id: 'a4-bw-single',
    paperSize: 'A4',
    colorMode: 'B&W',
    printStyle: 'Single Sided',
    paperType: 'Plain Paper',
    ratePerPage: 3.0,
  },
  {
    id: 'a4-bw-duplex',
    paperSize: 'A4',
    colorMode: 'B&W',
    printStyle: 'Back-to-Back',
    paperType: 'Plain Paper',
    ratePerPage: 3.0, // ₹3/page as specified
  },
  {
    id: 'a4-color-single',
    paperSize: 'A4',
    colorMode: 'Colour',
    printStyle: 'Single Sided',
    paperType: 'Plain Paper',
    ratePerPage: 8.0,
  },
  {
    id: 'a4-color-duplex',
    paperSize: 'A4',
    colorMode: 'Colour',
    printStyle: 'Back-to-Back',
    paperType: 'Plain Paper',
    ratePerPage: 6.5,
  },
  {
    id: 'a3-bw-single',
    paperSize: 'A3',
    colorMode: 'B&W',
    printStyle: 'Single Sided',
    paperType: 'Plain Paper',
    ratePerPage: 1.5,
  },
  {
    id: 'a3-bw-duplex',
    paperSize: 'A3',
    colorMode: 'B&W',
    printStyle: 'Back-to-Back',
    paperType: 'Plain Paper',
    ratePerPage: 1.2,
  },
  {
    id: 'a3-color-single',
    paperSize: 'A3',
    colorMode: 'Colour',
    printStyle: 'Single Sided',
    paperType: 'Plain Paper',
    ratePerPage: 8.0,
  },
  {
    id: 'a3-color-duplex',
    paperSize: 'A3',
    colorMode: 'Colour',
    printStyle: 'Back-to-Back',
    paperType: 'Plain Paper',
    ratePerPage: 6.5,
  },
];

export const GLOSSY_PAPER_SURCHARGE = 4.0; // ₹4 per sheet extra for glossy

export const DEFAULT_DISCOUNTS: DiscountRule[] = [
  {
    id: 'bulk-100',
    title: 'Bulk Savings (100+ pages)',
    description: '5% off on print orders exceeding 100 pages',
    type: 'bulk',
    minPages: 100,
    percentage: 5,
    active: true,
  },
  {
    id: 'bulk-250',
    title: 'Super Bulk (250+ pages)',
    description: '10% off on print orders exceeding 250 pages',
    type: 'bulk',
    minPages: 250,
    percentage: 10,
    active: true,
  },
  {
    id: 'coupon-sonu10',
    code: 'SONU10',
    title: 'Shop Special 10%',
    description: 'Flat 10% discount on orders above ₹100',
    type: 'coupon',
    minAmount: 100,
    percentage: 10,
    active: true,
  },
];

/**
 * Parses user page range e.g. "1-5, 8, 10-12" or "all"
 */
export function calculatePrintablePages(pageRange: string, totalPages: number): number {
  if (!pageRange || pageRange.trim().toLowerCase() === 'all') {
    return Math.max(1, totalPages);
  }

  const set = new Set<number>();
  const parts = pageRange.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          set.add(i);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        set.add(num);
      }
    }
  }

  return set.size > 0 ? set.size : totalPages;
}

/**
 * Calculates physical sheet count produced by print style and photo collage
 */
export function calculateSheets(
  printablePages: number,
  printStyle: PrintStyle,
  photoCollage: PhotoCollage
): number {
  let pagesPerSheet = 1;
  switch (photoCollage) {
    case '2/page':
      pagesPerSheet = 2;
      break;
    case '4/page':
      pagesPerSheet = 4;
      break;
    case '6/page':
      pagesPerSheet = 6;
      break;
    case '9/page':
      pagesPerSheet = 9;
      break;
    case '12/page':
      pagesPerSheet = 12;
      break;
    case '16/page':
      pagesPerSheet = 16;
      break;
    case 'Original':
    default:
      pagesPerSheet = 1;
      break;
  }

  // Number of single-sided faces
  const faces = Math.ceil(printablePages / pagesPerSheet);

  if (printStyle === 'Back-to-Back') {
    return Math.ceil(faces / 2);
  }
  return faces;
}

/**
 * Finds rate per page from pricing rules
 */
export function findRatePerPage(
  paperSize: PaperSize,
  colorMode: ColorMode,
  printStyle: PrintStyle,
  paperType: PaperType,
  rules: PricingRule[]
): number {
  const match = rules.find(
    (r) =>
      r.paperSize === paperSize &&
      r.colorMode === colorMode &&
      r.printStyle === printStyle
  );

  let baseRate = match ? match.ratePerPage : 3.0;

  if (paperType === 'Glossy Paper') {
    baseRate += GLOSSY_PAPER_SURCHARGE;
  }

  return baseRate;
}

/**
 * Calculates single document total price
 */
export function calculateDocumentPricing(
  doc: {
    pageCount: number;
    pageRange: string;
    copies: number;
    paperSize: PaperSize;
    colorMode: ColorMode;
    printStyle: PrintStyle;
    paperType: PaperType;
    photoCollage: PhotoCollage;
  },
  pricingRules: PricingRule[] = DEFAULT_PRICING_RULES
): { printablePages: number; sheetsCount: number; ratePerPage: number; totalPrice: number } {
  const printablePages = calculatePrintablePages(doc.pageRange, doc.pageCount);
  const sheetsCount = calculateSheets(printablePages, doc.printStyle, doc.photoCollage);
  const ratePerPage = findRatePerPage(
    doc.paperSize,
    doc.colorMode,
    doc.printStyle,
    doc.paperType,
    pricingRules
  );

  // Price = ratePerPage * printablePages * copies (or sheets if photo collage scaled)
  const effectivePages = doc.photoCollage !== 'Original' ? sheetsCount : printablePages;
  const totalPrice = Number((ratePerPage * effectivePages * Math.max(1, doc.copies)).toFixed(2));

  return {
    printablePages,
    sheetsCount,
    ratePerPage,
    totalPrice,
  };
}

/**
 * Calculates entire order pricing with discounts
 */
export function calculateOrderSummary(
  documents: DocumentItem[],
  pricingRules: PricingRule[] = DEFAULT_PRICING_RULES,
  discounts: DiscountRule[] = DEFAULT_DISCOUNTS,
  couponCode?: string
): {
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  appliedDiscountTitle?: string;
  totalPrintablePages: number;
  totalSheets: number;
} {
  let subtotal = 0;
  let totalPrintablePages = 0;
  let totalSheets = 0;

  for (const doc of documents) {
    const calc = calculateDocumentPricing(doc, pricingRules);
    subtotal += calc.totalPrice;
    totalPrintablePages += calc.printablePages * doc.copies;
    totalSheets += calc.sheetsCount * doc.copies;
  }

  subtotal = Number(subtotal.toFixed(2));

  let discountAmount = 0;
  let appliedDiscountTitle: string | undefined;

  // 1. Check coupon code if provided
  if (couponCode && couponCode.trim()) {
    const normalized = couponCode.trim().toUpperCase();
    const coupon = discounts.find(
      (d) => d.active && d.type === 'coupon' && d.code?.toUpperCase() === normalized
    );
    if (coupon) {
      if (!coupon.minAmount || subtotal >= coupon.minAmount) {
        if (coupon.percentage) {
          discountAmount = Number(((subtotal * coupon.percentage) / 100).toFixed(2));
          appliedDiscountTitle = `${coupon.title} (-${coupon.percentage}%)`;
        } else if (coupon.fixedAmount) {
          discountAmount = Math.min(subtotal, coupon.fixedAmount);
          appliedDiscountTitle = `${coupon.title} (-₹${coupon.fixedAmount})`;
        }
      }
    }
  }

  // 2. If no coupon, check bulk discount
  if (discountAmount === 0) {
    const bulkDiscounts = discounts
      .filter((d) => d.active && d.type === 'bulk' && d.minPages && totalPrintablePages >= d.minPages)
      .sort((a, b) => (b.minPages || 0) - (a.minPages || 0));

    if (bulkDiscounts.length > 0) {
      const bestBulk = bulkDiscounts[0];
      if (bestBulk.percentage) {
        discountAmount = Number(((subtotal * bestBulk.percentage) / 100).toFixed(2));
        appliedDiscountTitle = `${bestBulk.title} (-${bestBulk.percentage}%)`;
      }
    }
  }

  const totalAmount = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

  return {
    subtotal,
    discountAmount,
    totalAmount,
    appliedDiscountTitle,
    totalPrintablePages,
    totalSheets,
  };
}
