import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { Layout } from '../../components/Layout/Layout';
import { CheckCircle, Download, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { generateIDCard } from '../../utils/pdf';

export const OnboardingComplete: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDownloadIDCard = () => {
    if (user) {
      generateIDCard(user);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/member/dashboard');
  };

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <Card className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to the Team! 🎉
            </h1>
            
            <p className="text-gray-600 mb-8">
              Your onboarding is complete! You're now officially part of the Astracore team. 
              Here's what you can do next:
            </p>

            <div className="space-y-4">
              <Button
                onClick={handleDownloadIDCard}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download ID Card</span>
              </Button>

              <Button
                onClick={handleGoToDashboard}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong>
                <br />
                • Explore your member dashboard
                • Check out the team wiki
                • Connect with your team members
                • Start contributing to projects!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};