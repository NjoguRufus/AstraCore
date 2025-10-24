import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from './UI/Card';
import { Button } from './UI/Button';
import { AlertCircle, CheckCircle, User, Building, Shield } from 'lucide-react';

export const FirebaseDiagnostics: React.FC = () => {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any>({});

  useEffect(() => {
    if (user) {
      setDiagnostics({
        isAuthenticated: !!user,
        hasUid: !!user.uid,
        hasEmail: !!user.email,
        hasCompanyId: !!user.companyId,
        hasCompanyRole: !!user.companyRole,
        isAdmin: !!user.isAdmin,
        onboardingCompleted: !!user.onboardingCompleted,
        contractSigned: !!user.contractSigned,
        userData: {
          uid: user.uid,
          email: user.email,
          companyId: user.companyId,
          companyRole: user.companyRole,
          isAdmin: user.isAdmin,
          onboardingCompleted: user.onboardingCompleted,
          contractSigned: user.contractSigned
        }
      });
    }
  }, [user]);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getStatusText = (status: boolean) => {
    return status ? 'OK' : 'Missing';
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Firebase Permissions Diagnostics
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">Authentication:</span>
                {getStatusIcon(diagnostics.isAuthenticated)}
                <span className={`text-sm ${getStatusColor(diagnostics.isAuthenticated)}`}>
                  {getStatusText(diagnostics.isAuthenticated)}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">User ID:</span>
                {getStatusIcon(diagnostics.hasUid)}
                <span className={`text-sm ${getStatusColor(diagnostics.hasUid)}`}>
                  {getStatusText(diagnostics.hasUid)}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">Email:</span>
                {getStatusIcon(diagnostics.hasEmail)}
                <span className={`text-sm ${getStatusColor(diagnostics.hasEmail)}`}>
                  {getStatusText(diagnostics.hasEmail)}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">Company ID:</span>
                {getStatusIcon(diagnostics.hasCompanyId)}
                <span className={`text-sm ${getStatusColor(diagnostics.hasCompanyId)}`}>
                  {getStatusText(diagnostics.hasCompanyId)}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">Company Role:</span>
                {getStatusIcon(diagnostics.hasCompanyRole)}
                <span className={`text-sm ${getStatusColor(diagnostics.hasCompanyRole)}`}>
                  {getStatusText(diagnostics.hasCompanyRole)}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium">Admin Status:</span>
                {getStatusIcon(diagnostics.isAdmin)}
                <span className={`text-sm ${getStatusColor(diagnostics.isAdmin)}`}>
                  {getStatusText(diagnostics.isAdmin)}
                </span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Raw User Data:</h3>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(diagnostics.userData, null, 2)}
              </pre>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Common Issues & Solutions:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="text-red-600">•</span>
                  <span><strong>Missing Company ID:</strong> Contact your administrator to assign you to a company</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-red-600">•</span>
                  <span><strong>Missing Company Role:</strong> Your account needs a company role (company_admin or company_member)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-red-600">•</span>
                  <span><strong>Not Admin:</strong> Only admins can access all data. Regular users can only access their assigned projects</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Refresh Page
              </Button>
              <Button 
                onClick={() => {
                  console.log('User data:', user);
                  console.log('Diagnostics:', diagnostics);
                }}
                variant="outline"
              >
                Log to Console
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
