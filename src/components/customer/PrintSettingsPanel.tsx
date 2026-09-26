import React from 'react';
import {
  DocumentItem,
  PaperSize,
  ColorMode,
  PrintStyle,
  Orientation,
  Scaling,
  PaperType,
  Collation,
  PhotoCollage,
  PricingRule,
} from '../../types';
import { PhotoCollageSelector } from './PhotoCollageSelector';
import { Minus, Plus, Sliders, FileText, Layers, Sparkles, Check } from 'lucide-react';
import { calculateDocumentPricing } from '../../utils/pricing';

interface PrintSettingsPanelProps {
  document: DocumentItem;
  pricingRules: PricingRule[];
  onChange: (updatedDoc: DocumentItem) => void;
}

export const PrintSettingsPanel: React.FC<PrintSettingsPanelProps> = ({
  document: doc,
  pricingRules,
  onChange,
}) => {
  const isImage = doc.type.startsWith('image/') || doc.name.match(/\.(jpg|jpeg|png|webp)$/i);

  const updateField = <K extends keyof DocumentItem>(field: K, value: DocumentItem[K]) => {
    const updated = { ...doc, [field]: value };
    const pricing = calculateDocumentPricing(updated, pricingRules);
    updated.printablePages = pricing.printablePages;
    updated.sheetsCount = pricing.sheetsCount;
    updated.ratePerPage = pricing.ratePerPage;
    updated.totalPrice = pricing.totalPrice;
    onChange(updated);
  };

  const handleCopiesChange = (delta: number) => {
    const newCopies = Math.max(1, Math.min(100, doc.copies + delta));
    updateField('copies', newCopies);
  };

  return (
    <div className="bg-[#0b162d] rounded-3xl p-4 sm:p-6 border border-blue-900/50 shadow-xl shadow-black/40 space-y-5 sm:space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#112347] text-orange-400 flex items-center justify-center border border-blue-800/40">
            <Sliders className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h4 className="font-extrabold text-sm sm:text-base text-white">
            Print Configuration
          </h4>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Rate: <span className="text-orange-400 font-bold font-mono">₹{doc.ratePerPage.toFixed(2)}</span>/page
        </div>
      </div>

      {/* Grid of Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* 1. Print Style */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Print Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Single Sided', 'Back-to-Back'] as PrintStyle[]).map((style) => {
              const isSelected = doc.printStyle === style;
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateField('printStyle', style)}
                  className={`min-h-[44px] py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm shadow-orange-500/10 ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  {style === 'Single Sided' ? (
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-orange-400' : 'opacity-70'}`} />
                  ) : (
                    <Layers className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-orange-400' : 'opacity-70'}`} />
                  )}
                  <span>{style}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Color Mode */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Color Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Black & White', 'Colour'] as ColorMode[]).map((mode) => {
              const isSelected = doc.colorMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateField('colorMode', mode)}
                  className={`min-h-[44px] py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm shadow-orange-500/10 ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
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

        {/* 3. Paper Size */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Paper Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['A4', 'A3'] as PaperSize[]).map((size) => {
              const isSelected = doc.paperSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateField('paperSize', size)}
                  className={`min-h-[44px] py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm shadow-orange-500/10 ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  <span>{size}</span>
                  <span
                    className={`text-[10px] font-normal ${
                      isSelected ? 'text-orange-300' : 'text-slate-400'
                    }`}
                  >
                    {size === 'A4' ? 'Standard' : 'Large Poster'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Paper Type */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Paper Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Plain Paper', 'Glossy Paper'] as PaperType[]).map((type) => {
              const isSelected = doc.paperType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateField('paperType', type)}
                  className={`min-h-[44px] py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm shadow-orange-500/10 ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  <span>{type}</span>
                  <span
                    className={`text-[10px] font-normal ${
                      isSelected ? 'text-orange-300' : 'text-slate-400'
                    }`}
                  >
                    {type === 'Glossy Paper' ? '+₹4.00' : '75 GSM Standard'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Orientation */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Orientation
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Auto', 'Portrait', 'Landscape'] as Orientation[]).map((ori) => {
              const isSelected = doc.orientation === ori;
              return (
                <button
                  key={ori}
                  type="button"
                  onClick={() => updateField('orientation', ori)}
                  className={`min-h-[42px] py-2 px-1.5 text-xs font-bold rounded-xl border transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  {ori === 'Auto' ? 'Auto' : ori}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Scaling */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Scaling
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Fit to page', 'Actual size', 'Fill page'] as Scaling[]).map((scale) => {
              const isSelected = doc.scaling === scale;
              return (
                <button
                  key={scale}
                  type="button"
                  onClick={() => updateField('scaling', scale)}
                  className={`min-h-[42px] py-2 px-1 text-xs font-bold rounded-xl border transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  {scale}
                </button>
              );
            })}
          </div>
        </div>

        {/* 7. Collation */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Collation
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Collated', 'Uncollated'] as Collation[]).map((col) => {
              const isSelected = doc.collation === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => updateField('collation', col)}
                  className={`min-h-[44px] py-2 px-2 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  <span>{col}</span>
                  <span
                    className={`text-[9px] font-normal ${
                      isSelected ? 'text-orange-300' : 'text-slate-400'
                    }`}
                  >
                    {col === 'Collated' ? '1, 2, 3 • 1, 2, 3' : '1, 1 • 2, 2 • 3, 3'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 8. Copies Stepper */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Copies
          </label>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center border border-blue-900/50 rounded-2xl overflow-hidden bg-[#070e1c] p-1 shadow-inner">
              <button
                type="button"
                onClick={() => handleCopiesChange(-1)}
                className="w-10 h-10 rounded-xl bg-[#112347] border border-blue-800/40 hover:bg-orange-500 hover:text-white flex items-center justify-center text-slate-200 transition active:scale-95 shadow-xs"
                aria-label="Decrease copies"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              <span className="w-12 text-center font-black text-base text-white font-mono">
                {doc.copies}
              </span>
              <button
                type="button"
                onClick={() => handleCopiesChange(1)}
                className="w-10 h-10 rounded-xl bg-[#112347] border border-blue-800/40 hover:bg-orange-500 hover:text-white flex items-center justify-center text-slate-200 transition active:scale-95 shadow-xs"
                aria-label="Increase copies"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
            <div className="text-xs text-slate-400">
              Total sheets: <strong className="text-white font-mono font-bold">{doc.sheetsCount * doc.copies}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Collage Options (Only for images) */}
      {isImage && (
        <div className="pt-3 border-t border-blue-900/40">
          <PhotoCollageSelector
            selected={doc.photoCollage}
            onChange={(collage) => updateField('photoCollage', collage)}
          />
        </div>
      )}

      {/* Page Selection (Multi-page documents) */}
      {doc.pageCount > 1 && (
        <div className="pt-3 border-t border-blue-900/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Page Selection ({doc.pageCount} total pages)
            </label>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => updateField('pageRange', 'all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                  doc.pageRange === 'all'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-[#091326] border border-blue-900/40 text-slate-300 hover:bg-[#0c1833]'
                }`}
              >
                All pages
              </button>
              <button
                type="button"
                onClick={() => updateField('pageRange', `1-${doc.pageCount}`)}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                  doc.pageRange !== 'all'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-[#091326] border border-blue-900/40 text-slate-300 hover:bg-[#0c1833]'
                }`}
              >
                Custom pages
              </button>
            </div>
          </div>

          {doc.pageRange !== 'all' && (
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={doc.pageRange}
                onChange={(e) => updateField('pageRange', e.target.value)}
                placeholder="e.g. 1-5, 8, 10-12"
                className="flex-1 px-3 py-2 text-xs border border-blue-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-[#070e1c] text-white font-mono placeholder:text-slate-500"
              />
              <span className="text-xs text-slate-400 whitespace-nowrap">
                Printable: <strong className="text-orange-400 font-bold">{doc.printablePages}</strong> / {doc.pageCount} pages
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

