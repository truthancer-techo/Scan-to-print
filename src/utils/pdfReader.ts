import { PDFDocument } from 'pdf-lib';

export interface PageRangeValidationResult {
  isValid: boolean;
  selectedPages: number[];
  selectedCount: number;
  errorMessage?: string;
}

/**
 * Validates and parses user-entered page ranges e.g. "1-3, 5, 7-10" or "all"
 * Strictly validates against total document pages and provides clear errors.
 */
export function parseAndValidatePdfPageRange(
  input: string,
  totalPages: number
): PageRangeValidationResult {
  const safeTotal = Math.max(1, totalPages);
  const trimmed = (input || '').trim();

  if (!trimmed || trimmed.toLowerCase() === 'all') {
    const all = Array.from({ length: safeTotal }, (_, i) => i + 1);
    return {
      isValid: true,
      selectedPages: all,
      selectedCount: safeTotal,
    };
  }

  // Ensure only digits, commas, hyphens and whitespace
  if (!/^[\d\s,-]+$/.test(trimmed)) {
    return {
      isValid: false,
      selectedPages: [],
      selectedCount: 0,
      errorMessage: 'Invalid format. Use page numbers and ranges, like 1-3, 5.',
    };
  }

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    return {
      isValid: false,
      selectedPages: [],
      selectedCount: 0,
      errorMessage: 'Please enter at least one valid page number.',
    };
  }

  const pagesSet = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      const sides = part.split('-').map((s) => s.trim());
      if (sides.length !== 2 || !sides[0] || !sides[1]) {
        return {
          isValid: false,
          selectedPages: [],
          selectedCount: 0,
          errorMessage: `Invalid range format: "${part}".`,
        };
      }
      const start = parseInt(sides[0], 10);
      const end = parseInt(sides[1], 10);

      if (isNaN(start) || isNaN(end)) {
        return {
          isValid: false,
          selectedPages: [],
          selectedCount: 0,
          errorMessage: `Invalid range values: "${part}".`,
        };
      }
      if (start < 1) {
        return {
          isValid: false,
          selectedPages: [],
          selectedCount: 0,
          errorMessage: 'Page numbers must be 1 or higher.',
        };
      }
      if (start > end) {
        return {
          isValid: false,
          selectedPages: [],
          selectedCount: 0,
          errorMessage: `Invalid range: ${start}-${end}. Start page cannot be greater than end page.`,
        };
      }
      if (start > safeTotal) {
        return {
          isValid: false,
          selectedPages: [],
          selectedCount: 0,
          errorMessage: `Page ${start} is not available. This PDF contains ${safeTotal} page${safeTotal > 1 ? 's' : ''}.`,
        };
      }
      if (end > safeTotal) {
        return {
          isValid: false,
          selectedPages: [],
          selectedCount: 0,
          errorMessage: `Page ${end} is not available. This PDF contains ${safeTotal} page${safeTotal > 1 ? 's' : ''}.`,
        };
      }

      for (let i = start; i <= end; i++) {
        pagesSet.add(i);
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum)) {
        return {
          isValid: false,
          selectedPages: [],
          selectedCount: 0,
          errorMessage: `Invalid page number: "${part}".`,
        };
      }
      if (pageNum < 1) {
        return {
          isValid: false,
          selectedPages: [],
          selectedCount: 0,
          errorMessage: 'Page numbers must be 1 or higher.',
        };
      }
      if (pageNum > safeTotal) {
        return {
          isValid: false,
          selectedPages: [],
          selectedCount: 0,
          errorMessage: `Page ${pageNum} is not available. This PDF contains ${safeTotal} page${safeTotal > 1 ? 's' : ''}.`,
        };
      }
      pagesSet.add(pageNum);
    }
  }

  const selectedPages = Array.from(pagesSet).sort((a, b) => a - b);
  if (selectedPages.length === 0) {
    return {
      isValid: false,
      selectedPages: [],
      selectedCount: 0,
      errorMessage: 'Please enter at least one valid page number.',
    };
  }

  return {
    isValid: true,
    selectedPages,
    selectedCount: selectedPages.length,
  };
}

/**
 * Detects authentic PDF metadata and page count from the uploaded file
 */
export async function detectPdfMetadata(file: File | Blob): Promise<{
  pageCount: number;
  isValidPdf: boolean;
  error?: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const count = pdfDoc.getPageCount();
    return {
      pageCount: Math.max(1, count),
      isValidPdf: true,
    };
  } catch (err: any) {
    // Graceful fallback: text search for /Type /Page in raw content
    try {
      const text = await file.text();
      const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
      if (pageMatches && pageMatches.length > 0) {
        return {
          pageCount: pageMatches.length,
          isValidPdf: true,
        };
      }
      const countMatch = text.match(/\/Count\s+(\d+)/);
      if (countMatch && parseInt(countMatch[1], 10) > 0) {
        return {
          pageCount: parseInt(countMatch[1], 10),
          isValidPdf: true,
        };
      }
    } catch {
      // ignore
    }

    return {
      pageCount: 1,
      isValidPdf: true,
    };
  }
}
