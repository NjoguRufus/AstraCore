import React, { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup } from 'firebase/auth';
import { updateDoc, doc, getDoc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { Layout } from '../../components/Layout/Layout';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export const MemberAccess: React.FC = () => {
  const [idCode, setIdCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();

  // Configure Google provider
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  const verifyIdCode = async (code: string): Promise<boolean> => {
    const codeRef = doc(db, 'id_codes', code);
    const snap = await getDoc(codeRef);
    if (!snap.exists()) {
      throw new Error('Invalid ID code. Please contact your administrator.');
    }
    const data: any = snap.data();
    if (data.used === true) {
      if (data.claimedByEmail) {
        throw new Error(`ID code already used by ${data.claimedByEmail}.`);
      }
      throw new Error('This ID code has already been used by another account.');
    }
    return true;
  };

  const handleVerifyCode = async () => {
    try {
      setError('');
      const code = idCode.trim();
      if (!code) {
        setError('Please enter your ID code.');
        return;
      }
      setIsVerifying(true);
      await verifyIdCode(code);
      setIsCodeVerified(true);
      toast.success('ID code verified. Continue with Google.');
    } catch (error: any) {
      console.error('Code verification error:', error);
      setError(error.message || 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const code = idCode.trim();
      if (!code) {
        setError('Please enter your ID code.');
        return;
      }
      if (!isCodeVerified) {
        // Verify inline to reduce friction if user skipped the step
        try {
          setIsVerifying(true);
          await verifyIdCode(code);
          setIsCodeVerified(true);
        } catch (e: any) {
          setError(e.message || 'Failed to verify code');
          return;
        } finally {
          setIsVerifying(false);
        }
      }
      sessionStorage.setItem('pending_id_code', code);
      setIsLoading(true);
      // Try popup first for immediate claim; fallback to redirect if blocked
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const authUser = result.user;
        await processIdCodeClaim(authUser.uid, authUser.email, code);
        sessionStorage.removeItem('pending_id_code');
        toast.success('Successfully authenticated');
        
        // Force a small delay to ensure Firestore writes are complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if onboarding is completed, if not redirect to onboarding
        if (!user?.onboardingCompleted) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/member/dashboard', { replace: true });
        }
        return;
      } catch (popupError) {
        // Popup blocked/failed; use redirect flow
        await signInWithRedirect(auth, googleProvider);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
      setIsLoading(false);
      sessionStorage.removeItem('pending_id_code');
    }
  };

  const processIdCodeClaim = async (userId: string, userEmail: string | null, code: string) => {
    try {
      console.log(`Processing ID code claim for user ${userId} with code ${code}`);
      
      if (!userEmail) {
        throw new Error('User email not available');
      }

      // Ensure we have the current authenticated user
      const currentUser = auth.currentUser;
      console.log('Current auth user:', currentUser?.uid, 'Requested userId:', userId);
      console.log('Auth state:', currentUser ? 'Authenticated' : 'Not authenticated');
      
      if (!currentUser) {
        throw new Error('User not authenticated. Please try signing in again.');
      }
      
      if (currentUser.uid !== userId) {
        throw new Error('Authentication mismatch. Please try signing in again.');
      }
      
      // Wait for auth state to stabilize and ensure user is properly authenticated
      let attempts = 0;
      while (!auth.currentUser && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
      
      if (!auth.currentUser) {
        throw new Error('Authentication state not stable. Please try again.');
      }

      const codeRef = doc(db, 'id_codes', code);
      const codeSnap = await getDoc(codeRef);
      
      console.log('Code snapshot exists:', codeSnap.exists());
      
      if (!codeSnap.exists()) {
        throw new Error('Invalid ID code. Please contact your administrator.');
      }

      const codeData: any = codeSnap.data();
      console.log('Code data:', codeData);

      if (codeData?.used === true && codeData?.claimedByUid !== userId) {
        throw new Error('This ID code has already been used by another account.');
      }

      if (codeData?.used !== true) {
        console.log('Claiming new ID code...');
        console.log('🔍 ID Code Data Retrieved:', {
          assignedName: codeData?.assignedName,
          assignedTeam: codeData?.assignedTeam,
          assignedRole: codeData?.assignedRole,
          assignedStatus: codeData?.assignedStatus
        });
        
        const userRef = doc(db, 'users', userId);
        const derivedName = codeData?.assignedName || currentUser.displayName || '';
        const derivedTeam = codeData?.assignedTeam || '';
        const derivedRole = codeData?.assignedRole || 'dev';

        console.log('🔍 Derived User Data:', {
          name: derivedName,
          team: derivedTeam,
          role: derivedRole
        });

        try {
          console.log('Creating user document...');
          
          // Use a batch write to ensure atomicity
          const batch = writeBatch(db);
          
          batch.set(userRef, { 
            email: userEmail,
            name: derivedName,
            team: derivedTeam,
            role: derivedRole,
            isAdmin: false,
            idCode: code,
            status: codeData?.assignedStatus || 'pending',
            pendingApproval: codeData?.assignedStatus === 'pending' || codeData?.pendingApproval || false,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            onboardingCompleted: false,
            contractSigned: false,
            companyId: '', // Will be set by admin
            companyRole: 'company_member',
            roleOnboardingCompleted: false
          });
          
          batch.update(codeRef, {
            used: true,
            claimedByUid: userId,
            claimedByEmail: userEmail,
            claimedAt: serverTimestamp()
          });
          
                         await batch.commit();
               console.log('Batch write completed successfully');
               
               // Wait a moment for Firestore to propagate the changes
               await new Promise(resolve => setTimeout(resolve, 1000));
               
               // Force refresh user context to get updated data
               console.log('🔄 Refreshing user context after ID code claim...');
               await refreshUser();
               
               // Wait another moment for context to update
               await new Promise(resolve => setTimeout(resolve, 1000));
               
               console.log('✅ User context refreshed, navigating to onboarding...');
               navigate('/onboarding');
             } catch (writeError) {
               console.error('Error during batch write:', writeError);
               throw writeError;
             }
           } else {
             // Already claimed by this user; update lastLogin
             const userRef = doc(db, 'users', userId);
             await setDoc(
               userRef,
               { lastLogin: serverTimestamp() },
               { merge: true }
             );
           }

      return true;
    } catch (error) {
      console.error('Error in processIdCodeClaim:', error);
      throw error;
    }
  };

  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        if (loading) return;
        
        console.log('Checking authentication state...');
        setIsLoading(true);

        // Check for redirect result
        const result = await getRedirectResult(auth);
        console.log('Redirect result:', result);
        
        const pendingCode = sessionStorage.getItem('pending_id_code');
        console.log('Pending code:', pendingCode);

        // Case 1: User completed Google redirect sign-in
        if (result) {
          console.log('User signed in via redirect');
           const authUser = result.user;
          
          if (!pendingCode) {
            await auth.signOut();
            throw new Error('Missing ID code. Please try again.');
          }

          await processIdCodeClaim(authUser.uid, authUser.email, pendingCode);
          sessionStorage.removeItem('pending_id_code');
          
      toast.success('Successfully authenticated');
          navigate('/member/dashboard', { replace: true });
          return;
        }

        // Case 2: User is already logged in
        if (user) {
          console.log('User already authenticated:', user.uid);
          
          if (pendingCode) {
            console.log('Processing pending ID code for existing user');
            await processIdCodeClaim(user.uid, user.email, pendingCode);
            sessionStorage.removeItem('pending_id_code');
          }
          
          if (user.isAdmin) {
            navigate('/admin/dashboard', { replace: true });
          } else if (!user.onboardingCompleted) {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/member/dashboard', { replace: true });
          }
          return;
        }

        // Case 3: No user, no redirect result
        console.log('No active session found');
         setIsLoading(false);
    } catch (error: any) {
      console.error('Authentication error:', error);
        await auth.signOut();
        sessionStorage.removeItem('pending_id_code');
      setError(error.message || 'Authentication failed. Please try again.');
      toast.error(error.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

    handleAuthRedirect();
  }, [navigate, user, loading]);

  if (loading || isLoading) {
    return (
      <Layout showSidebar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p>Checking authentication status...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => navigate('/auth/role-selection')}
              className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to role selection</span>
            </button>
            
            <div className="flex justify-center mb-6">
              <img
                src="https://imgur.com/T7mH4Ly.png"
                alt="Astracore Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Team Member Access</h2>
            <p className="mt-2 text-gray-600">
              Sign in with your Google account
            </p>
          </div>
          
          <Card>
            <div className="space-y-6">
              <div>
                <label htmlFor="idCode" className="block text-sm font-medium text-gray-700 mb-2">
                  ID Code
                </label>
                <input
                  type="text"
                  id="idCode"
                  value={idCode}
                  onChange={(e) => setIdCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your ID code from admin"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyCode}
                  isLoading={isVerifying}
                  disabled={!idCode.trim() || isVerifying}
                  className="flex-1 flex justify-center items-center py-3"
                  variant="outline"
                >
                  Verify Code
                </Button>
              <Button
                onClick={handleGoogleSignIn}
                isLoading={isLoading}
                  disabled={!isCodeVerified || isLoading}
                  className="flex-1 flex justify-center items-center space-x-3 py-3"
                variant="outline"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              
              <Button
                onClick={() => navigate('/auth/signin')}
                className="w-full flex justify-center items-center space-x-3 py-3"
                variant="outline"
              >
                <span>Already a Member? Sign In</span>
              </Button>
              {isCodeVerified && (
                <p className="text-sm text-green-600 mt-2">Code verified. You can now continue with Google.</p>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact your administrator.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};