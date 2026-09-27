import React from 'react';
import { DocumentItem, PricingRule } from '../../../types';
import { PdfConfigurePanel } from './PdfConfigurePanel';
import { ImageConfigurePanel } from './ImageConfigurePanel';
import { PrintSettingsPanel } from '../PrintSettingsPanel';

interface DocumentConfigureRouterProps {
  document: DocumentItem;
  documents?: DocumentItem[];
  pricingRules: PricingRule[];
  onChange: (updatedDoc: DocumentItem) => void;
  totalDocumentsCount?: number;
  isApplyToAll?: boolean;
  selectedDocIndex?: number;
  onSelectDocIndex?: (index: number) => void;
  onRemoveDoc?: (index: number) => void;
  onResetAll?: () => void;
  onAddDocuments?: (newDocs: DocumentItem[]) => void;
}

/**
 * File-type based configuration routing architecture:
 * PDF → PdfConfigurePanel
 * JPG/PNG/WEBP → ImageConfigurePanel
 * Other/General → PrintSettingsPanel
 */
export const DocumentConfigureRouter: React.FC<DocumentConfigureRouterProps> = ({
  document: doc,
  documents = [],
  pricingRules,
  onChange,
  totalDocumentsCount = 1,
  isApplyToAll = false,
  selectedDocIndex = 0,
  onSelectDocIndex,
  onRemoveDoc,
  onResetAll,
  onAddDocuments,
}) => {
  const isPdf =
    doc.fileType === 'pdf' ||
    doc.type === 'application/pdf' ||
    doc.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return (
      <PdfConfigurePanel
        document={doc}
        pricingRules={pricingRules}
        onChange={onChange}
        totalDocumentsCount={totalDocumentsCount}
        isApplyToAll={isApplyToAll}
      />
    );
  }

  const isImage =
    doc.fileType === 'image' ||
    doc.type.startsWith('image/') ||
    doc.name.match(/\.(jpg|jpeg|png|webp|bmp|gif|tiff)$/i);

  if (isImage) {
    return (
      <ImageConfigurePanel
        document={doc}
        documents={documents}
        pricingRules={pricingRules}
        onChange={onChange}
        totalDocumentsCount={totalDocumentsCount}
        selectedDocIndex={selectedDocIndex}
        onSelectDocIndex={onSelectDocIndex}
        onRemoveDoc={onRemoveDoc}
        onResetAll={onResetAll}
        onAddDocuments={onAddDocuments}
      />
    );
  }

  // Fallback to standard panel for other document types until their dedicated modules are built
  return (
    <PrintSettingsPanel
      document={doc}
      pricingRules={pricingRules}
      onChange={onChange}
    />
  );
};
