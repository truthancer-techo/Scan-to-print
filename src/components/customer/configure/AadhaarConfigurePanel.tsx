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
    1: { rotation: 0, zoom: 100, panX: 0, panY: 0, crop: { top: 0, bottom: 0, left: 0, right: 0 }, isCropping: false },
  });

  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [draggingHandle, setDraggingHandle] = useState<CropHandle | null>(null);
  const draggingHandleRef = useRef<CropHandle | null>(null);

  // Panning state for A4 preview
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

  // Sync slots with uploaded images
  useEffect(() => {
    setSlots((prev) => {
      const updated = { ...prev };
      if (currentImages[0]) {
        updated[0] = {
          ...updated[0],
          imageUrl: currentImages[0].previewUrl || currentImages[0].url,
        };
      } else {
        updated[0] = { ...updated[0], imageUrl: undefined };
      }

      if (currentImages[1]) {
        updated[1] = {
          ...updated[1],
          imageUrl: currentImages[1].previewUrl || currentImages[1].url,
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
      [activeSlotIndex]: {
        ...prev[activeSlotIndex],
        ...updates,
      },
    }));
  };

  // Pan bounds: Image can move freely across the entire A4 canvas all the way to edges/corners
  const getPanBounds = (zoomLevel = 100) => {
    const scale = Math.max(0.5, zoomLevel / 100);
    const maxPanX = Math.round(120 * scale + 70);
    const maxPanY = Math.round(170 * scale + 90);
    return { maxPanX, maxPanY };
  };

  // Smooth touch gestures on A4 preview: 2-finger pinch zoom (big/small) & 1-finger move
  useEffect(() => {
    const el = paperGestureRef.current;
    if (!el) return;

    let isPinching = false;
    let isDragging = false;
    let isPanLocked = false;
    let startDist = 0;
    let startZoom = 100;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragInitialPanX = 0;
    let dragInitialPanY = 0;
    let gestureIntent: 'undecided' | 'scroll' | 'pan' = 'undecided';
    let panHoldTimer: ReturnType<typeof setTimeout> | null = null;

    const calcDist = (t1: Touch, t2: Touch) =>
      Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (panHoldTimer) {
        clearTimeout(panHoldTimer);
        panHoldTimer = null;
      }

      // If user is touching a crop handle, let pointer events handle it
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-crop-handle]')) {
        isDragging = false;
        isPinching = false;
        isPanLocked = false;
        return;
      }

      // If in crop mode, don't pan image when touching inside
      if (activeSlotRef.current.isCropping) {
        return;
      }

      if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        isPinching = true;
        isDragging = false;
        isPanLocked = false;
        gestureIntent = 'pan';
        startDist = calcDist(e.touches[0], e.touches[1]) || 1;
        startZoom = activeSlotRef.current.zoom || 100;
      } else if (e.touches.length === 1) {
        isPinching = false;
        isDragging = false;
        isPanLocked = false;
        gestureIntent = 'undecided';

        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
        dragInitialPanX = activeSlotRef.current.panX || 0;
        dragInitialPanY = activeSlotRef.current.panY || 0;

        panHoldTimer = setTimeout(() => {
          if (gestureIntent !== 'scroll') {
            isPanLocked = true;
            isDragging = true;
            gestureIntent = 'pan';
          }
        }, 100);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      // If user is dragging a crop handle or in crop mode, skip panning
      if (draggingHandleRef.current || activeSlotRef.current.isCropping) return;

      if (isPinching && e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();

        const currentDist = calcDist(e.touches[0], e.touches[1]);
        const scaleFactor = currentDist / (startDist || 1);
        const newZoom = Math.max(40, Math.min(350, Math.round(startZoom * scaleFactor)));

        const bounds = getPanBounds(newZoom);
        const clampedPanX = Math.max(-bounds.maxPanX, Math.min(bounds.maxPanX, activeSlotRef.current.panX || 0));
        const clampedPanY = Math.max(-bounds.maxPanY, Math.min(bounds.maxPanY, activeSlotRef.current.panY || 0));

        updateActiveSlot({
          zoom: newZoom,
          panX: clampedPanX,
          panY: clampedPanY,
        });
        return;
      }

      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - dragStartX;
        const deltaY = e.touches[0].clientY - dragStartY;

        if (gestureIntent === 'undecided') {
          if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX) * 1.3 && !isPanLocked) {
            gestureIntent = 'scroll';
            if (panHoldTimer) clearTimeout(panHoldTimer);
            return;
          }
          if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
            gestureIntent = 'pan';
            isDragging = true;
            isPanLocked = true;
            if (panHoldTimer) clearTimeout(panHoldTimer);
          }
        }

        if (gestureIntent === 'scroll') return;

        if (isDragging) {
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();

          const bounds = getPanBounds(activeSlotRef.current.zoom || 100);
          const rawPanX = dragInitialPanX + deltaX;
          const rawPanY = dragInitialPanY + deltaY;
          const clampedPanX = Math.max(-bounds.maxPanX, Math.min(bounds.maxPanX, rawPanX));
          const clampedPanY = Math.max(-bounds.maxPanY, Math.min(bounds.maxPanY, rawPanY));

          updateActiveSlot({ panX: clampedPanX, panY: clampedPanY });
        }
      }
    };

    const onTouchEnd = () => {
      if (panHoldTimer) clearTimeout(panHoldTimer);
      isPinching = false;
      isDragging = false;
      isPanLocked = false;
      gestureIntent = 'undecided';
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      if (panHoldTimer) clearTimeout(panHoldTimer);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [activeSlotIndex]);

  // Desktop mouse drag to pan
  const startPan = (e: React.MouseEvent) => {
    if (activeSlot.isCropping || draggingHandleRef.current) return;
    if ((e.target as HTMLElement)?.closest('[data-crop-handle]')) return;
    e.preventDefault();
    e.stopPropagation();

    panStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: activeSlot.panX || 0,
      initialPanY: activeSlot.panY || 0,
    };
    setIsPanning(true);
  };

  // Mouse wheel zoom
  const handleSlotWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomDelta = e.deltaY < 0 ? 5 : -5;
    const currentZoom = activeSlot.zoom || 100;
    const newZoom = Math.max(40, Math.min(350, currentZoom + zoomDelta));
    const bounds = getPanBounds(newZoom);
    const clampedPanX = Math.max(-bounds.maxPanX, Math.min(bounds.maxPanX, activeSlot.panX || 0));
    const clampedPanY = Math.max(-bounds.maxPanY, Math.min(bounds.maxPanY, activeSlot.panY || 0));
    updateActiveSlot({ zoom: newZoom, panX: clampedPanX, panY: clampedPanY });
  };

  // Global pointer handlers for smooth handle dragging & desktop panning
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

            const rot = activeSlot.rotation || 0;
            const cx = (rect.left + rect.right) / 2;
            const cy = (rect.top + rect.bottom) / 2;
            const unrotatedW = targetBox.offsetWidth || rect.width;
            const unrotatedH = targetBox.offsetHeight || rect.height;

            if (unrotatedW > 0 && unrotatedH > 0) {
              const scale = ((activeSlot.zoom || 100) / 100) || 1;
              const rad = (-rot * Math.PI) / 180;
              const dx = (clientX - cx) / scale;
              const dy = (clientY - cy) / scale;
              const localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
              const localDy = dx * Math.sin(rad) + dy * Math.cos(rad);
              const localX = localDx + unrotatedW / 2;
              const localY = localDy + unrotatedH / 2;

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

        // 2. Desktop Mouse Pan across A4
        if (isPanning && panStartRef.current && !activeSlot.isCropping) {
          const dx = clientX - panStartRef.current.startX;
          const dy = clientY - panStartRef.current.startY;
          const bounds = getPanBounds(activeSlot.zoom || 100);
          const rawPanX = panStartRef.current.initialPanX + dx;
          const rawPanY = panStartRef.current.initialPanY + dy;
          const clampedPanX = Math.max(-bounds.maxPanX, Math.min(bounds.maxPanX, Math.round(rawPanX)));
          const clampedPanY = Math.max(-bounds.maxPanY, Math.min(bounds.maxPanY, Math.round(rawPanY)));
          updateActiveSlot({ panX: clampedPanX, panY: clampedPanY });
        }
      });
    };

    const handlePointerUp = () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      draggingHandleRef.current = null;
      setDraggingHandle(null);
      setIsPanning(false);
      panStartRef.current = null;
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
  }, [draggingHandle, isPanning, activeSlot.crop, activeSlot.zoom, activeSlot.isCropping]);

  const handleRotate = () => {
    const cur = activeSlot.rotation || 0;
    updateActiveSlot({ rotation: (cur + 90) % 360 });
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
      {/* 2. MAIN LIVE A4 PRINT LAYOUT PREVIEW (ALL ACTIONS IN A4)       */}
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

        {/* Realistic A4 White Paper Container: Pure Unified A4 Sheet, NO Grid, NO Separate Window */}
        <div className="bg-[#070e1c] p-4 sm:p-6 rounded-2xl border border-blue-900/50 flex flex-col justify-center items-center overflow-hidden">
          {/* A4 Sheet: strict 1:1.4142 aspect ratio, pure white, strictly containing all children */}
          <div
            ref={paperGestureRef}
            onWheel={handleSlotWheel}
            className="relative bg-white text-slate-800 rounded-sm shadow-2xl overflow-hidden border border-slate-300 w-full max-w-[280px] sm:max-w-[320px] select-none flex flex-col items-center justify-center"
            style={{
              aspectRatio: '1 / 1.4142',
              touchAction: 'pan-y',
              contain: 'paint',
              clipPath: 'inset(0)',
            }}
          >
            {/* If 1 image uploaded: Single unified canvas, user can position image anywhere across the whole A4 sheet */}
            {!hasMultipleImages ? (
              activeSlot.imageUrl ? (
                <div
                  onMouseDown={startPan}
                  className={`w-full h-full relative flex items-center justify-center overflow-hidden select-none ${
                    isPanning && !activeSlot.isCropping ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{
                    touchAction: 'pan-y',
                    contain: 'paint',
                    clipPath: 'inset(0)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Panned container with strict bounding so it never escapes A4 corners */}
                  <div
                    className={`w-full h-full relative flex items-center justify-center ${
                      isPanning ? 'transition-none' : 'transition-transform duration-100 ease-out'
                    }`}
                    style={{
                      transform: `translate3d(${activeSlot.panX || 0}px, ${activeSlot.panY || 0}px, 0)`,
                      willChange: isPanning ? 'transform' : 'auto',
                      contain: 'paint',
                      clipPath: 'inset(0)',
                    }}
                  >
                    {/* Scaled & Rotated Image Box */}
                    <div
                      ref={activeImageContainerRef}
                      className="relative flex items-center justify-center max-w-[94%] max-h-[94%]"
                      style={{
                        transform: `rotate(${activeSlot.rotation || 0}deg) scale(${
                          (activeSlot.zoom || 100) / 100
                        })`,
                        contain: 'paint',
                      }}
                    >
                      <img
                        src={activeSlot.imageUrl}
                        alt="Aadhaar Card"
                        className="w-full h-auto max-h-[380px] object-contain select-none pointer-events-none"
                        style={{
                          clipPath:
                            activeSlot.crop && !activeSlot.isCropping
                              ? `inset(${activeSlot.crop.top}% ${activeSlot.crop.right}% ${activeSlot.crop.bottom}% ${activeSlot.crop.left}%)`
                              : undefined,
                        }}
                      />

                      {/* IN-PLACE CROP BOX (EXACTLY MATCHING USER SCREENSHOT!) */}
                      {activeSlot.isCropping && (
                        <div
                          className="absolute pointer-events-none z-30 select-none"
                          style={{
                            top: `${activeSlot.crop?.top || 0}%`,
                            bottom: `${activeSlot.crop?.bottom || 0}%`,
                            left: `${activeSlot.crop?.left || 0}%`,
                            right: `${activeSlot.crop?.right || 0}%`,
                          }}
                        >
                          {/* Blue Rectangle Border */}
                          <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />

                          {/* Diagonal 'X' Cross Lines (Matching User's Screenshot!) */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                            <line x1="0%" y1="0%" x2="100%" y2="100%" stroke="#3b82f6" strokeWidth="1.5" />
                            <line x1="100%" y1="0%" x2="0%" y2="100%" stroke="#3b82f6" strokeWidth="1.5" />
                          </svg>

                          {/* 8 Square Points: White squares with blue border (Matching User's Screenshot!) */}
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
                </div>
              ) : null
            ) : (
              /* If 2 images (Front & Back): Both placed cleanly on the A4 page, tap to select & drag */
              <div className="w-full h-full p-2 flex flex-col justify-between overflow-hidden relative">
                {[0, 1].map((idx) => {
                  const s = slots[idx];
                  if (!s || !s.imageUrl) return null;
                  const isSelected = activeSlotIndex === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveSlotIndex(idx)}
                      onMouseDown={isSelected && !s.isCropping ? startPan : undefined}
                      className={`relative flex-1 flex items-center justify-center overflow-hidden cursor-pointer select-none ${
                        isSelected && !s.isCropping ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''
                      }`}
                      style={{
                        touchAction: 'pan-y',
                        contain: 'paint',
                        clipPath: 'inset(0)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className={`w-full h-full relative flex items-center justify-center ${
                          isPanning && isSelected ? 'transition-none' : 'transition-transform duration-100 ease-out'
                        }`}
                        style={{
                          transform: `translate3d(${s.panX || 0}px, ${s.panY || 0}px, 0)`,
                          willChange: isPanning && isSelected ? 'transform' : 'auto',
                          contain: 'paint',
                          clipPath: 'inset(0)',
                        }}
                      >
                        <div
                          ref={isSelected ? activeImageContainerRef : undefined}
                          className="relative flex items-center justify-center max-w-[94%] max-h-[94%]"
                          style={{
                            transform: `rotate(${s.rotation || 0}deg) scale(${
                              (s.zoom || 100) / 100
                            })`,
                            contain: 'paint',
                          }}
                        >
                          <img
                            src={s.imageUrl}
                            alt=""
                            className="w-full h-auto max-h-[175px] object-contain select-none pointer-events-none"
                            style={{
                              clipPath:
                                s.crop && !s.isCropping
                                  ? `inset(${s.crop.top}% ${s.crop.right}% ${s.crop.bottom}% ${s.crop.left}%)`
                                  : undefined,
                            }}
                          />

                          {/* In-Place Crop Box for selected card */}
                          {isSelected && s.isCropping && (
                            <div
                              className="absolute pointer-events-none z-30 select-none"
                              style={{
                                top: `${s.crop?.top || 0}%`,
                                bottom: `${s.crop?.bottom || 0}%`,
                                left: `${s.crop?.left || 0}%`,
                                right: `${s.crop?.right || 0}%`,
                              }}
                            >
                              <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />

                              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                                <line x1="0%" y1="0%" x2="100%" y2="100%" stroke="#3b82f6" strokeWidth="1.5" />
                                <line x1="100%" y1="0%" x2="0%" y2="100%" stroke="#3b82f6" strokeWidth="1.5" />
                              </svg>

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
                    </div>
                  );
                })}
              </div>
            )}
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
