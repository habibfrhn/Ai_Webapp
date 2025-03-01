// client/src/screens/listScreen.ts

export async function renderListScreen(container: HTMLElement) {
  container.innerHTML = `<h1>Semua Invoice</h1><p>Loading invoices...</p>`;
  const token = localStorage.getItem('token');
  let invoices: any[] = [];
  try {
    const response = await fetch('http://localhost:3000/api/invoice/list', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || !data.invoices) {
      throw new Error(data.message || 'Failed to fetch invoices');
    }
    invoices = data.invoices;
  } catch (error: any) {
    container.innerHTML = `<h1>Error</h1><p>${error.message}</p>`;
    return;
  }

  // Define default and extra columns.
  const defaultColumns = [
    { key: 'invoiceNumber', label: 'Invoice Number' },
    { key: 'buyerName', label: 'Nama Pembeli' },
    { key: 'invoiceDate', label: 'Tanggal Faktur' },
    { key: 'dueDate', label: 'Tanggal Jatuh Tempo' },
    { key: 'invoiceType', label: 'Tipe Faktur' },
    { key: 'totalAmount', label: 'Total Amount' },
  ];
  const extraColumns = [
    { key: 'buyerAddress', label: 'Alamat Pembeli' },
    { key: 'buyerPhone', label: 'Nomor Telefon' },
    { key: 'buyerEmail', label: 'Email Pembeli' },
    { key: 'sellerName', label: 'Nama Penjual/Perusahaan' },
  ];

  // State for visible extra columns and selected invoice IDs.
  let visibleExtraColumns: Set<string> = new Set();
  let selectedInvoiceIds: Set<string> = new Set();

  function renderUI() {
    let html = `<h1>Semua Invoice</h1>`;
    // Extra columns selector.
    html += `<div style="margin-bottom: 1rem;"><strong>Show Additional Columns:</strong>`;
    extraColumns.forEach(col => {
      const checked = visibleExtraColumns.has(col.key) ? 'checked' : '';
      html += `
        <label style="margin-left: 1rem;">
          <input type="checkbox" class="extra-column-toggle" data-key="${col.key}" ${checked}>
          ${col.label}
        </label>
      `;
    });
    html += `</div>`;
    // Multi-delete button.
    if (selectedInvoiceIds.size > 0) {
      html += `<button id="multiDeleteBtn" style="margin-bottom: 1rem; background-color: #dc2626; color: white; border: none; padding: 0.5rem; cursor: pointer;">
        Delete Selected (${selectedInvoiceIds.size})
      </button>`;
    }
    // Table header with a toggle select-all checkbox.
    html += `<table style="width:100%; border-collapse: collapse;">`;
    html += `<thead><tr>`;
    html += `<th style="border: 1px solid #ddd; padding: 8px;">
             <input type="checkbox" id="selectAll" ${selectedInvoiceIds.size === invoices.length && invoices.length > 0 ? 'checked' : ''}>
           </th>`;
    defaultColumns.forEach(col => {
      html += `<th style="border: 1px solid #ddd; padding: 8px;">${col.label}</th>`;
    });
    visibleExtraColumns.forEach(key => {
      const col = extraColumns.find(c => c.key === key);
      if (col) {
        html += `<th style="border: 1px solid #ddd; padding: 8px;">${col.label}</th>`;
      }
    });
    html += `</tr></thead>`;
    // Table body.
    html += `<tbody>`;
    invoices.forEach((invoice) => {
      html += `<tr>`;
      html += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
        <input type="checkbox" class="row-select" data-id="${invoice._id}" ${selectedInvoiceIds.has(invoice._id) ? 'checked' : ''}>
      </td>`;
      defaultColumns.forEach(col => {
        let cellContent = invoice[col.key] || 'N/A';
        if (col.key === 'invoiceNumber') {
          cellContent = `<a href="#/invoice/${invoice._id}">${cellContent}</a>`;
        }
        html += `<td style="border: 1px solid #ddd; padding: 8px;">${cellContent}</td>`;
      });
      visibleExtraColumns.forEach(key => {
        let cellContent = invoice[key] || 'N/A';
        html += `<td style="border: 1px solid #ddd; padding: 8px;">${cellContent}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
    // Extra columns toggles.
    const toggles = container.querySelectorAll<HTMLInputElement>('.extra-column-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('change', () => {
        const key = toggle.getAttribute('data-key')!;
        if (toggle.checked) {
          visibleExtraColumns.add(key);
        } else {
          visibleExtraColumns.delete(key);
        }
        renderUI();
      });
    });
    // Toggle select-all checkbox.
    const selectAll = container.querySelector<HTMLInputElement>('#selectAll');
    if (selectAll) {
      selectAll.addEventListener('click', () => {
        if (selectedInvoiceIds.size === invoices.length) {
          selectedInvoiceIds.clear();
        } else {
          invoices.forEach(invoice => selectedInvoiceIds.add(invoice._id));
        }
        renderUI();
      });
    }
    // Row checkbox listeners.
    const rowCheckboxes = container.querySelectorAll<HTMLInputElement>('.row-select');
    rowCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-id')!;
        if (cb.checked) {
          selectedInvoiceIds.add(id);
        } else {
          selectedInvoiceIds.delete(id);
        }
        renderUI();
      });
    });
    // Multi-delete button.
    const multiDeleteBtn = container.querySelector<HTMLButtonElement>('#multiDeleteBtn');
    if (multiDeleteBtn) {
      multiDeleteBtn.addEventListener('click', async () => {
        const confirmDelete = confirm(`Are you sure you want to delete ${selectedInvoiceIds.size} selected invoice(s)?`);
        if (!confirmDelete) return;
        try {
          const response = await fetch('http://localhost:3000/api/invoice', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ invoiceIds: Array.from(selectedInvoiceIds) }),
          });
          const result = await response.json();
          if (result.success) {
            alert(result.message);
            invoices = invoices.filter(inv => !selectedInvoiceIds.has(inv._id));
            selectedInvoiceIds.clear();
            renderUI();
          } else {
            alert(`Error: ${result.message}`);
          }
        } catch (err: any) {
          alert(`Failed to delete invoices: ${err.message}`);
        }
      });
    }
  }
  renderUI();
}
