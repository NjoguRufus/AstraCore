import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { Layout } from '../components/Layout/Layout';
import { toast } from 'react-hot-toast';

export const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Configure Google provider with additional scopes if needed
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account', // Force account selection
    hd: 'yourdomain.com' // Restrict to your organization domain
  });

  useEffect(() => {
    if (user && !loading) {
      redirectUser(user);
    }
  }, [user, loading]);

  const redirectUser = (user: any) => {
    if (user.isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/member/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Verify domain if needed
      if (!firebaseUser.email?.endsWith('@yourdomain.com')) {
        await auth.signOut();
        throw new Error('Only company email addresses are allowed');
      }

      // Check user status in Firestore
      const [userDoc, pendingInvite] = await Promise.all([
        getDoc(doc(db, 'active_members', firebaseUser.uid)),
        checkPendingInvitation(firebaseUser.email)
      ]);

      if (userDoc.exists()) {
        redirectUser({ ...userDoc.data(), uid: firebaseUser.uid });
      } else if (pendingInvite) {
        navigate('/onboarding', { state: { email: firebaseUser.email } });
      } else {
        await auth.signOut();
        toast.error('No active membership or pending invitation found');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Login popup was closed - please try again');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkPendingInvitation = async (email?: string | null) => {
    if (!email) return false;
    
    // Implement your pending invitation check logic here
    // Example:
    // const snapshot = await getDocs(query(
    //   collection(db, 'pending_members'),
    //   where('email', '==', email)
    // ));
    // return !snapshot.empty;
    
    return false; // Placeholder
  };

  if (loading) {
    return (
      <Layout showSidebar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">A</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome to Astracore</h2>
            <p className="mt-2 text-gray-600">Internal Team Operations System</p>
          </div>
          
          <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-200">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-6">
                  Sign in with your company Google account
                </p>
              </div>
              
              <Button
                onClick={handleGoogleSignIn}
                isLoading={isLoading}
                className="w-full flex justify-center items-center space-x-3 py-3"
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
                <span>Sign in with Google</span>
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  By continuing, you agree to our Terms of Service
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};