import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../../config/firebase';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { Layout } from '../../components/Layout/Layout';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export const AdminAccess: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Verify admin access code
    const adminCode = import.meta.env.VITE_ADMIN_ACCESS_CODE;
    if (password !== adminCode) {
      setError('Invalid admin access code. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      // Sign in with Google after password verification
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Create or update admin user in users collection
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: firebaseUser.displayName || 'Administrator',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        role: 'admin',
        team: 'Administration',
        skills: [],
        employeeID: 'ADMIN001',
        isAdmin: true,
        createdAt: new Date(),
        lastLogin: new Date()
      }, { merge: true });
      
      // Redirect will happen automatically via AuthContext
    } catch (error) {
      console.error('Admin sign in error:', error);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <h2 className="text-3xl font-bold text-gray-900">Administrator Access</h2>
            <p className="mt-2 text-gray-600">Enter the admin access code to continue</p>
          </div>
          
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Access Code
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter admin access code"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                Verify & Sign In with Google
              </Button>
            </form>
          </Card>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              This access code is required for administrator privileges
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};