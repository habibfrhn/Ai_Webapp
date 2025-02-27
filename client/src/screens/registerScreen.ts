// ===============================
// 3) client/src/screens/registerScreen.ts (FULL UPDATED CODE)
// ===============================
export function renderRegisterScreen(container: HTMLElement) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 2rem;">
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Register</h2>
        <form id="registerForm" style="display: flex; flex-direction: column; gap: 0.5rem; width: 250px;">
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
            style="padding: 0.5rem; background-color: #10b981; color: white; border: none; cursor: pointer;"
          >
            Register
          </button>
          <div id="registerStatus" style="color: red; font-size: 0.875rem;"></div>
        </form>
        <p style="margin-top: 1rem;">
          Already have an account?
          <a href="#/login" style="color: blue; text-decoration: underline;">Login</a>
        </p>
      </div>
    `;
  
    const form = container.querySelector<HTMLFormElement>('#registerForm')!;
    const statusEl = container.querySelector<HTMLDivElement>('#registerStatus')!;
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      statusEl.textContent = '';
  
      const formData = new FormData(form);
      const email = formData.get('email')?.toString() || '';
      const password = formData.get('password')?.toString() || '';
  
      try {
        const resp = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) {
          throw new Error(data.message || 'Register failed');
        }
        alert('Registered successfully!');
        // Optionally auto-login or redirect to login
        window.location.hash = '#/login';
      } catch (err: any) {
        statusEl.textContent = err.message;
      }
    });
  }
  