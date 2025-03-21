import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InvoiceData } from './EditInvoiceScreen';

interface InvoiceFormData extends InvoiceData {
  status: 'Belum diproses' | 'Sedang diproses' | 'Telah diproses';
  currencyCode: string;
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
    currencyCode: extractedData?.currencyCode || 'IDR',
  });

  const isFinalized = useRef(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'currencyCode') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase().slice(0, 3) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    isFinalized.current = true;

    const dateRegex = /^(\d{1,2}\/\d{1,2}\/\d{4})$/;
    // Validate date fields only if they are non-empty.
    if (formData.invoiceDate !== '' && !dateRegex.test(formData.invoiceDate ?? '')) {
      alert('Please use dd/mm/yyyy format for Tanggal Faktur');
      return;
    }
    if (formData.dueDate !== '' && !dateRegex.test(formData.dueDate ?? '')) {
      alert('Please use dd/mm/yyyy format for Tanggal Jatuh Tempo');
      return;
    }

    // Prepare final data: if a date field is empty, set it to null.
    const finalData = { ...formData };
    finalData.invoiceDate = formData.invoiceDate === '' ? null : formData.invoiceDate;
    finalData.dueDate = formData.dueDate === '' ? null : formData.dueDate;

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

    // totalAmount is left as is. If empty, backend will store null.
    // No additional formatting is applied on the client side.

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

  const handleCancel = () => {
    isFinalized.current = true;
    navigate('/invoices');
  };

  return (
    <div className="p-4 text-sm" style={{ outline: 'none' }}>
      <h2 className="text-lg font-bold mb-2">DATA FAKTUR BARU</h2>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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

        <div className="mt-2"></div>

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

        <div className="mt-2"></div>

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
                value={formData.totalAmount || ''}
                onChange={handleChange}
                className="w-full border p-1"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-sm">
            Simpan perubahan
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
