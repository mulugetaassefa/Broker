import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SocketProvider } from './contexts/SocketContext';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import PropertyList from './pages/properties/PropertyList';
import PropertyDetails from './pages/properties/PropertyDetails';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Components
import Dashboard from './pages/dashboard/Dashboard';
import DashboardOverview from './pages/dashboard/Overview';
import MyListings from './pages/dashboard/MyListings';
import Messages from './pages/dashboard/Messages';
import Favorites from './pages/dashboard/Favorites';
import Profile from './pages/profile/Profile';
import Settings from './pages/dashboard/Settings';
import InterestForm from './pages/dashboard/InterestForm';
import MyInterests from './pages/dashboard/MyInterests';
import UserProfile from './components/user/UserProfile';

// Admin Components
import AdminOverview from './pages/admin/AdminOverview';
import ManageUsers from './pages/admin/ManageUsers';
import AdminMessages from './pages/admin/AdminMessages';
import ManageProperties from './pages/admin/ManageProperties';
import Analytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports';
import UserInterests from './pages/admin/UserInterests';

// Protected Route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin access is required but user is not admin
  if (adminOnly && user.role !== 'admin') {
    toast.error('Unauthorized access');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route component (redirects to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <SocketProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Unified Dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard isAdmin={false} />
              </ProtectedRoute>
            }>
              {/* User Routes */}
              <Route index element={<DashboardOverview />} />
              <Route path="my-listings" element={<MyListings />} />
              <Route path="messages" element={<Messages />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="profile/:id" element={<Profile />} />
              <Route path="interests" element={<MyInterests />} />
              <Route path="interests/new" element={<InterestForm />} />
              <Route path="interests/:id/edit" element={<InterestForm />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Dashboard isAdmin={true} />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="properties" element={<ManageProperties />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="reports" element={<Reports />} />
              <Route path="interests" element={<UserInterests />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-xl text-gray-600">Page not found</p>
                </div>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </SocketProvider>
  );
}

export default App;