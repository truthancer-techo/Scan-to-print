import React, { useState, useRef, useEffect } from 'react';
import {
  DocumentItem,
  ColorMode,
  Orientation,
  PaperType,
  PaperSize,
  PricingRule,
} from '../../../types';
import {
  Minus,
  Plus,
  RotateCw,
  Crop,
  Trash2,
  Sliders,
  Sparkles,
  FileText,
  UploadCloud,
  X,
  Check,
  ZoomIn,
  Grid,
  Image as ImageIcon,
} from 'lucide-react';
import { calculateDocumentPricing } from '../../../utils/pricing';

export type LayoutPreset =
  | '1_full'
  | '2_top_bottom'
  | '2_left_right'
  | '4_grid'
  | 'custom';

export interface SlotSetting {
  imageId?: string;
  imageUrl?: string;
  imageName?: string;
  fitMode: 'Fit' | 'Fill' | 'Stretch';
  rotation: number; // 0, 90, 180, 270
  zoom: number; // 50 to 200
  isCropped?: boolean;
}

interface ImageConfigurePanelProps {
  document: DocumentItem;
  documents?: DocumentItem[];
  pricingRules: PricingRule[];
  onChange: (updatedDoc: DocumentItem) => void;
  totalDocumentsCount?: number;
  selectedDocIndex?: number;
  onSelectDocIndex?: (index: number) => void;
  onRemoveDoc?: (index: number) => void;
  onResetAll?: () => void;
  onAddDocuments?: (newDocs: DocumentItem[]) => void;
}

