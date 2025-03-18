// EditInvoiceScreen.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
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
  currencyCode?: string;
  invoiceType?: 'Faktur masuk' | 'Faktur keluar' | '';
}

interface LocationStateSingle {
  invoiceId: string;
  extractedData?: InvoiceData;
}

interface LocationStateMultiple {
  invoices: { invoiceId: string; extractedData: InvoiceData }[];
}

type LocationStateType = LocationStateSingle | LocationStateMultiple | null;

const EditInvoiceScreen: React.FC = () => {
  const location = useLocation();
  const { invoiceId: routeInvoiceId } = useParams<{ invoiceId: string }>();
  const locationState = location.state as LocationStateType;

  const [invoiceId, setInvoiceId] = useState<string>('');
  const [extractedData, setExtractedData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locationState && 'invoiceId' in locationState && locationState.invoiceId) {
      setInvoiceId(locationState.invoiceId);
      if (locationState.extractedData) {
        setExtractedData(locationState.extractedData);
      } else {
        setLoading(true);
        const token = localStorage.getItem('token');
        fetch(`http://localhost:3000/api/invoice/${locationState.invoiceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            if (data.invoice) {
              setExtractedData(data.invoice);
            }
          })
          .catch(err => console.error('Failed to load invoice:', err))
          .finally(() => setLoading(false));
      }
    } else if (routeInvoiceId) {
      setInvoiceId(routeInvoiceId);
      setLoading(true);
      const token = localStorage.getItem('token');
      fetch(`http://localhost:3000/api/invoice/${routeInvoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.invoice) {
            setExtractedData(data.invoice);
          }
        })
        .catch(err => console.error('Failed to load invoice:', err))
        .finally(() => setLoading(false));
    }
  }, [locationState, routeInvoiceId]);

  if (loading || !invoiceId || !extractedData) {
    return <p>Loading invoice...</p>;
  }

  return (
    <div className="flex h-screen">
      <div className="h-screen w-1/2 bg-[#f9fafb]">
        <ImagePreviewScreen invoiceId={invoiceId} />
      </div>
      <div className="flex-1">
        <UploadFormScreen invoiceId={invoiceId} extractedData={extractedData} />
      </div>
    </div>
  );
};

export default EditInvoiceScreen;
