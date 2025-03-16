// EditInvoiceScreen.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import ImagePreviewScreen from './ImagePreviewScreen';
import UploadFormScreen from './UploadFormScreen';

export interface InvoiceData {
  sellerName?: string | null;
  sellerAddress?: string | null;
  sellerPhone?: string | null;
  sellerEmail?: string | null;
  sellerTaxId?: string | null;
  buyerName?: string | null;
  buyerAddress?: string | null;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  buyerTaxId?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  taxDetails?: string | null;
  totalAmount?: string | null;
  // NEW: Include currencyCode for proper type-checking.
  currencyCode?: string;
  invoiceType?: 'Faktur masuk' | 'Faktur keluar' | '';
}

interface InvoiceStateSingle {
  invoiceId: string;
  extractedData: InvoiceData;
}

interface InvoiceStateMultiple {
  invoices: { invoiceId: string; extractedData: InvoiceData }[];
}

type LocationState = InvoiceStateSingle | InvoiceStateMultiple;

const EditInvoiceScreen: React.FC = () => {
  const { state } = useLocation() as { state: LocationState };

  if ('invoices' in state && Array.isArray(state.invoices)) {
    // Multiple invoices mode: render a list of invoice edit views.
    return (
      <div>
        {state.invoices.map((invoice) => (
          <div key={invoice.invoiceId} className="flex h-screen border-b">
            {/* Left Panel */}
            <div className="h-screen w-1/2 bg-[#f9fafb]">
              <ImagePreviewScreen invoiceId={invoice.invoiceId} />
            </div>
            {/* Right Panel */}
            <div className="flex-1">
              <UploadFormScreen invoiceId={invoice.invoiceId} extractedData={invoice.extractedData} />
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    // Single invoice mode.
    const { invoiceId, extractedData } = state as InvoiceStateSingle;
    return (
      <div className="flex h-screen">
        {/* Left Panel */}
        <div className="h-screen w-1/2 bg-[#f9fafb]">
          <ImagePreviewScreen invoiceId={invoiceId} />
        </div>
        {/* Right Panel */}
        <div className="flex-1">
          <UploadFormScreen invoiceId={invoiceId} extractedData={extractedData} />
        </div>
      </div>
    );
  }
};

export default EditInvoiceScreen;
