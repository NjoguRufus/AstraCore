import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { checkUserContractStatus } from '../../services/firebaseService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  allowedRoles
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingContract, setCheckingContract] = useState(false);

  useEffect(() => {
    const checkContractStatus = async () => {
      if (user && !user.onboardingCompleted && !requireAdmin && location.pathname !== '/onboarding') {
        setCheckingContract(true);
        try {
          const contractStatus = await checkUserContractStatus(user.uid);
          if (contractStatus.hasContract) {
            // User has a contract but user document wasn't updated
            // Redirect to contract status check page
            navigate('/check-contract');
            return;
          }
        } catch (error) {
          console.error('Error checking contract status:', error);
        } finally {
          setCheckingContract(false);
        }
      }
    };

    checkContractStatus();
  }, [user, requireAdmin, location.pathname, navigate]);

  if (loading || checkingContract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/role-selection" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/member/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/member/dashboard" replace />;
  }

  // Check if user needs to complete onboarding (for member routes)
  if (!requireAdmin && !user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};