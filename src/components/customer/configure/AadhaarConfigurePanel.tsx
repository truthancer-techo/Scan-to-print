import React, { useState, useEffect, useRef } from 'react';
import {
  Minus,
  Plus,
  RotateCw,
  Crop,
  Eye,
  Image as ImageIcon,
  X,
  RotateCcw,
} from 'lucide-react';
import { DocumentItem, PricingRule, ColorMode } from '../../../types';
import { calculateDocumentPricing } from '../../../utils/pricing';

export interface SlotCrop {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface AadhaarSlotData {
  imageUrl?: string;
  zoom?: number;
  rotation?: number;
  panX?: number;
  panY?: number;
  crop?: SlotCrop;
  isCropping?: boolean;
}

type CropHandle =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

const CROP_HANDLES: { id: CropHandle; top: string; left: string; cursor: string }[] = [
  { id: 'top-left', top: '0%', left: '0%', cursor: 'cursor-nwse-resize' },
  { id: 'top', top: '0%', left: '50%', cursor: 'cursor-ns-resize' },
  { id: 'top-right', top: '0%', left: '100%', cursor: 'cursor-nesw-resize' },
  { id: 'right', top: '50%', left: '100%', cursor: 'cursor-ew-resize' },
  { id: 'bottom-right', top: '100%', left: '100%', cursor: 'cursor-nwse-resize' },
  { id: 'bottom', top: '100%', left: '50%', cursor: 'cursor-ns-resize' },
  { id: 'bottom-left', top: '100%', left: '0%', cursor: 'cursor-nesw-resize' },
  { id: 'left', top: '50%', left: '0%', cursor: 'cursor-ew-resize' },
];

interface AadhaarConfigurePanelProps {
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

export const AadhaarConfigurePanel: React.FC<AadhaarConfigurePanelProps> = ({
  document: doc,
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
  const paperGestureRef = useRef<HTMLDivElement | null>(null);
  const activeImageContainerRef = useRef<HTMLDivElement | null>(null);

  // Current uploaded images list
  const currentImages = documents.length > 0 ? documents : (doc.previewUrl || doc.url ? [doc] : []);

  // Per-image configurations: index 0 (Front) and index 1 (Back)
  const [slots, setSlots] = useState<{ [key: number]: AadhaarSlotData }>({
    0: { rotation: 0, zoom: 100, panX: 0, panY: 0, crop: { top: 0, bottom: 0, left: 0, right: 0 }, isCropping: false },
    1: { rotation: 0, zoom: 100, panX: 0, panY: 95, crop: { top: 0, bottom: 0, left: 0, right: 0 }, isCropping: false },
  });

  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(selectedDocIndex || 0);
  const [draggingHandle, setDraggingHandle] = useState<CropHandle | null>(null);
  const draggingHandleRef = useRef<CropHandle | null>(null);

  // Tracking which card is currently being dragged
  const panCardIdxRef = useRef<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number } | null>(null);

  const activeSlot = slots[activeSlotIndex] || {
    rotation: 0,
    zoom: 100,
    panX: 0,
    panY: 0,
    crop: { top: 0, bottom: 0, left: 0, right: 0 },
    isCropping: false,
  };

  const activeSlotRef = useRef(activeSlot);
  activeSlotRef.current = activeSlot;
  const activeSlotIndexRef = useRef(activeSlotIndex);
  activeSlotIndexRef.current = activeSlotIndex;

  // Sync activeSlotIndex with selectedDocIndex from props if changed externally
  useEffect(() => {
    if (selectedDocIndex !== undefined && selectedDocIndex !== activeSlotIndex) {
      setActiveSlotIndex(selectedDocIndex);
    }
  }, [selectedDocIndex]);

  // Sync slots with uploaded images:
  // When 2 images exist, default Image 0 to top half (-95px) and Image 1 to bottom half (+95px)
  // so BOTH are immediately visible on the A4 page without covering each other!
  useEffect(() => {
    setSlots((prev) => {
      const updated = { ...prev };
      const hasTwo = currentImages.length > 1;

      if (currentImages[0]) {
        const prevPanY = prev[0]?.panY;
        const initialPanY = hasTwo ? (prevPanY !== undefined && prevPanY !== 0 ? prevPanY : -95) : (prevPanY ?? 0);

        updated[0] = {
          ...updated[0],
          imageUrl: currentImages[0].previewUrl || currentImages[0].url,
          panY: initialPanY,
        };
      } else {
        updated[0] = { ...updated[0], imageUrl: undefined };
      }

      if (currentImages[1]) {
        const prevPanY = prev[1]?.panY;
        const initialPanY = prevPanY !== undefined && prevPanY !== 0 ? prevPanY : 95;

        updated[1] = {
          ...updated[1],
          imageUrl: currentImages[1].previewUrl || currentImages[1].url,
          panY: initialPanY,
        };
      } else {
        updated[1] = { ...updated[1], imageUrl: undefined };
      }
      return updated;
    });
  }, [currentImages]);

  const updateActiveSlot = (updates: Partial<AadhaarSlotData>) => {
    setSlots((prev) => ({
      ...prev,
      [activeSlotIndexRef.current]: {
        ...prev[activeSlotIndexRef.current],
        ...updates,
      },
    }));
  };

  const updateSlotByIdx = (idx: number, updates: Partial<AadhaarSlotData>) => {
    setSlots((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        ...updates,
      },
    }));
  };

