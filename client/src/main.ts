// ===============================
// client/src/main.ts (FULL UPDATED CODE)
// ===============================
import { renderLayout } from './layout';
import { renderHomeScreen } from './screens/homeScreen';
import { renderUploadScreen } from './screens/uploadScreen';
import { renderListScreen } from './screens/listScreen';
import { renderLoginScreen } from './screens/logInScreen';
import { renderRegisterScreen } from './screens/registerScreen';
import { renderEditInvoiceScreen } from './screens/editInvoiceScreen'; // NEW import

// Check if user has a token in localStorage
function isLoggedIn(): boolean {
  const token = localStorage.getItem('token');
  return !!token; // true if token exists
}

const app = document.querySelector<HTMLDivElement>('#app')!;
const layout = renderLayout();
app.appendChild(layout);

function router() {
  const hash = window.location.hash || '#/';
  const mainArea = document.querySelector<HTMLDivElement>('#main-area')!;

  // Force user to /login or /register if not logged in
  if (!isLoggedIn() && hash !== '#/login' && hash !== '#/register') {
    window.location.hash = '#/login';
    return;
  }

  if (hash === '#/') {
    renderHomeScreen(mainArea);
  } else if (hash === '#/upload') {
    // CHANGED: handle the callback to automatically show editInvoiceScreen
    renderUploadScreen(mainArea, (extractedData, fileName) => {
      console.log('Upload success, extracted data:', extractedData);
      const imageUrl = `http://localhost:3000/uploads/${fileName}`;
      renderEditInvoiceScreen(mainArea, imageUrl, extractedData);
    });
  } else if (hash === '#/invoices') {
    renderListScreen(mainArea);
  } else if (hash === '#/login') {
    renderLoginScreen(mainArea);
  } else if (hash === '#/register') {
    renderRegisterScreen(mainArea);
  } else {
    mainArea.innerHTML = '<h1>404 - Page Not Found</h1>';
  }
}

window.addEventListener('hashchange', router);
router();
