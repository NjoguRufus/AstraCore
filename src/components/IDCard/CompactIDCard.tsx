import React from 'react';
import { User } from '../../types';
import { Download, Eye } from 'lucide-react';

interface CompactIDCardProps {
  user: User;
  profilePhotoUrl?: string;
  onDownload: () => void;
  onPreview?: () => void;
}

export const CompactIDCard: React.FC<CompactIDCardProps> = ({
  user,
  profilePhotoUrl,
  onDownload,
  onPreview
}) => {
  const initials = user.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="relative">
      {/* ID Card Container */}
      <div 
        className="relative w-80 h-48 rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
        style={{
          background: 'linear-gradient(135deg, #0B1C48 0%, #0B1C48 50%, rgba(0, 191, 255, 0.1) 100%)',
          border: '1px solid rgba(0, 191, 255, 0.3)'
        }}
        onClick={onPreview}
      >
        {/* Glowing border effect */}
        <div 
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(45deg, transparent, rgba(0, 191, 255, 0.2), transparent)',
            animation: 'glow 2s ease-in-out infinite alternate'
          }}
        />
        
        {/* Top Section */}
        <div className="relative z-10 pt-3 text-center">
          <h1 className="text-white text-sm font-bold">ASTRARONIX</h1>
          <p className="text-white text-xs opacity-80">Innovate. Build. Elevate.</p>
        </div>

        {/* Middle Section - Profile Photo */}
        <div className="relative z-10 flex flex-col items-center mt-3">
          {/* Glowing ring around photo */}
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(0, 191, 255, 0.3) 0%, transparent 70%)',
                transform: 'scale(1.2)'
              }}
            />
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0, 191, 255, 0.2) 0%, transparent 70%)',
                transform: 'scale(1.1)'
              }}
            />
            
            {/* Profile Photo */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
              {profilePhotoUrl ? (
                <img 
                  src={profilePhotoUrl} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: '#0B1C48' }}
                >
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Name and Role */}
          <div className="mt-2 text-center">
            <h2 className="text-white text-xs font-bold uppercase">{user.name}</h2>
            <p 
              className="text-xs font-bold uppercase mt-1"
              style={{ color: '#00BFFF' }}
            >
              {user.role}
            </p>
            <p className="text-white text-xs mt-1">ID: {user.idCode}</p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="absolute bottom-3 left-0 right-0 text-center">
          <p className="text-gray-300 text-xs">Astraronix Solutions</p>
          <p className="text-gray-400 text-xs mt-1">Internal Use Only</p>
          
          {/* QR Code placeholder */}
          <div className="absolute bottom-3 right-3 w-5 h-5 bg-white rounded flex items-center justify-center">
            <span className="text-xs font-bold" style={{ color: '#0B1C48' }}>QR</span>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="text-white text-center">
            <Eye className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs font-medium">Click to Preview</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-2 mt-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-1 text-xs font-medium"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </button>
        
        {onPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-1 text-xs font-medium"
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        )}
      </div>

      {/* CSS for glow animation */}
      <style jsx>{`
        @keyframes glow {
          from {
            opacity: 0.5;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
