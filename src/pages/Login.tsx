import React, { useState, useEffect } from 'react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { Layout } from '../components/Layout/Layout';

export const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Email/Password Admin Login State
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [adminAccessGranted, setAdminAccessGranted] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');

  useEffect(() => {
    console.log('Login useEffect:', { user, loading });
    if (user && !loading && user.role && user.role !== 'admin') {
      navigate('/member/dashboard');
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    if (role === 'admin' && password !== 'B17T6E6YMYF') {
      alert('Incorrect admin password.');
      return;
    }
    if (role === 'user' && !userId) {
      alert('Please enter your user ID.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Always create/update user document with Firebase UID
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user document with pending status for non-admins
        await setDoc(userRef, {
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          role: role === 'admin' ? 'admin' : 'user',
          status: role === 'admin' ? 'active' : 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // If user (not admin), create pending member entry
        if (role === 'user') {
          const pendingRef = doc(db, 'pending_members', firebaseUser.uid);
          await setDoc(pendingRef, {
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            role: 'user',
            status: 'pending',
            createdAt: serverTimestamp()
          });
        }
      } else {
        // Update existing user document and set to active
        const updatedData = {
          ...userDoc.data(),
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          status: 'active',
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userRef, updatedData, { merge: true });
        
        // If user exists and is not admin, ensure they're in active_members
        if (role === 'user') {
          const activeRef = doc(db, 'active_members', firebaseUser.uid);
          const activeDoc = await getDoc(activeRef);
          if (!activeDoc.exists()) {
            await setDoc(activeRef, {
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              role: 'user',
              status: 'active',
              createdAt: serverTimestamp()
            });
          }
          
          // Remove from pending_members if exists
          const pendingRef = doc(db, 'pending_members', firebaseUser.uid);
          const pendingDoc = await getDoc(pendingRef);
          if (pendingDoc.exists()) {
            await setDoc(pendingRef, { status: 'active', updatedAt: serverTimestamp() }, { merge: true });
          }
        }
      }

      // For admin role, verify admin status
      if (role === 'admin') {
        const freshDoc = await getDoc(userRef);
        if (freshDoc.data()?.role !== 'admin') {
          alert('You are not authorized as an admin.');
          return;
        }
        navigate('/admin/dashboard');
        return;
      } else {
        // For user role, navigate to member dashboard
        navigate('/member/dashboard');
        return;
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  // Admin Email/Password Sign In Handler
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== 'B17T6E6YMYF') {
      alert('Incorrect admin password.');
      return;
    }
    setIsLoading(true);
    try {
      // Try Firebase Auth sign in
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;
      console.log('Signed in UID:', firebaseUser.uid);
      // Check Firestore for admin role in 'users' collection
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        alert('You are not authorized as an admin.');
        return;
      }
      // Success: will redirect by useEffect
    } catch (error) {
      console.error('Admin login error:', error);
      alert('Admin login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

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
                  Sign in with your Google account or as an admin
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User (Google + ID)</option>
                  <option value="admin">Admin (Google + Password)</option>
                </select>
              </div>
              {role === 'admin' && (
                <>
                  <div className="mb-4 flex items-center">
                    <input
                      type="checkbox"
                      id="isAdminChecked"
                      checked={isAdminChecked}
                      onChange={e => {
                        setIsAdminChecked(e.target.checked);
                        setAdminAccessGranted(false);
                        setAdminMessage('');
                        setPassword('');
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="isAdminChecked" className="text-sm font-medium text-gray-700">
                      I am an admin
                    </label>
                  </div>
                  {isAdminChecked && !adminAccessGranted && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <Button
                        type="button"
                        className="mt-2 w-full"
                        onClick={() => {
                          if (password === 'B17T6E6YMYF') {
                            setAdminAccessGranted(true);
                            setAdminMessage('Access granted. Please sign in with Google email to navigate to admin dashboard.');
                          } else {
                            setAdminAccessGranted(false);
                            setAdminMessage('Incorrect admin password.');
                          }
                        }}
                      >
                        Okay
                      </Button>
                      {adminMessage && (
                        <div className={`mt-2 text-sm ${adminAccessGranted ? 'text-green-600' : 'text-red-600'}`}>{adminMessage}</div>
                      )}
                    </div>
                  )}
                  {adminAccessGranted && (
                    <div className="mb-4 text-green-600 text-sm font-medium">
                      {adminMessage}
                    </div>
                  )}
                </>
              )}
              {role === 'user' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
              <Button
                onClick={handleGoogleSignIn}
                isLoading={isLoading}
                className="w-full flex justify-center items-center space-x-3 py-3"
                variant="outline"
                disabled={role === 'admin' && (!isAdminChecked || !adminAccessGranted)}
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