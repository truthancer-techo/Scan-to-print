import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Download,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  CheckCircle2,
  Eye,
  Loader2,
} from 'lucide-react';
import { DocumentItem } from '../../../types';
import { pdfjsLib } from '../../../utils/pdfViewerWorker';
import { useModalScrollLock } from '../../../utils/useModalScrollLock';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Convert base64 dataUrl to Uint8Array safely for high-performance memory loading
function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    const base64Index = dataUrl.indexOf(';base64,');
    if (base64Index !== -1) {
      const base64 = dataUrl.substring(base64Index + 8);
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  } catch (err) {
    console.error('Failed to convert dataUrl to Uint8Array:', err);
  }
  return null;
}

interface PdfPreviewProps {
  document: DocumentItem;
  onClose?: () => void;
  className?: string;
  isModal?: boolean;
}

interface PageRenderItemProps {
  pdfDoc: PDFDocumentProxy;
  pageNum: number;
  scale: number;
  baseWidth: number;
  isSelectedForPrint: boolean;
  hasCustomSelection: boolean;
  onVisible: (pageNum: number) => void;
  cachedAspectRatio?: number;
}

/**
 * Individual Page Renderer with IntersectionObserver lazy-loading
 * and cancellation of previous render tasks.
 */
const PageRenderItem: React.FC<PageRenderItemProps> = ({
  pdfDoc,
  pageNum,
  scale,
  baseWidth,
  isSelectedForPrint,
  hasCustomSelection,
  onVisible,
  cachedAspectRatio = 1.414,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(cachedAspectRatio);
  const renderTaskRef = useRef<any>(null);

  // IntersectionObserver to observe visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            onVisible(pageNum);
          }
        });
      },
      {
        rootMargin: '350px 0px', // Pre-render pages before they hit screen
        threshold: 0.1,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [pageNum, onVisible]);

  // Render page when visible or when scale changes
  useEffect(() => {
    if (!isVisible || !pdfDoc) return;

    let isCancelled = false;
    let pageProxy: PDFPageProxy | null = null;

    const render = async () => {
      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore cancel errors
          }
          renderTaskRef.current = null;
        }

        setIsRendering(true);
        pageProxy = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        // Calculate aspect ratio
        const initialViewport = pageProxy.getViewport({ scale: 1 });
        const ratio = initialViewport.height / initialViewport.width;
        setAspectRatio(ratio);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const targetWidth = baseWidth * (scale / 100);
        const actualScale = targetWidth / initialViewport.width;
        const viewport = pageProxy.getViewport({ scale: actualScale });

        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const renderContext: any = {
          canvasContext: ctx,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
          viewport: viewport,
        };

        const task = pageProxy.render(renderContext);
        renderTaskRef.current = task;

        await task.promise;
        if (!isCancelled) {
          setIsRendered(true);
          setIsRendering(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !isCancelled) {
          console.warn(`Error rendering page ${pageNum}:`, err);
          setIsRendering(false);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }
    };
  }, [isVisible, pdfDoc, pageNum, scale, baseWidth]);

  const targetWidth = Math.floor(baseWidth * (scale / 100));
  const estimatedHeight = Math.floor(targetWidth * aspectRatio);

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNum}`}
      className="relative flex flex-col items-center transition-all duration-150"
      style={{ width: targetWidth }}
    >
      {/* Top Page Number & Status Pill */}
      <div className="w-full flex items-center justify-between mb-1.5 px-1 text-[11px] font-medium text-slate-400 select-none">
        <span className="flex items-center gap-1.5 bg-[#0b162d]/90 px-2 py-0.5 rounded-md border border-blue-900/40 text-slate-300">
          <span>Page {pageNum}</span>
        </span>

        {hasCustomSelection && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isSelectedForPrint
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700/50'
            }`}
          >
            {isSelectedForPrint ? '✓ Will Print' : '✕ Excluded'}
          </span>
        )}
      </div>

      {/* Page Canvas Container with Shadow & White Paper Look */}
      <div
        className={`relative bg-white rounded-sm shadow-2xl overflow-hidden ring-1 transition-all ${
          isSelectedForPrint
            ? 'ring-slate-800/40 shadow-black/60'
            : 'ring-slate-700/30 opacity-70 grayscale-[30%]'
        }`}
        style={{
          width: targetWidth,
          minHeight: isRendered ? undefined : estimatedHeight,
        }}
      >
        {/* Placeholder / Skeleton while not rendered */}
        {(!isRendered || isRendering) && (
          <div
            className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-4 select-none"
            style={{ minHeight: estimatedHeight }}
          >
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span className="text-xs font-semibold text-slate-600">
                Loading Page {pageNum}...
              </span>
            </div>
          </div>
        )}

        {/* Real PDF Canvas */}
        <canvas
          ref={canvasRef}
          className={`block mx-auto transition-opacity duration-200 ${
            isRendered ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </div>
  );
};

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  document: doc,
  onClose,
  className = '',
  isModal = false,
}) => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(doc.pageCount || 1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(640);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Robust modal scroll lock and scroll isolation
  useModalScrollLock(isModal, scrollContainerRef, onClose);

  // Measure container width for responsive fit-to-width calculation
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(w);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Determine base width so at 100% zoom it fits comfortably without horizontal scrolling
  const baseWidth = Math.max(260, Math.min(containerWidth - 36, 680));

  const isAadhaarDoc =
    doc.detectedDocumentType === 'aadhaar_card' && Boolean(doc.printLayoutUrl);
  const [previewMode, setPreviewMode] = useState<'a4_layout' | 'original'>(
    isAadhaarDoc && doc.useAadhaarLayout !== false ? 'a4_layout' : 'original'
  );

  useEffect(() => {
    if (isAadhaarDoc && doc.useAadhaarLayout !== false) {
      setPreviewMode('a4_layout');
    }
  }, [isAadhaarDoc, doc.useAadhaarLayout]);

  // Load PDF Document safely with PDF.js
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setLoadingError(null);

    const loadPdf = async () => {
      try {
        if (!doc.url) {
          throw new Error('No PDF document URL provided.');
        }

        let loadingTask: any;

        if (doc.url.startsWith('data:')) {
          const bytes = dataUrlToUint8Array(doc.url);
          if (bytes && bytes.length > 0) {
            loadingTask = pdfjsLib.getDocument({ data: bytes });
          } else {
            loadingTask = pdfjsLib.getDocument({ url: doc.url });
          }
        } else if (doc.url.startsWith('blob:')) {
          try {
            const resp = await fetch(doc.url);
            const buf = await resp.arrayBuffer();
            loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buf) });
          } catch {
            loadingTask = pdfjsLib.getDocument({ url: doc.url });
          }
        } else {
          loadingTask = pdfjsLib.getDocument({ url: doc.url });
        }

        const loadedDoc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(loadedDoc);
        setTotalPages(loadedDoc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.error('PDF.js loading error:', err);
        setIsLoading(false);

        if (err?.name === 'PasswordException') {
          setLoadingError('This PDF is password protected and cannot be previewed.');
        } else {
          setLoadingError('Unable to preview this PDF. Please check file integrity or retry.');
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [doc.url, retryCount]);

  // Track currently visible page during continuous scroll
  const handlePageVisible = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
  }, []);

  // Zoom helpers
  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const handleResetZoom = () => setZoom(100);

  // Check if custom page selection is active
  const hasCustomSelection =
    !!doc.pageRange && doc.pageRange !== 'all' && (doc.selectedPages?.length ?? 0) > 0;
  const selectedSet = new Set(doc.selectedPages || []);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      className={`flex flex-col bg-[#070e1c] text-white overflow-hidden ${
        isModal ? 'h-full max-h-full' : 'h-full min-h-[500px]'
      } ${className}`}
    >
      {/* ========================================================
          NATIVE PREVIEW HEADER (Sonu Printer Visual Design Language)
          ======================================================== */}
      <div className="shrink-0 p-3 sm:p-4 bg-[#0a1428] border-b border-blue-950/80 flex items-center justify-between gap-3 shadow-md z-20">
        {/* Document Metadata Column */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3
              className="font-bold text-xs sm:text-sm text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md"
              title={doc.name}
            >
              {doc.name}
            </h3>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
              <span>{(doc.size / (1024 * 1024)).toFixed(2)} MB</span>
              <span>•</span>
              <span>
                {totalPages} {totalPages === 1 ? 'page' : 'pages'}
              </span>
              {hasCustomSelection && (
                <>
                  <span>•</span>
                  <span className="text-orange-400 font-semibold">
                    {doc.printablePages} selected
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Center / Right Controls Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Aadhaar Layout Mode Toggle (When Aadhaar card detected) */}
          {isAadhaarDoc && (
            <div className="flex bg-[#112347] p-0.5 rounded-xl border border-blue-900/60 shadow-xs">
              <button
                type="button"
                onClick={() => setPreviewMode('a4_layout')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  previewMode === 'a4_layout'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                A4 Layout
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('original')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  previewMode === 'original'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Original PDF
              </button>
            </div>
          )}

          {/* Page Counter Badge */}
          {!isLoading && !loadingError && (
            <div className="hidden xs:flex items-center px-2.5 py-1 bg-[#112347] text-slate-200 border border-blue-800/50 rounded-lg text-xs font-mono font-semibold shadow-xs">
              <span>
                {isAadhaarDoc && previewMode === 'a4_layout'
                  ? 'A4 Sheet 1 of 1'
                  : `Page ${currentPage} of ${totalPages}`}
              </span>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#112347]/80 border border-blue-800/40 rounded-xl p-0.5 shadow-sm">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 rounded-lg hover:bg-blue-900/40 transition"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 text-xs font-mono text-slate-200 hover:text-orange-400 transition"
              title="Reset to 100% Fit Width"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 rounded-lg hover:bg-blue-900/40 transition"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-white border-l border-blue-800/40 rounded-r-lg hover:bg-blue-900/40 transition"
              title="Fit to page width"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Secondary Download Button */}
          {doc.url && (
            <a
              href={doc.url}
              download={doc.name}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-[#112347] hover:bg-[#162c5a] border border-blue-800/40 rounded-xl font-medium transition active:scale-95 shadow-xs"
              title="Download original uploaded PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Download</span>
            </a>
          )}

          {/* Close / Done Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#112347] hover:bg-rose-900/40 text-slate-200 hover:text-white border border-blue-800/50 hover:border-rose-700/50 rounded-xl text-xs font-bold transition active:scale-95 ml-1"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          PREVIEW VIEWPORT CONTAINER (Continuous Vertical Scroll)
          ======================================================== */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 bg-[#040813] overflow-y-auto overscroll-contain p-3 sm:p-6 relative select-none scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-transparent"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          touchAction: 'pan-y',
        }}
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4 text-orange-400">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">
              Preparing PDF preview...
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Rendering actual pages with high-resolution client engine for {doc.name}.
            </p>
          </div>
        )}

        {/* Error State with Retry Button */}
        {loadingError && !isLoading && (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">
              {loadingError}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              The PDF could not be rendered inside the preview window. The original file is still safe and ready for printing.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-md shadow-orange-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Preview</span>
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#112347] hover:bg-[#162c5a] text-slate-300 text-xs font-semibold rounded-xl border border-blue-800/40 transition"
                >
                  Return to Configure
                </button>
              )}
            </div>
          </div>
        )}

        {/* Aadhaar A4 Print Layout View (When A4 layout mode active) */}
        {!isLoading && !loadingError && isAadhaarDoc && previewMode === 'a4_layout' && doc.printLayoutUrl && (
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-4 pb-16">
            <div className="w-full flex items-center justify-between px-1 text-[11px] font-medium text-slate-400 select-none">
              <span className="flex items-center gap-1.5 bg-[#0b162d]/90 px-2.5 py-1 rounded-md border border-blue-900/40 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aadhaar A4 Print Derivative (1 Physical Sheet)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ✓ Ready to Print
              </span>
            </div>

            {/* A4 Printable Sheet Container */}
            <div
              className="relative bg-white rounded-sm shadow-2xl overflow-hidden ring-1 ring-slate-300 transition-all"
              style={{
                width: Math.floor(baseWidth * (zoom / 100)),
                aspectRatio: '1 / 1.414',
              }}
            >
              <img
                src={doc.printLayoutUrl}
                alt="Aadhaar A4 Print Layout"
                className="w-full h-full object-contain block select-none pointer-events-none"
              />
            </div>

            <div className="text-center py-2 text-xs text-slate-400 font-medium space-y-0.5">
              <p>A4 Fixed Sheet • Front Card (Upper Center) • Back Card (Lower Center) • Upright</p>
              <p className="text-[11px] text-slate-500">
                Both sides oriented upright with preserved proportions and standard print margins.
              </p>
            </div>
          </div>
        )}

        {/* Mobile-Style Vertical Continuous Pages List (When standard PDF or original view active) */}
        {!isLoading && !loadingError && pdfDoc && (!isAadhaarDoc || previewMode === 'original') && (
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-6 sm:gap-8 pb-16">
            {pageNumbers.map((pNum) => {
              const isSelected = !hasCustomSelection || selectedSet.has(pNum);
              return (
                <PageRenderItem
                  key={`page-${pNum}`}
                  pdfDoc={pdfDoc}
                  pageNum={pNum}
                  scale={zoom}
                  baseWidth={baseWidth}
                  isSelectedForPrint={isSelected}
                  hasCustomSelection={hasCustomSelection}
                  onVisible={handlePageVisible}
                />
              );
            })}

            {/* End of Document Indicator */}
            <div className="text-center py-4 text-xs text-slate-500 font-medium">
              End of document ({totalPages} pages)
            </div>
          </div>
        )}

        {/* Floating Mobile Page Indicator */}
        {!isLoading && !loadingError && (
          <div className="xs:hidden fixed bottom-16 left-1/2 -translate-x-1/2 z-30 bg-[#070e1c]/90 backdrop-blur-md border border-blue-800/50 text-white text-[11px] font-mono font-bold px-3 py-1 rounded-full shadow-xl">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Bottom Bar with Done Button */}
      {onClose && (
        <div className="shrink-0 p-3 sm:p-4 bg-[#0a1428] border-t border-blue-950 flex items-center justify-end text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-md shadow-orange-500/25 ml-auto"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};
