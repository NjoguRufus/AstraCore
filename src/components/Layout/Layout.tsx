import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        {showSidebar && user && <Sidebar />}
        <main className={`flex-1 ${showSidebar && user ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};