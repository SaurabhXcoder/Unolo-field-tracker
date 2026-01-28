import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import History from './pages/History';
import Layout from './components/Layout';

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session on refresh
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    // ✅ STORE TOKEN FIRST
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));

    // ✅ UPDATE STATE
    setUser(userData);

    // ✅ FORCE NAVIGATION (CRITICAL)
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
        }
      />

      <Route
        path="/"
        element={
          user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard user={user} />} />
        <Route path="checkin" element={<CheckIn user={user} />} />
        <Route path="history" element={<History user={user} />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
