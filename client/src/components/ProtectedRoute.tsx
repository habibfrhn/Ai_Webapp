// client/src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  userId: string;
}

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    // Check if token has expired.
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }
  } catch {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
