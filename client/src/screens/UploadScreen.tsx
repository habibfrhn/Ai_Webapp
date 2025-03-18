// UploadScreen.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const UploadScreen = () => {
  const [status, setStatus] = useState('');
  const [sameInvoice, setSameInvoice] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Append new files to the selectedFiles state
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    // Clear input value to allow selecting the same file again if needed
    e.target.value = '';
  };

  // Remove a file from the selectedFiles array by index
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('');

    // Check your own state to ensure at least one file is selected
    if (selectedFiles.length === 0) {
      setStatus('No file selected.');
      return;
    }

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    const formData = new FormData();

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setStatus("Unsupported file format detected. Please upload only PDF, PNG, or JPG files.");
        return;
      }
      formData.append('invoiceImage', file);
    }

    // When sameInvoice is true, group files into a single invoice ("single")
    // otherwise treat each file as a separate invoice ("multiple").
    formData.append('invoiceGrouping', sameInvoice ? 'single' : 'multiple');

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
        // Redirect to beranda (home) after successful upload.
        navigate('/');
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
          ref={fileInputRef}
          onChange={handleFileChange}
          className="mb-4"
        />
        {selectedFiles.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold">Selected Files:</h3>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 ml-2"
                  >
                    X
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mb-4">
          <label>
            <input
              type="checkbox"
              checked={sameInvoice}
              onChange={(e) => setSameInvoice(e.target.checked)}
            />
            {' '}Each file belongs to the same invoice
          </label>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white">
          Upload
        </button>
      </form>
      {status && <div className="mt-2">{status}</div>}
    </div>
  );
};

export default UploadScreen;
