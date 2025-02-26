// client/src/main.ts

import { renderLayout } from './layout';
import { renderHomeScreen } from './screens/homeScreen';
import { renderUploadScreen } from './screens/uploadScreen';
import { renderListScreen } from './screens/listScreen';
import { renderEditInvoiceScreen } from './screens/editInvoiceScreen';

// Map the keys from DeepSeek to the interface in editInvoiceScreen
function mapDeepSeekToInvoiceData(deepSeekData: any) {
  return {
    sellerName: deepSeekData['Nama penjual/perusahaan'] ?? '',
    buyerName: deepSeekData['Nama pembeli'] ?? '',
    buyerAddress: deepSeekData['Alamat pembeli'] ?? '',
    buyerPhone: deepSeekData['Nomor telefon pembeli'] ?? '',
    buyerEmail: deepSeekData['Email pembeli'] ?? '',
    invoiceNumber: deepSeekData['Nomor faktur'] ?? '',
    invoiceDate: deepSeekData['Tanggal faktur'] ?? '',
    dueDate: deepSeekData['Tanggal jatuh tempo faktur'] ?? '',
    taxDetails: deepSeekData['Rincian pajak (PPN)'] ?? '',
    totalAmount: deepSeekData['Total jumlah pembayaran'] ?? '',
  };
}

const app = document.querySelector<HTMLDivElement>('#app')!;
const layout = renderLayout();
app.appendChild(layout);

function router() {
  const hash = window.location.hash || '#/';
  const mainArea = document.querySelector<HTMLDivElement>('#main-area')!;

  if (hash === '#/') {
    renderHomeScreen(mainArea);
  } else if (hash === '#/upload') {
    // Callback now receives (extractedData, fileName)
    renderUploadScreen(mainArea, (extractedData: any, fileName: string) => {
      console.log('Upload success, raw deepseek data:', extractedData);

      // Convert the keys
      const invoiceData = mapDeepSeekToInvoiceData(extractedData);

      // Construct image URL
      const imageUrl = `http://localhost:3000/uploads/${fileName}`;
      renderEditInvoiceScreen(mainArea, imageUrl, invoiceData);
    });
  } else if (hash === '#/invoices') {
    renderListScreen(mainArea);
  } else {
    mainArea.innerHTML = '<h1>404 - Page Not Found</h1>';
  }
}

window.addEventListener('hashchange', router);
router();
