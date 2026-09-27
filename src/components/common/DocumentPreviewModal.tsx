import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, FileText, CheckCircle } from 'lucide-react';
import { DocumentItem } from '../../types';
import { PdfPreview } from '../customer/preview/PdfPreview';
import { useModalScrollLock } from '../../utils/useModalScrollLock';

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  isOpen,
  onClose,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(doc?.rotation || 0);
  const imageScrollRef = useRef<HTMLDivElement | null>(null);

  const isImage =
    doc?.type.startsWith('image/') || doc?.name.match(/\.(jpg|jpeg|png|webp|bmp)$/i);
  const isPdf =
    doc?.fileType === 'pdf' || doc?.type.includes('pdf') || doc?.name.toLowerCase().endsWith('.pdf');

  // Activate scroll lock on image modal if open
  useModalScrollLock(isOpen && !isPdf && !!doc, imageScrollRef, onClose);

  if (!isOpen || !doc) return null;

  // Dedicated in-app PDF rendering via PDF.js with continuous vertical scroll
  if (isPdf) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="bg-[#070e1c] rounded-2xl max-w-4xl w-full flex flex-col h-[94vh] max-h-[94vh] overflow-hidden shadow-2xl border border-blue-900/60 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <PdfPreview document={doc} onClose={onClose} isModal={true} />
        </div>
      </div>
    );
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-[#0b162d] rounded-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden shadow-2xl border border-blue-900/50 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 bg-[#070e1c] text-white flex items-center justify-between border-b border-blue-950">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="font-bold text-sm truncate text-white">{doc.name}</h3>
              <p className="text-xs text-slate-400">
                {(doc.size / (1024 * 1024)).toFixed(2)} MB • {doc.pageCount} page(s) • {doc.paperSize} {doc.colorMode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#112347] transition"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-300 font-mono">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#112347] transition"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#112347] transition ml-1"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#112347] transition ml-2"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div
          ref={imageScrollRef}
          className="flex-1 bg-[#040813] overflow-auto overscroll-contain p-6 flex items-center justify-center min-h-[380px]"
          style={{ overscrollBehavior: 'contain' }}
        >
          {isImage && doc.url ? (
            <div
              className="transition-transform duration-200 shadow-2xl rounded-lg overflow-hidden bg-white"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                maxWidth: '100%',
              }}
            >
              <img
                src={doc.url}
                alt={doc.name}
                className="max-h-[500px] object-contain block mx-auto"
              />
            </div>
          ) : (
            <div className="p-8 text-center bg-[#0b162d] rounded-2xl shadow-xl border border-blue-900/50 max-w-sm">
              <FileText className="w-16 h-16 text-orange-400 mx-auto mb-3" />
              <p className="font-semibold text-white">{doc.name}</p>
              <p className="text-xs text-slate-400 mt-1">
                Document loaded securely. Standard document engine ready for physical printing.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full font-medium border border-emerald-500/30">
                <CheckCircle className="w-3.5 h-3.5" /> High-Resolution Print Ready
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-[#0b162d] border-t border-blue-900/40 flex items-center justify-end text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl font-bold transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
