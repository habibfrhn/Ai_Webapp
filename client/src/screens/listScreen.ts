// src/screens/listScreen.ts
export function renderListScreen(container: HTMLElement) {
    container.innerHTML = `
      <h1>Semua Invoice</h1>
      <p>Here is a list of all invoices...</p>
      <ul>
        <li>Invoice #1234</li>
        <li>Invoice #5678</li>
        <!-- etc. -->
      </ul>
    `;
  }
  