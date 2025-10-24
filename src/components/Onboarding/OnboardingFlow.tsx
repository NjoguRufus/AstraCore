import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { TermsAcceptance } from "./TermsAcceptance";
import { ContractSigning } from "./ContractSigning";
import { WelcomeMessage } from "./WelcomeMessage";
import { Card } from "../UI/Card";
import { CheckCircle, FileText, UserCheck, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

type OnboardingStep = 'welcome' | 'terms' | 'contract' | 'complete';

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  const { user, refreshUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Show loading while user data is being loaded
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your information...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Debug: Log user data when onboarding starts
    console.log('🔍 OnboardingFlow - User data:', {
      user: user ? {
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
        idCode: user.idCode,
        onboardingCompleted: user.onboardingCompleted,
        contractSigned: user.contractSigned
      } : null
    });

    // Check if user has already completed onboarding
    if (user?.onboardingCompleted || user?.contractSigned) {
      console.log('🚀 User already completed onboarding, redirecting to member dashboard...');
      navigate('/member/dashboard');
      return;
    }

    // Additional check: verify if user has a contract in the contracts collection
    const checkExistingContract = async () => {
      if (user?.uid) {
        try {
          const contractData = localStorage.getItem('contractData');
          if (contractData) {
            // User has contract data in localStorage, they might be in the middle of onboarding
            return;
          }

          // Check if user already has a contract in Firestore
          const { checkUserContractStatus } = await import('../../services/firebaseService');
          const contractStatus = await checkUserContractStatus(user.uid);
          
          if (contractStatus.hasContract) {
            console.log('🚀 User already has a contract in Firestore, redirecting to member dashboard...');
            // Force complete onboarding and redirect
            const { forceCompleteOnboarding } = await import('../../services/firebaseService');
            const success = await forceCompleteOnboarding(user.uid);
            if (success) {
              await refreshUser();
              navigate('/member/dashboard');
            } else {
              navigate('/check-contract');
            }
          }
        } catch (error) {
          console.error('Error checking existing contract:', error);
        }
      }
    };

    checkExistingContract();
  }, [user, navigate, refreshUser]);

  const handleWelcomeContinue = () => {
    setCurrentStep('terms');
  };

  const handleTermsAccepted = () => {
    setCurrentStep('contract');
  };

  const handleContractSigned = async () => {
    setCurrentStep('complete');
  };

  const handleCompleteOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Store contract data in contracts collection first
      const contractData = localStorage.getItem('contractData');
      if (contractData) {
        const contract = JSON.parse(contractData);
        console.log('📄 Contract data from localStorage:', contract);
        
        const contractRef = doc(db, 'contracts', user.uid);
        const contractToStore = {
          ...contract,
          uid: user.uid,
          // Convert string dates back to Date objects
          signedAt: contract.signedAt ? new Date(contract.signedAt) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('💾 Storing contract in Firestore:', contractToStore);
        await setDoc(contractRef, contractToStore);
        console.log('✅ Contract stored successfully in Firestore');
      }

      // Update user document to mark onboarding as completed
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        onboardingCompleted: true,
        contractSigned: true,
        contractId: user.uid, // Use UID as contract ID since we stored it with UID
        roleOnboardingCompleted: false, // Ensure role onboarding modal shows after initial onboarding
        updatedAt: new Date()
      });

      toast.success('Onboarding completed successfully!');
      
      console.log('🎉 Onboarding completed! Refreshing user context...');
      
      // Refresh user context to get updated flags
      await refreshUser();
      
      console.log('🚀 Navigating to /member/dashboard...');
      navigate('/member/dashboard');
      
      // Clear localStorage after successful completion
      localStorage.removeItem('contractData');
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceComplete = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const { forceCompleteOnboarding } = await import('../../services/firebaseService');
      const success = await forceCompleteOnboarding(user.uid);
      
      if (success) {
        toast.success('Onboarding completed! Redirecting to dashboard...');
        await refreshUser();
        navigate('/member/dashboard');
      } else {
        toast.error('No contract found. Please complete the onboarding process.');
      }
    } catch (error) {
      console.error('Error force completing onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step: OnboardingStep) => {
    if (step === currentStep) return 'current';
    if (step === 'welcome' && currentStep !== 'welcome') return 'completed';
    if (step === 'terms' && (currentStep === 'contract' || currentStep === 'complete')) return 'completed';
    if (step === 'contract' && currentStep === 'complete') return 'completed';
    return 'pending';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        console.log('🔍 OnboardingFlow - Passing data to WelcomeMessage:', {
          userName: user?.name || user?.displayName || '',
          teamName: user?.team || 'Astraronix Team',
          userRole: user?.role || 'dev'
        });
        return (
          <WelcomeMessage
            userName={user?.name || user?.displayName || ''}
            teamName={user?.team || 'Astraronix Team'}
            userRole={user?.role || 'dev'}
            onContinue={handleWelcomeContinue}
          />
        );
      
      case 'terms':
        return (
          <TermsAcceptance
            onNext={handleTermsAccepted}
          />
        );
      
      case 'contract':
        return (
          <ContractSigning
            onNext={handleContractSigned}
            onBack={() => setCurrentStep('terms')}
            memberData={{
              name: user?.name || '',
              email: user?.email || '',
              role: user?.role || '',
              idCode: user?.idCode || ''
            }}
          />
        );
      
      case 'complete':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Onboarding Complete!
              </h1>
              <p className="text-lg text-gray-600">
                Welcome to the Astraronix Solutions team! You've successfully completed the onboarding process.
              </p>
            </div>

            <Card className="mb-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <UserCheck className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900">Account Activation</h3>
                      <p className="text-sm text-gray-600">
                        Your account has been activated and you can now access all member features.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <FileText className="w-6 h-6 text-green-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900">Contract Signed</h3>
                      <p className="text-sm text-gray-600">
                        Your team member contract has been signed and stored securely.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <ArrowRight className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900">Access Dashboard</h3>
                      <p className="text-sm text-gray-600">
                        You'll be redirected to your member dashboard where you can view projects, 
                        update your profile, and collaborate with your team.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="text-center">
              <button
                onClick={handleCompleteOnboarding}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img 
                src="https://i.imgur.com/T7mH4Ly.png" 
                alt="Astraronix Solutions" 
                className="h-8 w-auto"
              />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Team Member Onboarding
              </h1>
            </div>
            
            <div className="text-sm text-gray-500">
              Welcome, {user.name}
            </div>
          </div>
        </div>
      </div>

      {/* Force complete button for stuck users */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="text-center">
            <button
              onClick={handleForceComplete}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'I already signed a contract - Take me to dashboard'}
            </button>
            
            <div className="mt-2">
              <span className="text-sm text-yellow-700">
                Having trouble?{' '}
                <button
                  onClick={() => navigate('/check-contract')}
                  className="text-yellow-800 underline hover:text-yellow-900"
                >
                  Check my contract status
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8 py-4">
            {(['welcome', 'terms', 'contract', 'complete'] as OnboardingStep[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  getStepStatus(step) === 'completed' 
                    ? 'bg-green-600 border-green-600 text-white'
                    : getStepStatus(step) === 'current'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-gray-200 border-gray-300 text-gray-500'
                }`}>
                  {getStepStatus(step) === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                
                <span className={`ml-3 text-sm font-medium ${
                  getStepStatus(step) === 'completed'
                    ? 'text-green-600'
                    : getStepStatus(step) === 'current'
                    ? 'text-blue-600'
                    : 'text-gray-500'
                }`}>
                  {step === 'welcome' && 'Welcome'}
                  {step === 'terms' && 'Terms & Conditions'}
                  {step === 'contract' && 'Contract Signing'}
                  {step === 'complete' && 'Complete'}
                </span>
                
                {index < 3 && (
                  <div className={`ml-8 w-16 h-0.5 ${
                    getStepStatus(step) === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8">
        {renderStepContent()}
      </div>
    </div>
  );
};
