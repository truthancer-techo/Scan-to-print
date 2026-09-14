import React, { useRef, useState } from 'react';
import { UploadCloud, AlertCircle, FileText, Sparkles, ArrowUp } from 'lucide-react';
import { DocumentItem } from '../../types';
import { UploadProgress } from './UploadProgress';

interface FileUploaderProps {
  onFilesUploaded: (docs: DocumentItem[]) => void;
  onOpenScanner?: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadFileSize, setUploadFileSize] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);

    const validFiles: File[] = [];
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > MAX_SIZE) {
        setErrorMsg(`File "${file.name}" exceeds the maximum 50 MB limit.`);
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Start animated upload progress
    const first = validFiles[0];
    setUploadFileName(validFiles.length === 1 ? first.name : `${validFiles.length} documents`);
    setUploadFileSize(validFiles.reduce((acc, f) => acc + f.size, 0));
    setIsUploading(true);
    setUploadProgress(10);
    setIsComplete(false);

    // Read files and convert to data URLs
    const docs: DocumentItem[] = [];
    let completedCount = 0;

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        const isImg = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

        // Estimate pages (1 for images, or simulated estimate based on size for PDF/Word/Excel)
        const estimatedPages = isImg
          ? 1
          : isPdf
          ? Math.max(1, Math.min(25, Math.ceil(file.size / 350000)))
          : 1;

        const docItem: DocumentItem = {
          id: `doc-${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: resultUrl,
          previewUrl: isImg ? resultUrl : undefined,
          pageCount: estimatedPages,
          pageRange: 'all',
          printablePages: estimatedPages,
          copies: 1,
          paperSize: 'A4',
          colorMode: isImg ? 'Colour' : 'B&W',
          printStyle: 'Single Sided',
          orientation: 'Auto',
          scaling: 'Fit to page',
          paperType: 'Plain Paper',
          collation: 'Collated',
          photoCollage: 'Original',
          sheetsCount: estimatedPages,
          ratePerPage: isImg ? 8.0 : 3.0,
          totalPrice: (isImg ? 8.0 : 3.0) * estimatedPages,
        };

        docs.push(docItem);
        completedCount++;

        // Smooth progress simulation
        const progressVal = Math.min(95, Math.round((completedCount / validFiles.length) * 90));
        setUploadProgress(progressVal);

        if (completedCount === validFiles.length) {
          // Finish upload
          setTimeout(() => {
            setUploadProgress(100);
            setIsComplete(true);
            setTimeout(() => {
              setIsUploading(false);
              onFilesUploaded(docs);
            }, 800);
          }, 600);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  if (isUploading) {
    return (
      <UploadProgress
        fileName={uploadFileName}
        fileSize={uploadFileSize}
        progress={uploadProgress}
        isComplete={isComplete}
      />
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 px-1">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-rose-950/60 border border-rose-500/40 text-rose-200 rounded-2xl text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Upload Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer bg-[#0b162d] rounded-3xl p-6 sm:p-8 text-center transition-all duration-200 border shadow-xl shadow-black/40 ${
          isDragging
            ? 'border-orange-500 bg-[#0f1d3d] scale-[1.01] ring-2 ring-orange-500/30'
            : 'border-blue-900/50 hover:border-blue-700/60 hover:bg-[#0d1a36]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip"
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
        />

        {/* Upload Icon Container matching reference image */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-[#112347] border border-blue-800/40 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:border-orange-500/50 transition-all duration-200 shadow-inner relative">
          <div className="relative flex items-center justify-center">
            <UploadCloud className="w-9 h-9 sm:w-10 sm:h-10 text-white stroke-[1.8]" />
            <ArrowUp className="w-3.5 h-3.5 text-orange-400 stroke-[3] absolute bottom-1" />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Drop your file here
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-5">
          or tap to browse
        </p>

        {/* Prominent Primary CTA Button */}
        <div className="my-5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="w-full max-w-xs mx-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-full font-black text-sm sm:text-base shadow-lg shadow-orange-500/30 active:scale-95 transition-all tracking-wide"
          >
            <span>Choose Files</span>
          </button>
        </div>

        {/* Supported formats & file size */}
        <div className="space-y-1.5 pt-4">
          <p className="text-xs font-bold text-slate-200">
            Supported:
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            PDF, Word, Excel, PowerPoint, TXT, JPG, PNG, ZIP
          </p>
          <p className="text-xs font-black text-orange-400 tracking-wide">
            Max 50 MB
          </p>
        </div>

        {/* Bottom features bar inside the card */}
        <div className="pt-4 mt-5 border-t border-blue-900/40 grid grid-cols-2 gap-2 text-left">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium border-r border-blue-900/40 pr-2">
            <FileText className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="truncate">Multiple files supported</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium pl-2">
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="truncate">High-resolution output</span>
          </div>
        </div>
      </div>

      {/* Privacy guarantee */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 px-3">
          <span>🔒 Secure & Private — Your documents are automatically deleted after order completion.</span>
        </p>
      </div>
    </div>
  );
};

