// client/src/main.ts
import { renderLayout } from './layout';
import { renderHomeScreen } from './screens/homeScreen';
import { renderUploadScreen } from './screens/uploadScreen';
import { renderListScreen } from './screens/listScreen';
import { renderLoginScreen } from './screens/logInScreen';
import { renderRegisterScreen } from './screens/registerScreen';
import { renderEditInvoiceScreen } from './screens/editInvoiceScreen';

/**
 * Checks whether the token exists.
 */
function hasToken(): boolean {
  return !!localStorage.getItem('token');
}

/**
 * Calls the backend refresh endpoint.
 */
async function refreshToken() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const response = await fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (response.ok && data.token) {
      localStorage.setItem('token', data.token);
    } else {
      localStorage.removeItem('token');
      window.location.hash = '#/login';
    }
  } catch (err) {
    console.error('Error refreshing token:', err);
  }
}

/**
 * Instead of checking an embedded expiration in the token,
 * we now rely on refreshing the token as long as the user is active.
 */
function isLoggedIn(): boolean {
  return hasToken();
}

const app = document.querySelector<HTMLDivElement>('#app')!;
const layout = renderLayout();
app.appendChild(layout);

/**
 * The router refreshes the token on each route change.
 */
async function router() {
  const hash = window.location.hash || '#/';
  const mainArea = document.querySelector<HTMLDivElement>('#main-area')!;

  // Refresh token if user is logged in.
  if (isLoggedIn()) {
    await refreshToken();
  }

  // Redirect to login/register if not logged in.
  if (!isLoggedIn() && hash !== '#/login' && hash !== '#/register') {
    window.location.hash = '#/login';
    return;
  }

  if (hash === '#/') {
    renderHomeScreen(mainArea);
  } else if (hash === '#/upload') {
    renderUploadScreen(mainArea, (extractedData, fileName) => {
      console.log('Upload success, extracted data:', extractedData);
      const imageUrl = `http://localhost:3000/uploads/${fileName}`;
      renderEditInvoiceScreen(mainArea, imageUrl, extractedData, fileName);
    });
  } else if (hash === '#/invoices') {
    renderListScreen(mainArea);
  } else if (hash === '#/login') {
    renderLoginScreen(mainArea);
  } else if (hash === '#/register') {
    renderRegisterScreen(mainArea);
  } else if (hash.startsWith('#/invoice/')) {
    // New branch for viewing an existing invoice in edit mode.
    const parts = hash.split('/');
    const invoiceId = parts[2];
    mainArea.innerHTML = `<p>Loading invoice details...</p>`;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3000/api/invoice/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.invoice) {
        throw new Error(data.message || 'Failed to fetch invoice details');
      }
      const invoice = data.invoice;
      const invoiceImageUrl = `http://localhost:3000/uploads/${invoice.fileName}`;
      // Pass the invoice data to the edit screen.
      renderEditInvoiceScreen(mainArea, invoiceImageUrl, invoice, invoice.fileName);
    } catch (err: any) {
      mainArea.innerHTML = `<h1>Error</h1><p>${err.message}</p>`;
    }
  } else {
    mainArea.innerHTML = '<h1>404 - Page Not Found</h1>';
  }
}

// Refresh token periodically.
setInterval(() => {
  if (isLoggedIn()) {
    refreshToken();
  }
}, 5 * 60 * 1000);

window.addEventListener('hashchange', router);
router();
