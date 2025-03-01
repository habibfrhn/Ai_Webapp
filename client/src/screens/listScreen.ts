// client/src/screens/listScreen.ts
export async function renderListScreen(container: HTMLElement) {
  container.innerHTML = `<h1>Semua Invoice</h1><p>Loading invoices...</p>`;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/invoice/list', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || !data.invoices) {
      throw new Error(data.message || 'Failed to fetch invoices');
    }
    const invoices = data.invoices;
    let html = `
      <h1>Semua Invoice</h1>
      <table style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px;">Invoice Number</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Nama Pembeli</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Tanggal Faktur</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Tanggal Jatuh Tempo</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
    `;
    invoices.forEach((invoice: any) => {
      html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">
            <a href="#/invoice/${invoice._id}">${invoice.invoiceNumber || 'N/A'}</a>
          </td>
          <td style="border: 1px solid #ddd; padding: 8px;">${invoice.buyerName || 'N/A'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${invoice.invoiceDate || 'N/A'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${invoice.dueDate || 'N/A'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${invoice.totalAmount || 'N/A'}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (err: any) {
    container.innerHTML = `<h1>Error</h1><p>${err.message}</p>`;
  }
}
