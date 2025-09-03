import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from '../../contexts/SidebarContext';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  const { user } = useAuth();
  const { isSidebarOpen, closeSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Header />
      <div className="flex relative">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}
        
        {/* Sidebar */}
        {showSidebar && user && (
          <div className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:static inset-y-0 left-0 z-50 w-64
            transition-transform duration-300 ease-in-out
          `}>
            <Sidebar />
          </div>
        )}
        
        {/* Main content */}
        <main className={`
          flex-1 
          ${showSidebar && user ? 'lg:ml-0' : 'max-w-7xl mx-auto'}
          w-full
        `}>
          {children}
        </main>
      </div>
    </div>
  );
};