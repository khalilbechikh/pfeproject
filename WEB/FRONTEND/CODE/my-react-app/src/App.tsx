import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginSignup from './components/auth/loginsignup';
import StyledPage from './components/StyledPage';
import Dashboard from './components/homepage/dashboard';
import Profile from './components/homepage/profile';
import Preview from './components/homepage/preview';
import UserOwnRepoPreview from './components/homepage/UserOwnRepoPreview';
import RequestResetPassword from './components/auth/requestresetpassword';
import ResetPassword from './components/auth/resetpassword';
import Verify2FA from './components/auth/verify2fa';
import { JSX, useState, useEffect } from 'react';
import AdminInterface from './components/admin/admininterface';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  userId: string;
}

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Regular protected route
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    return isAuthenticated ? children : <Navigate to="/" replace />;
  };

  // Admin protected route
  const ProtectedAdminRoute = ({ children }: { children: JSX.Element }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('authToken');

    useEffect(() => {
      const verifyAdmin = async () => {
        if (!token) {
          setLoading(false);
          return;
        }

        try {
          const decoded = jwtDecode<JwtPayload>(token);
          const response = await fetch(`http://localhost:5000/v1/api/users/${decoded.userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setIsAdmin(userData.data.is_admin === true);
          }
        } catch (error) {
          console.error('Admin verification failed:', error);
        } finally {
          setLoading(false);
        }
      };

      verifyAdmin();
    }, [token]);

    if (loading) {
      return <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>;
    }

    if (!token || !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/styled" element={<StyledPage />} />
        <Route path="/request-reset-password" element={<RequestResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminInterface />
            </ProtectedAdminRoute>
          }
        />

        {/* Regular Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile darkMode={darkMode} setDarkMode={setDarkMode} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/repositories/:id"
          element={
            <ProtectedRoute>
              <Preview darkMode={darkMode} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/userownrepopreview/:id"
          element={
            <ProtectedRoute>
              <UserOwnRepoPreview darkMode={darkMode} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify-2fa"
          element={
            <ProtectedRoute>
              <Verify2FA />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
