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
  invoiceType?: 'Faktur masuk' | 'Faktur keluar' | '';
}

const EditInvoiceScreen: React.FC = () => {
  const { state } = useLocation() as {
    state: {
      invoiceId: string;
      extractedData: InvoiceData;
    };
  };

  const { invoiceId, extractedData } = state;

  return (
    <div className="flex h-screen">
      {/* Left Panel for image preview (full height, half screen width) */}
      <div className="h-screen w-1/2 bg-gray-200">
        <ImagePreviewScreen invoiceId={invoiceId} />
      </div>

      {/* Right Panel for form upload */}
      <div className="flex-1">
        <UploadFormScreen invoiceId={invoiceId} extractedData={extractedData} />
      </div>
    </div>
  );
};

export default EditInvoiceScreen;
