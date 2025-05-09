// App.tsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import HomeScreen from './screens/homeScreen';
import ListScreen from './screens/ListScreen';
import ClientInfoScreen from './screens/ClientInfoScreen';
import HistoryScreen from './screens/HistoryScreen';
import UploadScreen from './screens/UploadScreen';
import EditInvoiceScreen from './screens/editUpdateScreen/EditInvoiceScreen';
import EditSavedInvoiceScreen from './screens/EditSavedInvoiceScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

function App() {
  return (
    <Layout>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/invoices" element={<ListScreen />} />
          <Route path="/clients" element={<ClientInfoScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
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
