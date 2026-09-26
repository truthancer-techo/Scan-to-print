import React from 'react';
import { DocumentItem, PricingRule } from '../../../types';
import { PdfConfigurePanel } from './PdfConfigurePanel';
import { PrintSettingsPanel } from '../PrintSettingsPanel';

interface DocumentConfigureRouterProps {
  document: DocumentItem;
  pricingRules: PricingRule[];
  onChange: (updatedDoc: DocumentItem) => void;
}

/**
 * File-type based configuration routing architecture:
 * PDF → PdfConfigurePanel
 * Future:
 * JPG/PNG → ImageConfigure
 * DOC/DOCX → DocumentConfigure
 * XLS/XLSX → SpreadsheetConfigure
 * PPT/PPTX → PresentationConfigure
 * TXT → TextConfigure
 * ZIP → ArchiveConfigure
 */
export const DocumentConfigureRouter: React.FC<DocumentConfigureRouterProps> = ({
  document: doc,
  pricingRules,
  onChange,
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