  // Pan bounds: Generous bounds allowing images to move all the way from top to bottom
  // and corner to corner across the entire A4 canvas, strictly bounded inside the outer A4 edge
  const getPanBounds = () => {
    const el = paperGestureRef.current;
    const paperW = el?.clientWidth || 280;
    const paperH = el?.clientHeight || Math.round(paperW * 1.4142);

    const maxPanX = Math.round(paperW / 2 - 15);
    const maxPanY = Math.round(paperH / 2 - 20);

    return { maxPanX, maxPanY };
  };

  // Direct card pointer down to select card and immediately start smooth dragging
  const handleCardPointerDown = (e: React.PointerEvent, idx: number) => {
    setActiveSlotIndex(idx);
    onSelectDocIndex?.(idx);

    const slot = slots[idx];
    if (slot?.isCropping) return;
    if ((e.target as HTMLElement)?.closest('[data-crop-handle]')) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    panCardIdxRef.current = idx;
    panStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: slot?.panX || 0,
      initialPanY: slot?.panY || 0,
    };
    setIsPanning(true);
  };

  // Touch gesture handler: 2-finger pinch zoom on active card
  useEffect(() => {
    const el = paperGestureRef.current;
    if (!el) return;

    let isPinching = false;
    let startDist = 0;
    let startZoom = 100;

    const calcDist = (t1: Touch, t2: Touch) =>
      Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (activeSlotRef.current.isCropping) return;

      if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        isPinching = true;
        startDist = calcDist(e.touches[0], e.touches[1]) || 1;
        startZoom = activeSlotRef.current.zoom || 100;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (activeSlotRef.current.isCropping) return;

      if (isPinching && e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();

        const currentDist = calcDist(e.touches[0], e.touches[1]);
        const scaleFactor = currentDist / (startDist || 1);
        const newZoom = Math.max(30, Math.min(350, Math.round(startZoom * scaleFactor)));

        updateActiveSlot({ zoom: newZoom });
      }
    };

    const onTouchEnd = () => {
      isPinching = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Mouse wheel zoom
  const handleSlotWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomDelta = e.deltaY < 0 ? 5 : -5;
    const currentZoom = activeSlot.zoom || 100;
    const newZoom = Math.max(30, Math.min(350, currentZoom + zoomDelta));
    updateActiveSlot({ zoom: newZoom });
  };

  // Global pointer handlers for card dragging & crop handle dragging
  useEffect(() => {
    if (!isPanning && !draggingHandle) return;

    let animFrameId: number | null = null;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY;

      if (animFrameId) cancelAnimationFrame(animFrameId);

      animFrameId = requestAnimationFrame(() => {
        // 1. Dragging one of the 8 square crop handles right on the image
        if (draggingHandle) {
          const targetBox = activeImageContainerRef.current;
          if (targetBox) {
            const rect = targetBox.getBoundingClientRect();
            const currentCrop = activeSlot.crop || { top: 0, bottom: 0, left: 0, right: 0 };
            const newCrop = { ...currentCrop };

            const unrotatedW = targetBox.offsetWidth || rect.width;
            const unrotatedH = targetBox.offsetHeight || rect.height;

            if (unrotatedW > 0 && unrotatedH > 0) {
              const localX = clientX - rect.left;
              const localY = clientY - rect.top;

              if (draggingHandle.includes('top')) {
                const topPct = Math.max(0, Math.min(85 - (currentCrop.bottom || 0), (localY / unrotatedH) * 100));
                newCrop.top = Math.round(topPct);
              }
              if (draggingHandle.includes('bottom')) {
                const bottomPct = Math.max(0, Math.min(85 - (currentCrop.top || 0), ((unrotatedH - localY) / unrotatedH) * 100));
                newCrop.bottom = Math.round(bottomPct);
              }
              if (draggingHandle.includes('left')) {
                const leftPct = Math.max(0, Math.min(85 - (currentCrop.right || 0), (localX / unrotatedW) * 100));
                newCrop.left = Math.round(leftPct);
              }
              if (draggingHandle.includes('right')) {
                const rightPct = Math.max(0, Math.min(85 - (currentCrop.left || 0), ((unrotatedW - localX) / unrotatedW) * 100));
                newCrop.right = Math.round(rightPct);
              }

              updateActiveSlot({ crop: newCrop });
              return;
            }
          }
        }

        // 2. Dragging a card across the A4 canvas
        if (isPanning && panStartRef.current && panCardIdxRef.current !== null) {
          const targetIdx = panCardIdxRef.current;
          const dx = clientX - panStartRef.current.startX;
          const dy = clientY - panStartRef.current.startY;
          const bounds = getPanBounds();
          const rawPanX = panStartRef.current.initialPanX + dx;
          const rawPanY = panStartRef.current.initialPanY + dy;
          const clampedPanX = Math.max(-bounds.maxPanX, Math.min(bounds.maxPanX, Math.round(rawPanX)));
          const clampedPanY = Math.max(-bounds.maxPanY, Math.min(bounds.maxPanY, Math.round(rawPanY)));
          updateSlotByIdx(targetIdx, { panX: clampedPanX, panY: clampedPanY });
        }
      });
    };

    const handlePointerUp = () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      draggingHandleRef.current = null;
      setDraggingHandle(null);
      setIsPanning(false);
      panStartRef.current = null;
      panCardIdxRef.current = null;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchcancel', handlePointerUp);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [draggingHandle, isPanning, activeSlot.crop]);

  const handleRotate = () => {
    const newRotation = ((activeSlot.rotation || 0) + 90) % 360;
    updateActiveSlot({ rotation: newRotation });
  };

  const handleToggleCrop = () => {
    updateActiveSlot({ isCropping: !activeSlot.isCropping });
  };

  const handleResetCrop = () => {
    updateActiveSlot({ crop: { top: 0, bottom: 0, left: 0, right: 0 } });
  };

  const handleCropHandlePointerDown = (e: React.PointerEvent, handle: CropHandle) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
    draggingHandleRef.current = handle;
    setDraggingHandle(handle);
  };

  // Pricing calculations
  const applyCalculation = (updates: Partial<DocumentItem>) => {
    const merged: DocumentItem = {
      ...doc,
      ...updates,
      serviceType: 'aadhaar',
      detectedDocumentType: 'aadhaar_card',
      useAadhaarLayout: true,
      paperSize: 'A4',
      printablePages: 1,
    };
    const updated = calculateDocumentPricing(merged, pricingRules);
    onChange(updated);
  };

  const handleCopiesChange = (delta: number) => {
    const current = doc.copies || 1;
    const newCopies = Math.max(1, Math.min(100, current + delta));
    applyCalculation({ copies: newCopies });
  };

  const handleManualCopiesInput = (val: string) => {
    if (val === '') {
      applyCalculation({ copies: 1 });
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(1, Math.min(100, num));
      applyCalculation({ copies: clamped });
    }
  };

  const handleNewFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newDocs: DocumentItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const newDoc: DocumentItem = {
        id: `aadhaar-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type || 'image/jpeg',
        fileType: file.type === 'application/pdf' ? 'pdf' : 'image',
        url: dataUrl,
        previewUrl: dataUrl,
        originalUrl: dataUrl,
        pageCount: 1,
        pageRange: 'all',
        printablePages: 1,
        copies: doc.copies || 1,
        paperSize: 'A4',
        colorMode: doc.colorMode || 'Colour',
        printStyle: 'Single Sided',
        orientation: 'Portrait',
        scaling: 'Fit to page',
        paperType: 'Plain Paper',
        collation: 'Collated',
        photoCollage: 'Original',
        sheetsCount: doc.copies || 1,
        physicalSheets: doc.copies || 1,
        ratePerPage: doc.colorMode === 'Colour' ? 8.0 : 3.0,
        subtotal: (doc.colorMode === 'Colour' ? 8.0 : 3.0) * (doc.copies || 1),
        totalPrice: (doc.colorMode === 'Colour' ? 8.0 : 3.0) * (doc.copies || 1),
        serviceType: 'aadhaar',
        detectedDocumentType: 'aadhaar_card',
        isAadhaarDerivative: true,
        useAadhaarLayout: true,
      };
      newDocs.push(newDoc);
    }

    if (newDocs.length > 0) {
      if (onAddDocuments) {
        onAddDocuments(newDocs);
      } else {
        onChange(newDocs[0]);
      }
    }
  };

  const currentColor = doc.colorMode || 'Colour';
  const currentCopies = doc.copies || 1;
  const hasMultipleImages = currentImages.length > 1;

  const hasAnyCrop =
    (activeSlot.crop?.top || 0) > 0 ||
    (activeSlot.crop?.bottom || 0) > 0 ||
    (activeSlot.crop?.left || 0) > 0 ||
    (activeSlot.crop?.right || 0) > 0;

  return (
    <div className="bg-[#0b162d] rounded-3xl p-4 sm:p-6 border border-blue-900/50 shadow-xl shadow-black/40 space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0f2042] border border-blue-600/40 flex items-center justify-center p-1 shadow-inner shrink-0">
            <img
              src="/icons/aadhaar-card-stack.svg"
              alt="Aadhaar Front + Back"
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Aadhaar Print Setup
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Check your print layout and settings.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Adding More Images */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.bmp,.pdf"
        onChange={(e) => {
          handleNewFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* ============================================================== */}
      {/* BOX 1: TAP OR DRAG IMAGES HERE (Dashed Dropzone)               */}
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
      {/* BOX 2: UPLOADED IMAGES BOX (Horizontal Thumbnail Strip)         */}
      {/* ============================================================== */}
      <div className="bg-[#070e1c] rounded-2xl p-4 border border-blue-900/50 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-xs sm:text-sm text-white">
            Uploaded Images ({currentImages.length})
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-xl bg-blue-950/60 hover:bg-blue-900/70 text-blue-300 hover:text-white border border-blue-800/50 text-xs font-bold transition active:scale-95 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>+ Add More</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onResetAll) {
                  onResetAll();
                }
              }}
              className="px-2.5 py-1 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/50 text-xs font-bold transition active:scale-95 shadow-xs cursor-pointer"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
          {currentImages.map((img, idx) => {
            const isSelected = activeSlotIndex === idx;
            return (
              <div
                key={img.id || idx}
                onClick={() => {
                  setActiveSlotIndex(idx);
                  onSelectDocIndex?.(idx);
                }}
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

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetIndex = documents.length > 0
                      ? documents.findIndex((d) => d.id === img.id)
                      : idx;
                    if (targetIndex !== -1 && onRemoveDoc) {
                      onRemoveDoc(targetIndex);
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
      {/* 2. MAIN LIVE A4 PRINT LAYOUT PREVIEW (PURE SINGLE A4 CANVAS)   */}
      {/* ============================================================== */}
      <div className="space-y-3">
        {/* Header & Tool Bar */}
        <div className="flex flex-col gap-2.5 px-1">
          {/* Interactive Tools: Rotate, Crop, Done/Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Rotate Button */}
            <button
              type="button"
              onClick={handleRotate}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#112347] hover:bg-[#162c5a] text-slate-200 hover:text-white border border-blue-800/40 text-xs font-bold transition active:scale-95 shadow-xs"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-3.5 h-3.5 text-orange-400" />
              <span>{activeSlot.rotation || 0}°</span>
            </button>

            {/* In-Place Crop Toggle Button */}
            <button
              type="button"
              onClick={handleToggleCrop}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 shadow-xs ${
                activeSlot.isCropping
                  ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/40'
                  : 'bg-[#112347] hover:bg-[#162c5a] text-slate-200 hover:text-white border-blue-800/40'
              }`}
              title="Toggle In-place Crop"
            >
              <Crop className={`w-3.5 h-3.5 ${activeSlot.isCropping ? 'text-white' : 'text-orange-400'}`} />
              <span>{activeSlot.isCropping ? 'Done Crop' : 'Crop'}</span>
            </button>

            {/* Reset Crop Button (visible when cropped or cropping) */}
            {hasAnyCrop && (
              <button
                type="button"
                onClick={handleResetCrop}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-bold transition active:scale-95 shadow-xs"
                title="Reset Crop to Original Image"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-orange-400" />
            <span>A4 Print Layout Preview</span>
          </label>
        </div>

        {/* Realistic A4 White Paper Container: Strictly Clamped, Pure White A4 */}
        <div className="bg-[#070e1c] p-4 sm:p-6 rounded-2xl border border-blue-900/50 flex flex-col justify-center items-center overflow-hidden">
          {/* A4 Sheet: strict 1:1.4142 aspect ratio, pure white, ZERO dividing lines, ZERO middle boundaries */}
          <div
            ref={paperGestureRef}
            onWheel={handleSlotWheel}
            className="relative bg-white text-slate-800 rounded-sm shadow-2xl border border-slate-300 w-full max-w-[280px] sm:max-w-[320px] select-none overflow-hidden"
            style={{
              aspectRatio: '1 / 1.4142',
              touchAction: 'none',
              contain: 'paint',
              clipPath: 'inset(0)',
              WebkitClipPath: 'inset(0)',
              isolation: 'isolate',
              transform: 'translateZ(0)',
            }}
          >
            {/* Render both uploaded images simultaneously on the same single full A4 sheet */}
            {[0, 1].map((idx) => {
              const s = slots[idx];
              if (!s || !s.imageUrl) return null;
              const isSelected = activeSlotIndex === idx;

              const crop = s.crop || { top: 0, bottom: 0, left: 0, right: 0 };
              const isCardCropping = s.isCropping;

              // Exact cropped dimensions
              const cropW = Math.max(10, 100 - (crop.left || 0) - (crop.right || 0));
              const cropH = Math.max(10, 100 - (crop.top || 0) - (crop.bottom || 0));
              const hasAppliedCrop = (crop.top > 0 || crop.bottom > 0 || crop.left > 0 || crop.right > 0) && !isCardCropping;

              // Base standard size for card on A4 canvas
              const baseW = 215;
              const baseH = 135;

              // Cropped box size shrinks to cropped area with zero ghost margins
              const visibleW = hasAppliedCrop ? Math.round((cropW / 100) * baseW) : baseW;
              const visibleH = hasAppliedCrop ? Math.round((cropH / 100) * baseH) : baseH;

              return (
                <div
                  key={idx}
                  onPointerDown={(e) => handleCardPointerDown(e, idx)}
                  className={`absolute flex items-center justify-center cursor-pointer select-none rounded-sm transition-shadow ${
                    isSelected
                      ? (hasMultipleImages ? 'ring-2 ring-blue-500 shadow-md ring-offset-1 ring-offset-white' : '')
                      : 'hover:ring-1 hover:ring-slate-300 opacity-95'
                  }`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate3d(calc(-50% + ${s.panX || 0}px), calc(-50% + ${s.panY || 0}px), 0)`,
                    zIndex: isSelected ? 30 : 10,
                    touchAction: 'none',
                  }}
                >
                  {/* Scaled & Rotated Container */}
                  <div
                    ref={isSelected ? activeImageContainerRef : undefined}
                    className="relative flex items-center justify-center"
                    style={{
                      transform: `rotate(${s.rotation || 0}deg) scale(${
                        (s.zoom || 100) / 100
                      })`,
                      transformOrigin: 'center center',
                    }}
                  >
                    {/* Visible Cropped Container with Zero Ghost Margins (Never cuts off on zoom!) */}
                    <div
                      className="relative overflow-hidden flex items-center justify-center select-none"
                      style={{
                        width: `${visibleW}px`,
                        height: `${visibleH}px`,
                      }}
                    >
                      <img
                        src={s.imageUrl}
                        alt="Aadhaar Card"
                        className="select-none pointer-events-none max-w-none max-h-none"
                        style={{
                          position: 'absolute',
                          width: hasAppliedCrop ? `${(100 / cropW) * 100}%` : '100%',
                          height: hasAppliedCrop ? `${(100 / cropH) * 100}%` : '100%',
                          left: hasAppliedCrop ? `-${(crop.left / cropW) * 100}%` : '0%',
                          top: hasAppliedCrop ? `-${(crop.top / cropH) * 100}%` : '0%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>

                    {/* IN-PLACE CROP BOX OVERLAY (MATCHING SCREENSHOT) */}
                    {isSelected && isCardCropping && (
                      <div
                        className="absolute pointer-events-none z-30 select-none"
                        style={{
                          top: `${crop.top}%`,
                          bottom: `${crop.bottom}%`,
                          left: `${crop.left}%`,
                          right: `${crop.right}%`,
                        }}
                      >
                        {/* Blue Rectangle Border */}
                        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />

                        {/* Diagonal 'X' Cross Lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                          <line x1="0%" y1="0%" x2="100%" y2="100%" stroke="#3b82f6" strokeWidth="1.5" />
                          <line x1="100%" y1="0%" x2="0%" y2="100%" stroke="#3b82f6" strokeWidth="1.5" />
                        </svg>

                        {/* 8 Square Points: White squares with blue border */}
                        {CROP_HANDLES.map((handle) => (
                          <div
                            key={handle.id}
                            data-crop-handle="true"
                            onPointerDown={(e) => handleCropHandlePointerDown(e, handle.id)}
                            className={`absolute w-3.5 h-3.5 bg-white border-2 border-blue-600 shadow-sm ${handle.cursor} pointer-events-auto hover:scale-125 active:scale-135 transition-transform z-40 touch-none select-none`}
                            style={{
                              top: handle.top,
                              left: handle.left,
                              transform: 'translate(-50%, -50%)',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Number of Copies & Color Mode Options */}
      <div className="space-y-4 pt-2">
        {/* Copies Stepper with Direct Input */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-[#091326] p-4 rounded-2xl border border-blue-900/40">
          <div>
            <span className="text-xs font-extrabold text-white block">
              Number of Copies
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#112347] border border-blue-800/50 rounded-2xl p-1 shadow-inner">
            <button
              type="button"
              onClick={() => handleCopiesChange(-1)}
              disabled={currentCopies <= 1}
              className="w-9 h-9 rounded-xl bg-[#09152b] hover:bg-[#162d5a] text-slate-200 hover:text-white flex items-center justify-center transition active:scale-95 disabled:opacity-40"
              title="Decrease copies"
              aria-label="Decrease copies"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <input
              type="number"
              min="1"
              max="100"
              value={currentCopies}
              onChange={(e) => handleManualCopiesInput(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-12 h-9 text-center font-mono font-black text-sm text-white bg-transparent border-none focus:outline-hidden focus:ring-1 focus:ring-orange-500/60 rounded-lg cursor-text hover:bg-white/5 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title="Click or tap to enter number of copies"
              aria-label="Number of copies"
            />
            <button
              type="button"
              onClick={() => handleCopiesChange(1)}
              disabled={currentCopies >= 100}
              className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center transition active:scale-95 shadow-md shadow-orange-500/30"
              title="Increase copies"
              aria-label="Increase copies"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Color Mode Selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Color Mode
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {(['B&W', 'Colour'] as ColorMode[]).map((mode) => {
              const isSelected = currentColor === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => applyCalculation({ colorMode: mode })}
                  className={`min-h-[48px] py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-orange-500/15 text-white border-orange-500 shadow-sm ring-1 ring-orange-500/40'
                      : 'border-blue-900/40 hover:border-blue-800/60 bg-[#091326] text-slate-300 hover:bg-[#0c1833]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        mode === 'Colour' ? 'bg-amber-400 shadow-xs' : 'bg-slate-400'
                      }`}
                    />
                    <span>{mode}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
