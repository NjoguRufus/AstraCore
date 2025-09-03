import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
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
  BarChart3,
  Bell,
  User,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { closeSidebar } = useSidebar();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'dev': return <Code className="w-5 h-5" />;
      case 'design': return <Palette className="w-5 h-5" />;
      case 'cyber': return <Shield className="w-5 h-5" />;
      case 'analyst': return <BarChart3 className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const adminNavItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: <Home className="w-5 h-5" />
    },
    {
      name: 'Members',
      href: '/admin/members',
      icon: <Users className="w-5 h-5" />
    },
    {
      name: 'Projects',
      href: '/admin/projects',
      icon: <Target className="w-5 h-5" />
    },
    {
      name: 'Tasks',
      href: '/admin/tasks',
      icon: <FileText className="w-5 h-5" />
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      name: 'Notifications',
      href: '/admin/notifications',
      icon: <Bell className="w-5 h-5" />
    },
    {
      name: 'Audit Logs',
      href: '/admin/audit-logs',
      icon: <Shield className="w-5 h-5" />
    },
    {
      name: 'Company Settings',
      href: '/admin/company-settings',
      icon: <Settings className="w-5 h-5" />
    },
    {
      name: 'Billing',
      href: '/admin/billing',
      icon: <Code className="w-5 h-5" />
    },
    {
      name: 'Announcements',
      href: '/admin/announcements',
      icon: <Bell className="w-5 h-5" />
    },
    {
      name: 'Wiki Management',
      href: '/admin/wiki',
      icon: <BookOpen className="w-5 h-5" />
    }
  ];

  const memberNavItems = [
    {
      name: 'Dashboard',
      href: '/member/dashboard',
      icon: <Home className="w-5 h-5" />
    },
    {
      name: 'My Projects',
      href: '/member/projects',
      icon: <Target className="w-5 h-5" />
    },
    {
      name: 'My Profile',
      href: '/member/profile',
      icon: <User className="w-5 h-5" />
    }
  ];

  const sharedNavItems = [
    {
      name: 'Wiki',
      href: '/wiki',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      name: 'Skills',
      href: '/skills',
      icon: <FileText className="w-5 h-5" />
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  const navItems = user?.isAdmin ? adminNavItems : memberNavItems;

  return (
    <div className="w-64 bg-gray-50 min-h-screen border-r border-gray-200 shadow-lg lg:shadow-none">
      <div className="p-6">
        {/* Mobile close button */}
        <div className="flex justify-between items-center mb-6 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-3 mb-8 lg:mb-8">
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
          {/* Main Navigation */}
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={closeSidebar}
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
          ))}

          {/* Divider */}
          <div className="border-t border-gray-200 my-4"></div>

          {/* Shared Navigation */}
          {sharedNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={closeSidebar}
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
          ))}
        </nav>
      </div>
    </div>
  );
};