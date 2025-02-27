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

/**
 * Checks whether the token exists.
 * (We now rely on a sliding refresh mechanism to keep token valid)
 */
function hasToken(): boolean {
  return !!localStorage.getItem('token');
}

/**
 * Calls the backend refresh endpoint.
 * If successful, a new token (with 8h expiration) is stored.
 * If not, the user is logged out.
 */
async function refreshToken() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const response = await fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
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
 * Also, if the token is missing or invalid, the user is redirected to login.
 */
async function router() {
  const hash = window.location.hash || '#/';
  const mainArea = document.querySelector<HTMLDivElement>('#main-area')!;
  
  // If user has a token, refresh it to reset the expiration countdown.
  if (isLoggedIn()) {
    await refreshToken();
  }
  
  // Force user to /login or /register if not logged in.
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

// Refresh token periodically (e.g., every 5 minutes) while the app is open.
setInterval(() => {
  if (isLoggedIn()) {
    refreshToken();
  }
}, 5 * 60 * 1000);

window.addEventListener('hashchange', router);
router();
