import React, { useState } from 'react';
import { X, RotateCw, Crop, Check, Layers, AlertCircle } from 'lucide-react';
import { DocumentItem } from '../../types';
import { calculatePrintablePages } from '../../utils/pricing';

interface DocumentEditorModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDoc: DocumentItem) => void;
}

export const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !doc) return null;

  const [rotation, setRotation] = useState<number>(doc.rotation || 0);
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>(
    doc.pageRange === 'all' ? 'all' : 'custom'
  );
  const [customRange, setCustomRange] = useState<string>(
    doc.pageRange === 'all' ? `1-${doc.pageCount}` : doc.pageRange
  );
  const [cropOption, setCropOption] = useState<'none' | 'trim-margins' | 'photo-passport'>(
    'none'
  );

  const effectivePrintablePages =
    pageRangeMode === 'all'
      ? doc.pageCount
      : calculatePrintablePages(customRange, doc.pageCount);

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleSave = () => {
    const updated: DocumentItem = {
      ...doc,
      rotation,
      pageRange: pageRangeMode === 'all' ? 'all' : customRange,
      printablePages: effectivePrintablePages,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0b162d] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-blue-900/50 flex flex-col text-white">
        {/* Header */}
        <div className="p-4 bg-[#070e1c] text-white flex items-center justify-between border-b border-blue-950">
          <div>
            <h3 className="font-bold text-base text-white">Edit Document</h3>
            <p className="text-xs text-slate-400">Non-destructive adjustments for {doc.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#112347] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Quick Preview with Rotation */}
          <div className="bg-[#070e1c] rounded-xl p-4 flex flex-col items-center justify-center border border-blue-950">
            <div className="relative w-48 h-48 flex items-center justify-center overflow-hidden bg-white rounded-lg shadow-sm border border-slate-700">
              {doc.url ? (
                <img
                  src={doc.url}
                  alt="preview"
                  className="max-h-full max-w-full object-contain transition-transform duration-200"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              ) : (
                <div className="text-center p-4">
                  <Layers className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                  <span className="text-xs text-slate-600 font-medium">Page Preview</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleRotate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#112347] hover:bg-[#162c5a] border border-blue-800/40 rounded-lg text-xs font-semibold text-slate-200 shadow-sm transition"
              >
                <RotateCw className="w-3.5 h-3.5 text-orange-400" /> Rotate 90° ({rotation}°)
              </button>
              {rotation !== 0 && (
                <button
                  onClick={() => setRotation(0)}
                  className="text-xs text-orange-400 hover:text-orange-300 underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Page Selection (if multi-page or custom) */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white block">Page Selection</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPageRangeMode('all')}
                className={`p-3 rounded-xl border text-left transition ${
                  pageRangeMode === 'all'
                    ? 'border-orange-500 bg-orange-500/15 text-white ring-1 ring-orange-500/40'
                    : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">All Pages</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Print all {doc.pageCount} page(s)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPageRangeMode('custom')}
                className={`p-3 rounded-xl border text-left transition ${
                  pageRangeMode === 'custom'
                    ? 'border-orange-500 bg-orange-500/15 text-white ring-1 ring-orange-500/40'
                    : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">Custom Range</div>
                <div className="text-[11px] text-slate-400 mt-0.5">e.g. 1-3, 5</div>
              </button>
            </div>

            {pageRangeMode === 'custom' && (
              <div className="pt-2">
                <input
                  type="text"
                  value={customRange}
                  onChange={(e) => setCustomRange(e.target.value)}
                  placeholder={`e.g. 1-${doc.pageCount} or 1, 3, 5`}
                  className="w-full px-3.5 py-2 text-sm border border-blue-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-[#070e1c] text-white placeholder:text-slate-500"
                />
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1.5 px-1">
                  <span>Selected printable pages:</span>
                  <span className="font-bold text-orange-400 font-mono">
                    {effectivePrintablePages} page(s)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Non-destructive Crop & Margin Trim */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white block flex items-center gap-1.5">
              <Crop className="w-4 h-4 text-orange-400" /> Margin & Edge Processing
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'Original Margins' },
                { id: 'trim-margins', label: 'Trim White Margins' },
                { id: 'photo-passport', label: 'Passport Alignment' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCropOption(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition ${
                    cropOption === opt.id
                      ? 'border-orange-500 bg-orange-500/15 text-white font-semibold'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Original uploaded file is retained permanently without degradation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#070e1c] border-t border-blue-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-blue-800/40 hover:bg-[#112347] text-slate-300 text-xs font-semibold rounded-full transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-xs font-bold rounded-full shadow-md transition"
          >
            <Check className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
