// UploadFormScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceData } from './EditInvoiceScreen';

interface InvoiceFormData extends InvoiceData {
  status: 'Belum diproses' | 'Sedang diproses' | 'Telah diproses';
}

interface UploadFormScreenProps {
  invoiceId: string;
  extractedData: InvoiceData;
}

const UploadFormScreen: React.FC<UploadFormScreenProps> = ({ invoiceId, extractedData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<InvoiceFormData>({
    sellerName: extractedData?.sellerName || '',
    sellerAddress: extractedData?.sellerAddress || '',
    sellerPhone: extractedData?.sellerPhone || '',
    sellerEmail: extractedData?.sellerEmail || '',
    sellerTaxId: extractedData?.sellerTaxId || '',
    buyerName: extractedData?.buyerName || '',
    buyerAddress: extractedData?.buyerAddress || '',
    buyerPhone: extractedData?.buyerPhone || '',
    buyerEmail: extractedData?.buyerEmail || '',
    buyerTaxId: extractedData?.buyerTaxId || '',
    invoiceNumber: extractedData?.invoiceNumber || '',
    invoiceDate: extractedData?.invoiceDate || '',
    dueDate: extractedData?.dueDate || '',
    taxDetails: extractedData?.taxDetails || '',
    totalAmount: extractedData?.totalAmount || '',
    invoiceType: extractedData?.invoiceType || 'Faktur masuk',
    status: 'Belum diproses',
  });

  // Ref to track if the form was finalized (submitted or cancelled)
  const isFinalized = useRef(false);

  // Trigger cleanup via sendBeacon if the user leaves without finalizing.
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isFinalized.current) {
        const token = localStorage.getItem('token');
        if (token) {
          const url = 'http://localhost:3000/api/invoice/temp/cleanup-all';
          // Note: sendBeacon sends a POST request with 'text/plain' MIME type.
          const data = JSON.stringify({});
          navigator.sendBeacon(url, data);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark form as finalized to prevent cleanup on unload.
    isFinalized.current = true;

    const dateRegex = /^(\d{1,2}\/\d{1,2}\/\d{4})$/;
    if (!dateRegex.test(formData.invoiceDate || '')) {
      alert('Please use dd/mm/yyyy format for Tanggal Faktur');
      return;
    }
    if (!dateRegex.test(formData.dueDate || '')) {
      alert('Please use dd/mm/yyyy format for Tanggal Jatuh Tempo');
      return;
    }

    // Remove irrelevant fields based on invoice type.
    const finalData = { ...formData };
    if (formData.invoiceType === 'Faktur masuk') {
      finalData.buyerName = null;
      finalData.buyerAddress = null;
      finalData.buyerPhone = null;
      finalData.buyerEmail = null;
      finalData.buyerTaxId = null;
    } else if (formData.invoiceType === 'Faktur keluar') {
      finalData.sellerName = null;
      finalData.sellerAddress = null;
      finalData.sellerPhone = null;
      finalData.sellerEmail = null;
      finalData.sellerTaxId = null;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found; please log in again.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/invoice/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invoiceId, ...finalData }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Save request failed: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      if (result.success) {
        alert('Invoice saved successfully.');
        navigate('/invoices');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to save invoice: ${err.message}`);
      } else {
        alert('Failed to save invoice (unknown error)');
      }
    }
  };

  const handleCancel = async () => {
    // Mark as finalized and trigger cleanup.
    isFinalized.current = true;
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('http://localhost:3000/api/invoice/temp/cleanup-all', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error('Cleanup error on cancel:', error);
      }
    }
    navigate('/invoices');
  };

  return (
    <div className="p-4 text-sm" style={{ outline: 'none' }}>
      <h2 className="text-lg font-bold mb-2">DATA FAKTUR BARU</h2>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Top Row: Tipe Faktur & Status */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold">Tipe Faktur</label>
            <select
              name="invoiceType"
              value={formData.invoiceType || ''}
              onChange={handleChange}
              className="w-full border p-1"
            >
              <option value="Faktur masuk">Faktur masuk</option>
              <option value="Faktur keluar">Faktur keluar</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold">Status</label>
            <select
              name="status"
              value={formData.status || ''}
              onChange={handleChange}
              className="w-full border p-1"
            >
              <option value="Belum diproses">Belum diproses</option>
              <option value="Sedang diproses">Sedang diproses</option>
              <option value="Telah diproses">Telah diproses</option>
            </select>
          </div>
        </div>

        {/* Spacer */}
        <div className="mt-2"></div>

        {/* Informasi Penjual / Pembeli Section */}
        {formData.invoiceType === 'Faktur masuk' ? (
          <div>
            <h3 className="text-md font-bold mb-2">Informasi Penjual</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold">Nama Penjual</label>
                <input
                  type="text"
                  name="sellerName"
                  placeholder="Nama Penjual"
                  value={formData.sellerName || ''}
                  onChange={handleChange}
                  className="w-full border p-1"
                />
              </div>
              <div>
                <label className="block font-semibold">NPWP Penjual</label>
                <input
                  type="text"
                  name="sellerTaxId"
                  placeholder="NPWP Penjual"
                  value={formData.sellerTaxId || ''}
                  onChange={handleChange}
                  className="w-full border p-1"
                />
              </div>
              <div>
                <label className="block font-semibold">Email Penjual</label>
                <input
                  type="text"
                  name="sellerEmail"
                  placeholder="Email Penjual"
                  value={formData.sellerEmail || ''}
                  onChange={handleChange}
                  className="w-full border p-1"
                />
              </div>
              <div>
                <label className="block font-semibold">Nomor Telefon Penjual</label>
                <input
                  type="text"
                  name="sellerPhone"
                  placeholder="Nomor Telefon Penjual"
                  value={formData.sellerPhone || ''}
                  onChange={handleChange}
                  className="w-full border p-1"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold">Alamat Penjual</label>
                <textarea
                  name="sellerAddress"
                  placeholder="Alamat Penjual"
                  value={formData.sellerAddress || ''}
                  onChange={handleChange}
                  className="w-full border p-1 resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-md font-bold mb-2">Informasi Pembeli</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold">Nama Pembeli</label>
                <input
                  type="text"
                  name="buyerName"
                  placeholder="Nama Pembeli"
                  value={formData.buyerName || ''}
                  onChange={handleChange}
                  className="w-full border p-1"
                />
              </div>
              <div>
                <label className="block font-semibold">NPWP Pembeli</label>
                <input
                  type="text"
                  name="buyerTaxId"
                  placeholder="NPWP Pembeli"
                  value={formData.buyerTaxId || ''}
                  onChange={handleChange}
                  className="w-full border p-1"
                />
              </div>
              <div>
                <label className="block font-semibold">Email Pembeli</label>
                <input
                  type="text"
                  name="buyerEmail"
                  placeholder="Email Pembeli"
                  value={formData.buyerEmail || ''}
                  onChange={handleChange}
                  className="w-full border p-1"
                />
              </div>
              <div>
                <label className="block font-semibold">Nomor Telefon Pembeli</label>
                <input
                  type="text"
                  name="buyerPhone"
                  placeholder="Nomor Telefon Pembeli"
                  value={formData.buyerPhone || ''}
                  onChange={handleChange}
                  className="w-full border p-1"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold">Alamat Pembeli</label>
                <textarea
                  name="buyerAddress"
                  placeholder="Alamat Pembeli"
                  value={formData.buyerAddress || ''}
                  onChange={handleChange}
                  className="w-full border p-1 resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="mt-2"></div>

        {/* Informasi Faktur Section */}
        <div>
          <h3 className="text-md font-bold mb-2">Informasi Faktur</h3>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block font-semibold">Nomor Faktur</label>
              <input
                type="text"
                name="invoiceNumber"
                placeholder="Nomor Faktur"
                value={formData.invoiceNumber || ''}
                onChange={handleChange}
                className="w-full border p-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block font-semibold">Tanggal Faktur (dd/mm/yyyy)</label>
              <input
                type="text"
                name="invoiceDate"
                placeholder="dd/mm/yyyy"
                value={formData.invoiceDate || ''}
                onChange={handleChange}
                className="w-full border p-1"
              />
            </div>
            <div>
              <label className="block font-semibold">Tanggal Jatuh Tempo (dd/mm/yyyy)</label>
              <input
                type="text"
                name="dueDate"
                placeholder="dd/mm/yyyy"
                value={formData.dueDate || ''}
                onChange={handleChange}
                className="w-full border p-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block font-semibold">Rincian Pajak (PPN)</label>
              <input
                type="text"
                name="taxDetails"
                placeholder="10%"
                value={formData.taxDetails || ''}
                onChange={handleChange}
                className="w-full border p-1"
              />
            </div>
            <div>
              <label className="block font-semibold">Total Jumlah Pembayaran</label>
              <input
                type="text"
                name="totalAmount"
                placeholder="Total Pembayaran"
                value={formData.totalAmount || ''}
                onChange={handleChange}
                className="w-full border p-1"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-sm">
            Upload faktur
          </button>
          <button type="button" onClick={handleCancel} className="px-3 py-1 bg-transparent text-black text-sm underline">
            Batalkan
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadFormScreen;
