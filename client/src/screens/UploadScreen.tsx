// UploadScreen.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UploadScreen = () => {
  const [status, setStatus] = useState('');
  const [separateInvoices, setSeparateInvoices] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('');
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('invoiceFile') as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setStatus('No file selected.');
      return;
    }
    
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    const formData = new FormData();
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      if (!allowedTypes.includes(file.type)) {
        setStatus("Unsupported file format detected. Please upload only PDF, PNG, or JPG files.");
        return;
      }
      formData.append('invoiceImage', file);
    }
    // Append the grouping mode ("multiple" or "single")
    formData.append('invoiceGrouping', separateInvoices ? 'multiple' : 'single');

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3000/api/invoice/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setStatus('Upload successful.');
        // Redirect based on response type.
        if (data.invoices) {
          navigate('/edit-invoice', { state: { invoices: data.invoices } });
        } else {
          navigate('/edit-invoice', { state: { invoiceId: data.invoiceId, extractedData: data.extractedData } });
        }
      } else {
        setStatus(`Server error: ${data.message}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setStatus(`Failed to fetch: ${err.message}`);
    }
  };

  return (
    <div>
      <h2 className="text-2xl mb-4">Upload Invoice</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          name="invoiceFile"
          accept="application/pdf, image/png, image/jpeg"
          multiple
          required
          className="mb-4"
        />
        <div className="mb-4">
          <label>
            <input
              type="checkbox"
              checked={separateInvoices}
              onChange={(e) => setSeparateInvoices(e.target.checked)}
            />
            {' '}Each file belongs to a separate invoice
          </label>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white">Upload</button>
      </form>
      {status && <div className="mt-2">{status}</div>}
    </div>
  );
};

export default UploadScreen;
