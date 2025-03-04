import { useState, useEffect } from 'react';

interface Invoice {
  _id: string;
  invoiceNumber?: string;
  buyerName?: string;
  invoiceDate?: string;
  dueDate?: string;
  invoiceType?: string;
  totalAmount?: string;
  buyerAddress?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  sellerName?: string;
}

const defaultColumns = [
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'buyerName', label: 'Nama Pembeli' },
  { key: 'invoiceDate', label: 'Tanggal Faktur' },
  { key: 'dueDate', label: 'Tanggal Jatuh Tempo' },
  { key: 'invoiceType', label: 'Tipe Faktur' },
  { key: 'totalAmount', label: 'Total Amount' },
];

const extraColumns = [
  { key: 'buyerAddress', label: 'Alamat Pembeli' },
  { key: 'buyerPhone', label: 'Nomor Telefon' },
  { key: 'buyerEmail', label: 'Email Pembeli' },
  { key: 'sellerName', label: 'Nama Penjual/Perusahaan' },
];

const ListScreen = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [visibleExtraColumns, setVisibleExtraColumns] = useState<Set<string>>(new Set());
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/invoice/list', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((resp) => resp.json())
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

  const toggleExtraColumn = (key: string) => {
    setVisibleExtraColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.size === invoices.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(invoices.map((inv) => inv._id)));
    }
  };

  const handleMultiDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedInvoiceIds.size} selected invoice(s)?`)) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3000/api/invoice', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ invoiceIds: Array.from(selectedInvoiceIds) }),
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setInvoices(invoices.filter((inv) => !selectedInvoiceIds.has(inv._id)));
        setSelectedInvoiceIds(new Set());
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert(`Failed to delete invoices: ${err.message}`);
    }
  };

  if (loading) return <p>Loading invoices...</p>;
  if (error)
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Semua Invoice</h1>
      <div className="mb-4">
        <strong>Show Additional Columns:</strong>
        {extraColumns.map((col) => (
          <label key={col.key} className="ml-4">
            <input
              type="checkbox"
              checked={visibleExtraColumns.has(col.key)}
              onChange={() => toggleExtraColumn(col.key)}
            />
            {col.label}
          </label>
        ))}
      </div>
      {selectedInvoiceIds.size > 0 && (
        <button onClick={handleMultiDelete} className="mb-4 bg-red-600 text-white px-3 py-2">
          Delete Selected ({selectedInvoiceIds.size})
        </button>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">
              <input
                type="checkbox"
                checked={selectedInvoiceIds.size === invoices.length && invoices.length > 0}
                onChange={toggleSelectAll}
              />
            </th>
            {defaultColumns.map((col) => (
              <th key={col.key} className="border p-2">
                {col.label}
              </th>
            ))}
            {[...visibleExtraColumns].map((key) => {
              const col = extraColumns.find((c) => c.key === key);
              return col ? (
                <th key={col.key} className="border p-2">
                  {col.label}
                </th>
              ) : null;
            })}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice._id}>
              <td className="border p-2 text-center">
                <input
                  type="checkbox"
                  checked={selectedInvoiceIds.has(invoice._id)}
                  onChange={() => toggleSelectInvoice(invoice._id)}
                />
              </td>
              {defaultColumns.map((col) => {
                const cellContent = invoice[col.key as keyof Invoice] || 'N/A';
                return col.key === 'invoiceNumber' ? (
                  <td key={col.key} className="border p-2">
                    <a href={`/invoice/${invoice._id}`} className="text-blue-600 underline">
                      {cellContent}
                    </a>
                  </td>
                ) : (
                  <td key={col.key} className="border p-2">
                    {cellContent}
                  </td>
                );
              })}
              {[...visibleExtraColumns].map((key) => {
                const cellContent = invoice[key as keyof Invoice] || 'N/A';
                return (
                  <td key={key} className="border p-2">
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListScreen;
