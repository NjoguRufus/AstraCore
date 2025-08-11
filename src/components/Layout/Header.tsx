import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectNotifications } from '../../hooks/useProjectNotifications';
import { useModal } from '../../contexts/ModalContext';
import { LogOut, User as UserIcon, Bell, Target } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { hasNewNotifications, newProjects } = useProjectNotifications();
  const { showConfirmation } = useModal();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'dev': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'design': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cyber': return 'bg-green-100 text-green-800 border-green-200';
      case 'analyst': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirmation({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      type: 'warning',
      confirmText: 'Sign Out',
      cancelText: 'Cancel'
    });
    
    if (confirmed) {
      await signOut();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img
                src="https://imgur.com/T7mH4Ly.png"
                alt="Astracore Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-gray-900">Astracore</span>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              {/* Project Notifications */}
              {user.role !== 'admin' && hasNewNotifications && (
                <div className="relative">
                  <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {newProjects.length} new project{newProjects.length > 1 ? 's' : ''}
                    </span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};