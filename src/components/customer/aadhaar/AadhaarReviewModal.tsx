import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RotateCw,
  CheckCircle2,
  Sliders,
  Maximize2,
  AlertCircle,
  Eye,
  RefreshCw,
  Move,
} from 'lucide-react';
import { DocumentItem, AadhaarPanels, BoundingBox } from '../../../types';
import { createAadhaarA4Layout } from '../../../utils/aadhaar/aadhaarLayoutEngine';
import { pdfjsLib } from '../../../utils/pdfViewerWorker';
import { useModalScrollLock } from '../../../utils/useModalScrollLock';

interface AadhaarReviewModalProps {
  isOpen: boolean;
  document: DocumentItem | null;
  onClose: () => void;
  onConfirmLayout: (updatedDoc: DocumentItem) => void;
}

export const AadhaarReviewModal: React.FC<AadhaarReviewModalProps> = ({
  isOpen,
  document: doc,
  onClose,
  onConfirmLayout,
}) => {
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  useModalScrollLock(isOpen && !!doc, modalScrollRef, onClose);

  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Editable panel boxes
  const [frontBox, setFrontBox] = useState<BoundingBox>({
    x: 0.05,
    y: 0.65,
    width: 0.42,
    height: 0.28,
  });
  const [backBox, setBackBox] = useState<BoundingBox>({
    x: 0.52,
    y: 0.65,
    width: 0.42,
    height: 0.28,
  });

  const [previewA4Url, setPreviewA4Url] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'crop' | 'a4_preview'>('crop');

  // Load target PDF page and render onto canvas when modal opens
  useEffect(() => {
    if (!isOpen || !doc) return;

    let isMounted = true;
    setIsLoading(true);

    const loadPage = async () => {
      try {
        const panels = doc.detectedPanels || {
          front: { x: 0.05, y: 0.65, width: 0.42, height: 0.28 },
          back: { x: 0.52, y: 0.65, width: 0.42, height: 0.28 },
          sourcePage: 1,
        };

        setFrontBox(panels.front);
        setBackBox(panels.back);

        // Fetch PDF source
        let buffer: ArrayBuffer;
        if (doc.url.startsWith('data:')) {
          const base64Index = doc.url.indexOf(';base64,');
          const base64 = doc.url.substring(base64Index + 8);
          const binary = window.atob(base64);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
          buffer = bytes.buffer;
        } else {
          const res = await fetch(doc.url);
          buffer = await res.arrayBuffer();
        }

        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
        const targetPageNum = panels.sourcePage || 1;
        const page = await pdf.getPage(targetPageNum);

        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = window.document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (isMounted) {
            setSourceCanvas(canvas);
            // Generate initial preview
            const result = await createAadhaarA4Layout(canvas, {
              front: panels.front,
              back: panels.back,
              sourcePage: targetPageNum,
            });
            setPreviewA4Url(result.printLayoutDataUrl);
          }
        }
      } catch (err) {
        console.error('Failed to load page for Aadhaar review:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [isOpen, doc]);

  // Regenerate A4 layout when boxes change
  const handleRegeneratePreview = async (
    newFront: BoundingBox = frontBox,
    newBack: BoundingBox = backBox
  ) => {
    if (!sourceCanvas || !doc) return;
    setIsRegenerating(true);
    try {
      const result = await createAadhaarA4Layout(sourceCanvas, {
        front: newFront,
        back: newBack,
        sourcePage: doc.detectedPanels?.sourcePage || 1,
      });
      setPreviewA4Url(result.printLayoutDataUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleBoxChange = (
    panelType: 'front' | 'back',
    field: keyof BoundingBox,
    val: number
  ) => {
    if (panelType === 'front') {
      const updated = { ...frontBox, [field]: val };
      setFrontBox(updated);
      handleRegeneratePreview(updated, backBox);
    } else {
      const updated = { ...backBox, [field]: val };
      setBackBox(updated);
      handleRegeneratePreview(frontBox, updated);
    }
  };

  const handleConfirm = async () => {
    if (!doc || !sourceCanvas) return;
    setIsRegenerating(true);
    try {
      const panels: AadhaarPanels = {
        front: frontBox,
        back: backBox,
        sourcePage: doc.detectedPanels?.sourcePage || 1,
      };
      const { printLayoutDataUrl, thumbnailDataUrl } = await createAadhaarA4Layout(
        sourceCanvas,
        panels
      );

      const updatedDoc: DocumentItem = {
        ...doc,
        detectedDocumentType: 'aadhaar_card',
        layoutStatus: 'LAYOUT_GENERATED',
        detectedPanels: panels,
        printLayoutUrl: printLayoutDataUrl,
        printLayoutThumbnail: thumbnailDataUrl,
        isAadhaarDerivative: true,
        useAadhaarLayout: true,
      };

      onConfirmLayout(updatedDoc);
      onClose();
    } catch (err) {
      console.error('Failed to confirm Aadhaar layout:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!isOpen || !doc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalScrollRef}
        className="bg-[#0b162d] rounded-2xl max-w-4xl w-full flex flex-col h-[94vh] max-h-[94vh] overflow-hidden shadow-2xl border border-blue-900/50 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 bg-[#070e1c] border-b border-blue-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Aadhaar Document Layout Review
              </h3>
              <p className="text-[11px] text-slate-400">
                Verify or adjust the front & back panels for precision A4 printing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-[#112347] p-0.5 rounded-xl border border-blue-900/50">
              <button
                type="button"
                onClick={() => setViewMode('crop')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  viewMode === 'crop'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Adjust Panels
              </button>
              <button
                type="button"
                onClick={() => setViewMode('a4_preview')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  viewMode === 'a4_preview'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>A4 Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#112347] transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#040813] overflow-auto p-4 flex flex-col items-center justify-center relative">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading document page…</p>
            </div>
          ) : viewMode === 'a4_preview' ? (
            /* A4 Print Output Preview */
            <div className="flex flex-col items-center justify-center p-4 w-full h-full">
              {previewA4Url ? (
                <div className="bg-white rounded-lg shadow-2xl p-2 max-h-[58vh] aspect-[1/1.414] overflow-hidden flex items-center justify-center border border-slate-300">
                  <img
                    src={previewA4Url}
                    alt="Aadhaar A4 Layout"
                    className="max-h-full max-w-full object-contain block mx-auto"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-400">Generating preview…</p>
              )}
              <p className="text-[11px] text-slate-400 mt-3 text-center">
                A4 Fixed Canvas • Front centered upper • Back centered lower • Plain Paper Normal Quality
              </p>
            </div>
          ) : (
            /* Source Crop Visualizer with Overlaid Bounding Boxes */
            <div className="relative max-h-[60vh] max-w-full overflow-auto flex items-center justify-center">
              {sourceCanvas && (
                <div className="relative inline-block border border-blue-900/60 rounded-lg overflow-hidden shadow-2xl bg-white">
                  <img
                    src={sourceCanvas.toDataURL('image/jpeg', 0.8)}
                    alt="Source Page"
                    className="max-h-[54vh] object-contain block"
                  />

                  {/* FRONT PANEL HIGHLIGHT BOX */}
                  <div
                    className={`absolute border-2 transition-all pointer-events-none ${
                      activeTab === 'front'
                        ? 'border-orange-500 bg-orange-500/20 ring-2 ring-orange-500/40'
                        : 'border-orange-400/70 bg-orange-400/10'
                    }`}
                    style={{
                      left: `${frontBox.x * 100}%`,
                      top: `${frontBox.y * 100}%`,
                      width: `${frontBox.width * 100}%`,
                      height: `${frontBox.height * 100}%`,
                    }}
                  >
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-black rounded shadow-xs uppercase">
                      Front Panel
                    </span>
                  </div>

                  {/* BACK PANEL HIGHLIGHT BOX */}
                  <div
                    className={`absolute border-2 transition-all pointer-events-none ${
                      activeTab === 'back'
                        ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/40'
                        : 'border-emerald-400/70 bg-emerald-400/10'
                    }`}
                    style={{
                      left: `${backBox.x * 100}%`,
                      top: `${backBox.y * 100}%`,
                      width: `${backBox.width * 100}%`,
                      height: `${backBox.height * 100}%`,
                    }}
                  >
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded shadow-xs uppercase">
                      Back Panel
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-[#0b162d] border-t border-blue-900/40 flex flex-wrap items-center justify-between gap-4">
          {/* Panel Selector Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('front')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                activeTab === 'front'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                  : 'bg-[#112347] border-blue-800/40 text-slate-300 hover:text-white'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Front Panel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('back')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                activeTab === 'back'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-[#112347] border-blue-800/40 text-slate-300 hover:text-white'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Back Panel</span>
            </button>
          </div>

          {/* Quick Adjustment Controls */}
          {activeTab === 'front' ? (
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="text-slate-400">Position & Size:</span>
              <button
                type="button"
                onClick={() =>
                  handleBoxChange('front', 'y', Math.max(0.45, frontBox.y - 0.02))
                }
                className="px-2 py-1 bg-[#112347] hover:bg-[#162c5a] rounded-lg border border-blue-800/40 text-[11px] font-mono"
              >
                ↑ Up
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBoxChange('front', 'y', Math.min(0.75, frontBox.y + 0.02))
                }
                className="px-2 py-1 bg-[#112347] hover:bg-[#162c5a] rounded-lg border border-blue-800/40 text-[11px] font-mono"
              >
                ↓ Down
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBoxChange('front', 'width', Math.min(0.5, frontBox.width + 0.01))
                }
                className="px-2 py-1 bg-[#112347] hover:bg-[#162c5a] rounded-lg border border-blue-800/40 text-[11px] font-mono"
              >
                + Width
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBoxChange('front', 'width', Math.max(0.35, frontBox.width - 0.01))
                }
                className="px-2 py-1 bg-[#112347] hover:bg-[#162c5a] rounded-lg border border-blue-800/40 text-[11px] font-mono"
              >
                - Width
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="text-slate-400">Position & Size:</span>
              <button
                type="button"
                onClick={() =>
                  handleBoxChange('back', 'y', Math.max(0.45, backBox.y - 0.02))
                }
                className="px-2 py-1 bg-[#112347] hover:bg-[#162c5a] rounded-lg border border-blue-800/40 text-[11px] font-mono"
              >
                ↑ Up
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBoxChange('back', 'y', Math.min(0.75, backBox.y + 0.02))
                }
                className="px-2 py-1 bg-[#112347] hover:bg-[#162c5a] rounded-lg border border-blue-800/40 text-[11px] font-mono"
              >
                ↓ Down
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBoxChange('back', 'width', Math.min(0.5, backBox.width + 0.01))
                }
                className="px-2 py-1 bg-[#112347] hover:bg-[#162c5a] rounded-lg border border-blue-800/40 text-[11px] font-mono"
              >
                + Width
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBoxChange('back', 'width', Math.max(0.35, backBox.width - 0.01))
                }
                className="px-2 py-1 bg-[#112347] hover:bg-[#162c5a] rounded-lg border border-blue-800/40 text-[11px] font-mono"
              >
                - Width
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#112347] hover:bg-[#162c5a] text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isRegenerating}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/25 transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm & Use A4 Layout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
