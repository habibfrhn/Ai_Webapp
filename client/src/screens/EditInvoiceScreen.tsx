import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

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
  const { state } = useLocation() as {
    state: {
      invoiceId: string;
      extractedData: InvoiceData;
    };
  };
  const { invoiceId, extractedData } = state;
  const navigate = useNavigate();

  // Initialize form data from extractedData or empty strings
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

  // Zoom/pan states
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Store the Blob URL for the invoice image
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch the invoice image from the protected endpoint
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

    // Cleanup: revoke the object URL when unmounting
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [invoiceId]);

  // 2. Mouse events for panning the image
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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

  // Mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.max(0.5, prev + delta));
  };

  // 3. Form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // 4. Save Invoice -> finalize (sets temporary=false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If date is not strictly dd/mm/yyyy, the user sees an alert and we do NOT call the API
    const dateRegex = /^(\d{1,2}\/\d{1,2}\/\d{4})$/;
    if (!dateRegex.test(formData.invoiceDate || '')) {
      alert('Please use dd/mm/yyyy format for Tanggal Faktur');
      return;
    }
    if (!dateRegex.test(formData.dueDate || '')) {
      alert('Please use dd/mm/yyyy format for Tanggal Jatuh Tempo');
      return;
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
        body: JSON.stringify({ invoiceId, ...formData }),
      });
      // If the server returns an error code, you might want to check that here:
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Save request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Save Invoice response:', result); // Debug: see if success or error
      if (result.success) {
        alert('Invoice saved successfully.');
        // After saving, the invoice is now "temporary=false" on the server.
        // This means you can see it in ListScreen if you re-fetch from the server.
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

  // 5. Cancel -> delete the temporary invoice from DB
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
    <div className="flex flex-col md:flex-row h-full">
      {/* Left Panel: Image Preview */}
      <div
        className="flex-1 border-r p-4"
        ref={imgContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '500px',
        }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Invoice"
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

      {/* Right Panel: Invoice Form */}
      <div className="flex-1 p-4">
        <h2 className="text-xl font-bold mb-4">New Invoice Data</h2>
        {/* noValidate disables HTML5 pattern checks; we do manual checks in handleSubmit */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label className="block font-bold">Nama Penjual/Perusahaan</label>
            <input
              type="text"
              name="sellerName"
              value={formData.sellerName}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Nama Pembeli</label>
            <input
              type="text"
              name="buyerName"
              value={formData.buyerName}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Alamat Pembeli</label>
            <textarea
              name="buyerAddress"
              value={formData.buyerAddress}
              onChange={handleChange}
              className="w-full border p-2 resize-vertical"
            />
          </div>
          <div>
            <label className="block font-bold">Nomor Telefon Pembeli</label>
            <input
              type="text"
              name="buyerPhone"
              value={formData.buyerPhone}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Email Pembeli</label>
            <input
              type="text"
              name="buyerEmail"
              value={formData.buyerEmail}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Nomor Faktur</label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Tanggal Faktur (dd/mm/yyyy)</label>
            <input
              type="text"
              name="invoiceDate"
              value={formData.invoiceDate}
              onChange={handleChange}
              placeholder="dd/mm/yyyy"
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
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Rincian Pajak (PPN)</label>
            <input
              type="text"
              name="taxDetails"
              value={formData.taxDetails}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Total Jumlah Pembayaran</label>
            <input
              type="text"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block font-bold">Tipe Faktur</label>
            <select
              name="invoiceType"
              value={formData.invoiceType}
              onChange={handleChange}
              className="w-full border p-2"
            >
              <option value="Faktur masuk">Faktur masuk</option>
              <option value="Faktur keluar">Faktur keluar</option>
            </select>
          </div>
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
