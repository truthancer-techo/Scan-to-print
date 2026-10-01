import React, { useState } from 'react';
import { DocumentItem, PricingRule } from '../../types';
import { PdfPreview } from './preview/PdfPreview';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ZoomIn,
  ZoomOut,
  FileText,
  Layers,
  Printer,
  Minus,
  Plus,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { calculateDocumentPricing, calculatePrintablePages } from '../../utils/pricing';

interface PreviewAndEditStepProps {
  documents: DocumentItem[];
  pricingRules: PricingRule[];
  selectedDocIndex: number;
  onSelectDocIndex: (index: number) => void;
  onUpdateDocument: (index: number, updatedDoc: DocumentItem) => void;
  onBack: () => void;
  onNext: () => void;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  appliedDiscountTitle?: string;
}

export const PreviewAndEditStep: React.FC<PreviewAndEditStepProps> = ({
  documents,
  pricingRules,
  selectedDocIndex,
  onSelectDocIndex,
  onUpdateDocument,
  onBack,
  onNext,
  subtotal,
  discountAmount,
  totalAmount,
  appliedDiscountTitle,
}) => {
  const activeIndex = Math.min(selectedDocIndex, Math.max(0, documents.length - 1));
  const activeDoc = documents[activeIndex] || documents[0];

  const [zoom, setZoom] = useState<number>(100);

  if (!activeDoc) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">No document selected for preview.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold text-xs"
        >
          ← Return to Upload
        </button>
      </div>
    );
  }

  const isImage =
    activeDoc.type.startsWith('image/') || activeDoc.name.match(/\.(jpg|jpeg|png|webp|bmp)$/i);
  const isPdf = activeDoc.type.includes('pdf') || activeDoc.name.endsWith('.pdf');

  // Rotate document 90 degrees
  const handleRotate = () => {
    const currentRot = activeDoc.rotation || 0;
    const newRot = (currentRot + 90) % 360;
    const updated = { ...activeDoc, rotation: newRot };
    onUpdateDocument(activeIndex, updated);
  };

  // Adjust copies
  const handleCopiesChange = (delta: number) => {
    const newCopies = Math.max(1, Math.min(100, activeDoc.copies + delta));
    const updated = { ...activeDoc, copies: newCopies };
    const pricing = calculateDocumentPricing(updated, pricingRules);
    updated.printablePages = pricing.printablePages;
    updated.sheetsCount = pricing.sheetsCount;
    updated.ratePerPage = pricing.ratePerPage;
    updated.totalPrice = pricing.totalPrice;
    onUpdateDocument(activeIndex, updated);
  };

  // Adjust page range
  const handlePageRangeChange = (rangeMode: 'all' | 'custom', customVal?: string) => {
    const range = rangeMode === 'all' ? 'all' : customVal || `1-${activeDoc.pageCount}`;
    const printable =
      rangeMode === 'all'
        ? activeDoc.pageCount
        : calculatePrintablePages(range, activeDoc.pageCount);

    const updated = {
      ...activeDoc,
      pageRange: range,
      printablePages: printable,
    };
    const pricing = calculateDocumentPricing(updated, pricingRules);
    updated.sheetsCount = pricing.sheetsCount;
    updated.ratePerPage = pricing.ratePerPage;
    updated.totalPrice = pricing.totalPrice;
    onUpdateDocument(activeIndex, updated);
  };

  const totalPages = documents.reduce((acc, d) => acc + d.printablePages * d.copies, 0);
  const totalSheets = documents.reduce((acc, d) => {
    if (d.fileType === 'pdf') {
      const isDuplex = d.printStyle === 'Back-to-Back';
      const sides = d.printablePages * d.copies;
      return acc + (isDuplex ? Math.ceil(sides / 2) : sides);
    }
    return acc + d.sheetsCount * d.copies;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-36">
      {/* Top Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b162d] p-4 rounded-2xl border border-blue-900/50 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#112347] hover:bg-[#162c5a] text-slate-200 hover:text-white border border-blue-800/40 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition active:scale-95 shrink-0"
            aria-label="Back to Configure"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300 shrink-0" />
            <span>Back to Configure</span>
          </button>

          <div>
            <h2 className="font-extrabold text-base text-white">
              Preview & Verify Document
            </h2>
            <p className="text-xs text-slate-400">
              Check layout, inspect pages, and verify print specifications before confirming.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-full font-black text-xs sm:text-sm shadow-md shadow-orange-500/20 transition active:scale-[0.99]"
        >
          <span>Next: Confirm Order</span>
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </button>
      </div>

      {/* Multiple Documents Tab Selector */}
      {documents.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {documents.map((doc, idx) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => onSelectDocIndex(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                idx === activeIndex
                  ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                  : 'bg-[#091326] text-slate-300 border-blue-900/40 hover:bg-[#0c1833]'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${idx === activeIndex ? 'text-orange-400' : 'text-slate-400'}`} />
              <span className="truncate max-w-[140px]">{doc.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  idx === activeIndex ? 'bg-orange-500/20 text-orange-300' : 'bg-[#112347] text-slate-400'
                }`}
              >
                {doc.printablePages} pgs × {doc.copies}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Grid: Preview on Left, Config & Adjustments on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Canvas Preview Area */}
        <div className="lg:col-span-7 bg-[#0b162d] rounded-2xl border border-blue-900/50 shadow-xl overflow-hidden flex flex-col">
          {/* Canvas Toolbar */}
          <div className="p-3 bg-[#070e1c] border-b border-blue-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <FileText className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-xs font-bold truncate text-slate-200" title={activeDoc.name}>
                {activeDoc.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 25))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-[#112347] rounded-lg transition"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-400 px-1">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(200, z + 25))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-[#112347] rounded-lg transition"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-[#112347] rounded-lg transition ml-1"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Viewport Box */}
          <div className="flex-1 bg-[#040813] p-6 flex items-center justify-center min-h-[420px] overflow-auto relative">
            {isImage && activeDoc.url ? (
              <div
                className="transition-transform duration-200 shadow-2xl rounded-lg overflow-hidden bg-white max-h-[450px]"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${activeDoc.rotation || 0}deg)`,
                }}
              >
                <img
                  src={activeDoc.url}
                  alt={activeDoc.name}
                  className="max-h-[420px] object-contain block mx-auto"
                />
              </div>
            ) : isPdf && activeDoc.url ? (
              <div className="w-full h-[520px] rounded-xl overflow-hidden shadow-2xl border border-blue-900/50">
                <PdfPreview document={activeDoc} isModal={false} />
              </div>
            ) : (
              <div className="text-center p-8 bg-[#0b162d] rounded-2xl border border-blue-900/50 shadow-xl max-w-xs">
                <FileText className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-white truncate">{activeDoc.name}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Ready for spooling and printing on Sonu Printer hardware.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Document Verified</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Active Specs and Non-Destructive Adjustments */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Configuration Card */}
          <div className="bg-[#0b162d] rounded-2xl p-5 border border-blue-900/50 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-orange-400" />
                <h3 className="font-extrabold text-sm text-white">Print Specifications</h3>
              </div>
              <span className="text-xs font-mono font-bold text-orange-400">
                ₹{activeDoc.totalPrice.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-[#070e1c] rounded-xl border border-blue-950">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Paper Size</span>
                <span className="font-bold text-white">{activeDoc.paperSize}</span>
              </div>

              <div className="p-2.5 bg-[#070e1c] rounded-xl border border-blue-950">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Color Mode</span>
                <span className="font-bold text-white">{activeDoc.colorMode}</span>
              </div>

              <div className="p-2.5 bg-[#070e1c] rounded-xl border border-blue-950">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Print Style</span>
                <span className="font-bold text-white">{activeDoc.printStyle}</span>
              </div>

              <div className="p-2.5 bg-[#070e1c] rounded-xl border border-blue-950">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Paper Type</span>
                <span className="font-bold text-white">{activeDoc.paperType}</span>
              </div>
            </div>

            {/* Copies Quick Adjuster */}
            <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Print Copies</span>
                <span className="text-[11px] text-slate-400">Total copies of this document</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopiesChange(-1)}
                  className="w-8 h-8 rounded-lg bg-[#112347] hover:bg-orange-500 hover:text-white border border-blue-800/40 text-slate-200 flex items-center justify-center font-bold transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={activeDoc.copies}
                  onChange={(e) => {
                    const num = parseInt(e.target.value, 10);
                    if (!isNaN(num)) {
                      handleCopiesChange(Math.max(1, Math.min(100, num)) - activeDoc.copies);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-10 h-8 text-center font-extrabold text-sm font-mono text-white bg-transparent border-none focus:outline-hidden focus:ring-1 focus:ring-orange-500/60 rounded-lg cursor-text hover:bg-white/5 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  title="Click or tap to enter number of copies"
                  aria-label="Number of copies"
                />
                <button
                  type="button"
                  onClick={() => handleCopiesChange(1)}
                  className="w-8 h-8 rounded-lg bg-[#112347] hover:bg-orange-500 hover:text-white border border-blue-800/40 text-slate-200 flex items-center justify-center font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Rotation Adjuster */}
            <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Orientation & Rotation</span>
                <span className="text-[11px] text-slate-400">
                  Current rotation: {activeDoc.rotation || 0}°
                </span>
              </div>

              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#112347] hover:bg-[#162c5a] text-slate-200 border border-blue-800/40 rounded-lg text-xs font-bold transition"
              >
                <RotateCw className="w-3.5 h-3.5 text-orange-400" />
                <span>Rotate 90°</span>
              </button>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="p-4 bg-[#0e1b38] border border-orange-500/30 rounded-2xl text-xs space-y-1">
            <p className="font-bold text-orange-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
              Need to change paper size or color mode?
            </p>
            <p className="text-slate-300">
              Click{' '}
              <button
                type="button"
                onClick={onBack}
                className="text-orange-400 font-bold underline hover:text-orange-300"
              >
                ← Back to Configure
              </button>{' '}
              anytime. All your uploaded files and options are preserved.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Summary Bar for Step 3 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#070e1c]/95 backdrop-blur-lg border-t border-blue-950/80 shadow-[0_-8px_25px_rgba(0,0,0,0.7)] p-3 sm:p-4 transition-all text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-3 bg-[#112347] hover:bg-[#162c5a] text-slate-200 hover:text-white border border-blue-800/40 rounded-full font-bold text-xs sm:text-sm shadow-sm transition active:scale-95 shrink-0"
            aria-label="Back to Configure"
          >
            <ArrowLeft className="w-4 h-4 text-slate-300" />
            <span>Back</span>
          </button>

          {/* Pricing Preview */}
          <div className="text-center sm:text-left">
            <div className="flex items-baseline gap-2 justify-center sm:justify-start">
              <span className="text-xs text-slate-400 font-medium">Payable:</span>
              <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {documents.length} doc{documents.length > 1 ? 's' : ''} • {totalPages} printable page{totalPages > 1 ? 's' : ''} • {totalSheets} sheet{totalSheets > 1 ? 's' : ''}
            </p>
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-full font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition active:scale-[0.99] shrink-0"
          >
            <span className="whitespace-nowrap">Next: Confirm Order</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
