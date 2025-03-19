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

  // Removes token from storage and navigates to login
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Checks if path is active for highlighting
  const isActive = (path: string) => location.pathname === path;

  // Returns consistent classes for each nav item
  const navItemClasses = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors
     ${active ? 'bg-gray-200' : 'hover:bg-gray-100'}
     text-black`; // We'll override color on "Sign out"

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-black flex flex-col p-4">
        {/* Header / Logo */}
        <div className="flex items-center gap-3 mb-4">
          <TbHome className="w-6 h-6" />
          <h3 className="text-xl font-semibold">Ai_Webapp</h3>
        </div>

        {/* Navigation list (remove or override any library classes like .menu) */}
        <ul className="list-none p-0">
          <li className="mb-2">
            <Link to="/" className={navItemClasses(isActive('/'))}>
              <TbHome className="text-xl" />
              <span>Beranda</span>
            </Link>
          </li>

          <li className="mb-2">
            <Link
              to="/invoices"
              className={navItemClasses(isActive('/invoices'))}
            >
              <TbFileInvoice className="text-xl" />
              <span>Faktur</span>
            </Link>
          </li>

          <li className="mb-2">
            <Link
              to="/clients"
              className={navItemClasses(isActive('/clients'))}
            >
              <TbUsers className="text-xl" />
              <span>Klien</span>
            </Link>
          </li>

          <li className="mb-2">
            <Link
              to="/history"
              className={navItemClasses(isActive('/history'))}
            >
              <TbHistory className="text-xl" />
              <span>Riwayat</span>
            </Link>
          </li>

          {/* "Sign out" is also a <Link>, but we override the color and call logout */}
          <li className="mb-2">
            <Link
              to="#"
              onClick={(e) => {
                e.preventDefault(); // Prevent the "#" navigation
                handleLogout();
              }}
              className={`${navItemClasses(false)} text-red-600`}
            >
              <FiLogOut className="text-xl" />
              <span>Sign out</span>
            </Link>
          </li>
        </ul>
      </aside>

      {/* Main content area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
