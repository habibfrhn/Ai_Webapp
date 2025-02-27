// ===============================
// 2) client/src/screens/loginScreen.ts (FULL UPDATED CODE)
// ===============================
export function renderLoginScreen(container: HTMLElement) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Login</h2>
        <form id="loginForm" style="display: flex; flex-direction: column; gap: 0.5rem; width: 250px;">
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            required
            style="padding: 0.5rem;"
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            required
            style="padding: 0.5rem;"
          />
          <button 
            type="submit" 
            style="padding: 0.5rem; background-color: #4f46e5; color: white; border: none; cursor: pointer;"
          >
            Login
          </button>
          <div id="loginStatus" style="color: red; font-size: 0.875rem;"></div>
        </form>
        <p style="margin-top: 1rem;">
          Don't have an account?
          <a href="#/register" style="color: blue; text-decoration: underline;">Register</a>
        </p>
      </div>
    `;
  
    const form = container.querySelector<HTMLFormElement>('#loginForm')!;
    const statusEl = container.querySelector<HTMLDivElement>('#loginStatus')!;
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      statusEl.textContent = '';
  
      const formData = new FormData(form);
      const email = formData.get('email')?.toString() || '';
      const password = formData.get('password')?.toString() || '';
  
      try {
        const resp = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) {
          throw new Error(data.message || 'Login failed');
        }
        // CHANGED: Save token to localStorage
        localStorage.setItem('token', data.token);
        alert('Logged in successfully!');
        // Redirect to home
        window.location.hash = '#/';
      } catch (err: any) {
        statusEl.textContent = err.message;
      }
    });
  }
  