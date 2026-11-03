import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import api from './services/api';

// AUTH
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import RegisterCustomer from './pages/auth/RegisterCustomer';
import RegisterCustomerEmail from './pages/auth/RegisterCustomerEmail';
import RegisterCustomerPhone from './pages/auth/RegisterCustomerPhone';
import RegisterProvider from './pages/auth/RegisterProvider';
import RegisterProviderEmail from './pages/auth/RegisterProviderEmail';
import RegisterProviderPhone from './pages/auth/RegisterProviderPhone';

// CUSTOMER
import Home from './pages/customer/Home';
import Providers from './pages/customer/Providers';
import ProviderDetails from './pages/customer/ProviderDetails';
import RequestHistory from './pages/customer/RequestHistory';
import Notifications from './pages/customer/Notifications';
import MyRequests from './pages/customer/MyRequests';
import RequestService from './pages/customer/RequestService';

// PROVIDER
import Dashboard from './pages/provider/Dashboard';
import AddProvider from './pages/provider/AddProvider';
import EditProvider from './pages/provider/EditProvider';

// ADMIN
import AdminPanel from './pages/admin/AdminPanel';
import Profile from './pages/customer/Profile';
import Wallet from './pages/provider/Wallet';

function AppContent() {
  const { user } = useAuth();
  
  // 👇 NAYA: Provider Onboarding Check 👇
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkProviderStatus = async () => {
      if (user && user.role === 'PROVIDER') {
        try {
          const res = await api.get('/providers/my');
          // Agar koi service nahi hai, to onboarding true hai
          if (res.data && res.data.length === 0) {
            setIsOnboarding(true);
          } else {
            setIsOnboarding(false);
          }
        } catch (err) {
          console.error("Error checking provider status:", err);
        } finally {
          setCheckingOnboarding(false);
        }
      } else {
        setIsOnboarding(false);
        setCheckingOnboarding(false);
      }
    };

    checkProviderStatus();
  }, [user]);

  // Jab tak status check ho raha hai, loading dikhayein (taake flicker na ho)
  if (checkingOnboarding) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-primary-600 font-bold text-xl">Loading...</div>;
  }

  // 👇 STRICT RESTRICTION: Agar new provider hai, to SIRF AddProvider dikhao, koi Navbar nahi 👇
  if (user && user.role === 'PROVIDER' && isOnboarding) {
    return (
      <Routes>
        <Route path="/add-provider" element={<AddProvider />} />
        {/* Agar user kisi doosre URL par jaye, to wapas Add Provider par bhej do */}
        <Route path="*" element={<Navigate to="/add-provider" replace />} />
      </Routes>
    );
  }

  // 👇 NORMAL FLOW (Jab provider onboarding complete kar le, ya customer/admin ho) 👇
  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {user && <Navbar />}
        <Routes>
          {/* ===== AUTH ROUTES ===== */}
          <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/home" replace /> : <ForgotPassword />} />

          {/* Customer Registration */}
          <Route path="/register-customer" element={user ? <Navigate to="/home" replace /> : <RegisterCustomer />} />
          <Route path="/register/customer" element={user ? <Navigate to="/home" replace /> : <RegisterCustomer />} />
          <Route path="/register/customer/email" element={user ? <Navigate to="/home" replace /> : <RegisterCustomerEmail />} />
          <Route path="/register/customer/phone" element={user ? <Navigate to="/home" replace /> : <RegisterCustomerPhone />} />

          {/* Provider Registration */}
          <Route path="/register-provider" element={user ? <Navigate to="/home" replace /> : <RegisterProvider />} />
          <Route path="/register/provider/email" element={user ? <Navigate to="/home" replace /> : <RegisterProviderEmail />} />
          <Route path="/register/provider/phone" element={user ? <Navigate to="/home" replace /> : <RegisterProviderPhone />} />

          {/* ===== PROTECTED ROUTES ===== */}
          <Route path="/home" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'PROVIDER', 'ADMIN']}>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/providers" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'PROVIDER', 'ADMIN']}>
              <Providers />
            </ProtectedRoute>
          } />
          
          <Route path="/my-services" element={
            <ProtectedRoute allowedRoles={['PROVIDER']}>
              <Providers />
            </ProtectedRoute>
          } />

          <Route path="/providers/:id" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'PROVIDER', 'ADMIN']}>
              <ProviderDetails />
            </ProtectedRoute>
          } />
          <Route path="/request-service/:providerId" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'PROVIDER', 'ADMIN']}>
              <RequestService />
            </ProtectedRoute>
          } />
          <Route path="/request-history" element={<RequestHistory />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/my-requests" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'PROVIDER', 'ADMIN']}>
              <MyRequests />
            </ProtectedRoute>
          } />

          <Route path="/wallet" element={<Wallet />} />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/add-provider" element={
            <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
              <AddProvider />
            </ProtectedRoute>
          } />
          <Route path="/edit-provider/:id" element={
            <ProtectedRoute allowedRoles={['PROVIDER', 'ADMIN']}>
              <EditProvider />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'PROVIDER', 'ADMIN']}>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPanel />
            </ProtectedRoute>
          } />

          {/* ===== DEFAULT ROUTES ===== */}
          <Route path="/" element={<Navigate to={user ? (user.role === 'PROVIDER' ? '/dashboard' : '/home') : '/login'} replace />} />
          <Route path="*" element={<Navigate to={user ? (user.role === 'PROVIDER' ? '/dashboard' : '/home') : '/login'} replace />} />
        </Routes>
      </div>
  );
}

function App() {
  return (
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
  );
}

export default App;
