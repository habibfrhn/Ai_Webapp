// src/layout.ts

export function renderLayout(): HTMLDivElement {
    // Create a container for the entire layout
    const layoutContainer = document.createElement('div');
    layoutContainer.style.display = 'flex';          // side-by-side layout
    layoutContainer.style.height = '100vh';          // full viewport height
  
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
    `;
  
    // Main content area
    const mainArea = document.createElement('div');
    mainArea.style.flex = '1';
    mainArea.style.padding = '1rem';
    mainArea.id = 'main-area'; // We'll replace content here based on the route
  
    // Append nav + main to the container
    layoutContainer.appendChild(nav);
    layoutContainer.appendChild(mainArea);
  
    return layoutContainer;
  }
  