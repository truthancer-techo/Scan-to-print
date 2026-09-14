import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, FileText, CheckCircle } from 'lucide-react';
import { DocumentItem } from '../../types';

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

  if (!isOpen || !doc) return null;

  const isImage = doc.type.startsWith('image/') || doc.name.match(/\.(jpg|jpeg|png|webp|bmp)$/i);
  const isPdf = doc.type.includes('pdf') || doc.name.endsWith('.pdf');

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0b162d] rounded-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden shadow-2xl border border-blue-900/50 text-white">
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
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#112347] transition"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-300 font-mono">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#112347] transition"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#112347] transition ml-1"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#112347] transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="flex-1 bg-[#040813] overflow-auto p-6 flex items-center justify-center min-h-[380px]">
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
          ) : isPdf && doc.url ? (
            <div
              className="w-full h-[500px] bg-white rounded-lg shadow-2xl overflow-hidden"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <iframe
                src={`${doc.url}#toolbar=0`}
                title={doc.name}
                className="w-full h-full border-0"
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

        {/* Bottom Configuration Summary */}
        <div className="p-4 bg-[#0b162d] border-t border-blue-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-300">
            <span>
              Format:{' '}
              <strong className="text-white font-semibold">
                {doc.paperSize} ({doc.printStyle})
              </strong>
            </span>
            <span>
              Color Mode:{' '}
              <strong className="text-white font-semibold">{doc.colorMode}</strong>
            </span>
            <span>
              Paper:{' '}
              <strong className="text-white font-semibold">{doc.paperType}</strong>
            </span>
            <span>
              Copies:{' '}
              <strong className="text-white font-semibold">{doc.copies}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {doc.url && (
              <a
                href={doc.url}
                download={doc.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-800/40 hover:bg-[#112347] rounded-xl text-slate-200 font-medium transition"
              >
                <Download className="w-3.5 h-3.5" /> Download File
              </a>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-full font-bold transition shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
