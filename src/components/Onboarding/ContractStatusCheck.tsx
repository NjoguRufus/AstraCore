import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { checkUserContractStatus, forceCompleteOnboarding } from '../../services/firebaseService';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { toast } from 'react-hot-toast';

export const ContractStatusCheck: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const contractStatus = await checkUserContractStatus(user.uid);
        
        if (contractStatus.hasContract) {
          // User has a contract, force complete onboarding
          const success = await forceCompleteOnboarding(user.uid);
          if (success) {
            toast.success('Contract found! Redirecting to dashboard...');
            await refreshUser();
            navigate('/member/dashboard');
          } else {
            toast.error('Failed to complete onboarding. Please contact admin.');
            navigate('/onboarding');
          }
        } else {
          // No contract found, redirect to onboarding
          toast.info('No contract found. Please complete the onboarding process.');
          navigate('/onboarding');
        }
      } catch (error) {
        console.error('Error checking contract status:', error);
        toast.error('Error checking contract status. Please try again.');
        navigate('/onboarding');
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [user, navigate, refreshUser]);

  const handleManualCheck = async () => {
    if (!user?.uid) return;

    setChecking(true);
    try {
      const contractStatus = await checkUserContractStatus(user.uid);
      
      if (contractStatus.hasContract) {
        const success = await forceCompleteOnboarding(user.uid);
        if (success) {
          toast.success('Contract found! Redirecting to dashboard...');
          await refreshUser();
          navigate('/member/dashboard');
        } else {
          toast.error('Failed to complete onboarding. Please contact admin.');
        }
      } else {
        toast.info('No contract found. Please complete the onboarding process.');
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Error checking contract status:', error);
      toast.error('Error checking contract status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Checking your contract status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contract Status Check</h1>
          <p className="text-gray-600 mb-6">
            We're checking if you have already signed a contract...
          </p>
          
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? 'Checking...' : 'Check Again'}
          </button>
          
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full mt-3 bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700"
          >
            Go to Onboarding
          </button>
        </div>
      </div>
    </div>
  );
};
