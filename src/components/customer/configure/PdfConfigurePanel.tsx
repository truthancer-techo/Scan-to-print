import React, { useState, useEffect } from 'react';
import {
  DocumentItem,
  ColorMode,
  Orientation,
  PricingRule,
} from '../../../types';
import {
  Minus,
  Plus,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Compass,
  CreditCard,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { calculatePdfPrice } from '../../../utils/pricing';
import { parseAndValidatePdfPageRange } from '../../../utils/pdfReader';
import { AadhaarReviewModal } from '../aadhaar/AadhaarReviewModal';

interface PdfConfigurePanelProps {
  document: DocumentItem;
  pricingRules: PricingRule[];
  onChange: (updatedDoc: DocumentItem) => void;
  totalDocumentsCount?: number;
  isApplyToAll?: boolean;
}

export const PdfConfigurePanel: React.FC<PdfConfigurePanelProps> = ({
  document: doc,
  pricingRules,
  onChange,
  totalDocumentsCount = 1,
  isApplyToAll = false,
}) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Page selection state: 'all' or 'custom'
  const isCustomPageMode = doc.pageSelectionMode === 'custom';
  const [customRangeInput, setCustomRangeInput] = useState<string>(
    doc.pageRange === 'all' || !doc.pageRange ? '' : doc.pageRange
  );
  const [rangeError, setRangeError] = useState<string | null>(null);

  // Copies input state for smooth typing on mobile/desktop
  const [copiesInput, setCopiesInput] = useState<string>(String(doc.copies || 1));

  useEffect(() => {
    setCopiesInput(String(doc.copies || 1));
  }, [doc.copies]);

  // Sync state if external doc changes
  useEffect(() => {
    if (doc.pageSelectionMode === 'all' || doc.pageRange === 'all') {
      if (doc.pageSelectionMode !== 'custom') {
        setCustomRangeInput('');
        setRangeError(null);
      }
    } else {
      setCustomRangeInput(doc.pageRange || '');
      if (doc.pageRange) {
        const validation = parseAndValidatePdfPageRange(doc.pageRange, doc.pageCount);
        setRangeError(validation.isValid ? null : validation.errorMessage || 'Invalid range');
      } else {
        setRangeError(null);
      }
    }
  }, [doc.id, doc.pageRange, doc.pageCount, doc.pageSelectionMode]);

  const applyPdfCalculation = (partial: Partial<DocumentItem>) => {
    const updated: DocumentItem = {
      ...doc,
      ...partial,
      fileType: 'pdf',
      paperSize: 'A4',
      paperType: 'Plain Paper',
      printQuality: 'Normal',
      scalingMode: 'default',
    };

    // If Aadhaar A4 layout is active, output is 1 physical A4 print sheet per copy
    const isAadhaarActive =
      updated.detectedDocumentType === 'aadhaar_card' && updated.useAadhaarLayout !== false;

    if (isAadhaarActive) {
      const rule = pricingRules.find(
        (r) => r.colorMode === updated.colorMode && r.paperSize === 'A4'
      );
      const rate = rule?.ratePerPage ?? (updated.colorMode === 'Colour' ? 8.0 : 3.0);
      const copies = updated.copies || 1;
      updated.printablePages = 1;
      updated.selectedPages = [1];
      updated.sheetsCount = copies;
      updated.physicalSheets = copies;
      updated.ratePerPage = rate;
      updated.subtotal = rate * copies;
      updated.totalPrice = rate * copies;
      onChange(updated);
      return;
    }

    const calc = calculatePdfPrice(
      {
        pageCount: updated.pageCount,
        pageRange: updated.pageRange,
        copies: updated.copies,
        colorMode: updated.colorMode,
        printStyle: updated.printStyle,
      },
      pricingRules
    );

    updated.printablePages = calc.printablePages;
    updated.selectedPages = calc.selectedPages;
    updated.sheetsCount = calc.sheetsCount;
    updated.physicalSheets = calc.sheetsCount;
    updated.ratePerPage = calc.ratePerPage;
    updated.subtotal = calc.subtotal;
    updated.totalPrice = calc.totalPrice;

    onChange(updated);
  };

  // Color Mode Change
  const handleColorModeChange = (mode: ColorMode) => {
    applyPdfCalculation({ colorMode: mode });
  };

  // Orientation Change
  const handleOrientationChange = (ori: Orientation) => {
    applyPdfCalculation({ orientation: ori });
  };

  // Copies Change
  const handleCopiesChange = (delta: number) => {
    const current = parseInt(copiesInput, 10) || doc.copies || 1;
    const newCopies = Math.max(1, Math.min(100, current + delta));
    setCopiesInput(String(newCopies));
    applyPdfCalculation({ copies: newCopies });
  };

  // Direct manual copies typing (mobile-keyboard optimized)
  const handleCopiesInputChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    setCopiesInput(cleaned);

    if (cleaned !== '') {
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        const clamped = Math.min(100, parsed);
        applyPdfCalculation({ copies: clamped });
      }
    }
  };

  const handleCopiesInputBlur = () => {
    const parsed = parseInt(copiesInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      setCopiesInput('1');
      applyPdfCalculation({ copies: 1 });
    } else {
      const clamped = Math.min(100, Math.max(1, parsed));
      setCopiesInput(String(clamped));
      applyPdfCalculation({ copies: clamped });
    }
  };

  // Page Selection Change
  const handlePageModeToggle = (mode: 'all' | 'custom') => {
    if (mode === 'all') {
      setRangeError(null);
      setCustomRangeInput('');
      applyPdfCalculation({
        pageRange: 'all',
        pageSelectionMode: 'all',
      });
    } else {
      setRangeError(null);
      if (customRangeInput.trim()) {
        const validation = parseAndValidatePdfPageRange(customRangeInput.trim(), doc.pageCount);
        if (validation.isValid) {
          applyPdfCalculation({
            pageRange: customRangeInput.trim(),
            pageSelectionMode: 'custom',
          });
        } else {
          setRangeError(validation.errorMessage || 'Invalid range format');
        }
      } else {
        setCustomRangeInput('');
        applyPdfCalculation({
          pageRange: '',
          pageSelectionMode: 'custom',
        });
      }
    }
  };

  const handleCustomRangeInputChange = (value: string) => {
    setCustomRangeInput(value);
    if (!value.trim()) {
      setRangeError(null);
      applyPdfCalculation({
        pageRange: '',
        pageSelectionMode: 'custom',
      });
      return;
    }
    const validation = parseAndValidatePdfPageRange(value, doc.pageCount);
    if (validation.isValid) {
      setRangeError(null);
      applyPdfCalculation({
        pageRange: value.trim(),
        pageSelectionMode: 'custom',
      });
    } else {
      setRangeError(validation.errorMessage || 'Invalid range format');
    }
  };

  // Rates and Sheets
  const isDuplex = doc.printStyle === 'Back-to-Back';
  const totalSides = doc.printablePages * doc.copies;
  const totalSheets = doc.physicalSheets || doc.sheetsCount || (isDuplex ? Math.ceil(totalSides / 2) : totalSides);

  return (
    <div className="bg-[#0b162d] rounded-3xl p-4 sm:p-6 border border-blue-900/50 shadow-xl shadow-black/40 space-y-5 sm:space-y-6">
      {/* Header Bar with Document Name */}
      <div className="border-b border-blue-900/40 pb-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 shrink-0">
            <Sliders className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-sm sm:text-base text-white truncate">
              PDF Print Configuration
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              {doc.name} • {doc.pageCount} page{doc.pageCount > 1 ? 's' : ''} in source
            </p>
          </div>
        </div>

        {isApplyToAll && totalDocumentsCount > 1 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-bold shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Syncing to all {totalDocumentsCount} files (समान सेटिंग्स)</span>
          </div>
        )}
      </div>

      {/* Aadhaar Automatic Layout Banner (Shown only when Aadhaar is detected) */}
      {doc.detectedDocumentType === 'aadhaar_card' && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            doc.layoutStatus === 'REVIEW_REQUIRED'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-[#091a38] border-blue-800/60 text-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  doc.layoutStatus === 'REVIEW_REQUIRED'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {doc.layoutStatus === 'REVIEW_REQUIRED' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="font-extrabold text-xs sm:text-sm text-white">
                    {doc.layoutStatus === 'REVIEW_REQUIRED'
                      ? 'Document layout detected — please review'
                      : 'Aadhaar Layout Detected (Front & Back)'}
                  </h5>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      doc.useAadhaarLayout !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {doc.useAadhaarLayout !== false ? 'A4 Print Ready' : 'Original PDF Active'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {doc.layoutStatus === 'REVIEW_REQUIRED'
                    ? 'Aadhaar card layout was detected with moderate confidence. Please review crop coordinates.'
                    : doc.useAadhaarLayout !== false
                    ? 'Front & Back panels positioned upright on a clean A4 sheet (1 print page) with standard margins.'
                    : 'Currently using the original full-page PDF without Aadhaar card recomposition.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  const newUse = doc.useAadhaarLayout === false;
                  applyPdfCalculation({ useAadhaarLayout: newUse });
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#112347] hover:bg-[#162c5a] border border-blue-800/50 rounded-xl transition"
              >
                {doc.useAadhaarLayout !== false ? 'Use Original PDF' : 'Use A4 Layout'}
              </button>
              <button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                  doc.layoutStatus === 'REVIEW_REQUIRED'
                    ? 'bg-amber-500 hover:bg-amber-400 text-black font-black shadow-md'
                    : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/50'
                }`}
              >
                <span>
                  {doc.layoutStatus === 'REVIEW_REQUIRED' ? 'Review & Confirm' : 'Adjust Crop'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of PDF Options in Strict Customer-Facing Order */}
      <div className="space-y-4 sm:space-y-5">
        {/* 1. COLOR MODE */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            1. Color Mode
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {(['Black & White', 'Colour'] as ColorMode[]).map((mode) => {
              const isSelected = doc.colorMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleColorModeChange(mode)}
                  className={`min-h-[46px] py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm shadow-orange-500/10 ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      mode === 'Colour'
                        ? 'bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400 ring-1 ring-white/50'
                        : isSelected
                        ? 'bg-white ring-1 ring-white/40'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>{mode}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. ORIENTATION */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              2. Orientation
            </label>
            <span className="text-[10px] text-slate-400">
              {doc.orientation === 'Auto' ? 'Uses PDF native orientation' : `${doc.orientation} print`}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['Auto', 'Portrait', 'Landscape'] as Orientation[]).map((ori) => {
              const isSelected = doc.orientation === ori;
              return (
                <button
                  key={ori}
                  type="button"
                  onClick={() => handleOrientationChange(ori)}
                  className={`min-h-[42px] py-2 px-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  <Compass className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-orange-400' : 'opacity-60'}`} />
                  <span>{ori}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. COPIES */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              3. Copies
            </label>
            <span className="text-[10px] text-slate-400">
              {doc.copies} {doc.copies === 1 ? 'copy' : 'copies'} requested
            </span>
          </div>
          <div className="flex items-center justify-between bg-[#070e1c] border border-blue-900/50 rounded-2xl p-2 shadow-inner">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopiesChange(-1)}
                disabled={(parseInt(copiesInput, 10) || doc.copies || 1) <= 1}
                className="w-10 h-10 rounded-xl bg-[#112347] border border-blue-800/40 hover:bg-orange-500 hover:text-white disabled:opacity-40 disabled:hover:bg-[#112347] disabled:hover:text-slate-400 flex items-center justify-center text-slate-200 transition active:scale-95 shadow-xs"
                aria-label="Decrease copies"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={copiesInput}
                onChange={(e) => handleCopiesInputChange(e.target.value)}
                onFocus={(e) => {
                  const target = e.currentTarget;
                  setTimeout(() => {
                    try {
                      target.select();
                      target.setSelectionRange(0, 9999);
                    } catch (_) {}
                  }, 50);
                }}
                onBlur={handleCopiesInputBlur}
                className="w-14 h-10 text-center font-black text-lg text-white font-mono bg-[#091326] border border-blue-900/50 rounded-xl focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition cursor-text hover:border-blue-700"
                title="Click or tap to enter number of copies"
                aria-label="Number of copies"
              />
              <button
                type="button"
                onClick={() => handleCopiesChange(1)}
                disabled={(parseInt(copiesInput, 10) || doc.copies || 1) >= 100}
                className="w-10 h-10 rounded-xl bg-[#112347] border border-blue-800/40 hover:bg-orange-500 hover:text-white disabled:opacity-40 disabled:hover:bg-[#112347] disabled:hover:text-slate-400 flex items-center justify-center text-slate-200 transition active:scale-95 shadow-xs"
                aria-label="Increase copies"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="text-right pr-2">
              <p className="text-xs font-bold text-white font-mono">
                {totalSheets} physical sheet{totalSheets > 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-slate-400">
                {totalSides} printed side{totalSides > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* 4. PAGE SELECTION */}
        <div className="space-y-2 pt-1 border-t border-blue-900/40">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              4. Page Selection
            </label>
            <span className="text-[11px] text-slate-400">
              Total in PDF: <strong className="text-white font-mono font-bold">{doc.pageCount}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handlePageModeToggle('all')}
              className={`min-h-[44px] py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                !isCustomPageMode
                  ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                  : 'bg-[#091326] border-blue-900/40 text-slate-300 hover:bg-[#0c1833]'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${!isCustomPageMode ? 'text-orange-400' : 'opacity-60'}`} />
              <span>All Pages ({doc.pageCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handlePageModeToggle('custom')}
              className={`min-h-[44px] py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                isCustomPageMode
                  ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                  : 'bg-[#091326] border-blue-900/40 text-slate-300 hover:bg-[#0c1833]'
              }`}
            >
              <span>Custom Pages</span>
            </button>
          </div>

          {/* Custom Range Input Area */}
          {isCustomPageMode && (
            <div className="space-y-2 mt-2 bg-[#070e1c] p-3 rounded-2xl border border-blue-900/50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customRangeInput}
                  onChange={(e) => handleCustomRangeInputChange(e.target.value)}
                  placeholder={`e.g. 1-3, 5, 7-${doc.pageCount}`}
                  className="flex-1 px-3 py-2 text-xs border border-blue-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-[#0b162d] text-white font-mono placeholder:text-slate-500"
                />
                <span className="text-xs text-slate-300 whitespace-nowrap font-mono px-2 py-1 bg-[#112347] rounded-lg border border-blue-800/40">
                  <strong className="text-orange-400 font-bold">{doc.printablePages}</strong> / {doc.pageCount} pgs
                </span>
              </div>

              {rangeError ? (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-900/50">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{rangeError}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Examples: <span className="font-mono text-slate-300">1-3</span>,{' '}
                  <span className="font-mono text-slate-300">5</span>,{' '}
                  <span className="font-mono text-slate-300">1-5, 10</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Aadhaar Manual Crop & Alignment Review Modal */}
      {isReviewOpen && (
        <AadhaarReviewModal
          isOpen={isReviewOpen}
          document={doc}
          onClose={() => setIsReviewOpen(false)}
          onConfirmLayout={(updated) => {
            applyPdfCalculation({
              ...updated,
              useAadhaarLayout: true,
              layoutStatus: 'LAYOUT_GENERATED',
            });
          }}
        />
      )}
    </div>
  );
};
