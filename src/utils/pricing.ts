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
import { parseAndValidatePdfPageRange } from './pdfReader';

export interface PdfPricingConfig {
  pdf: {
    a4: {
      bw: {
        singleSided: number;
        backToBack: number;
      };
      color: {
        singleSided: number;
        backToBack: number;
      };
    };
  };
}

export const DEFAULT_PDF_PRICING: PdfPricingConfig = {
  pdf: {
    a4: {
      bw: {
        singleSided: 3.0,
        backToBack: 3.0,
      },
      color: {
        singleSided: 8.0,
        backToBack: 6.5,
      },
    },
  },
};

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
 * Centralized pricing calculation function specifically for PDF workflow
 * Returns exact printable pages, physical sheets, rates, and subtotal.
 */
export function calculatePdfPrice(
  doc: {
    pageCount?: number;
    pagesCount?: number;
    pageRange?: string;
    copies?: number;
    colorMode?: ColorMode;
    printStyle?: PrintStyle;
    paperSize?: PaperSize;
  },
  pricingRules: PricingRule[] = DEFAULT_PRICING_RULES,
  pdfPricing: PdfPricingConfig = DEFAULT_PDF_PRICING
): {
  printablePages: number;
  selectedPages: number[];
  sheetsCount: number;
  ratePerPage: number;
  subtotal: number;
  totalPrice: number;
} {
  const pageCount = Math.max(1, Number(doc.pageCount || (doc as any).pagesCount || 1));
  const pageRange = doc.pageRange || 'all';
  const rangeValidation = parseAndValidatePdfPageRange(pageRange, pageCount);
  const printablePages = Math.max(1, rangeValidation.isValid ? rangeValidation.selectedCount : pageCount);
  const copies = Math.max(1, Number(doc.copies || 1));

  const rawColor = String(doc.colorMode || '').toLowerCase();
  const isColor = rawColor === 'colour' || rawColor === 'color';
  const normColorMode: ColorMode = isColor ? 'Colour' : 'B&W';

  const rawStyle = String(doc.printStyle || '').toLowerCase();
  const isDuplex = rawStyle.includes('back') || rawStyle.includes('duplex');
  const normPrintStyle: PrintStyle = isDuplex ? 'Back-to-Back' : 'Single Sided';

  const normPaperSize: PaperSize = doc.paperSize === 'A3' ? 'A3' : 'A4';

  // Read rate from pricingRules (if available) or fallback to pdfPricing structure
  const ruleMatch = pricingRules.find(
    (r) =>
      r.paperSize === normPaperSize &&
      r.colorMode === normColorMode &&
      r.printStyle === normPrintStyle
  );

  let ratePerPage: number;
  if (ruleMatch && typeof ruleMatch.ratePerPage === 'number') {
    ratePerPage = ruleMatch.ratePerPage;
  } else {
    if (!isColor) {
      ratePerPage = isDuplex
        ? pdfPricing.pdf.a4.bw.backToBack
        : pdfPricing.pdf.a4.bw.singleSided;
    } else {
      ratePerPage = isDuplex
        ? pdfPricing.pdf.a4.color.backToBack
        : pdfPricing.pdf.a4.color.singleSided;
    }
  }

  if (!Number.isFinite(ratePerPage) || ratePerPage <= 0) {
    ratePerPage = isColor ? 8.0 : 3.0;
  }

  // Physical sheets calculation:
  // Single Sided: 10 pages * 1 copy = 10 sheets
  // Back-to-Back: 10 pages * 1 copy = 5 sheets
  // Odd pages rounded up: 5 pages, Back-to-Back, 1 copy = 3 sheets
  // Multiple copies: 5 pages, Back-to-Back, 2 copies = 10 printed sides = 5 physical sheets
  const totalPrintedSides = printablePages * copies;
  const sheetsCount = isDuplex
    ? Math.max(1, Math.ceil(totalPrintedSides / 2))
    : Math.max(1, totalPrintedSides);

  const subtotal = Number((ratePerPage * printablePages * copies).toFixed(2)) || 0;

  return {
    printablePages,
    selectedPages: rangeValidation.selectedPages?.length ? rangeValidation.selectedPages : [1],
    sheetsCount,
    ratePerPage,
    subtotal,
    totalPrice: subtotal,
  };
}

