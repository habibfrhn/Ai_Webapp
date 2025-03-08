import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

interface InvoiceData {
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

const EditInvoiceScreen = () => {
  const { state } = useLocation() as {
    state: {
      invoiceId: string;
      extractedData: InvoiceData;
    };
  };
  const { invoiceId, extractedData } = state;
  const navigate = useNavigate();

  // Merge new fields with existing extracted data
  const [formData, setFormData] = useState<InvoiceData>({
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
  });

  // Zoom/pan states
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Image source
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Fetch the image from the server
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let objectUrl: string | null = null;

    fetch(`http://localhost:3000/api/invoice/temp/${invoiceId}/image`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Image request failed: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      })
      .catch((err) => {
        console.error('Failed to load image:', err);
      });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [invoiceId]);

  // On image load, measure container & image => compute initial scale/translate
  const handleImageLoad = () => {
    if (!imgContainerRef.current || !imgRef.current) return;

    const containerRect = imgContainerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const naturalWidth = imgRef.current.naturalWidth;
    const naturalHeight = imgRef.current.naturalHeight;

    // Fit the image fully in the half-screen container
    const scaleToFitWidth = containerWidth / naturalWidth;
    const scaleToFitHeight = containerHeight / naturalHeight;
    const initialScale = Math.min(scaleToFitWidth, scaleToFitHeight);

    // Pin image to the top, center horizontally
    const imageDisplayWidth = naturalWidth * initialScale;
    // const imageDisplayHeight = naturalHeight * initialScale;

    const offsetX = (containerWidth - imageDisplayWidth) / 2;
    const offsetY = 0;

    setScale(initialScale);
    setTranslate({ x: offsetX, y: offsetY });
  };

  // Mouse events for panning (left-click only)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only proceed if left button (button=0)
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.max(0.5, prev + delta));
  };

  // Form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save -> finalize invoice
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dateRegex = /^(\d{1,2}\/\d{1,2}\/\d{4})$/;
    if (!dateRegex.test(formData.invoiceDate || '')) {
      alert('Please use dd/mm/yyyy format for Tanggal Faktur');
      return;
    }
    if (!dateRegex.test(formData.dueDate || '')) {
      alert('Please use dd/mm/yyyy format for Tanggal Jatuh Tempo');
      return;
    }

    // Copy data, remove irrelevant fields
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

  // Cancel -> delete the temporary invoice
  const handleCancel = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found; please log in again.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/invoice/temp/${invoiceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cancel request failed: ${response.status} - ${errorText}`);
      }
      navigate('/invoices');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to cancel invoice: ${err.message}`);
      } else {
        alert('Failed to cancel invoice (unknown error)');
      }
    }
  };

  return (
    <div className="flex h-screen">
      {/* 
        Left Panel: 
          - sticky so it doesn't scroll
          - top-0 pinned at top
          - h-screen fills vertical space
          - w-1/2 for half-screen width
          - overflow-hidden, no scrollbars
          - NO padding class => no extra margin around the image
          - border-r for a vertical divider
      */}
      <div
        className="sticky top-0 h-screen w-1/2 overflow-hidden border-r"
        ref={imgContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {imageSrc ? (
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Invoice"
            onLoad={handleImageLoad}
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              cursor: dragging ? 'grabbing' : 'grab',
              transition: 'transform 0.1s',
            }}
          />
        ) : (
          <p>Loading invoice image...</p>
        )}
      </div>

      {/* 
        Right Panel: 
          - flex-1 so it takes remaining width
          - p-4 for padding
          - overflow-y-auto to scroll the form if it's tall
      */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">New Invoice Data</h2>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Invoice Type */}
          <div>
            <label className="block font-bold">Tipe Faktur</label>
            <select
              name="invoiceType"
              value={formData.invoiceType || ''}
              onChange={handleChange}
              className="w-full border p-2"
            >
              <option value="Faktur masuk">Faktur masuk</option>
              <option value="Faktur keluar">Faktur keluar</option>
            </select>
          </div>

          {/* If invoiceType === "Faktur masuk", show seller fields only */}
          {formData.invoiceType === 'Faktur masuk' && (
            <>
              <div>
                <label className="block font-bold">Nama Penjual</label>
                <input
                  type="text"
                  name="sellerName"
                  placeholder="Nama Penjual"
                  value={formData.sellerName || ''}
                  onChange={handleChange}
                  className="w-full border p-2"
                />
              </div>
              <div>
                <label className="block font-bold">Alamat Penjual</label>
                <textarea
                  name="sellerAddress"
                  placeholder="Alamat Penjual"
                  value={formData.sellerAddress || ''}
                  onChange={handleChange}
                  className="w-full border p-2 resize-vertical"
                />
              </div>
              <div>
                <label className="block font-bold">Nomor Telefon Penjual</label>
                <input
                  type="text"
                  name="sellerPhone"
                  placeholder="Nomor Telefon Penjual"
                  value={formData.sellerPhone || ''}
                  onChange={handleChange}
                  className="w-full border p-2"
                />
              </div>
              <div>
                <label className="block font-bold">Email Penjual</label>
                <input
                  type="text"
                  name="sellerEmail"
                  placeholder="Email Penjual"
                  value={formData.sellerEmail || ''}
                  onChange={handleChange}
                  className="w-full border p-2"
                />
              </div>
              <div>
                <label className="block font-bold">NPWP Penjual (sellerTaxId)</label>
                <input
                  type="text"
                  name="sellerTaxId"
                  placeholder="NPWP Penjual"
                  value={formData.sellerTaxId || ''}
                  onChange={handleChange}
                  className="w-full border p-2"
                />
              </div>
            </>
          )}

          {/* If invoiceType === "Faktur keluar", show buyer fields only */}
          {formData.invoiceType === 'Faktur keluar' && (
            <>
              <div>
                <label className="block font-bold">Nama Pembeli</label>
                <input
                  type="text"
                  name="buyerName"
                  placeholder="Nama Pembeli"
                  value={formData.buyerName || ''}
                  onChange={handleChange}
                  className="w-full border p-2"
                />
              </div>
              <div>
                <label className="block font-bold">Alamat Pembeli</label>
                <textarea
                  name="buyerAddress"
                  placeholder="Alamat Pembeli"
                  value={formData.buyerAddress || ''}
                  onChange={handleChange}
                  className="w-full border p-2 resize-vertical"
                />
              </div>
              <div>
                <label className="block font-bold">Nomor Telefon Pembeli</label>
                <input
                  type="text"
                  name="buyerPhone"
                  placeholder="Nomor Telefon Pembeli"
                  value={formData.buyerPhone || ''}
                  onChange={handleChange}
                  className="w-full border p-2"
                />
              </div>
              <div>
                <label className="block font-bold">Email Pembeli</label>
                <input
                  type="text"
                  name="buyerEmail"
                  placeholder="Email Pembeli"
                  value={formData.buyerEmail || ''}
                  onChange={handleChange}
                  className="w-full border p-2"
                />
              </div>
              <div>
                <label className="block font-bold">NPWP Pembeli (buyerTaxId)</label>
                <input
                  type="text"
                  name="buyerTaxId"
                  placeholder="NPWP Pembeli"
                  value={formData.buyerTaxId || ''}
                  onChange={handleChange}
                  className="w-full border p-2"
                />
              </div>
            </>
          )}

          {/* Common invoice fields */}
          <div>
            <label className="block font-bold">Nomor Faktur</label>
            <input
              type="text"
              name="invoiceNumber"
              placeholder="Nomor Faktur"
              value={formData.invoiceNumber || ''}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Tanggal Faktur (dd/mm/yyyy)</label>
            <input
              type="text"
              name="invoiceDate"
              placeholder="dd/mm/yyyy"
              value={formData.invoiceDate || ''}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Tanggal Jatuh Tempo Faktur (dd/mm/yyyy)</label>
            <input
              type="text"
              name="dueDate"
              placeholder="dd/mm/yyyy"
              value={formData.dueDate || ''}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Rincian Pajak (PPN)</label>
            <input
              type="text"
              name="taxDetails"
              placeholder="10%"
              value={formData.taxDetails || ''}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Total Jumlah Pembayaran</label>
            <input
              type="text"
              name="totalAmount"
              placeholder="Total Pembayaran"
              value={formData.totalAmount || ''}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>

          {/* Submit/Cancel */}
          <div className="flex gap-4">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white">
              Save Invoice
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInvoiceScreen;
