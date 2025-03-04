import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UploadScreen = () => {
  const [status, setStatus] = useState('');
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
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('invoiceImage', file);
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
      const { success, extractedData, fileName, message } = await response.json();
      if (success) {
        setStatus('Upload successful.');
        navigate('/edit-invoice', {
          state: {
            invoiceImageUrl: `http://localhost:3000/uploads/${fileName}`,
            extractedData,
            fileName,
          },
        });
      } else {
        setStatus(`Server error: ${message}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setStatus(`Failed to fetch: ${err.message}`);
    }
  };

  return (
    <div>
      <h2 className="text-2xl mb-4">Upload Invoice</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" name="invoiceFile" accept="image/*" required className="mb-4" />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white">Upload</button>
      </form>
      {status && <div className="mt-2">{status}</div>}
    </div>
  );
};

export default UploadScreen;
