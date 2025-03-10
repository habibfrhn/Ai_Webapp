import { Link, useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Check if current route matches link
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex">
      {/* Sidebar (fixed, pinned to the left) */}
      <aside className="w-64 h-screen bg-white text-gray-800 fixed top-0 left-0 flex flex-col">
        <div className="p-4 flex-grow">
          <h2 className="text-xl font-bold mb-4">Ai_Webapp</h2>
          <nav className="flex flex-col gap-2 text-sm">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-gray-200 text-black'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Dasbor
            </Link>
            <Link
              to="/invoices"
              className={`block px-3 py-2 rounded-lg transition-colors ${
                isActive('/invoices')
                  ? 'bg-gray-200 text-black'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Faktur
            </Link>
            <Link
              to="/clients"
              className={`block px-3 py-2 rounded-lg transition-colors ${
                isActive('/clients')
                  ? 'bg-gray-200 text-black'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Klien
            </Link>
            <Link
              to="/history"
              className={`block px-3 py-2 rounded-lg transition-colors ${
                isActive('/history')
                  ? 'bg-gray-200 text-black'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Riwayat
            </Link>
          </nav>
        </div>
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content area, offset by sidebar width, no extra styles */}
      <main className="ml-64" style={{ background: 'none' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
