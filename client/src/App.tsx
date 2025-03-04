// src/App.tsx
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import HomeScreen from './screens/homeScreen';
import ListScreen from './screens/ListScreen';
import ClientInfoScreen from './screens/clientInfoScreen';
import HistoryScreen from './screens/historyScreen';

import UploadScreen from './screens/UploadScreen';
import EditInvoiceScreen from './screens/EditInvoiceScreen';
import EditSavedInvoiceScreen from './screens/EditSavedInvoiceScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

function App() {
  const location = useLocation();

  const refreshToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
      } else {
        localStorage.removeItem('token');
      }
    } catch (err: unknown) {
      console.error('Error refreshing token:', err);
    }
  };

  // Refresh on route change
  useEffect(() => {
    if (localStorage.getItem('token')) {
      refreshToken();
    }
  }, [location]);

  // Refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (localStorage.getItem('token')) {
        refreshToken();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/invoices" element={<ListScreen />} />
          <Route path="/clients" element={<ClientInfoScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          {/* existing routes */}
          <Route path="/upload" element={<UploadScreen />} />
          <Route path="/edit-invoice" element={<EditInvoiceScreen />} />
          <Route path="/invoice/:invoiceId" element={<EditSavedInvoiceScreen />} />
        </Route>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="*" element={<h1 className="text-center mt-8">404 - Page Not Found</h1>} />
      </Routes>
    </Layout>
  );
}

export default App;
