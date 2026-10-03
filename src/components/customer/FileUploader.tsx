import React, { useRef, useState } from 'react';
import { UploadCloud, AlertCircle, FileText, Sparkles, ArrowUp, X } from 'lucide-react';
import { DocumentItem } from '../../types';
import { UploadProgress } from './UploadProgress';
import { detectPdfMetadata } from '../../utils/pdfReader';
import { analyzePdfDocument } from '../../utils/aadhaar/documentAnalyzer';

interface FileUploaderProps {
  onFilesUploaded: (docs: DocumentItem[]) => void;
  onOpenScanner?: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const aadhaarFileInputRef = useRef<HTMLInputElement | null>(null);
  const passportFileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeService, setActiveService] = useState<'passport' | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadFileSize, setUploadFileSize] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAadhaarUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);

    const validFiles: File[] = [];
    const MAX_SIZE = 50 * 1024 * 1024;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > MAX_SIZE) {
        setErrorMsg(`File "${file.name}" exceeds the maximum 50 MB limit.`);
        return;
      }
      validFiles.push(file);
    }
    if (validFiles.length === 0) return;

    const first = validFiles[0];
    setUploadFileName(validFiles.length === 1 ? first.name : `${validFiles.length} files (Aadhaar)`);
    setUploadFileSize(validFiles.reduce((acc, f) => acc + f.size, 0));
    setIsUploading(true);
    setUploadProgress(20);
    setIsComplete(false);
    setStatusMessage('Preparing Aadhaar A4 print layout...');

    try {
      const docs: DocumentItem[] = [];

      for (let index = 0; index < validFiles.length; index++) {
        const file = validFiles[index];
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isImg = file.type.startsWith('image/');

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        if (isPdf) {
          const pdfMeta = await detectPdfMetadata(file);
          const pageCount = pdfMeta.pageCount;
          const docItem: DocumentItem = {
            id: `aadhaar-${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: file.type || 'application/pdf',
            fileType: 'pdf',
            url: dataUrl,
            previewUrl: dataUrl,
            originalUrl: dataUrl,
            pageCount: pageCount,
            pageRange: 'all',
            pageSelectionMode: 'all',
            selectedPages: [1],
            printablePages: 1,
            copies: 1,
            paperSize: 'A4',
            colorMode: 'Colour',
            printStyle: 'Single Sided',
            orientation: 'Portrait',
            scaling: 'Fit to page',
            scalingMode: 'default',
            paperType: 'Plain Paper',
            printQuality: 'Normal',
            collation: 'Collated',
            photoCollage: 'Original',
            sheetsCount: 1,
            physicalSheets: 1,
            ratePerPage: 8.0,
            subtotal: 8.0,
            totalPrice: 8.0,
            serviceType: 'aadhaar',
            detectedDocumentType: 'aadhaar_card',
            isAadhaarDerivative: true,
            useAadhaarLayout: true,
          };

          try {
            const { updatedDoc } = await analyzePdfDocument(docItem, file);
            if (updatedDoc.printLayoutUrl) {
              docItem.detectedPanels = updatedDoc.detectedPanels;
              docItem.layoutStatus = updatedDoc.layoutStatus;
              docItem.printLayoutUrl = updatedDoc.printLayoutUrl;
              docItem.printLayoutThumbnail = updatedDoc.printLayoutThumbnail;
            }
          } catch (err) {
            console.warn('Aadhaar analysis fallback:', err);
          }

          docs.push(docItem);
        } else {
          // Images (Front and/or Back)
          const docItem: DocumentItem = {
            id: `aadhaar-${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: file.type || 'image/jpeg',
            fileType: 'image',
            url: dataUrl,
            previewUrl: dataUrl,
            originalUrl: dataUrl,
            pageCount: 1,
            pageRange: 'all',
            printablePages: 1,
            copies: 1,
            paperSize: 'A4',
            colorMode: 'Colour',
            printStyle: 'Single Sided',
            orientation: 'Portrait',
            scaling: 'Fit to page',
            paperType: 'Plain Paper',
            collation: 'Collated',
            photoCollage: 'Original',
            sheetsCount: 1,
            physicalSheets: 1,
            ratePerPage: 8.0,
            subtotal: 8.0,
            totalPrice: 8.0,
            serviceType: 'aadhaar',
            detectedDocumentType: 'aadhaar_card',
            isAadhaarDerivative: true,
            useAadhaarLayout: true,
          };
          docs.push(docItem);
        }
      }

      setUploadProgress(100);
      setIsComplete(true);
      setStatusMessage('Aadhaar setup ready!');

      setTimeout(() => {
        setIsUploading(false);
        setIsComplete(false);
        setUploadProgress(0);
        onFilesUploaded(docs);
      }, 300);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload Aadhaar file');
      setIsUploading(false);
    }
  };

  const processFiles = async (fileList: FileList | null) => {
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
    setUploadProgress(15);
    setIsComplete(false);

    try {
      const docs: DocumentItem[] = [];

      for (let index = 0; index < validFiles.length; index++) {
        const file = validFiles[index];
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isImg = file.type.startsWith('image/');

        // Read file as Data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        if (isPdf) {
          // Detect authentic PDF page count
          const pdfMeta = await detectPdfMetadata(file);
          const pageCount = pdfMeta.pageCount;

          const docItem: DocumentItem = {
            id: `doc-${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: file.type || 'application/pdf',
            fileType: 'pdf',
            url: dataUrl,
            previewUrl: dataUrl,
            originalUrl: dataUrl,
            pageCount: pageCount,
            pageRange: 'all',
            pageSelectionMode: 'all',
            selectedPages: Array.from({ length: pageCount }, (_, i) => i + 1),
            printablePages: pageCount,
            copies: 1,
            paperSize: 'A4',
            colorMode: 'B&W',
            printStyle: 'Single Sided',
            orientation: 'Auto',
            scaling: 'Fit to page',
            scalingMode: 'default',
            paperType: 'Plain Paper',
            printQuality: 'Normal',
            collation: 'Collated',
            photoCollage: 'Original',
            sheetsCount: pageCount,
            physicalSheets: pageCount,
            ratePerPage: 3.0,
            subtotal: 3.0 * pageCount,
            totalPrice: 3.0 * pageCount,
          };

          // Automatically analyze PDF for Aadhaar document layout
          let finalDoc = docItem;
          try {
            setStatusMessage('Analyzing document layout…');
            const { updatedDoc, detectionResult } = await analyzePdfDocument(
              docItem,
              file,
              (status, msg) => {
                if (msg) setStatusMessage(msg);
              }
            );
            finalDoc = updatedDoc;
            if (detectionResult?.detected) {
              setStatusMessage('Aadhaar layout detected (Front & Back panels ready)');
            }
          } catch (analysisErr) {
            console.warn('PDF layout detection skipped:', analysisErr);
          }

          docs.push(finalDoc);
        } else {
          const estimatedPages = isImg ? 1 : 1;
          const docItem: DocumentItem = {
            id: `doc-${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            fileType: isImg ? 'image' : 'document',
            url: dataUrl,
            previewUrl: isImg ? dataUrl : undefined,
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
        }

        const progressVal = Math.min(95, Math.round(((index + 1) / validFiles.length) * 90));
        setUploadProgress(progressVal);
      }

      setUploadProgress(100);
      setIsComplete(true);
      setTimeout(() => {
        setIsUploading(false);
        onFilesUploaded(docs);
      }, 500);
    } catch (err: any) {
      console.error('File upload processing failed:', err);
      setErrorMsg('Failed to process document file. Please try again.');
      setIsUploading(false);
    }
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
        statusMessage={statusMessage}
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

      {/* Services Section */}
      <div className="space-y-3 pt-1">
        <div className="px-1">
          <h3 className="text-sm font-extrabold text-white tracking-wide">
            Services
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* CARD 1: Aadhaar Front + Back */}
          <button
            type="button"
            onClick={() => aadhaarFileInputRef.current?.click()}
            className="group w-full text-left p-4 rounded-2xl bg-[#0b162d] border border-blue-900/50 hover:border-orange-500/50 hover:bg-[#0e1d3b] transition-all duration-200 shadow-lg shadow-black/20 flex flex-col justify-between cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0f2042] border border-blue-600/40 flex items-center justify-center p-1 shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-blue-500/10">
                <img
                  src="/icons/aadhaar-card-stack.svg"
                  alt="Aadhaar Front + Back"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-extrabold text-white group-hover:text-orange-400 transition-colors">
                  Aadhaar Front + Back
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  Set front & back on A4
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-blue-900/30 flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 group-hover:text-orange-300 flex items-center gap-1">
                <span>Open Service →</span>
              </span>
            </div>
          </button>

          {/* Hidden input for Aadhaar service */}
          <input
            ref={aadhaarFileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={(e) => {
              handleAadhaarUpload(e.target.files);
              e.target.value = '';
            }}
          />

          {/* CARD 2: Passport Size Photo */}
          <button
            type="button"
            onClick={() => passportFileInputRef.current?.click()}
            className="group w-full text-left p-4 rounded-2xl bg-[#0b162d] border border-blue-900/50 hover:border-orange-500/50 hover:bg-[#0e1d3b] transition-all duration-200 shadow-lg shadow-black/20 flex flex-col justify-between cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0f2042] border border-blue-600/40 flex items-center justify-center p-1 shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-blue-500/10">
                <span className="text-2xl" role="img" aria-label="Passport Size Photo">📸</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-extrabold text-white group-hover:text-orange-400 transition-colors">
                  Passport Size Photo
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  Create passport photos on A4
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-blue-900/30 flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 group-hover:text-orange-300 flex items-center gap-1">
                <span>Open Service →</span>
              </span>
            </div>
          </button>

          {/* Hidden input for Passport service */}
          <input
            ref={passportFileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* Service Modal for other services if needed */}
      {activeService === 'passport' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#0b162d] border border-blue-900/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setActiveService(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#112347] hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 border border-blue-800/40"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#112347] border border-blue-800/50 flex items-center justify-center text-2xl shadow-inner shrink-0">
                <span>📸</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Passport Size Photo
                </h3>
                <p className="text-xs text-orange-400 font-medium">
                  Create passport photos on A4
                </p>
              </div>
            </div>

            <div className="bg-[#091326] rounded-2xl p-4 border border-blue-900/40 text-xs text-slate-300 space-y-2">
              <p>
                This dedicated service lets you create passport size photos on an A4 sheet ready for printing.
              </p>
              <p className="text-slate-400 text-[11px]">
                Select your photo now to arrange and configure it for printing.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveService(null);
                  fileInputRef.current?.click();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer"
              >
                Upload Photo
              </button>
              <button
                type="button"
                onClick={() => setActiveService(null)}
                className="py-3 px-4 rounded-xl bg-[#112347] hover:bg-[#162d5a] text-slate-300 hover:text-white font-bold text-xs sm:text-sm border border-blue-800/40 transition active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy guarantee */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 px-3">
          <span>🔒 Secure & Private — Your documents are automatically deleted after order completion.</span>
        </p>
      </div>
    </div>
  );
};

