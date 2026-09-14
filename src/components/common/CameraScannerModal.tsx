import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, ShieldAlert, Upload, Image as ImageIcon } from 'lucide-react';
import { DocumentItem } from '../../types';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentScanned: (doc: DocumentItem) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onDocumentScanned,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [docContrast, setDocContrast] = useState<'normal' | 'high' | 'bw'>('normal');
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopActiveStream = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (mode: 'environment' | 'user') => {
    try {
      setIsLoadingCamera(true);
      setErrorMsg(null);
      stopActiveStream();

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser environment.');
      }

      let mediaStream: MediaStream | null = null;

      // Tier 1: Try with requested facing mode as ideal (never exact to avoid OverconstrainedError)
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (firstErr) {
        console.warn('Ideal facingMode constraint failed, trying fallback camera constraints:', firstErr);
        // Tier 2: Try opposite facing mode
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: mode === 'environment' ? 'user' : 'environment' },
            },
            audio: false,
          });
        } catch (secondErr) {
          console.warn('Alternate facingMode failed, trying generic video constraint:', secondErr);
          // Tier 3: Basic video constraint (any connected camera / webcam)
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!mediaStream) {
        throw new Error('No camera stream could be established.');
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((playErr) => {
            console.warn('Video playback autoplay prevented:', playErr);
          });
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      const errText = String(err?.message || err?.name || '');
      if (
        err?.name === 'NotFoundError' ||
        err?.name === 'DevicesNotFoundError' ||
        errText.includes('Requested device not found') ||
        errText.includes('device not found')
      ) {
        setErrorMsg('No camera device was detected on your computer or device. You can upload or capture a photo directly from your device.');
      } else if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMsg('Camera permission was blocked. Please grant camera permission in your browser or select an image file directly.');
      } else {
        setErrorMsg(err?.message || 'Unable to start camera. Please verify device permissions or select a photo from your device.');
      }
    } finally {
      setIsLoadingCamera(false);
    }
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    }
    return () => {
      stopActiveStream();
    };
  }, [isOpen, facingMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        setErrorMsg(null);
        stopActiveStream();
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so user can pick again if needed
    e.target.value = '';
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply contrast filter
    if (docContrast === 'bw') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const bw = v > 120 ? 255 : 0;
        data[i] = bw;
        data[i + 1] = bw;
        data[i + 2] = bw;
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (docContrast === 'high') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.25);
        data[i + 1] = Math.min(255, data[i + 1] * 1.25);
        data[i + 2] = Math.min(255, data[i + 2] * 1.25);
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopActiveStream();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const confirmScannedDoc = () => {
    if (!capturedImage) return;

    const docId = `scan-${Date.now()}`;
    const scannedDoc: DocumentItem = {
      id: docId,
      name: `Scanned_Doc_${new Date().toLocaleTimeString().replace(/:/g, '')}.jpg`,
      size: Math.round(capturedImage.length * 0.75),
      type: 'image/jpeg',
      url: capturedImage,
      previewUrl: capturedImage,
      pageCount: 1,
      pageRange: '1',
      printablePages: 1,
      copies: 1,
      paperSize: 'A4',
      colorMode: 'Colour',
      printStyle: 'Single Sided',
      orientation: 'Auto',
      scaling: 'Fit to page',
      paperType: 'Plain Paper',
      collation: 'Collated',
      photoCollage: 'Original',
      sheetsCount: 1,
      ratePerPage: 8.0,
      totalPrice: 8.0,
    };

    onDocumentScanned(scannedDoc);
    handleClose();
  };

  const handleClose = () => {
    stopActiveStream();
    setCapturedImage(null);
    setErrorMsg(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      {/* Hidden file input for direct photo / gallery selection */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Mobile Document Scanner</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] overflow-hidden">
          {isLoadingCamera ? (
            <div className="p-6 text-center text-white">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">Connecting to camera...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-6 text-center max-w-md text-white">
              <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="font-bold text-white text-base mb-1.5">Camera Not Available</p>
              <p className="text-xs text-slate-300 leading-relaxed mb-5">{errorMsg}</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo / File</span>
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
              </div>
            </div>
          ) : capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={capturedImage}
                alt="Captured Document"
                className="max-h-[380px] max-w-full object-contain rounded-lg shadow-md"
              />
              <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 shadow">
                <Check className="w-3.5 h-3.5" /> Ready for Print
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover max-h-[420px]"
              />
              {/* Document Alignment Frame */}
              <div className="absolute inset-8 border-2 border-dashed border-amber-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="bg-black/60 text-amber-300 text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                  Align document within frame
                </span>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Contrast / Scan Mode Selector */}
        {!capturedImage && !errorMsg && (
          <div className="bg-slate-100 p-2.5 px-4 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Capture Mode:</span>
            <div className="flex gap-1.5 bg-slate-200/80 p-1 rounded-lg">
              <button
                onClick={() => setDocContrast('normal')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  docContrast === 'normal' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
                }`}
              >
                Colour
              </button>
              <button
                onClick={() => setDocContrast('high')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  docContrast === 'high' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
                }`}
              >
                High Contrast
              </button>
              <button
                onClick={() => setDocContrast('bw')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  docContrast === 'bw' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
                }`}
              >
                B&W Doc
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          {capturedImage ? (
            <>
              <button
                onClick={retakePhoto}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 hover:bg-white text-slate-700 rounded-xl font-medium text-sm transition"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                onClick={confirmScannedDoc}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm shadow-md transition ml-auto"
              >
                <Check className="w-4 h-4" /> Add to Order
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleCamera}
                  disabled={!!errorMsg || isLoadingCamera}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Flip Camera
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" /> Choose Photo
                </button>
              </div>

              <button
                onClick={capturePhoto}
                disabled={!!errorMsg || isLoadingCamera}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 mx-auto sm:mx-0"
              >
                <Camera className="w-4 h-4" /> Take Snapshot
              </button>

              <button
                onClick={handleClose}
                className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

