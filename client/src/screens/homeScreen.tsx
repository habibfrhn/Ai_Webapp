import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';

interface Invoice {
  _id: string;
  invoiceNumber?: string;
  sellerName?: string | null;
  buyerName?: string | null;
  invoiceType?: 'Faktur masuk' | 'Faktur keluar' | null;
  currencyCode?: string;
  totalAmount?: string;
  status: string;
  createdAt: string;
}

const PAGE_SIZE = 4;

interface InvoiceCardProps {
  title: string;
  invoices: Invoice[];
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ title, invoices }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  // Helper to format the total amount similarly to UploadFormScreen
  const formatAmount = (amount: string | undefined, currencyCode: string | undefined): string => {
    if (!amount || !currencyCode) return '';
    const numeric = parseFloat(amount.replace(',', '.'));
    // If USD, use US formatting; else assume IDR-style formatting
    if (currencyCode.toUpperCase() === 'USD') {
      return numeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      return numeric.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  // Sort invoices by createdAt descending (latest first)
  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const invoiceCount = sortedInvoices.length;
  const totalPages = invoiceCount > 0 ? Math.ceil(invoiceCount / PAGE_SIZE) : 1;
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentInvoices =
    invoiceCount > 0 ? sortedInvoices.slice(startIndex, startIndex + PAGE_SIZE) : [];
  // For spacing if fewer than PAGE_SIZE items on the last page
  const placeholders = invoiceCount > 0 ? Array.from({ length: PAGE_SIZE - currentInvoices.length }) : [];

  return (
    <div className="bg-white p-4 shadow rounded flex-1 text-xs">
      {/* Title */}
      <h2 className="mb-2 text-sm">
        {title} ({invoiceCount})
      </h2>

      {/* Invoice list */}
      <ul className="min-h-[200px] space-y-1">
        {invoiceCount === 0 ? (
          <li className="py-1 text-center text-[10px] text-gray-600">
            Tidak ada faktur tersedia
          </li>
        ) : (
          <>
            {currentInvoices.map((inv) => {
              // Determine partner name
              const partnerName =
                inv.invoiceType === 'Faktur masuk'
                  ? inv.sellerName
                  : inv.invoiceType === 'Faktur keluar'
                  ? inv.buyerName
                  : 'N/A';

              return (
                <li
                  key={inv._id}
                  onClick={() => navigate('/edit-invoice', { state: { invoiceId: inv._id } })}
                  className="cursor-pointer hover:bg-gray-200 p-2"
                >
                  {/* First row: invoice number + currency & total */}
                  <div className="flex justify-between">
                    <span className="font-bold text-sm">
                      {inv.invoiceNumber || 'No Invoice Number'}
                    </span>
                    <span className="text-sm">
                      {inv.currencyCode} {formatAmount(inv.totalAmount, inv.currencyCode)}
                    </span>
                  </div>
                  {/* Second row: partner name + invoice type */}
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>{partnerName || 'N/A'}</span>
                    <span>{inv.invoiceType}</span>
                  </div>
                </li>
              );
            })}
            {placeholders.map((_, index) => (
              <li key={`placeholder-${index}`} className="py-1">
                {/* Empty space placeholder */}
              </li>
            ))}
          </>
        )}
      </ul>

      {/* Pagination */}
      <div className="mt-1 h-8 flex justify-between items-center text-sm">
        <button
          disabled={page === 1 || invoiceCount === 0}
          onClick={() => setPage(page - 1)}
          className={`px-2 py-1 rounded ${page === 1 || invoiceCount === 0 ? 'text-gray-400' : 'text-black'}`}
        >
          Prev
        </button>
        <span>
          Halaman {invoiceCount === 0 ? 0 : page} dari {invoiceCount === 0 ? 0 : totalPages}
        </span>
        <button
          disabled={page === totalPages || invoiceCount === 0}
          onClick={() => setPage(page + 1)}
          className={`px-2 py-1 rounded ${page === totalPages || invoiceCount === 0 ? 'text-gray-400' : 'text-black'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const HomeScreen = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/invoice/list', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (resp) => {
        if (!resp.ok) {
          const errorText = await resp.text();
          throw new Error(`Server error: ${resp.status} ${errorText}`);
        }
        try {
          return await resp.json();
        } catch {
          const text = await resp.text();
          throw new Error(`Failed to parse JSON. Response text: ${text}`);
        }
      })
      .then((data) => {
        if (data.invoices) {
          setInvoices(data.invoices);
        } else {
          setError(data.message || 'Failed to fetch invoices');
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error) setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Separate the invoices by status
  const belumDiproses = invoices.filter((inv) => inv.status === 'Belum diproses');
  const sedangDiproses = invoices.filter((inv) => inv.status === 'Sedang diproses');
  const sudahDiproses = invoices.filter((inv) => inv.status === 'Telah diproses');

  if (loading) return <p>Loading invoices...</p>;
  if (error)
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );

  return (
    <div style={{ background: theme.background, minHeight: '100vh' }} className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Beranda</h1>
        <button
          onClick={() => navigate('/upload')}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Upload faktur
        </button>
      </div>

      {/* Three columns, each uses the same InvoiceCard structure */}
      <div className="flex space-x-4">
        <InvoiceCard title="Belum diproses" invoices={belumDiproses} />
        <InvoiceCard title="Sedang diproses" invoices={sedangDiproses} />
        <InvoiceCard title="Sudah diproses" invoices={sudahDiproses} />
      </div>
    </div>
  );
};

export default HomeScreen;
