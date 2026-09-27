import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { DocumentItem, Order } from '../../types';
import { StepIndicator } from '../../components/customer/StepIndicator';
import { FileUploader } from '../../components/customer/FileUploader';
import { DocumentCard } from '../../components/customer/DocumentCard';
import { DocumentConfigureRouter } from '../../components/customer/configure/DocumentConfigureRouter';
import { OrderSummarySticky } from '../../components/customer/OrderSummarySticky';
import { ConfirmAndPayStep } from '../../components/customer/ConfirmAndPayStep';
import { OrderConfirmation } from '../../components/customer/OrderConfirmation';
import { OrderTrackingView } from '../../components/customer/OrderTrackingView';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { DocumentEditorModal } from '../../components/common/DocumentEditorModal';
import { Plus, ArrowLeft, Printer, Check, X } from 'lucide-react';
import { calculateOrderSummary } from '../../utils/pricing';
import { detectPdfMetadata } from '../../utils/pdfReader';
import { analyzePdfDocument } from '../../utils/aadhaar/documentAnalyzer';

export const CustomerPrintPortal: React.FC = () => {
  const { pricing, discounts, business } = useApp();

  // Workflow steps: 1: Upload, 2: Configure, 3: Confirm Order
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Persistent session state across all navigation
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>('');

  // Persistent customer form info (retained even if user goes back to edit settings)
  const [customerInfo, setCustomerInfo] = useState<{
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    paymentMethod: 'upi' | 'razorpay' | 'manual';
  }>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    paymentMethod: 'upi',
  });

  // Modals
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [editorDoc, setEditorDoc] = useState<DocumentItem | null>(null);

  // Completed Order State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isTrackingMode, setIsTrackingMode] = useState<boolean>(false);

  // Manual payment mode trigger
  const [isManualPayIntent, setIsManualPayIntent] = useState<boolean>(false);

  // Sync with browser history for native Back & Forward buttons
  useEffect(() => {
    // Initial state setup
    window.history.replaceState({ step: 1 }, '');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.step === 'number') {
        const targetStep = event.state.step as 1 | 2 | 3;
        setCurrentStep(targetStep);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Safe navigation function updating state & browser history smoothly
  const navigateToStep = useCallback((step: 1 | 2 | 3, pushHistory = true) => {
    setCurrentStep(step);
    if (pushHistory) {
      window.history.pushState({ step }, '');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep === 3) navigateToStep(2);
    else if (currentStep === 2) navigateToStep(1);
  }, [currentStep, navigateToStep]);

  const handleNext = useCallback(() => {
    if (currentStep === 1 && documents.length > 0) navigateToStep(2);
    else if (currentStep === 2) navigateToStep(3);
  }, [currentStep, documents.length, navigateToStep]);

  // Handle new uploaded files
  const handleFilesUploaded = (newDocs: DocumentItem[]) => {
    setDocuments((prev) => {
      const newIndex = prev.length;
      setSelectedDocIndex(newIndex);
      return [...prev, ...newDocs];
    });
    navigateToStep(2);
  };

  // Recalculate order summary
  const summary = calculateOrderSummary(documents, pricing, discounts, couponCode);

  const handleUpdateDoc = (updatedDoc: DocumentItem) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    );
  };

  const handleRemoveDoc = (index: number) => {
    setDocuments((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        navigateToStep(1);
      } else if (selectedDocIndex >= next.length) {
        setSelectedDocIndex(next.length - 1);
      }
      return next;
    });
  };

  if (isTrackingMode && completedOrder) {
    return <OrderTrackingView orderId={completedOrder.id} initialOrder={completedOrder} />;
  }

  const activeDoc = documents[selectedDocIndex] || documents[0];
  const isImageSession =
    !!activeDoc &&
    (activeDoc.fileType === 'image' ||
      activeDoc.type?.startsWith('image/') ||
      !!activeDoc.name?.match(/\.(jpg|jpeg|png|webp|bmp|gif|tiff)$/i));

  return (
    <div className="space-y-4 sm:space-y-5 pb-32 px-3 sm:px-4 pt-3 sm:pt-4">
      {/* Premium Brand Header - Hidden on Confirm Step */}
      {currentStep !== 3 && (
        <header className="w-full max-w-xl mx-auto">
          <div className="bg-[#0b162d]/95 backdrop-blur-md rounded-2xl border border-blue-900/40 p-4 sm:p-5 shadow-xl shadow-black/30 transition-all">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Premium Printer Icon/Logo Container */}
              <div className="relative shrink-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#122347] to-[#0a152d] border border-blue-800/60 flex items-center justify-center shadow-[0_0_16px_rgba(249,115,22,0.18)] ring-1 ring-orange-500/20">
                  <Printer className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 stroke-[2.2]" />
                </div>
              </div>

              {/* Brand Typography & Status Hierarchy */}
              <div className="min-w-0 flex-1">
                {/* Primary: PRINT + Status: Live Service */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                    PRINT
                  </h1>

                  {/* Real-time Status Indicator Badge */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-[11px] font-bold tracking-wide shadow-sm shadow-emerald-950/40 select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span>Live Service</span>
                  </span>
                </div>

                {/* Secondary: Subtitle */}
                <p className="text-xs sm:text-sm font-semibold text-slate-200 tracking-tight leading-snug mt-1">
                  Instant QR Print Portal
                </p>

                {/* Tertiary: Service Information */}
                <p className="text-[11px] sm:text-xs text-slate-400 font-normal leading-normal mt-0.5">
                  High-Speed B&W • Colour • Document Printing
                </p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Step Indicator - Purely visual progress display (not clickable) */}
      <StepIndicator currentStep={currentStep} />

      {/* STEP 1: Upload Document */}
      {currentStep === 1 && (
        <div className="space-y-5">
          {documents.length > 0 && (
            <div className="relative max-w-xl mx-auto bg-[#0b162d] border border-blue-900/50 rounded-2xl p-4 pr-12 flex items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/30">
                  <Check className="w-5 h-5 stroke-[2.8]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black text-white truncate">
                    ✓ {documents.length} document{documents.length > 1 ? 's' : ''} ready
                  </p>
                  <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                    Your document is uploaded. Continue to configure print settings.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigateToStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-full font-bold text-xs shadow-md shadow-orange-500/25 transition shrink-0 active:scale-95"
              >
                <span>Continue →</span>
              </button>

              {/* Upper right corner wrong (X) button to remove document */}
              <button
                type="button"
                onClick={() => {
                  setDocuments([]);
                  setSelectedDocIndex(0);
                }}
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-800/90 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-90 border border-slate-700/50 shadow-sm"
                title="Remove"
                aria-label="Remove uploaded document"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}

          <FileUploader
            onFilesUploaded={handleFilesUploaded}
          />
        </div>
      )}

      {/* STEP 2: Configure Print */}
      {currentStep === 2 && (
        <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
          {/* Top Actions: Back Button, Add more */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-[#0b162d] p-3.5 sm:p-4 rounded-2xl border border-blue-900/50 shadow-xl">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[#112347] hover:bg-[#162c5a] text-slate-200 hover:text-white border border-blue-800/40 rounded-xl font-bold text-xs sm:text-sm transition active:scale-95 shrink-0 shadow-sm"
                aria-label="Back to Upload"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Back</span>
              </button>

              <div className="min-w-0">
                <h2 className="font-extrabold text-sm sm:text-base text-white truncate">
                  Configure your print
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                  Select options for each document. Live price updates instantly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-full text-xs font-black cursor-pointer shadow-md shadow-orange-500/20 transition active:scale-95 shrink-0">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Add document</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const files: File[] = Array.from(e.target.files);
                      const docs: DocumentItem[] = [];

                      for (let idx = 0; idx < files.length; idx++) {
                        const file = files[idx];
                        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                        const isImg = file.type.startsWith('image/');
                        const fileUrl = URL.createObjectURL(file);

                        if (isPdf) {
                          const pdfMeta = await detectPdfMetadata(file);
                          const pageCount = pdfMeta.pageCount;
                          const docItem: DocumentItem = {
                            id: `doc-${Date.now()}-${idx}`,
                            name: file.name,
                            size: file.size,
                            type: file.type || 'application/pdf',
                            fileType: 'pdf',
                            url: fileUrl,
                            previewUrl: fileUrl,
                            originalUrl: fileUrl,
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

                          let finalDoc = docItem;
                          try {
                            const { updatedDoc } = await analyzePdfDocument(docItem, file);
                            finalDoc = updatedDoc;
                          } catch (err) {
                            console.warn('PDF layout detection skipped:', err);
                          }

                          docs.push(finalDoc);
                        } else {
                          docs.push({
                            id: `doc-${Date.now()}-${idx}`,
                            name: file.name,
                            size: file.size,
                            type: file.type || 'application/octet-stream',
                            fileType: isImg ? 'image' : 'document',
                            url: fileUrl,
                            previewUrl: isImg ? fileUrl : undefined,
                            pageCount: 1,
                            pageRange: 'all',
                            printablePages: 1,
                            copies: 1,
                            paperSize: 'A4',
                            colorMode: isImg ? 'Colour' : 'B&W',
                            printStyle: 'Single Sided',
                            orientation: 'Auto',
                            scaling: 'Fit to page',
                            paperType: 'Plain Paper',
                            collation: 'Collated',
                            photoCollage: 'Original',
                            sheetsCount: 1,
                            ratePerPage: isImg ? 8.0 : 3.0,
                            totalPrice: isImg ? 8.0 : 3.0,
                          });
                        }
                      }
                      handleFilesUploaded(docs);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* List of Documents - Only shown for PDF/other documents; hidden for Image workspace */}
          {!isImageSession && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {documents.map((doc, idx) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  index={idx}
                  isSelected={selectedDocIndex === idx}
                  onSelect={() => setSelectedDocIndex(idx)}
                  onEdit={() => setEditorDoc(doc)}
                  onPreview={() => setPreviewDoc(doc)}
                  onRemove={() => handleRemoveDoc(idx)}
                />
              ))}
            </div>
          )}

          {/* Active Document Settings Panel */}
          {activeDoc && (
            <DocumentConfigureRouter
              key={isImageSession ? 'image-workspace' : activeDoc.id}
              document={activeDoc}
              documents={documents}
              selectedDocIndex={selectedDocIndex}
              onSelectDocIndex={setSelectedDocIndex}
              pricingRules={pricing}
              totalDocumentsCount={documents.length}
              onChange={handleUpdateDoc}
              onRemoveDoc={handleRemoveDoc}
              onResetAll={() => {
                setDocuments([]);
                setSelectedDocIndex(0);
                navigateToStep(1);
              }}
              onAddDocuments={handleFilesUploaded}
            />
          )}

          {/* Sticky Bottom Summary Bar with explicit Back & Next buttons */}
          <OrderSummarySticky
            documents={documents}
            subtotal={summary.subtotal}
            discountAmount={summary.discountAmount}
            totalAmount={summary.totalAmount}
            discountTitle={summary.appliedDiscountTitle}
            onBack={handleBack}
            backLabel="Back"
            onNext={handleNext}
            nextLabel="Continue to print"
          />
        </div>
      )}

      {/* STEP 3: Confirm Order */}
      {currentStep === 3 && (
        <ConfirmAndPayStep
          documents={documents}
          subtotal={summary.subtotal}
          discountAmount={summary.discountAmount}
          totalAmount={summary.totalAmount}
          appliedDiscountTitle={summary.appliedDiscountTitle}
          initialManualPay={isManualPayIntent}
          initialCustomerName={customerInfo.customerName}
          initialCustomerPhone={customerInfo.customerPhone}
          initialCustomerEmail={customerInfo.customerEmail}
          initialPaymentMethod={customerInfo.paymentMethod}
          onUpdateCustomerInfo={(info) => setCustomerInfo(info)}
          onBack={handleBack}
          onBackToConfigure={() => navigateToStep(2)}
          onOrderCompleted={(order) => setCompletedOrder(order)}
          onPrintAnother={() => {
            setCompletedOrder(null);
            setDocuments([]);
            setSelectedDocIndex(0);
            navigateToStep(1);
          }}
        />
      )}

      {/* Modals */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <DocumentEditorModal
        document={editorDoc}
        isOpen={!!editorDoc}
        onClose={() => setEditorDoc(null)}
        onSave={(updated) => {
          handleUpdateDoc(updated);
        }}
      />
    </div>
  );
};
