// Layout.tsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TbHome, TbFileInvoice, TbUsers, TbHistory } from 'react-icons/tb';
import { FiLogOut } from 'react-icons/fi';

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

  // Helper to highlight active link
  const isActive = (path: string) => location.pathname === path;

  const navItemClasses = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-black ${
      active ? 'bg-gray-200' : 'hover:bg-gray-100'
    }`;

  return (
    // Make a two-column flex layout
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white text-black flex flex-col p-4">
        <div className="flex items-center gap-3 mb-4">
          <TbHome className="w-6 h-6" />
          <h3 className="text-xl font-semibold">Ai_Webapp</h3>
        </div>
        <div className="flex-grow">
          <ul className="menu p-0">
            <li className="mb-2">
              <Link to="/" className={navItemClasses(isActive('/'))}>
                <TbHome className="text-xl" />
                <span>Beranda</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/invoices" className={navItemClasses(isActive('/invoices'))}>
                <TbFileInvoice className="text-xl" />
                <span>Faktur</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/clients" className={navItemClasses(isActive('/clients'))}>
                <TbUsers className="text-xl" />
                <span>Klien</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/history" className={navItemClasses(isActive('/history'))}>
                <TbHistory className="text-xl" />
                <span>Riwayat</span>
              </Link>
            </li>
            <li className="mb-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-red-600 hover:bg-gray-100"
              >
                <FiLogOut className="text-xl" />
                <span>Sign out</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* The main content will fill remaining space */}
      <main className="flex-1" style={{ background: 'none' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
