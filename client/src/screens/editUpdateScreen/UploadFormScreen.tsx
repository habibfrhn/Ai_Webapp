// UploadFormScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceData } from './EditInvoiceScreen';

interface InvoiceFormData extends InvoiceData {
  status: 'Belum diproses' | 'Sedang diproses' | 'Telah diproses';
  // currencyCode stores the 3-letter original currency code
  currencyCode: string;
  // totalAmount is the original amount stored as a plain numeric string
  totalAmount: string;
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
    // Use the currencyCode from extractedData or default to "IDR"
    currencyCode: extractedData?.currencyCode || 'IDR',
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
          const data = JSON.stringify({});
          navigator.sendBeacon(url, data);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Helper: Format the stored totalAmount for display based on currency.
  const formatAmountDisplay = (amount: string, currencyCode: string): string => {
    if (!amount) return '';
    // Convert to number (replace comma with dot)
    const numeric = parseFloat(amount.replace(',', '.'));
    if (currencyCode === 'USD') {
      // For dollars: use comma as thousand separator and period for decimals.
      return numeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      // For IDR (or others): use dot as thousand separator and comma for decimals.
      return numeric.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  // Helper: Parse the displayed amount back to a plain numeric string.
  const parseDisplayAmount = (display: string, currencyCode: string): string => {
    if (currencyCode === 'USD') {
      // Remove commas; then convert to a number and format with two decimals, replacing '.' with ','.
      const normalized = display.replace(/,/g, '');
      const num = parseFloat(normalized);
      return num.toFixed(2).replace('.', ',');
    } else {
      // For IDR, remove dots and commas and return an integer.
      const normalized = display.replace(/\./g, '').replace(/,/g, '');
      const num = parseFloat(normalized);
      return Math.round(num).toString();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // For currencyCode, force uppercase and limit to 3 characters.
    if (name === 'currencyCode') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase().slice(0, 3) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTotalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // When the user changes the total amount field, update state with the raw input.
    const input = e.target.value;
    // Remove common formatting characters.
    const raw = input.replace(/[.,]/g, '');
    setFormData(prev => ({ ...prev, totalAmount: raw }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    // If it's Faktur masuk, we keep seller info and nullify buyer info.
    // If it's Faktur keluar, we keep buyer info and nullify seller info.
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

    // Before submission, parse the displayed totalAmount to ensure plain format.
    finalData.totalAmount = parseDisplayAmount(formData.totalAmount, formData.currencyCode);

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

          {/* Nomor Faktur */}
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

          {/* Tanggal Faktur & Tanggal Jatuh Tempo */}
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

          {/* Rincian Pajak */}
          <div className="grid grid-cols-1 gap-2 mt-2">
            <div>
              <label className="block font-semibold">Rincian Pajak</label>
              <input
                type="text"
                name="taxDetails"
                placeholder="10%"
                value={formData.taxDetails || ''}
                onChange={handleChange}
                className="w-full border p-1"
              />
            </div>
          </div>

          {/* Kode Mata Uang & Jumlah Total */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block font-semibold">Kode Mata Uang</label>
              <input
                type="text"
                name="currencyCode"
                value={formData.currencyCode}
                onChange={handleChange}
                className="w-full border p-1"
                pattern="[A-Z]{3}"
                title="Masukkan 3 huruf kapital (misalnya, IDR atau USD)"
              />
            </div>
            <div>
              <label className="block font-semibold">Jumlah Total (dalam mata uang asli)</label>
              <input
                type="text"
                name="totalAmount"
                placeholder="Total Pembayaran"
                value={formatAmountDisplay(formData.totalAmount, formData.currencyCode)}
                onChange={handleTotalAmountChange}
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
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1 bg-transparent text-black text-sm underline"
          >
            Batalkan
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadFormScreen;
