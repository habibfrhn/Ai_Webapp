import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    if (password !== confirmPassword) {
      setStatus('Passwords do not match');
      return;
    }
    try {
      const resp = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.message || 'Register failed');
      }
      alert('Registered successfully!');
      navigate('/login');
    } catch (err: unknown) {
      if (err instanceof Error) setStatus(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center mt-8">
      <h2 className="text-xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-64">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="p-2 border"
        />
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Nama perusahaan/bisnis"
          required
          className="p-2 border"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="p-2 border"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          required
          className="p-2 border"
        />
        <button type="submit" className="p-2 bg-green-600 text-white">
          Register
        </button>
        {status && <div className="text-red-600 text-sm">{status}</div>}
      </form>
      <p className="mt-4">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 underline">
          Login
        </a>
      </p>
    </div>
  );
};

export default RegisterScreen;
