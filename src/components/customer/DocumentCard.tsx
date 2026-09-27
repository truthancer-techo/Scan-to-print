import React from 'react';
import { DocumentItem } from '../../types';
import { FileText, Trash2, Eye, CheckCircle2, X } from 'lucide-react';

interface DocumentCardProps {
  document: DocumentItem;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onPreview: () => void;
  onRemove: () => void;
  isUnified?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  index,
  isSelected,
  onSelect,
  onEdit,
  onPreview,
  onRemove,
  isUnified,
}) => {
  const [showConfirmRemove, setShowConfirmRemove] = React.useState(false);
  const isImage = doc.type.startsWith('image/') || doc.name.match(/\.(jpg|jpeg|png|webp)$/i);

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmRemove(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmRemove(false);
    onRemove();
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmRemove(false);
  };

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-3xl p-3.5 sm:p-4 transition-all duration-200 border cursor-pointer ${
        isSelected
          ? 'bg-[#0f1d3d] border-orange-500 shadow-xl shadow-black/50 ring-2 ring-orange-500/30'
          : 'bg-[#0b162d] hover:bg-[#0d1a36] border-blue-900/50 hover:border-blue-700/60 shadow-lg shadow-black/30'
      }`}
    >
      {/* Remove Confirmation Dialog Overlay */}
      {showConfirmRemove && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-[#070e1c]/95 backdrop-blur-xs z-30 rounded-3xl p-4 flex flex-col items-center justify-center text-center border border-rose-900/60 shadow-2xl animate-in fade-in duration-150"
        >
          <p className="text-xs font-bold text-white mb-1">Remove Document?</p>
          <p className="text-[11px] text-slate-400 mb-3 truncate max-w-[200px]">
            {doc.name}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelDelete}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition shadow-sm"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Top-Right Quick Remove 'X' Button */}
      <button
        type="button"
        onClick={handleRemoveClick}
        className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-slate-800/90 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-90 border border-slate-700/50 shadow-sm"
        title="Remove this document"
        aria-label="Remove document"
      >
        <X className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      {isSelected && (
        <div className="absolute -top-2.5 left-4 bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md shadow-orange-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-white" />
          <span>Configuring</span>
        </div>
      )}

      <div className="flex items-start gap-3 pr-6">
        {/* Document Icon Box (non-clickable, no # badge) */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#112347] border border-blue-800/40 flex items-center justify-center shrink-0 pointer-events-none select-none">
          {doc.printLayoutThumbnail ? (
            <img
              src={doc.printLayoutThumbnail}
              alt={doc.name}
              className="w-full h-full object-cover"
            />
          ) : doc.url && isImage ? (
            <img
              src={doc.url}
              alt={doc.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileText className="w-7 h-7 text-slate-400" />
          )}
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className="font-bold text-xs sm:text-sm text-white truncate leading-snug"
              title={doc.name}
            >
              {doc.name}
            </h4>
          </div>

          {(doc.detectedDocumentType === 'aadhaar_card' || isUnified) && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {doc.detectedDocumentType === 'aadhaar_card' && (
                <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Aadhaar A4
                </span>
              )}
              {isUnified && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  ✓ Synced
                </span>
              )}
            </div>
          )}

          <div className="mt-1 text-[11px] text-slate-400">
            <span>
              {doc.printablePages} {doc.printablePages === 1 ? 'page' : 'pages'} • {doc.copies} {doc.copies === 1 ? 'copy' : 'copies'} • {doc.sheetsCount || doc.printablePages} {(doc.sheetsCount || doc.printablePages) === 1 ? 'sheet' : 'sheets'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="flex items-center justify-end gap-1 sm:gap-2 mt-3 pt-2.5 border-t border-blue-900/30 text-xs">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="inline-flex items-center gap-1 text-slate-300 hover:text-white font-medium px-2 py-1.5 rounded-lg hover:bg-slate-800/60 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>
        <button
          type="button"
          onClick={handleRemoveClick}
          className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium px-2 py-1.5 rounded-lg hover:bg-rose-950/40 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
};


