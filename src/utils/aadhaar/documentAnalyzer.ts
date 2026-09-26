import { pdfjsLib } from '../pdfViewerWorker';
import { DocumentItem, AadhaarDetectionResult, AadhaarPanels } from '../../types';
import { detectAadhaarLayout, refinePanelsWithCanvas } from './aadhaarDetector';
import { createAadhaarA4Layout } from './aadhaarLayoutEngine';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Helper to convert base64 or blob URL to ArrayBuffer
async function fetchPdfData(doc: DocumentItem, file?: File): Promise<ArrayBuffer> {
  if (file) {
    return await file.arrayBuffer();
  }
  if (doc.url) {
    if (doc.url.startsWith('data:')) {
      const base64Index = doc.url.indexOf(';base64,');
      if (base64Index !== -1) {
        const base64 = doc.url.substring(base64Index + 8);
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
    }
    // Object URL or http URL
    const res = await fetch(doc.url);
    return await res.arrayBuffer();
  }
  throw new Error('No PDF source data available for analysis');
}

export interface AnalysisProgressCallback {
  (status: 'ANALYZING' | 'AADHAAR_DETECTED' | 'STANDARD_PDF' | 'REVIEW_REQUIRED', message?: string): void;
}

/**
 * High-performance, privacy-respecting in-browser PDF analysis pipeline
 * Inspects pages, detects Aadhaar side-by-side card layout, and generates A4 print layout derivative.
 */
export async function analyzePdfDocument(
  doc: DocumentItem,
  file?: File,
  onProgress?: AnalysisProgressCallback
): Promise<{
  updatedDoc: DocumentItem;
  detectionResult: AadhaarDetectionResult | null;
}> {
  try {
    onProgress?.('ANALYZING', 'Analyzing document layout…');

    const pdfBuffer = await fetchPdfData(doc, file);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });

    const pdfDoc: PDFDocumentProxy = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    let matchedResult: AadhaarDetectionResult | null = null;
    let targetPageNum = 1;

    // Inspect each page (up to first 10 pages to maintain snappy browser performance)
    const maxPagesToInspect = Math.min(totalPages, 10);

    for (let p = 1; p <= maxPagesToInspect; p++) {
      const page = await pdfDoc.getPage(p);
      const detection = await detectAadhaarLayout(page, p);

      if (detection.detected) {
        matchedResult = detection;
        targetPageNum = p;
        break; // Found the Aadhaar page
      }
    }

    // If Aadhaar layout was not detected on any inspected page
    if (!matchedResult || !matchedResult.detected || !matchedResult.panels) {
      onProgress?.('STANDARD_PDF', 'Standard PDF detected');
      return {
        updatedDoc: {
          ...doc,
          detectedDocumentType: 'standard_pdf',
          layoutStatus: 'STANDARD_PDF',
          detectionConfidence: 0,
        },
        detectionResult: null,
      };
    }

    // Aadhaar was detected!
    const status = matchedResult.status;
    onProgress?.(
      status === 'REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' : 'AADHAAR_DETECTED',
      status === 'REVIEW_REQUIRED'
        ? 'Possible Aadhaar layout detected — review recommended'
        : 'Aadhaar layout detected (Front & Back panels)'
    );

    // Render the target Aadhaar page at high resolution (scale 2.5 for crisp print composition)
    const targetPage = await pdfDoc.getPage(targetPageNum);
    const renderScale = 2.5;
    const viewport = targetPage.getViewport({ scale: renderScale });

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = Math.round(viewport.width);
    sourceCanvas.height = Math.round(viewport.height);
    const ctx = sourceCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not create canvas 2D context for PDF rendering');
    }

    await targetPage.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    // Refine panel coordinates with canvas
    const refinedPanels = refinePanelsWithCanvas(sourceCanvas, matchedResult.panels);

    // Create the A4 print layout derivative (Front on top, Back below, horizontally centered, both upright)
    const { printLayoutDataUrl, thumbnailDataUrl } = await createAadhaarA4Layout(
      sourceCanvas,
      refinedPanels
    );

    // Clean up offscreen source canvas to free memory
    sourceCanvas.width = 1;
    sourceCanvas.height = 1;

    const isSinglePageOrAadhaarSoleDoc = totalPages === 1;

    const updatedDoc: DocumentItem = {
      ...doc,
      detectedDocumentType: 'aadhaar_card',
      detectionConfidence: matchedResult.confidence,
      detectedPanels: refinedPanels,
      layoutStatus: status === 'REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' : 'LAYOUT_GENERATED',
      printLayoutUrl: printLayoutDataUrl,
      printLayoutThumbnail: thumbnailDataUrl,
      originalUrl: doc.originalUrl || doc.url,
      isAadhaarDerivative: true,
      useAadhaarLayout: status !== 'REVIEW_REQUIRED',
      // If the source was a 1-page Aadhaar letter, print output is 1 A4 physical sheet
      printablePages: isSinglePageOrAadhaarSoleDoc ? 1 : doc.printablePages,
      sheetsCount: isSinglePageOrAadhaarSoleDoc ? 1 : doc.sheetsCount,
      physicalSheets: isSinglePageOrAadhaarSoleDoc ? 1 : doc.physicalSheets,
      totalPrice: isSinglePageOrAadhaarSoleDoc ? doc.ratePerPage * doc.copies : doc.totalPrice,
      subtotal: isSinglePageOrAadhaarSoleDoc ? doc.ratePerPage * doc.copies : doc.subtotal,
    };

    return {
      updatedDoc,
      detectionResult: {
        ...matchedResult,
        printLayoutDataUrl,
        printLayoutThumbnail: thumbnailDataUrl,
      },
    };
  } catch (err) {
    console.error('Error during in-browser PDF analysis:', err);
    return {
      updatedDoc: {
        ...doc,
        detectedDocumentType: 'standard_pdf',
        layoutStatus: 'STANDARD_PDF',
      },
      detectionResult: null,
    };
  }
}
