import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home,
  Users,
  FileText,
  BookOpen,
  Target,
  Settings,
  Shield,
  Code,
  Palette,
  BarChart3
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'dev': return <Code className="w-5 h-5" />;
      case 'design': return <Palette className="w-5 h-5" />;
      case 'cyber': return <Shield className="w-5 h-5" />;
      case 'analyst': return <BarChart3 className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: user?.isAdmin ? '/admin/dashboard' : '/member/dashboard',
      icon: <Home className="w-5 h-5" />,
      showForAll: true
    },
    {
      name: 'Team Members',
      href: '/admin/members',
      icon: <Users className="w-5 h-5" />,
      adminOnly: true
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: <Target className="w-5 h-5" />,
      showForAll: true
    },
    {
      name: 'Wiki',
      href: '/wiki',
      icon: <BookOpen className="w-5 h-5" />,
      showForAll: true
    },
    {
      name: 'Skills',
      href: '/skills',
      icon: <FileText className="w-5 h-5" />,
      showForAll: true
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings className="w-5 h-5" />,
      showForAll: true
    }
  ];

  return (
    <div className="w-64 bg-gray-50 min-h-screen border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              {getRoleIcon(user?.role || '')}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{user?.name}</h3>
            <p className="text-sm text-gray-500">{user?.team}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems
            .filter(item => item.showForAll || (item.adminOnly && user?.isAdmin))
            .map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))
          }
        </nav>
      </div>
    </div>
  );
};