/**
 * Calculates single document total price
 */
export function calculateDocumentPricing(
  doc: {
    pageCount?: number;
    pagesCount?: number;
    pageRange?: string;
    copies?: number;
    paperSize?: PaperSize;
    colorMode?: ColorMode;
    printStyle?: PrintStyle;
    paperType?: PaperType;
    photoCollage?: PhotoCollage;
    fileType?: string;
    type?: string;
  },
  pricingRules: PricingRule[] = DEFAULT_PRICING_RULES
): { printablePages: number; sheetsCount: number; ratePerPage: number; totalPrice: number } {
  const fileType = (doc.fileType || doc.type || '').toLowerCase();
  if (fileType === 'pdf' || fileType.includes('pdf')) {
    const pdfCalc = calculatePdfPrice(doc, pricingRules);
    return {
      printablePages: pdfCalc.printablePages,
      sheetsCount: pdfCalc.sheetsCount,
      ratePerPage: pdfCalc.ratePerPage,
      totalPrice: pdfCalc.totalPrice,
    };
  }

  const pageCount = Math.max(1, Number(doc.pageCount || (doc as any).pagesCount || 1));
  const pageRange = doc.pageRange || 'all';
  const printablePages = Math.max(1, calculatePrintablePages(pageRange, pageCount) || 1);

  const rawStyle = String(doc.printStyle || '').toLowerCase();
  const normPrintStyle: PrintStyle =
    rawStyle.includes('back') || rawStyle.includes('duplex') ? 'Back-to-Back' : 'Single Sided';

  const photoCollage: PhotoCollage = doc.photoCollage || 'Original';

  const rawColor = String(doc.colorMode || '').toLowerCase();
  const normColorMode: ColorMode =
    rawColor === 'colour' || rawColor === 'color' ? 'Colour' : 'B&W';
  const normPaperSize: PaperSize = doc.paperSize === 'A3' ? 'A3' : 'A4';
  const normPaperType: PaperType =
    doc.paperType === 'Glossy Paper' ? 'Glossy Paper' : 'Plain Paper';

  let ratePerPage = findRatePerPage(
    normPaperSize,
    normColorMode,
    normPrintStyle,
    normPaperType,
    pricingRules
  );

  if (!Number.isFinite(ratePerPage) || ratePerPage <= 0) {
    ratePerPage = normColorMode === 'Colour' ? 8.0 : 3.0;
  }

  // Price = ratePerPage * printablePages * copies (or sheets if photo collage scaled)
  const copies = Math.max(1, Number(doc.copies || 1));
  const baseSheets = Math.max(1, calculateSheets(printablePages, normPrintStyle, photoCollage) || 1);
  const effectivePages = photoCollage !== 'Original' ? baseSheets : printablePages;
  const sheetsCount = baseSheets * copies;
  const totalPrice = Number((ratePerPage * effectivePages * copies).toFixed(2)) || 0;

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

  for (const doc of documents || []) {
    const calc = calculateDocumentPricing(doc, pricingRules);
    const copies = Math.max(1, Number(doc.copies || 1));
    subtotal += calc.totalPrice || 0;
    totalPrintablePages += (calc.printablePages || 1) * copies;
    totalSheets += calc.sheetsCount || 1;
  }

  subtotal = Number((subtotal || 0).toFixed(2));

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

/**
 * Centralized order pricing function
 * Accepts order documents or order object and calculates dynamic price
 */
export function calculatePrintPrice(
  orderOrDocs: { documents: DocumentItem[]; discountCode?: string } | DocumentItem[],
  pricingRules: PricingRule[] = DEFAULT_PRICING_RULES,
  discounts: DiscountRule[] = DEFAULT_DISCOUNTS
) {
  if (Array.isArray(orderOrDocs)) {
    return calculateOrderSummary(orderOrDocs, pricingRules, discounts);
  }
  return calculateOrderSummary(orderOrDocs.documents, pricingRules, discounts, orderOrDocs.discountCode);
}