export const ImageConfigurePanel: React.FC<ImageConfigurePanelProps> = ({
  document: activeDoc,
  documents = [],
  pricingRules,
  onChange,
  selectedDocIndex = 0,
  onSelectDocIndex,
  onRemoveDoc,
  onResetAll,
  onAddDocuments,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter only image documents from documents list
  const imageDocs = documents.filter(
    (d) =>
      d.fileType === 'image' ||
      d.type?.startsWith('image/') ||
      d.name?.match(/\.(jpg|jpeg|png|webp|bmp|gif|tiff)$/i)
  );

  // Safe fallback if activeDoc is not in imageDocs
  const currentImages = imageDocs.length > 0 ? imageDocs : [activeDoc];

  // 1. Layout Preset state
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>(() => {
    if (currentImages.length >= 5) return 'custom';
    if (currentImages.length === 4) return '4_grid';
    if (currentImages.length === 2) return '2_top_bottom';
    return '1_full';
  });

  // Custom Grid Rows & Columns
  const [customRows, setCustomRows] = useState<number>(() => {
    if (currentImages.length >= 9) return 3;
    if (currentImages.length >= 6) return 3;
    if (currentImages.length >= 4) return 2;
    return 3;
  });
  const [customCols, setCustomCols] = useState<number>(() => {
    if (currentImages.length >= 9) return 3;
    if (currentImages.length >= 6) return 2;
    if (currentImages.length >= 4) return 2;
    return 2;
  });

  // Applied grid specification
  const [appliedGrid, setAppliedGrid] = useState<{ rows: number; cols: number }>({
    rows: customRows,
    cols: customCols,
  });

  // Calculate total slots based on current preset
  const getGridDimensions = () => {
    switch (layoutPreset) {
      case '1_full':
        return { rows: 1, cols: 1 };
      case '2_top_bottom':
        return { rows: 2, cols: 1 };
      case '2_left_right':
        return { rows: 1, cols: 2 };
      case '4_grid':
        return { rows: 2, cols: 2 };
      case 'custom':
        return { rows: appliedGrid.rows, cols: appliedGrid.cols };
      default:
        return { rows: 1, cols: 1 };
    }
  };

  const { rows, cols } = getGridDimensions();
  const totalSlots = rows * cols;

  // Active slot index
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  // Slot configurations map (indexed 0..totalSlots-1)
  const [slots, setSlots] = useState<{ [key: number]: SlotSetting }>({});

  // Auto-populate or sync slots when layout or images change
  useEffect(() => {
    setSlots((prev) => {
      const next: { [key: number]: SlotSetting } = { ...prev };
      for (let i = 0; i < totalSlots; i++) {
        const assignedImg = currentImages[i % currentImages.length];
        if (!next[i]) {
          next[i] = {
            imageId: assignedImg?.id,
            imageUrl: assignedImg?.previewUrl || assignedImg?.url,
            imageName: assignedImg?.name,
            fitMode: 'Fit',
            rotation: 0,
            zoom: 100,
          };
        } else if (!next[i].imageUrl && assignedImg) {
          // Fill empty slot with image if available
          next[i] = {
            ...next[i],
            imageId: assignedImg.id,
            imageUrl: assignedImg.previewUrl || assignedImg.url,
            imageName: assignedImg.name,
          };
        }
      }
      return next;
    });
  }, [totalSlots, currentImages.length]);

  // Ensure activeSlotIndex is within valid range
  useEffect(() => {
    if (activeSlotIndex >= totalSlots) {
      setActiveSlotIndex(0);
    }
  }, [totalSlots, activeSlotIndex]);

  // Current active slot setting
  const activeSlot: SlotSetting = slots[activeSlotIndex] || {
    fitMode: 'Fit',
    rotation: 0,
    zoom: 100,
  };

  const updateActiveSlot = (patch: Partial<SlotSetting>) => {
    setSlots((prev) => ({
      ...prev,
      [activeSlotIndex]: {
        ...(prev[activeSlotIndex] || {
          fitMode: 'Fit',
          rotation: 0,
          zoom: 100,
        }),
        ...patch,
      },
    }));
  };

  // Helper to update activeDoc
  const updateDoc = (patch: Partial<DocumentItem>) => {
    const updated: DocumentItem = { ...activeDoc, ...patch };
    const pricing = calculateDocumentPricing(updated, pricingRules);
    updated.printablePages = pricing.printablePages;
    updated.sheetsCount = pricing.sheetsCount;
    updated.ratePerPage = pricing.ratePerPage;
    updated.totalPrice = pricing.totalPrice;
    onChange(updated);
  };

  // Fit mode
  const handleFitModeChange = (mode: 'Fit' | 'Fill' | 'Stretch') => {
    updateActiveSlot({ fitMode: mode });
  };

  // Rotate
  const handleRotate = () => {
    const nextRot = ((activeSlot.rotation || 0) + 90) % 360;
    updateActiveSlot({ rotation: nextRot });
  };

  // Crop toggle
  const handleToggleCrop = () => {
    const nextCrop = !activeSlot.isCropped;
    updateActiveSlot({
      isCropped: nextCrop,
      fitMode: nextCrop ? 'Fill' : activeSlot.fitMode,
    });
  };

  // Zoom
  const handleZoomChange = (z: number) => {
    updateActiveSlot({ zoom: z });
  };

  // Clear Slot
  const handleClearSlot = () => {
    updateActiveSlot({
      imageUrl: undefined,
      imageId: undefined,
      imageName: undefined,
      fitMode: 'Fit',
      rotation: 0,
      zoom: 100,
      isCropped: false,
    });
  };

  // Assign image to active slot
  const handleSelectThumbnail = (imgDoc: DocumentItem, index: number) => {
    onSelectDocIndex?.(index);
    updateActiveSlot({
      imageId: imgDoc.id,
      imageUrl: imgDoc.previewUrl || imgDoc.url,
      imageName: imgDoc.name,
    });
  };

  // Copies change
  const handleCopiesChange = (delta: number) => {
    const newCopies = Math.max(1, Math.min(100, (activeDoc.copies || 1) + delta));
    updateDoc({ copies: newCopies });
  };

  // File Upload processor for Drag & Drop / File Input
  const handleNewFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newDocs: DocumentItem[] = [];

    for (let idx = 0; idx < fileList.length; idx++) {
      const file = fileList[idx];
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      newDocs.push({
        id: `img-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
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
        copies: activeDoc.copies || 1,
        paperSize: activeDoc.paperSize || 'A4',
        colorMode: activeDoc.colorMode || 'Colour',
        printStyle: 'Single Sided',
        orientation: activeDoc.orientation || 'Auto',
        scaling: 'Fit to page',
        paperType: activeDoc.paperType || 'Plain Paper',
        collation: 'Collated',
        photoCollage: 'Original',
        sheetsCount: 1,
        ratePerPage: activeDoc.colorMode === 'B&W' ? 3.0 : 8.0,
        totalPrice: activeDoc.colorMode === 'B&W' ? 3.0 : 8.0,
      });
    }

    onAddDocuments?.(newDocs);
  };

  const isLandscape = activeDoc.orientation === 'Landscape';
  const isGrayscale = activeDoc.colorMode === 'B&W';

  return (
    <div className="bg-[#0b162d] rounded-3xl p-4 sm:p-6 border border-blue-900/50 shadow-xl shadow-black/40 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-blue-900/40 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#112347] text-orange-400 flex items-center justify-center border border-blue-800/40 shadow-inner">
            <Sliders className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <span>Image Print Configuration</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Photo Workspace
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Layout presets, multi-image collage slots & live WYSIWYG A4 print
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium">Rate</div>
          <div className="text-sm font-extrabold font-mono text-orange-400">
            ₹{(activeDoc.ratePerPage || 8.0).toFixed(2)}
            <span className="text-[10px] text-slate-400 font-normal">/sheet</span>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Adding More Images */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.bmp"
        onChange={(e) => handleNewFiles(e.target.files)}
        className="hidden"
      />

      {/* ============================================================== */}
      {/* 1. TAP OR DRAG IMAGES HERE (Dashed Dropzone - Image 1 & 2)     */}
      {/* ============================================================== */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleNewFiles(e.dataTransfer.files);
        }}
        className="group cursor-pointer rounded-2xl border-2 border-dashed border-blue-800/60 hover:border-orange-500 bg-[#070e1c] hover:bg-[#0c1833] p-4 text-center transition-all duration-200 shadow-inner flex flex-col items-center justify-center gap-1.5"
      >
        <div className="w-10 h-10 rounded-xl bg-[#112347] border border-blue-800/40 flex items-center justify-center text-blue-400 group-hover:text-orange-400 group-hover:border-orange-500/40 transition">
          <ImageIcon className="w-5 h-5" />
        </div>
        <div className="font-extrabold text-xs sm:text-sm text-slate-200 group-hover:text-white">
          Tap or drag images here
        </div>
        <p className="text-[11px] text-slate-400">
          JPG, PNG, WEBP (Multiple allowed, up to 25MB)
        </p>
      </div>

      {/* ============================================================== */}
      {/* 2. UPLOADED IMAGES BOX (Horizontal Thumbnail Strip - Image 2)   */}
      {/* ============================================================== */}
      <div className="bg-[#070e1c] rounded-2xl p-4 border border-blue-900/50 space-y-3 shadow-md">
        {/* Header: Uploaded Images (N) | + Add More | Reset All */}
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-xs sm:text-sm text-white">
            Uploaded Images ({currentImages.length})
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
            >
              <span>+ Add More</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset and remove all uploaded images?')) {
                  onResetAll?.();
                }
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-400 transition"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Thumbnails with Red (X) Delete Buttons */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
          {currentImages.map((img, idx) => {
            const isSelected = selectedDocIndex === idx;
            return (
              <div
                key={img.id || idx}
                onClick={() => handleSelectThumbnail(img, idx)}
                className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all active:scale-95 group ${
                  isSelected
                    ? 'border-orange-500 ring-2 ring-orange-500/30 shadow-md'
                    : 'border-slate-700/60 hover:border-slate-500'
                }`}
              >
                <img
                  src={img.previewUrl || img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />

                {/* Red Circular (X) Delete Button on Top Right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetIndex = documents.findIndex((d) => d.id === img.id);
                    if (targetIndex !== -1) {
                      onRemoveDoc?.(targetIndex);
                    }
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md transition"
                  title="Remove this image"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>

                {isSelected && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-orange-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. PAGE LAYOUT PRESET (Image 1, 2 & 4)                          */}
      {/* ============================================================== */}
      <div className="space-y-2.5">
        <label className="text-xs font-extrabold text-slate-300 block">
          Page Layout Preset
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* 1 Image (Full) */}
          <button
            type="button"
            onClick={() => setLayoutPreset('1_full')}
            className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition active:scale-[0.98] ${
              layoutPreset === '1_full'
                ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/40 shadow-sm'
                : 'bg-[#070e1c] border-blue-900/40 text-slate-300 hover:border-blue-700'
            }`}
          >
            <div className="w-6 h-8 rounded-xs border border-current flex items-center justify-center shrink-0">
              <div className="w-4 h-6 bg-current opacity-30 rounded-2xs" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs block leading-tight">
                1 Image (Full)
              </span>
            </div>
          </button>

          {/* 2 Images (Top/Bottom) */}
          <button
            type="button"
            onClick={() => setLayoutPreset('2_top_bottom')}
            className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition active:scale-[0.98] ${
              layoutPreset === '2_top_bottom'
                ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/40 shadow-sm'
                : 'bg-[#070e1c] border-blue-900/40 text-slate-300 hover:border-blue-700'
            }`}
          >
            <div className="w-6 h-8 rounded-xs border border-current flex flex-col justify-between p-0.5 shrink-0 gap-0.5">
              <div className="w-full h-3 bg-current opacity-30 rounded-2xs" />
              <div className="w-full h-3 bg-current opacity-30 rounded-2xs" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs block leading-tight">
                2 Images (Top/Bottom)
              </span>
            </div>
          </button>

          {/* 2 Images (Left/Right) */}
          <button
            type="button"
            onClick={() => setLayoutPreset('2_left_right')}
            className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition active:scale-[0.98] ${
              layoutPreset === '2_left_right'
                ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/40 shadow-sm'
                : 'bg-[#070e1c] border-blue-900/40 text-slate-300 hover:border-blue-700'
            }`}
          >
            <div className="w-6 h-8 rounded-xs border border-current flex justify-between p-0.5 shrink-0 gap-0.5">
              <div className="w-2.5 h-full bg-current opacity-30 rounded-2xs" />
              <div className="w-2.5 h-full bg-current opacity-30 rounded-2xs" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs block leading-tight">
                2 Images (Left/Right)
              </span>
            </div>
          </button>

          {/* 4 Images (2×2 Grid) */}
          <button
            type="button"
            onClick={() => setLayoutPreset('4_grid')}
            className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition active:scale-[0.98] ${
              layoutPreset === '4_grid'
                ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/40 shadow-sm'
                : 'bg-[#070e1c] border-blue-900/40 text-slate-300 hover:border-blue-700'
            }`}
          >
            <div className="w-6 h-8 rounded-xs border border-current grid grid-cols-2 p-0.5 shrink-0 gap-0.5">
              <div className="bg-current opacity-30 rounded-2xs" />
              <div className="bg-current opacity-30 rounded-2xs" />
              <div className="bg-current opacity-30 rounded-2xs" />
              <div className="bg-current opacity-30 rounded-2xs" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs block leading-tight">
                4 Images (2×2 Grid)
              </span>
            </div>
          </button>

          {/* Custom Grid */}
          <button
            type="button"
            onClick={() => setLayoutPreset('custom')}
            className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition active:scale-[0.98] ${
              layoutPreset === 'custom'
                ? 'bg-orange-500/15 border-orange-500 text-white ring-1 ring-orange-500/40 shadow-sm'
                : 'bg-[#070e1c] border-blue-900/40 text-slate-300 hover:border-blue-700'
            }`}
          >
            <Grid className="w-6 h-6 text-orange-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-extrabold text-xs block leading-tight">
                Custom Grid
              </span>
            </div>
          </button>
        </div>

        {/* Custom Grid Controls Bar (Rows, Columns, Apply Grid - Image 4) */}
        {layoutPreset === 'custom' && (
          <div className="mt-3 p-3.5 bg-[#070e1c] rounded-2xl border border-blue-900/50 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Rows */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Rows:</span>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={customRows}
                  onChange={(e) =>
                    setCustomRows(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))
                  }
                  className="w-14 py-1.5 px-2 bg-[#112347] border border-blue-800/50 rounded-xl text-center font-bold text-xs text-white"
                />
              </div>

              {/* Columns */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Columns:</span>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={customCols}
                  onChange={(e) =>
                    setCustomCols(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))
                  }
                  className="w-14 py-1.5 px-2 bg-[#112347] border border-blue-800/50 rounded-xl text-center font-bold text-xs text-white"
                />
              </div>
            </div>

            {/* Apply Grid Button */}
            <button
              type="button"
              onClick={() => {
                setAppliedGrid({ rows: customRows, cols: customCols });
              }}
              className="px-4 py-2 bg-[#112347] hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl border border-blue-800/50 transition active:scale-95 shadow-sm"
            >
              Apply Grid
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. CONFIGURE SLOT SELECTOR (Image 3 & 4)                       */}
      {/* ============================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-slate-300">
            Configure Slot:
          </label>
          <span className="text-[11px] text-slate-400">
            Slot {activeSlotIndex + 1} of {totalSlots}
          </span>
        </div>

        {/* Slot Pills (Slot 1, Slot 2, Slot 3...) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          {Array.from({ length: totalSlots }).map((_, slotIdx) => {
            const isActive = activeSlotIndex === slotIdx;
            const slotData = slots[slotIdx];
            const hasImage = !!slotData?.imageUrl;

            return (
              <button
                key={slotIdx}
                type="button"
                onClick={() => setActiveSlotIndex(slotIdx)}
                className={`px-3.5 py-1.5 rounded-full font-bold text-xs shrink-0 transition active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400'
                    : hasImage
                    ? 'bg-[#112347] text-slate-200 hover:text-white border border-blue-800/50'
                    : 'bg-[#070e1c] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>Slot {slotIdx + 1}</span>
                {hasImage && <span className="ml-1 opacity-70 text-[10px]">●</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. SLOT CONTROLS BAR: FIT MODE, ROTATE, CROP, ZOOM, CLEAR SLOT */}
      {/* ============================================================== */}
      <div className="bg-[#070e1c] p-4 rounded-2xl border border-blue-900/50 space-y-3.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* FIT MODE: Fit, Fill, Stretch */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              FIT MODE
            </span>
            <div className="inline-flex items-center bg-[#0d1a36] p-1 rounded-xl border border-blue-900/50 shadow-inner">
              {(['Fit', 'Fill', 'Stretch'] as const).map((mode) => {
                const isSelected = activeSlot.fitMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleFitModeChange(mode)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-[#122347]'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ROTATE, CROP & CLEAR SLOT BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* ROTATE */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                ROTATE
              </span>
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#112347] hover:bg-[#162c5a] text-slate-200 hover:text-white border border-blue-800/40 text-xs font-bold transition active:scale-95 shadow-xs"
                title="Rotate 90 degrees clockwise"
              >
                <RotateCw className="w-3.5 h-3.5 text-orange-400" />
                <span>{activeSlot.rotation || 0}°</span>
              </button>
            </div>

            {/* CROP */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                CROP
              </span>
              <button
                type="button"
                onClick={handleToggleCrop}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 shadow-xs ${
                  activeSlot.isCropped
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/30'
                    : 'bg-[#112347] hover:bg-[#162c5a] text-slate-200 hover:text-white border-blue-800/40'
                }`}
                title="Toggle Crop framing"
              >
                <Crop className="w-3.5 h-3.5 text-orange-400" />
                <span>Crop</span>
              </button>
            </div>

            {/* CLEAR SLOT */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 opacity-0">
                CLEAR
              </span>
              <button
                type="button"
                onClick={handleClearSlot}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/40 text-xs font-bold transition active:scale-95 shadow-xs"
                title="Clear current slot"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear Slot</span>
              </button>
            </div>
          </div>
        </div>

        {/* ZOOM LEVEL SLIDER */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ZoomIn className="w-3 h-3 text-orange-400" />
              ZOOM LEVEL
            </span>
            <span className="text-xs font-mono font-bold text-orange-400">
              {activeSlot.zoom || 100}%
            </span>
          </div>

          <input
            type="range"
            min={50}
            max={200}
            step={5}
            value={activeSlot.zoom || 100}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. LIVE A4 PRINT PREVIEW (WYSIWYG) - EXACT MATCH TO IMAGE 3 & 5 */}
      {/* ============================================================== */}
      <div className="bg-[#070e1c] rounded-3xl border border-blue-900/60 p-4 sm:p-5 shadow-2xl shadow-black/60 relative overflow-hidden">
        {/* Header: Live A4 Print Preview (WYSIWYG) | What you see is what prints */}
        <div className="flex items-center justify-between pb-3.5 border-b border-blue-900/40 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              Live A4 Print Preview
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-400">
              (WYSIWYG)
            </span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-400 italic font-medium shrink-0">
            What you see is what prints
          </span>
        </div>

        {/* The White A4 Paper Sheet */}
        <div className="py-6 flex flex-col items-center justify-center bg-[#050a14] rounded-2xl my-3 p-3 sm:p-4 border border-blue-950/60 overflow-hidden relative">
          {/* Dimension Tag */}
          <div className="mb-2 text-[10px] font-mono text-slate-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {activeDoc.paperSize || 'A4'} Sheet ({isLandscape ? '297 × 210 mm' : '210 × 297 mm'})
            </span>
          </div>

          {/* White Paper Canvas */}
          <div
            className={`bg-white rounded-sm shadow-2xl shadow-black border border-slate-300 relative transition-all duration-300 flex flex-col items-center justify-center overflow-hidden ${
              isLandscape
                ? 'w-full max-w-[420px] aspect-[297/210]'
                : 'w-full max-w-[270px] sm:max-w-[310px] aspect-[210/297]'
            }`}
            style={{ padding: '8px' }}
          >
            {/* Printable Margin Guideline (Dashed box) */}
            <div className="w-full h-full border border-dashed border-slate-300 rounded-xs flex items-center justify-center p-1 relative overflow-hidden bg-slate-50/20">
              {/* Grid of Slots inside A4 Sheet */}
              <div
                className="w-full h-full grid gap-1.5 overflow-hidden"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: totalSlots }).map((_, slotIdx) => {
                  const slotData = slots[slotIdx] || {
                    fitMode: 'Fit',
                    rotation: 0,
                    zoom: 100,
                  };
                  const isSlotActive = activeSlotIndex === slotIdx;
                  const hasImage = !!slotData.imageUrl;

                  // Fit Mode Object-fit mapping
                  const objectFit =
                    slotData.fitMode === 'Stretch'
                      ? 'fill'
                      : slotData.fitMode === 'Fill'
                      ? 'cover'
                      : 'contain';

                  return (
                    <div
                      key={slotIdx}
                      onClick={() => setActiveSlotIndex(slotIdx)}
                      className={`relative rounded-xs border overflow-hidden cursor-pointer flex items-center justify-center p-0.5 transition-all ${
                        isSlotActive
                          ? 'border-blue-500 ring-2 ring-blue-400 shadow-md bg-blue-50/20'
                          : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      {hasImage ? (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                          <img
                            src={slotData.imageUrl}
                            alt={`Slot ${slotIdx + 1}`}
                            className="transition-transform duration-200"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit,
                              transform: `rotate(${slotData.rotation || 0}deg) scale(${
                                (slotData.zoom || 100) / 100
                              })`,
                              filter: isGrayscale ? 'grayscale(100%)' : 'none',
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-center p-1">
                          <span className="text-[10px] font-bold text-slate-400 block">
                            Slot {slotIdx + 1}
                          </span>
                          <span className="text-[9px] text-slate-300">Empty</span>
                        </div>
                      )}

                      {/* Small Slot Number Badge */}
                      <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white font-mono text-[8px] px-1 rounded-2xs">
                        #{slotIdx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            {rows} × {cols} Grid ({totalSlots} photo slots on A4)
          </div>
        </div>

        {/* ============================================================== */}
        {/* 7. NUMBER OF COPIES STEPPER (Image 5)                          */}
        {/* ============================================================== */}
        <div className="pt-3.5 border-t border-blue-900/40 flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-extrabold text-white block">
              Number of Copies
            </span>
            <span className="text-[11px] text-slate-400">
              Total sheets: {activeDoc.copies || 1} × {activeDoc.printablePages || 1} ={' '}
              <strong className="text-slate-200">
                {activeDoc.sheetsCount || activeDoc.copies || 1} sheet(s)
              </strong>
            </span>
          </div>

          {/* Stepper: - [copies] + */}
          <div className="flex items-center gap-2 bg-[#112347] border border-blue-800/50 rounded-2xl p-1 shadow-inner">
            <button
              type="button"
              onClick={() => handleCopiesChange(-1)}
              disabled={(activeDoc.copies || 1) <= 1}
              className="w-9 h-9 rounded-xl bg-[#09152b] hover:bg-[#162d5a] text-slate-200 hover:text-white flex items-center justify-center transition active:scale-95 disabled:opacity-40"
              title="Decrease copies"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="w-10 text-center font-mono font-black text-sm text-white select-none">
              {activeDoc.copies || 1}
            </span>
            <button
              type="button"
              onClick={() => handleCopiesChange(1)}
              disabled={(activeDoc.copies || 1) >= 100}
              className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center transition active:scale-95 shadow-md shadow-orange-500/30"
              title="Increase copies"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 8. SECONDARY PRINT OPTIONS: COLOR, PAPER TYPE, PAPER SIZE      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
        {/* Color Mode */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Color Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['B&W', 'Colour'] as ColorMode[]).map((mode) => {
              const isSelected = (activeDoc.colorMode || 'Colour') === mode;
              const rate = mode === 'Colour' ? 8.0 : 3.0;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateDoc({ colorMode: mode })}
                  className={`min-h-[44px] py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-between active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        mode === 'Colour' ? 'bg-amber-400 shadow-xs' : 'bg-slate-400'
                      }`}
                    />
                    <span>{mode}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    ₹{rate}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paper Type */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Paper Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Plain Paper', 'Glossy Paper'] as PaperType[]).map((type) => {
              const isSelected = (activeDoc.paperType || 'Plain Paper') === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateDoc({ paperType: type })}
                  className={`min-h-[44px] py-2 px-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  {type === 'Glossy Paper' ? (
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span>{type === 'Glossy Paper' ? 'Glossy' : 'Plain'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orientation */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Orientation
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['Auto', 'Portrait', 'Landscape'] as Orientation[]).map((orient) => {
              const isSelected = (activeDoc.orientation || 'Auto') === orient;
              return (
                <button
                  key={orient}
                  type="button"
                  onClick={() => updateDoc({ orientation: orient })}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all flex items-center justify-center active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  <span>{orient}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
