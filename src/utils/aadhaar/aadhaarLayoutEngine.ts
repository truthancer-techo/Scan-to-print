import { AadhaarPanels, BoundingBox } from '../../types';

/**
 * Standard A4 Canvas Dimensions at 300 DPI for ultra-sharp print output
 * A4 physical dimensions: 210mm x 297mm
 * At 300 DPI: 2480px x 3508px (ratio: 1 : 1.4145)
 */
export const A4_WIDTH_PX = 2480;
export const A4_HEIGHT_PX = 3508;

/**
 * Standard ID-1 card dimensions (Aadhaar physical card size):
 * 85.6mm x 53.98mm (width x height)
 * On an A4 sheet (210mm wide), 85.6mm corresponds to ~40.76% of page width.
 * For optimal visual clarity and standard print margins, target card width is ~1040px (~42% of A4 width).
 */
export const TARGET_CARD_WIDTH_PX = 1050; // ~89mm wide on A4 page
export const CARD_VERTICAL_GAP_PX = 160;  // ~13.5mm clean professional gap

export interface LayoutOptions {
  customGap?: number;
  customCardWidth?: number;
  rotation?: number; // 0, 90, 180, 270
}

/**
 * Validates that panel coordinates and dimensions are sound and within printable bounds
 */
export function validatePanel(panel: BoundingBox): boolean {
  if (!panel) return false;
  if (panel.width <= 0 || panel.height <= 0) return false;
  if (panel.x < 0 || panel.y < 0) return false;
  if (panel.x + panel.width > 1.05 || panel.y + panel.height > 1.05) return false;
  return true;
}

/**
 * Crops a panel from a source canvas and draws it onto target canvas with exact pixel mapping
 */
function cropPanelToCanvas(
  sourceCanvas: HTMLCanvasElement,
  panel: BoundingBox
): HTMLCanvasElement {
  const cropCanvas = document.createElement('canvas');
  const srcWidth = sourceCanvas.width;
  const srcHeight = sourceCanvas.height;

  // Convert normalized (0..1) coordinates to source canvas pixels
  const sx = Math.max(0, Math.min(srcWidth - 1, Math.round(panel.x * srcWidth)));
  const sy = Math.max(0, Math.min(srcHeight - 1, Math.round(panel.y * srcHeight)));
  const sw = Math.max(1, Math.min(srcWidth - sx, Math.round(panel.width * srcWidth)));
  const sh = Math.max(1, Math.min(srcHeight - sy, Math.round(panel.height * srcHeight)));

  cropCanvas.width = sw;
  cropCanvas.height = sh;
  const ctx = cropCanvas.getContext('2d');
  if (ctx) {
    // Pixel-accurate copy, no hallucination or re-drawing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  }

  return cropCanvas;
}

/**
 * Creates an A4 print layout derivative with:
 * - A4 fixed canvas (210 x 297mm)
 * - Crisp pure white background
 * - Aadhaar FRONT panel centered horizontally in upper portion
 * - Aadhaar BACK panel centered horizontally below FRONT panel
 * - Both panels upright (DO NOT rotate back side!)
 * - Proportional scaling with preserved aspect ratio
 * - Clean professional print margins
 */
export async function createAadhaarA4Layout(
  sourceCanvas: HTMLCanvasElement,
  panels: AadhaarPanels,
  options?: LayoutOptions
): Promise<{ printLayoutDataUrl: string; thumbnailDataUrl: string }> {
  const a4Canvas = document.createElement('canvas');
  a4Canvas.width = A4_WIDTH_PX;
  a4Canvas.height = A4_HEIGHT_PX;

  const ctx = a4Canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to obtain A4 canvas 2D context');
  }

  // 1. Fill crisp pure white paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);

  // 2. Crop FRONT panel and BACK panel cleanly from source
  const frontCrop = cropPanelToCanvas(sourceCanvas, panels.front);
  const backCrop = cropPanelToCanvas(sourceCanvas, panels.back);

  // 3. Compute proportional card sizing
  // Use front card's aspect ratio (standard ~1.58), or normalize between the two
  const frontAspect = frontCrop.width / Math.max(1, frontCrop.height);
  const backAspect = backCrop.width / Math.max(1, backCrop.height);

  const targetWidth = options?.customCardWidth || TARGET_CARD_WIDTH_PX;
  const frontHeight = Math.round(targetWidth / (frontAspect || 1.58));
  const backHeight = Math.round(targetWidth / (backAspect || 1.58));

  const gap = options?.customGap ?? CARD_VERTICAL_GAP_PX;
  const totalCardsHeight = frontHeight + gap + backHeight;

  // 4. Center horizontally and place in upper portion of A4
  // We position the cards so the FRONT is slightly above the vertical center,
  // leaving generous, balanced margins on top and bottom.
  // Standard vertical placement: center the two-card group slightly above center
  const groupCenterY = A4_HEIGHT_PX * 0.46; // slightly above 50%
  const startY = Math.max(200, Math.round(groupCenterY - totalCardsHeight / 2));

  const frontX = Math.round((A4_WIDTH_PX - targetWidth) / 2);
  const frontY = startY;

  const backX = Math.round((A4_WIDTH_PX - targetWidth) / 2); // aligned to the exact same center axis
  const backY = frontY + frontHeight + gap;

  // 5. Draw FRONT card
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(frontCrop, frontX, frontY, targetWidth, frontHeight);

  // 6. Draw BACK card (upright! NEVER rotate 180 degrees)
  ctx.drawImage(backCrop, backX, backY, targetWidth, backHeight);

  // 7. Optional subtle light cut guides / corner ticks for print shops (very faint, print safe)
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(frontX - 0.5, frontY - 0.5, targetWidth + 1, frontHeight + 1);
  ctx.strokeRect(backX - 0.5, backY - 0.5, targetWidth + 1, backHeight + 1);

  // 8. Generate print-ready high-resolution data URL
  const printLayoutDataUrl = a4Canvas.toDataURL('image/png', 0.95);

  // 9. Generate thumbnail for fast rendering in document card
  const thumbCanvas = document.createElement('canvas');
  const thumbWidth = 280;
  const thumbHeight = Math.round(thumbWidth * (A4_HEIGHT_PX / A4_WIDTH_PX));
  thumbCanvas.width = thumbWidth;
  thumbCanvas.height = thumbHeight;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (thumbCtx) {
    thumbCtx.imageSmoothingEnabled = true;
    thumbCtx.drawImage(a4Canvas, 0, 0, thumbWidth, thumbHeight);
  }
  const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.85);

  return {
    printLayoutDataUrl,
    thumbnailDataUrl,
  };
}
