import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { Layout } from '../../components/Layout/Layout';

export const OnboardingStart: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Check if employee ID exists in pending_members
      const q = query(collection(db, 'pending_members'), where('employeeID', '==', employeeId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Employee ID not found. Please contact your administrator.');
        return;
      }

      // Store employee ID in sessionStorage for next step
      sessionStorage.setItem('onboarding_employee_id', employeeId);
      navigate('/onboarding/auth');
    } catch (error) {
      console.error('Error checking employee ID:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">1</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Astracore!</h1>
            <p className="text-gray-600 mt-2">Let's get you set up. First, we need to verify your employee ID.</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  id="employeeId"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your employee ID"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
              >
                Continue
              </Button>
            </form>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an employee ID? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};