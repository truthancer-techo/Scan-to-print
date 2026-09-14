import React from 'react';
import { DocumentItem } from '../../types';
import { FileText, Edit2, Trash2, Eye, CheckCircle2, X } from 'lucide-react';

interface DocumentCardProps {
  document: DocumentItem;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onRemove: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  index,
  isSelected,
  onSelect,
  onEdit,
  onPreview,
  onRemove,
}) => {
  const isImage = doc.type.startsWith('image/') || doc.name.match(/\.(jpg|jpeg|png|webp)$/i);

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-3xl p-3.5 sm:p-4 transition-all duration-200 border cursor-pointer ${
        isSelected
          ? 'bg-[#0f1d3d] border-orange-500 shadow-xl shadow-black/50 ring-2 ring-orange-500/30'
          : 'bg-[#0b162d] hover:bg-[#0d1a36] border-blue-900/50 hover:border-blue-700/60 shadow-lg shadow-black/30'
      }`}
    >
      {/* Top-Right Quick Remove 'X' Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
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
        {/* Thumbnail Preview with tap to zoom */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#112347] border border-blue-800/40 flex items-center justify-center shrink-0 group hover:ring-2 hover:ring-orange-500 transition"
          title="Tap to preview document"
        >
          {doc.url && isImage ? (
            <img
              src={doc.url}
              alt={doc.name}
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />
          ) : (
            <FileText className="w-7 h-7 text-slate-400 group-hover:text-orange-400 transition" />
          )}

          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
            <Eye className="w-4 h-4 text-white" />
          </div>

          <span className="absolute bottom-0.5 right-0.5 text-[8px] font-black bg-black/80 text-white px-1 rounded">
            #{index + 1}
          </span>
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className="font-bold text-xs sm:text-sm text-white truncate max-w-[130px] sm:max-w-[220px] leading-snug"
              title={doc.name}
            >
              {doc.name}
            </h4>
            <span className="font-mono font-extrabold text-xs sm:text-sm text-orange-400 shrink-0">
              ₹{doc.totalPrice.toFixed(2)}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mt-0.5">
            {doc.printablePages} {doc.printablePages === 1 ? 'page' : 'pages'} • {doc.copies}{' '}
            {doc.copies === 1 ? 'copy' : 'copies'}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] font-semibold bg-[#112347] text-slate-300 border border-blue-900/40 px-2 py-0.5 rounded-md">
              {doc.paperSize}
            </span>
            <span className="text-[10px] font-semibold bg-[#112347] text-slate-300 border border-blue-900/40 px-2 py-0.5 rounded-md">
              {doc.colorMode}
            </span>
            <span className="text-[10px] font-semibold bg-[#112347] text-slate-300 border border-blue-900/40 px-2 py-0.5 rounded-md">
              {doc.printStyle}
            </span>
            {doc.paperType === 'Glossy Paper' && (
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                Glossy
              </span>
            )}
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
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold px-2 py-1.5 rounded-lg hover:bg-orange-500/10 transition"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium px-2 py-1.5 rounded-lg hover:bg-rose-950/40 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
};


