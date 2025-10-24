import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../UI/LoadingSpinner';

export const DashboardRouter: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading while user data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if not completed
  if (!user.onboardingCompleted && !user.contractSigned) {
    return <Navigate to="/onboarding" replace />;
  }

  // Role-based redirection
  switch (user.role) {
    case 'dev':
      return <Navigate to="/dashboard/developer" replace />;
    case 'design':
      return <Navigate to="/dashboard/content" replace />;
    case 'sales':
      return <Navigate to="/dashboard/sales" replace />;
    case 'campaign':
      return <Navigate to="/dashboard/campaign" replace />;
    case 'cyber':
    case 'analyst':
      // For now, redirect cyber and analyst to developer dashboard
      // You can create separate dashboards for these roles later
      return <Navigate to="/dashboard/developer" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      // Fallback to developer dashboard for unknown roles
      return <Navigate to="/dashboard/developer" replace />;
  }
};
