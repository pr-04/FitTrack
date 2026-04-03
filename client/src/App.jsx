import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

// Base Pages (we will create these)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Diet from './pages/Diet';
import Tracker from './pages/Tracker';
import Profile from './pages/Profile';
import OAuthCallback from './pages/OAuthCallback';
import PageBackground from './components/PageBackground';

// Protected Route — strict checking for onboarding
const ProtectedRoute = ({ children, requireOnboarded = true }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireOnboarded && !user.isOnboarded) return <Navigate to="/app/onboarding" replace />;
  if (!requireOnboarded && user.isOnboarded) return <Navigate to="/app/dashboard" replace />;
  
  return children;
};

// Auth Route — redirects to /dashboard if already authenticated
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/app/dashboard" replace />;
};

import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/* Onboarding - User must be logged in, but strictly NOT onboarded yet */}
        <Route path="/app/onboarding" element={
          <ProtectedRoute requireOnboarded={false}>
            <Onboarding />
          </ProtectedRoute>
        } />

        {/* Protected App Routes (must be onboarded) */}
        <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="workout" element={<Workout />} />
          <Route path="diet" element={<Diet />} />
          <Route path="tracker" element={<Tracker />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PageBackground>
            <Toaster position="top-right" reverseOrder={false} />
            <AppRoutes />
          </PageBackground>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
