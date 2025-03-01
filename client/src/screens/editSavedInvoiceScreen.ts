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

export function renderEditSavedInvoiceScreen(
container: HTMLElement,
invoiceImageUrl: string,
invoiceData: InvoiceData,
fileName: string,
invoiceId: string
) {
// Add a Back button to the navigation panel if not already present
const nav = document.querySelector('nav');
if (nav && !nav.querySelector('#backBtn')) {
  const backBtn = document.createElement('button');
  backBtn.id = 'backBtn';
  backBtn.textContent = 'Back';
  backBtn.style.marginBottom = '1rem';
  backBtn.addEventListener('click', () => window.history.back());
  nav.insertBefore(backBtn, nav.firstChild);
}

container.innerHTML = `
    <div style="display: flex; height: 100%;">
      <!-- Left: Invoice Preview -->
      <div style="flex: 1; border-right: 1px solid #ccc; padding: 1rem;">
        <h2>Invoice Preview</h2>
        <img src="${invoiceImageUrl}" alt="Invoice Image" style="max-width: 100%; max-height: 500px;"/>
      </div>
      <!-- Right: Edit Saved Invoice Data -->
      <div style="flex: 1; padding: 1rem;">
        <h2>Edit Invoice Data</h2>
        <form id="invoiceForm" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; font-weight: bold;">Nama Penjual/Perusahaan</label>
            <input type="text" name="sellerName" value="${invoiceData.sellerName || ''}" style="width: 100%;"/>
          </div>
          <div>
            <label style="display: block; font-weight: bold;">Nama Pembeli</label>
            <input type="text" name="buyerName" value="${invoiceData.buyerName || ''}" style="width: 100%;"/>
          </div>
          <div>
            <label style="display: block; font-weight: bold;">Alamat Pembeli</label>
            <textarea name="buyerAddress" style="width: 100%; height: 3rem; resize: vertical;">${invoiceData.buyerAddress || ''}</textarea>
          </div>
          <div>
            <label style="display: block; font-weight: bold;">Nomor Telefon Pembeli</label>
            <input type="text" name="buyerPhone" value="${invoiceData.buyerPhone || ''}" style="width: 100%;"/>
          </div>
          <div>
            <label style="display: block; font-weight: bold;">Email Pembeli</label>
            <input type="text" name="buyerEmail" value="${invoiceData.buyerEmail || ''}" style="width: 100%;"/>
          </div>
          <div>
            <label style="display: block; font-weight: bold;">Nomor Faktur</label>
            <input type="text" name="invoiceNumber" value="${invoiceData.invoiceNumber || ''}" style="width: 100%;"/>
          </div>
          <div>
            <label style="display: block; font-weight: bold;">Tanggal Faktur (dd/mm/yyyy)</label>
            <input type="text" name="invoiceDate" value="${invoiceData.invoiceDate || ''}" style="width: 100%;" placeholder="dd/mm/yyyy" pattern="^\\d{2}/\\d{2}/\\d{4}$" title="Use the format dd/mm/yyyy"/>
          </div>
          <div>
            <label style="display: block; font-weight: bold;">Tanggal Jatuh Tempo Faktur (dd/mm/yyyy)</label>
            <input type="text" name="dueDate" value="${invoiceData.dueDate || ''}" style="width: 100%;" placeholder="dd/mm/yyyy" pattern="^\\d{2}/\\d{2}/\\d{4}$" title="Use the format dd/mm/yyyy"/>
          </div>
          <div>
            <label style="display: block; font-weight: bold;">Rincian Pajak (PPN)</label>
            <input type="text" name="taxDetails" value="${invoiceData.taxDetails || ''}" style="width: 100%;"/>
          </div>
          <div>
            <label style="display: block; font-weight: bold;">Total Jumlah Pembayaran</label>
            <input type="text" name="totalAmount" value="${invoiceData.totalAmount || ''}" style="width: 100%;"/>
          </div>
          <div>
            <label style="display: block; font-weight: bold;">Tipe Faktur</label>
            <select name="invoiceType" style="width: 100%;">
              <option value="Faktur masuk" ${invoiceData.invoiceType === 'Faktur masuk' ? 'selected' : ''}>Faktur masuk</option>
              <option value="Faktur keluar" ${invoiceData.invoiceType === 'Faktur keluar' ? 'selected' : ''}>Faktur keluar</option>
            </select>
          </div>
          <input type="hidden" name="fileName" value="${fileName}" />
          <div style="display: flex; gap: 1rem;">
            <button type="submit" style="padding: 0.5rem 1rem;">Update Invoice</button>
            <button type="button" id="deleteBtn" style="padding: 0.5rem 1rem; background-color: #dc2626; color: white; border: none; cursor: pointer;">Delete</button>
            <button type="button" id="cancelBtn" style="padding: 0.5rem 1rem; background-color: #ccc; border: none; cursor: pointer;">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;
const form = container.querySelector<HTMLFormElement>('#invoiceForm');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    alert('Please ensure dates use dd/mm/yyyy format.');
    return;
  }
  const formData = new FormData(form);
  const updatedInvoice: InvoiceData = {
    sellerName: formData.get('sellerName')?.toString(),
    buyerName: formData.get('buyerName')?.toString(),
    buyerAddress: formData.get('buyerAddress')?.toString(),
    buyerPhone: formData.get('buyerPhone')?.toString(),
    buyerEmail: formData.get('buyerEmail')?.toString(),
    invoiceNumber: formData.get('invoiceNumber')?.toString(),
    invoiceDate: formData.get('invoiceDate')?.toString(),
    dueDate: formData.get('dueDate')?.toString(),
    taxDetails: formData.get('taxDetails')?.toString(),
    totalAmount: formData.get('totalAmount')?.toString(),
    invoiceType: formData.get('invoiceType')?.toString(),
  };
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`http://localhost:3000/api/invoice/${invoiceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ ...updatedInvoice, fileName: formData.get('fileName')?.toString() }),
    });
    const result = await response.json();
    if (result.success) {
      alert('Invoice updated successfully.');
      window.location.hash = '#/invoices';
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (err: any) {
    alert(`Failed to update invoice: ${err.message}`);
  }
});
const cancelBtn = container.querySelector<HTMLButtonElement>('#cancelBtn');
cancelBtn?.addEventListener('click', () => {
  window.location.hash = '#/invoices';
});
const deleteBtn = container.querySelector<HTMLButtonElement>('#deleteBtn');
deleteBtn?.addEventListener('click', async () => {
  const confirmDelete = confirm('Are you sure you want to delete this invoice?');
  if (!confirmDelete) return;
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`http://localhost:3000/api/invoice/${invoiceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (result.success) {
      alert('Invoice deleted successfully.');
      window.location.hash = '#/invoices';
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (err: any) {
    alert(`Failed to delete invoice: ${err.message}`);
  }
});
}
