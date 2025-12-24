import './App.css'
import { useContext } from 'react';

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
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return null;

  return (
    <Router>
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/reclamations" element={<ReclamationsPage />} />
          <Route path="/interventions" element={<InterventionsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/reports" element={<ReportingPage />} />
          <Route path="/factures" element={<FacturesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
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
      <CartProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;