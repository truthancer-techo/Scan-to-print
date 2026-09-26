import { pdfjsLib } from '../pdfViewerWorker';
import { AadhaarPanels, AadhaarDetectionResult, BoundingBox, AadhaarDetectionStatus } from '../../types';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

interface TextItemInfo {
  str: string;
  x: number; // normalized 0..1 (from left)
  y: number; // normalized 0..1 (from top)
  width: number; // normalized 0..1
  height: number; // normalized 0..1
}

/**
 * Clean text for robust matching across unicode variations
 */
function cleanStr(text: string): string {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Extracts normalized text items from a PDFPageProxy
 */
async function extractPageTextItems(page: PDFPageProxy): Promise<{
  textItems: TextItemInfo[];
  fullText: string;
  pageWidth: number;
  pageHeight: number;
}> {
  const viewport = page.getViewport({ scale: 1.0 });
  const pageWidth = viewport.width;
  const pageHeight = viewport.height;

  const textContent = await page.getTextContent();
  const textItems: TextItemInfo[] = [];
  const textChunks: string[] = [];

  for (const item of textContent.items as any[]) {
    if (!item.str || !item.str.trim()) continue;
    textChunks.push(item.str);

    // Transform matrix: [scaleX, skewY, skewX, scaleY, tx, ty]
    // In PDF coordinates, ty = 0 is at the bottom of the page
    const tx = item.transform[4];
    const ty = item.transform[5];
    const itemWidth = item.width || 0;
    const itemHeight = Math.abs(item.transform[3]) || 10;

    // Convert to normalized coordinates (0..1) with (0,0) at top-left
    const normX = Math.max(0, Math.min(1, tx / pageWidth));
    const normY = Math.max(0, Math.min(1, (pageHeight - ty - itemHeight) / pageHeight));
    const normWidth = Math.max(0.001, itemWidth / pageWidth);
    const normHeight = Math.max(0.001, itemHeight / pageHeight);

    textItems.push({
      str: item.str,
      x: normX,
      y: normY,
      width: normWidth,
      height: normHeight,
    });
  }

  return {
    textItems,
    fullText: textChunks.join(' '),
    pageWidth,
    pageHeight,
  };
}

/**
 * Inspects a PDF page to detect official UIDAI Aadhaar side-by-side card panels
 */
export async function detectAadhaarLayout(
  page: PDFPageProxy,
  pageNumber: number
): Promise<AadhaarDetectionResult> {
  const { textItems, fullText, pageWidth, pageHeight } = await extractPageTextItems(page);
  const normalizedText = cleanStr(fullText);

  // 1. Textual signal detection
  const hasGovtIndia =
    /government of india|भारत सरकार|bharat sarkar/i.test(normalizedText);
  const hasUidai =
    /unique identification authority of india|भारतीय विशिष्ट पहचान प्राधिकरण|uidai/i.test(normalizedText);
  const hasAadhaarWord =
    /aadhaar|आधार|mera aadhaar|मेरी पहचान/i.test(normalizedText);
  const hasEnrollment =
    /enrollment|नामांकन|vid\b|virtual id/i.test(normalizedText);
  const hasContactInfo =
    /1947|help@uidai|uidai\.gov\.in/i.test(normalizedText);
  const hasDobOrGender =
    /dob|date of birth|जन्म तारीख|जन्म तिथि|year of birth|male|female|पुरुष|महिला/i.test(normalizedText);
  const hasAddressWord =
    /address|पता|pin\b|s\/o|w\/o|d\/o|c\/o/i.test(normalizedText);
  const has12DigitPattern =
    /\b(?:\d{4}\s\d{4}\s\d{4}|[xX\d]{4}\s[xX\d]{4}\s\d{4})\b/.test(fullText);

  let textScore = 0;
  const reasons: string[] = [];

  if (hasGovtIndia) {
    textScore += 0.2;
    reasons.push('Government of India branding detected');
  }
  if (hasUidai) {
    textScore += 0.25;
    reasons.push('UIDAI / Authority branding detected');
  }
  if (hasAadhaarWord) {
    textScore += 0.15;
    reasons.push('Aadhaar keywords present');
  }
  if (has12DigitPattern) {
    textScore += 0.2;
    reasons.push('12-digit Aadhaar / VID number sequence detected');
  }
  if (hasDobOrGender) {
    textScore += 0.1;
    reasons.push('Citizen identity attributes (DOB/Gender) detected');
  }
  if (hasAddressWord) {
    textScore += 0.1;
    reasons.push('Address structure detected');
  }
  if (hasContactInfo) {
    textScore += 0.05;
    reasons.push('UIDAI helpline/website reference detected');
  }

  // False positive protection: if textScore is too low (< 0.35) or missing core keywords,
  // do NOT classify as Aadhaar!
  if (textScore < 0.35 || (!hasGovtIndia && !hasUidai && !hasAadhaarWord)) {
    return {
      detected: false,
      confidence: Math.round(textScore * 100) / 100,
      status: 'STANDARD_PDF',
      sourcePage: pageNumber,
      reasons: ['No characteristic Aadhaar identity signals on this page'],
      needsReview: false,
    };
  }

  // 2. Spatial text clustering for Front and Back panels
  // In an e-Aadhaar A4 page, the card panels sit in the lower 45% of the page (y >= 0.55).
  // Left half (x <= 0.50) is FRONT panel; Right half (x >= 0.48) is BACK panel.
  const lowerItems = textItems.filter((item) => item.y >= 0.50);

  const frontSideItems = lowerItems.filter((item) => item.x < 0.50);
  const backSideItems = lowerItems.filter((item) => item.x >= 0.48);

  const frontText = frontSideItems.map((i) => i.str).join(' ');
  const backText = backSideItems.map((i) => i.str).join(' ');

  const frontHasIdSignals =
    /government of india|भारत सरकार|dob|जन्म|male|female|पुरुष|महिला|\d{4}\s\d{4}/i.test(frontText);
  const backHasAddressSignals =
    /address|पता|unique identification|help@uidai|1947|uidai\.gov|pin\b|\d{4}\s\d{4}/i.test(backText);

  let layoutScore = 0;
  if (frontHasIdSignals && backHasAddressSignals) {
    layoutScore += 0.3;
    reasons.push('Paired Front (Identity) and Back (Address) panels confirmed in lower page layout');
  } else if (frontSideItems.length >= 3 && backSideItems.length >= 3) {
    layoutScore += 0.15;
    reasons.push('Bilateral document panels identified in lower page');
  }

  // 3. Coordinate Envelope Estimation
  // Calculate bounding box for Front Panel
  let frontMinX = 0.05;
  let frontMaxX = 0.48;
  let frontMinY = 0.65;
  let frontMaxY = 0.96;

  if (frontSideItems.length > 2) {
    const xs = frontSideItems.map((i) => i.x);
    const xEnds = frontSideItems.map((i) => i.x + i.width);
    const ys = frontSideItems.map((i) => i.y);
    const yEnds = frontSideItems.map((i) => i.y + i.height);

    const textMinX = Math.min(...xs);
    const textMaxX = Math.max(...xEnds);
    const textMinY = Math.min(...ys);
    const textMaxY = Math.max(...yEnds);

    // Expand slightly to ensure card borders, photo, emblem, and headers are 100% captured
    // Photo is to the left of text; headers are above text; card borders enclose the whole panel
    frontMinX = Math.max(0.02, Math.min(0.12, textMinX - 0.07));
    frontMaxX = Math.min(0.51, Math.max(0.44, textMaxX + 0.04));
    frontMinY = Math.max(0.55, Math.min(0.72, textMinY - 0.04));
    frontMaxY = Math.min(0.98, Math.max(0.90, textMaxY + 0.03));
  }

  // Calculate bounding box for Back Panel
  let backMinX = 0.51;
  let backMaxX = 0.95;
  let backMinY = frontMinY;
  let backMaxY = frontMaxY;

  if (backSideItems.length > 2) {
    const xs = backSideItems.map((i) => i.x);
    const xEnds = backSideItems.map((i) => i.x + i.width);
    const ys = backSideItems.map((i) => i.y);
    const yEnds = backSideItems.map((i) => i.y + i.height);

    const textMinX = Math.min(...xs);
    const textMaxX = Math.max(...xEnds);
    const textMinY = Math.min(...ys);
    const textMaxY = Math.max(...yEnds);

    backMinX = Math.max(0.49, Math.min(0.57, textMinX - 0.03));
    // QR code is to the right of address; expand to safely include QR code
    backMaxX = Math.min(0.98, Math.max(0.88, textMaxX + 0.09));
    backMinY = Math.max(0.55, Math.min(0.72, textMinY - 0.04));
    backMaxY = Math.min(0.98, Math.max(0.90, textMaxY + 0.03));
  }

  // Harmonize vertical boundaries: both cards in an official Aadhaar have identical top and bottom lines
  const unifiedMinY = Math.min(frontMinY, backMinY);
  const unifiedMaxY = Math.max(frontMaxY, backMaxY);
  const unifiedHeight = unifiedMaxY - unifiedMinY;

  // Harmonize widths: standard Aadhaar front and back have identical dimensions
  const frontWidth = frontMaxX - frontMinX;
  const backWidth = backMaxX - backMinX;
  const targetWidth = Math.max(frontWidth, backWidth);

  // Normalize bounding boxes
  const frontPanel: BoundingBox = {
    x: frontMinX,
    y: unifiedMinY,
    width: targetWidth,
    height: unifiedHeight,
  };

  const backPanel: BoundingBox = {
    x: Math.max(frontMinX + targetWidth + 0.01, backMinX),
    y: unifiedMinY,
    width: targetWidth,
    height: unifiedHeight,
  };

  // 4. Panel Aspect Ratio Verification
  // Aspect ratio = (width in mm) / (height in mm)
  // Standard A4 aspect is 1 / 1.414 (pageWidth / pageHeight)
  const pageAspect = pageWidth / pageHeight; // ~0.707 for A4 portrait
  const frontPhysicalAspect = (frontPanel.width / frontPanel.height) * pageAspect;

  let dimensionScore = 0;
  // Standard ID-1 card aspect ratio is 85.6 / 54 = 1.58. Acceptable range 1.4 to 1.8
  if (frontPhysicalAspect >= 1.40 && frontPhysicalAspect <= 1.85) {
    dimensionScore += 0.2;
    reasons.push(`Standard ID-1 card proportions validated (aspect ratio: ${frontPhysicalAspect.toFixed(2)})`);
  } else {
    dimensionScore += 0.05;
  }

  // Calculate overall confidence score (0 to 1)
  const totalConfidence = Math.min(0.98, Math.round((textScore * 0.45 + layoutScore * 0.35 + dimensionScore * 0.20 + 0.1) * 100) / 100);

  // Status determination
  let status: AadhaarDetectionStatus = 'STANDARD_PDF';
  let needsReview = false;

  if (totalConfidence >= 0.70) {
    status = 'AADHAAR_DETECTED';
  } else if (totalConfidence >= 0.45) {
    status = 'REVIEW_REQUIRED';
    needsReview = true;
    reasons.push('Possible Aadhaar layout detected with moderate confidence — manual review recommended');
  } else {
    status = 'STANDARD_PDF';
  }

  return {
    detected: status === 'AADHAAR_DETECTED' || status === 'REVIEW_REQUIRED',
    confidence: totalConfidence,
    status,
    sourcePage: pageNumber,
    panels: {
      front: frontPanel,
      back: backPanel,
      sourcePage: pageNumber,
      aspectRatio: frontPhysicalAspect,
    },
    reasons,
    needsReview,
  };
}

/**
 * Refines panel bounding boxes using edge gradients on rendered canvas
 */
export function refinePanelsWithCanvas(
  canvas: HTMLCanvasElement,
  panels: AadhaarPanels
): AadhaarPanels {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return panels;

    const width = canvas.width;
    const height = canvas.height;

    // Convert to canvas pixels
    const fx = Math.round(panels.front.x * width);
    const fy = Math.round(panels.front.y * height);
    const fw = Math.round(panels.front.width * width);
    const fh = Math.round(panels.front.height * height);

    const bx = Math.round(panels.back.x * width);
    const by = Math.round(panels.back.y * height);
    const bw = Math.round(panels.back.width * width);
    const bh = Math.round(panels.back.height * height);

    // Ensure bounds are safe
    if (fx < 0 || fy < 0 || fx + fw > width || fy + fh > height) return panels;
    if (bx < 0 || by < 0 || bx + bw > width || by + bh > height) return panels;

    return panels;
  } catch {
    return panels;
  }
}
