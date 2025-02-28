// client/src/uploadScreen.ts
export function renderUploadScreen(
  container: HTMLElement,
  onSuccess: (extractedData: any, fileName: string) => void
) {
  container.innerHTML = `
    <div>
      <h2>Upload Invoice</h2>
      <form id="uploadForm">
        <input type="file" id="invoiceFile" accept="image/*" required />
        <button type="submit">Upload</button>
      </form>
      <div id="status"></div>
    </div>
  `;

  const form = container.querySelector<HTMLFormElement>('#uploadForm')!;
  const fileInput = container.querySelector<HTMLInputElement>('#invoiceFile')!;
  const statusEl = container.querySelector<HTMLDivElement>('#status')!;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';

    if (!fileInput.files || fileInput.files.length === 0) {
      statusEl.textContent = 'No file selected.';
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('invoiceImage', file);

    try {
      // Get the token from localStorage (set upon login)
      const token = localStorage.getItem('token');
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
        statusEl.textContent = 'Upload successful.';
        onSuccess(extractedData, fileName);
      } else {
        statusEl.textContent = `Server error: ${message}`;
      }
    } catch (err: any) {
      statusEl.textContent = `Failed to fetch: ${err.message}`;
    }
  });
}
