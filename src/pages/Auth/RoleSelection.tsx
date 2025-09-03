import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Layout } from '../../components/Layout/Layout';
import { Shield, Users, Crown, UserCheck } from 'lucide-react';

export const RoleSelection: React.FC = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'admin' | 'member') => {
    if (role === 'admin') {
      navigate('/auth/admin-access');
    } else {
      navigate('/auth/member-access');
    }
  };

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img
                src="https://imgur.com/T7mH4Ly.png"
                alt="Astracore Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome To Astraronix </h2>
            <p className="mt-2 text-gray-600">Select your role to continue</p>
          </div>
          
          <div className="space-y-4">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <button
                onClick={() => handleRoleSelect('admin')}
                className="w-full p-6 text-left hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Administrator</h3>
                    <p className="text-sm text-gray-600">
                      Full system access with management capabilities
                    </p>
                  </div>
                  <Shield className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <button
                onClick={() => handleRoleSelect('member')}
                className="w-full p-6 text-left hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Team Member</h3>
                    <p className="text-sm text-gray-600">
                      Access your dashboard and team resources
                    </p>
                  </div>
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              Choose the role that matches your access level
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};