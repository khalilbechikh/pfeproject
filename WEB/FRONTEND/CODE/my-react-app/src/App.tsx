import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginSignup from './components/auth/loginsignup';
import StyledPage from './components/StyledPage';
import Dashboard from './components/homepage/dashboard';
import Profile from './components/homepage/profile';
import Preview from './components/homepage/preview';
import UserOwnRepoPreview from './components/homepage/UserOwnRepoPreview';
import RequestResetPassword from './components/auth/requestresetpassword';
import ResetPassword from './components/auth/resetpassword'; // Import the ResetPassword component
import Verify2FA from './components/auth/verify2fa'; // Add new import
import { JSX, useState } from 'react';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Protected Route Component
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    return isAuthenticated ? children : <Navigate to="/" replace />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/styled" element={<StyledPage />} />
        <Route path="/request-reset-password" element={<RequestResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} /> {/* New dynamic route */}

        {/* Protected Routes */}
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
        {/* Existing protected route for repository preview */}
        <Route
          path="/repositories/:id"
          element={
            <ProtectedRoute>
              <Preview darkMode={darkMode} />
            </ProtectedRoute>
          }
        />
        {/* New protected route for user-owned repository preview */}
        <Route
          path="/userownrepopreview/:id"
          element={
            <ProtectedRoute>
              <UserOwnRepoPreview darkMode={darkMode} />
            </ProtectedRoute>
          }
        />
        {/* New route for 2FA verification */}
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
