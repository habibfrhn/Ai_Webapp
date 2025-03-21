import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';
import { FaPlus } from 'react-icons/fa';

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
  dueDate?: string;
}

const PAGE_SIZE = 4;

interface InvoiceCardProps {
  title: string;
  invoices: Invoice[];
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ title, invoices }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  // Sorting invoices by createdAt descending (latest first)
  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const invoiceCount = sortedInvoices.length;
  const totalPages = invoiceCount > 0 ? Math.ceil(invoiceCount / PAGE_SIZE) : 1;
  const startIndex = (page - 1) * PAGE_SIZE;
  const currentInvoices =
    invoiceCount > 0 ? sortedInvoices.slice(startIndex, startIndex + PAGE_SIZE) : [];
  // For spacing if fewer than PAGE_SIZE items on the last page
  const placeholders =
    invoiceCount > 0 ? Array.from({ length: PAGE_SIZE - currentInvoices.length }) : [];

  return (
    <div className="bg-white p-4 shadow rounded flex-1 text-xs flex flex-col">
      {/* Title */}
      <h2 className="mb-2 text-sm">
        {title} ({invoiceCount})
      </h2>

      {/* Invoice list container with fixed height */}
      <ul className="h-[220px] space-y-1">
        {invoiceCount === 0 ? (
          <li className="py-1 text-center text-[10px] text-gray-600">
            Tidak ada faktur tersedia
          </li>
        ) : (
          <>
            {currentInvoices.map((inv) => {
              // Determine partner name based on invoice type
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
                  {/* First row: invoice number (bold) + currency & raw total amount */}
                  <div className="flex justify-between">
                    <span className="font-bold text-sm">
                      {inv.invoiceNumber || 'No Invoice Number'}
                    </span>
                    <span className="text-sm">
                      {inv.currencyCode} {inv.totalAmount}
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
      <div className="mt-auto h-8 flex justify-between items-center text-sm">
        <button
          disabled={page === 1 || invoiceCount === 0}
          onClick={() => setPage(page - 1)}
          className={`px-2 py-1 rounded ${
            page === 1 || invoiceCount === 0 ? 'text-gray-400' : 'text-black'
          }`}
        >
          Prev
        </button>
        <span>
          Halaman {invoiceCount === 0 ? 0 : page} dari {invoiceCount === 0 ? 0 : totalPages}
        </span>
        <button
          disabled={page === totalPages || invoiceCount === 0}
          onClick={() => setPage(page + 1)}
          className={`px-2 py-1 rounded ${
            page === totalPages || invoiceCount === 0 ? 'text-gray-400' : 'text-black'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const DueSoonCard: React.FC<{ invoices: Invoice[] }> = ({ invoices }) => {
  const navigate = useNavigate();
  const PAGE_SIZE_RECT = 5; // Maximum of 6 invoices per page
  const [page, setPage] = useState(1);

  // Helper function to parse date strings (handles "dd/mm/yyyy" format)
  const parseDueDate = (dateStr: string): Date => {
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    return new Date(dateStr);
  };

  // Filter invoices with a defined dueDate, excluding "Telah diproses".
  // Also, show invoices if the due date is in the future or if overdue with status "Belum diproses" or "Sedang diproses".
  const dueSoonInvoices = invoices.filter((inv) => {
    if (!inv.dueDate) return false;
    if (inv.status === 'Telah diproses') return false;
    const dueDate = parseDueDate(inv.dueDate);
    const now = new Date();
    if (dueDate >= now) return true;
    if (dueDate < now && (inv.status === 'Belum diproses' || inv.status === 'Sedang diproses'))
      return true;
    return false;
  });

  // Sort by due date ascending (nearest due date first) using the custom parser
  const sortedInvoices = [...dueSoonInvoices].sort(
    (a, b) => parseDueDate(a.dueDate!).getTime() - parseDueDate(b.dueDate!).getTime()
  );

  const invoiceCount = sortedInvoices.length;
  const totalPages = invoiceCount > 0 ? Math.ceil(invoiceCount / PAGE_SIZE_RECT) : 1;
  const startIndex = (page - 1) * PAGE_SIZE_RECT;
  const currentInvoices =
    invoiceCount > 0 ? sortedInvoices.slice(startIndex, startIndex + PAGE_SIZE_RECT) : [];
  const placeholders =
    invoiceCount > 0 ? Array.from({ length: PAGE_SIZE_RECT - currentInvoices.length }) : [];

  // Format due date explicitly to "DD/MM/YYYY"
  const formatDueDate = (dueDate: string): string => {
    const date = parseDueDate(dueDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-white p-4 shadow rounded mt-4 flex flex-col text-sm">
      {/* Card header */}
      <h2 className="mb-2 text-sm">
        Faktur hampir jatuh tempo ({invoiceCount})
      </h2>
      {/* Invoice list container with fixed height for 6 invoice rows */}
      <div className="h-[210px] space-y-1">
        {invoiceCount === 0 ? (
          <div className="py-1 text-center text-sm text-gray-600">
            Tidak ada faktur hampir jatuh tempo
          </div>
        ) : (
          <>
            {currentInvoices.map((inv) => {
              const partnerName =
                inv.invoiceType === 'Faktur masuk'
                  ? inv.sellerName
                  : inv.invoiceType === 'Faktur keluar'
                  ? inv.buyerName
                  : 'N/A';

              return (
                <div
                  key={inv._id}
                  onClick={() => navigate('/edit-invoice', { state: { invoiceId: inv._id } })}
                  className="flex items-center justify-between p-2 hover:bg-gray-200 cursor-pointer"
                >
                  {/* Bold invoice number */}
                  <div className="w-1/6 font-bold">
                    {inv.invoiceNumber || 'No Invoice Number'}
                  </div>
                  <div className="w-1/6">{partnerName || 'N/A'}</div>
                  <div className="w-1/6">
                    {inv.dueDate ? formatDueDate(inv.dueDate) : 'N/A'}
                  </div>
                  <div className="w-1/6">{inv.status}</div>
                  <div className="w-1/6">{inv.invoiceType}</div>
                  <div className="w-1/6">
                    {inv.currencyCode} {inv.totalAmount}
                  </div>
                </div>
              );
            })}
            {placeholders.map((_, index) => (
              <div key={`placeholder-${index}`} className="py-1"></div>
            ))}
          </>
        )}
      </div>
      {/* Pagination controls */}
      <div className="mt-auto h-8 flex justify-between items-center text-sm">
        <button
          disabled={page === 1 || invoiceCount === 0}
          onClick={() => setPage(page - 1)}
          className={`px-2 py-1 rounded ${
            page === 1 || invoiceCount === 0 ? 'text-gray-400' : 'text-black'
          }`}
        >
          Prev
        </button>
        <span>
          Halaman {invoiceCount === 0 ? 0 : page} dari {invoiceCount === 0 ? 0 : totalPages}
        </span>
        <button
          disabled={page === totalPages || invoiceCount === 0}
          onClick={() => setPage(page + 1)}
          className={`px-2 py-1 rounded ${
            page === totalPages || invoiceCount === 0 ? 'text-gray-400' : 'text-black'
          }`}
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

  // Separate invoices by status for the three main cards
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
        <h2 className="text-2xl text-gray-700">Beranda</h2>
        <button
          onClick={() => navigate('/upload')}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaPlus /> Upload Faktur
        </button>
      </div>

      {/* Three invoice cards in a row */}
      <div className="flex space-x-4">
        <InvoiceCard title="Belum diproses" invoices={belumDiproses} />
        <InvoiceCard title="Sedang diproses" invoices={sedangDiproses} />
        <InvoiceCard title="Sudah diproses" invoices={sudahDiproses} />
      </div>

      {/* Rectangle card: Faktur hampir jatuh tempo with max 6 invoices per page */}
      <DueSoonCard invoices={invoices} />
    </div>
  );
};

export default HomeScreen;
