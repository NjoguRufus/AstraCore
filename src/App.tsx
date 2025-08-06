import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/UI/LoadingSpinner';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { OnboardingStart } from './pages/Onboarding/OnboardingStart';
import { OnboardingAuth } from './pages/Onboarding/OnboardingAuth';
import { OnboardingProfile } from './pages/Onboarding/OnboardingProfile';
import { OnboardingContract } from './pages/Onboarding/OnboardingContract';
import { OnboardingComplete } from './pages/Onboarding/OnboardingComplete';
import { MemberDashboard } from './pages/Member/MemberDashboard';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { MemberManagement } from './pages/Admin/MemberManagement';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<OnboardingStart />} />
        <Route path="/onboarding/auth" element={<OnboardingAuth />} />
        <Route path="/onboarding/profile" element={<OnboardingProfile />} />
        <Route path="/onboarding/contract" element={<OnboardingContract />} />
        <Route path="/onboarding/complete" element={<OnboardingComplete />} />

        {/* Protected Routes */}
        <Route
          path="/member/dashboard"
          element={
            <ProtectedRoute>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/members"
          element={
            <ProtectedRoute requireAdmin>
              <MemberManagement />
            </ProtectedRoute>
          }
        />

        {/* Redirect logic */}
        <Route
          path="/"
          element={
            user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Navigate to="/member/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;