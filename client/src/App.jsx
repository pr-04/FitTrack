import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Calories from './pages/Calories';
import Weight from './pages/Weight';
import Profile from './pages/Profile';
import PersonalizePlan from './pages/PersonalizePlan';
import OAuthCallback from './pages/OAuthCallback';
import Home from './pages/Home';
import PageBackground from './components/PageBackground';

// Protected Route — redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

// Auth Route — redirects to /dashboard if already authenticated (for login/signup pages)
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />

      {/* Protected App Routes */}
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="workouts" element={<Workouts />} />
        <Route path="calories" element={<Calories />} />
        <Route path="weight" element={<Weight />} />
        <Route path="profile" element={<Profile />} />
        <Route path="personalize-plan" element={<PersonalizePlan />} />
      </Route>

      {/* Legacy Redirects or Fallback */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/workouts" element={<Navigate to="/app/workouts" replace />} />
      <Route path="/calories" element={<Navigate to="/app/calories" replace />} />
      <Route path="/weight" element={<Navigate to="/app/weight" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
      <Route path="/personalize-plan" element={<Navigate to="/app/personalize-plan" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PageBackground>
            <AppRoutes />
          </PageBackground>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
