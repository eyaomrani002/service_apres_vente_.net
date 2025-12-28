import './App.css'
import { useContext, ReactElement } from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

// Theme
import { theme } from './assets/styles/theme';
import './assets/styles/global.css';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/auth/AuthLayout';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import UsersPage from './pages/dashboard/UsersPage';

// Mock pages pour la démo
import ArticlesPage from './pages/dashboard/ArticlesPage';
import ClientsPage from './pages/dashboard/ClientsPage';
import ReclamationsPage from './pages/dashboard/ReclamationsPage';
import InterventionsPage from './pages/dashboard/InterventionsPage';
import CalendarPage from './pages/dashboard/CalendarPage';
import ReportingPage from './pages/dashboard/ReportingPage';
import FacturesPage from './pages/dashboard/FacturesPage';
import CatalogPage from './pages/catalog/CatalogPage';
import CartPage from './pages/cart/CartPage';

function AppContent() {
  const { isAuthenticated, loading, hasAnyRole } = useContext(AuthContext);

  if (loading) return null;

  const ProtectedRoute = ({ element, roles }: { element: ReactElement; roles?: string[] }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roles && roles.length > 0 && !hasAnyRole(roles.map((r) => r.toLowerCase()))) {
      return <Navigate to="/catalog" replace />;
    }
    return element;
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Root: redirect depending on auth state */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/catalog" replace /> : <Navigate to="/login" replace />} />

        {/* Public auth layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected routes: MainLayout is only mounted when authenticated */}
        <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} roles={['admin']} />} />
          <Route path="/catalog" element={<ProtectedRoute element={<CatalogPage />} />} />
          <Route path="/cart" element={<ProtectedRoute element={<CartPage />} />} />
          <Route path="/articles" element={<ProtectedRoute element={<ArticlesPage />} roles={['admin']} />} />
          <Route path="/clients" element={<ProtectedRoute element={<ClientsPage />} roles={['admin']} />} />
          <Route path="/users" element={<ProtectedRoute element={<UsersPage />} roles={['admin']} />} />
          <Route path="/reclamations" element={<ProtectedRoute element={<ReclamationsPage />} />} />
          <Route path="/interventions" element={<ProtectedRoute element={<InterventionsPage />} roles={['admin']} />} />
          <Route path="/calendar" element={<ProtectedRoute element={<CalendarPage />} roles={['admin', 'responsablesav', 'technicien']} />} />
          <Route path="/reports" element={<ProtectedRoute element={<ReportingPage />} roles={['admin', 'responsablesav', 'technicien']} />} />
          <Route path="/factures" element={<ProtectedRoute element={<FacturesPage />} roles={['admin']} />} />
          <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
        </Route>

        {/* Fallback: send to dashboard if authenticated, otherwise to login */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;