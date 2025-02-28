// client/src/editInvoiceScreen.ts

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

export function renderEditInvoiceScreen(
  container: HTMLElement,
  invoiceImageUrl: string,
  extractedData: InvoiceData,
  fileName: string // Added fileName parameter
) {
  container.innerHTML = `
      <div style="display: flex; height: 100%;">
        <!-- Left side: Invoice Preview -->
        <div style="flex: 1; border-right: 1px solid #ccc; padding: 1rem;">
          <h2>Invoice Preview</h2>
          <img 
            src="${invoiceImageUrl}" 
            alt="Invoice Image" 
            style="max-width: 100%; max-height: 500px;"
          />
        </div>
  
        <!-- Right side: Edit Invoice Data -->
        <div style="flex: 1; padding: 1rem;">
          <h2>Edit Invoice Data</h2>
          <form id="invoiceForm" style="display: flex; flex-direction: column; gap: 1rem;">
  
            <div>
              <label style="display: block; font-weight: bold;">Nama Penjual/Perusahaan</label>
              <input 
                type="text" 
                name="sellerName" 
                value="${extractedData.sellerName || ''}"
                style="width: 100%;"
              />
            </div>
  
            <div>
              <label style="display: block; font-weight: bold;">Nama Pembeli</label>
              <input 
                type="text" 
                name="buyerName" 
                value="${extractedData.buyerName || ''}"
                style="width: 100%;"
              />
            </div>
  
            <div>
              <label style="display: block; font-weight: bold;">Alamat Pembeli</label>
              <textarea 
                name="buyerAddress" 
                style="width: 100%; height: 3rem; resize: vertical;"
              >${extractedData.buyerAddress || ''}</textarea>
            </div>
  
            <div>
              <label style="display: block; font-weight: bold;">Nomor Telefon Pembeli</label>
              <input 
                type="text" 
                name="buyerPhone" 
                value="${extractedData.buyerPhone || ''}"
                style="width: 100%;"
              />
            </div>
  
            <div>
              <label style="display: block; font-weight: bold;">Email Pembeli</label>
              <input 
                type="text" 
                name="buyerEmail" 
                value="${extractedData.buyerEmail || ''}"
                style="width: 100%;"
              />
            </div>
  
            <div>
              <label style="display: block; font-weight: bold;">Nomor Faktur</label>
              <input 
                type="text" 
                name="invoiceNumber" 
                value="${extractedData.invoiceNumber || ''}"
                style="width: 100%;"
              />
            </div>
  
            <div>
              <label style="display: block; font-weight: bold;">Tanggal Faktur (dd/mm/yyyy)</label>
              <input 
                type="text" 
                name="invoiceDate" 
                value="${extractedData.invoiceDate || ''}"
                style="width: 100%;"
                placeholder="dd/mm/yyyy"
                pattern="^\\d{2}/\\d{2}/\\d{4}$"
                title="Use the format dd/mm/yyyy"
              />
            </div>
  
            <div>
              <label style="display: block; font-weight: bold;">Tanggal Jatuh Tempo Faktur (dd/mm/yyyy)</label>
              <input 
                type="text" 
                name="dueDate" 
                value="${extractedData.dueDate || ''}"
                style="width: 100%;"
                placeholder="dd/mm/yyyy"
                pattern="^\\d{2}/\\d{2}/\\d{4}$"
                title="Use the format dd/mm/yyyy"
              />
            </div>
  
            <div>
              <label style="display: block; font-weight: bold;">Rincian Pajak (PPN)</label>
              <input 
                type="text" 
                name="taxDetails" 
                value="${extractedData.taxDetails || ''}"
                style="width: 100%;"
              />
            </div>
  
            <div>
              <label style="display: block; font-weight: bold;">Total Jumlah Pembayaran</label>
              <input 
                type="text" 
                name="totalAmount" 
                value="${extractedData.totalAmount || ''}"
                style="width: 100%;"
              />
            </div>
  
            <div>
              <label style="display: block; font-weight: bold;">Tipe Faktur</label>
              <select name="invoiceType" style="width: 100%;">
                <option value="Faktur masuk" ${extractedData.invoiceType === 'Faktur masuk' ? 'selected' : ''}>Faktur masuk</option>
                <option value="Faktur keluar" ${extractedData.invoiceType === 'Faktur keluar' ? 'selected' : ''}>Faktur keluar</option>
              </select>
            </div>
  
            <input type="hidden" name="fileName" value="${fileName}" />
  
            <button type="submit" style="align-self: flex-start; padding: 0.5rem 1rem;">
              Save Invoice
            </button>
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
  
    // Send updated invoice data to the backend.
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/invoice/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...updatedInvoice,
          fileName: formData.get('fileName')?.toString(),
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert('Invoice saved successfully.');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err: any) {
      alert(`Failed to save invoice: ${err.message}`);
    }
  });
}
