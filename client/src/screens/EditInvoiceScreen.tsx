import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface InvoiceData {
  sellerName?: string;
  buyerName?: string;
  buyerAddress?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  taxDetails?: string;
  totalAmount?: string;
  invoiceType?: string;
}

const EditInvoiceScreen = () => {
  const { state } = useLocation() as { state: {
    invoiceImageUrl: string;
    extractedData: InvoiceData;
    fileName: string;
  }};
  const { invoiceImageUrl, extractedData, fileName } = state;
  const navigate = useNavigate();

  const [formData, setFormData] = useState<InvoiceData>({
    sellerName: extractedData?.sellerName || '',
    buyerName: extractedData?.buyerName || '',
    buyerAddress: extractedData?.buyerAddress || '',
    buyerPhone: extractedData?.buyerPhone || '',
    buyerEmail: extractedData?.buyerEmail || '',
    invoiceNumber: extractedData?.invoiceNumber || '',
    invoiceDate: extractedData?.invoiceDate || '',
    dueDate: extractedData?.dueDate || '',
    taxDetails: extractedData?.taxDetails || '',
    totalAmount: extractedData?.totalAmount || '',
    invoiceType: extractedData?.invoiceType || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3000/api/invoice/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, fileName }),
      });
      const result = await response.json();
      if (result.success) {
        alert('Invoice saved successfully.');
        navigate('/invoices');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert(`Failed to save invoice: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/invoice/${fileName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        alert('Invoice deleted successfully.');
        navigate('/invoices');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert(`Failed to delete invoice: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="flex-1 border-r p-4">
        <h2 className="text-xl font-bold mb-4">Invoice Preview</h2>
        <img src={invoiceImageUrl} alt="Invoice" className="max-w-full max-h-[500px]" />
      </div>
      <div className="flex-1 p-4">
        <h2 className="text-xl font-bold mb-4">New Invoice Data</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-bold">Nama Penjual/Perusahaan</label>
            <input type="text" name="sellerName" value={formData.sellerName} onChange={handleChange} className="w-full border p-2" />
          </div>
          <div>
            <label className="block font-bold">Nama Pembeli</label>
            <input type="text" name="buyerName" value={formData.buyerName} onChange={handleChange} className="w-full border p-2" />
          </div>
          <div>
            <label className="block font-bold">Alamat Pembeli</label>
            <textarea name="buyerAddress" value={formData.buyerAddress} onChange={handleChange} className="w-full border p-2 resize-vertical" />
          </div>
          <div>
            <label className="block font-bold">Nomor Telefon Pembeli</label>
            <input type="text" name="buyerPhone" value={formData.buyerPhone} onChange={handleChange} className="w-full border p-2" />
          </div>
          <div>
            <label className="block font-bold">Email Pembeli</label>
            <input type="text" name="buyerEmail" value={formData.buyerEmail} onChange={handleChange} className="w-full border p-2" />
          </div>
          <div>
            <label className="block font-bold">Nomor Faktur</label>
            <input type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} className="w-full border p-2" />
          </div>
          <div>
            <label className="block font-bold">Tanggal Faktur (dd/mm/yyyy)</label>
            <input
              type="text"
              name="invoiceDate"
              value={formData.invoiceDate}
              onChange={handleChange}
              placeholder="dd/mm/yyyy"
              pattern="^\d{2}/\d{2}/\d{4}$"
              title="Use the format dd/mm/yyyy"
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Tanggal Jatuh Tempo Faktur (dd/mm/yyyy)</label>
            <input
              type="text"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              placeholder="dd/mm/yyyy"
              pattern="^\d{2}/\d{2}/\d{4}$"
              title="Use the format dd/mm/yyyy"
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Rincian Pajak (PPN)</label>
            <input type="text" name="taxDetails" value={formData.taxDetails} onChange={handleChange} className="w-full border p-2" />
          </div>
          <div>
            <label className="block font-bold">Total Jumlah Pembayaran</label>
            <input type="text" name="totalAmount" value={formData.totalAmount} onChange={handleChange} className="w-full border p-2" />
          </div>
          <div>
            <label className="block font-bold">Tipe Faktur</label>
            <select name="invoiceType" value={formData.invoiceType} onChange={handleChange} className="w-full border p-2">
              <option value="Faktur masuk">Faktur masuk</option>
              <option value="Faktur keluar">Faktur keluar</option>
            </select>
          </div>
          <input type="hidden" name="fileName" value={fileName} />
          <div className="flex gap-4">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white">Save Invoice</button>
            <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white">
              Delete
            </button>
            <button type="button" onClick={() => navigate('/invoices')} className="px-4 py-2 bg-gray-400">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInvoiceScreen;
