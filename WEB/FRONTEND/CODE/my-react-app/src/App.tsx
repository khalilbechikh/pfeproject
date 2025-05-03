import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginSignup from './components/auth/loginsignup';
import StyledPage from './components/StyledPage';
import Dashboard from './components/homepage/dashboard';
import Profile from './components/homepage/profile';
import Preview from './components/homepage/preview'; // Import the Preview component
import UserOwnRepoPreview from './components/homepage/UserOwnRepoPreview'; // Import the UserOwnRepoPreview component
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
      </Routes>
    </Router>
  );
}

export default App;
