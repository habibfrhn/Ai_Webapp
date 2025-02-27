// ===============================
// client/src/layout.ts (FULL UPDATED CODE)
// ===============================
export function renderLayout(): HTMLDivElement {
  // Create a container for the entire layout
  const layoutContainer = document.createElement('div');
  layoutContainer.style.display = 'flex';          // side-by-side layout
  layoutContainer.style.height = '100vh';            // full viewport height

  // Left nav
  const nav = document.createElement('nav');
  nav.style.width = '250px';
  nav.style.backgroundColor = '#2d2f36';
  nav.style.color = '#ffffff';
  nav.style.padding = '1rem';

  nav.innerHTML = `
    <h2>Ai_Webapp</h2>
    <ul style="list-style: none; padding: 0;">
      <li><a href="#/" style="color: white; text-decoration: none;">Beranda</a></li>
      <li><a href="#/upload" style="color: white; text-decoration: none;">Upload Invoice</a></li>
      <li><a href="#/invoices" style="color: white; text-decoration: none;">Semua Invoice</a></li>
    </ul>
    <button id="logoutBtn" style="margin-top: 1rem; background-color: #dc2626; color: white; border: none; padding: 0.5rem; cursor: pointer;">
      Logout
    </button>
  `;

  // Attach event listener to the logout button
  const logoutBtn = nav.querySelector<HTMLButtonElement>('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.hash = '#/login';
    });
  }

  // Main content area
  const mainArea = document.createElement('div');
  mainArea.style.flex = '1';
  mainArea.style.padding = '1rem';
  mainArea.id = 'main-area'; // Content will be replaced here based on the route

  // Append nav and main area to the container
  layoutContainer.appendChild(nav);
  layoutContainer.appendChild(mainArea);

  return layoutContainer;
}
