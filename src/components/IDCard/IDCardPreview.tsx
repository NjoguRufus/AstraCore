import React from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Download, Eye } from 'lucide-react';
import { User } from '../../types';

interface IDCardPreviewProps {
  user: User;
  profilePhotoUrl?: string;
  onGeneratePDF: () => void;
}

export const IDCardPreview: React.FC<IDCardPreviewProps> = ({
  user,
  profilePhotoUrl,
  onGeneratePDF
}) => {
  const initials = user.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="space-y-6">
      {/* Front of ID Card */}
      <div className="relative">
        <div className="w-full max-w-sm mx-auto">
          <div 
            className="relative w-full h-64 rounded-lg overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #0B1C48 0%, #0B1C48 50%, rgba(0, 191, 255, 0.1) 100%)',
              border: '1px solid rgba(0, 191, 255, 0.3)'
            }}
          >
            {/* Glowing border effect */}
            <div 
              className="absolute inset-0 rounded-lg"
              style={{
                background: 'linear-gradient(45deg, transparent, rgba(0, 191, 255, 0.2), transparent)',
                animation: 'glow 2s ease-in-out infinite alternate'
              }}
            />
            
            {/* Top Section */}
            <div className="relative z-10 pt-4 text-center">
              <h1 className="text-white text-lg font-bold">ASTRARONIX</h1>
              <p className="text-white text-xs opacity-80">Innovate. Build. Elevate.</p>
            </div>

            {/* Middle Section - Profile Photo */}
            <div className="relative z-10 flex flex-col items-center mt-6">
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
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                  {profilePhotoUrl ? (
                    <img 
                      src={profilePhotoUrl} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: '#0B1C48' }}
                    >
                      {initials}
                    </div>
                  )}
                </div>
              </div>

              {/* Name and Role */}
              <div className="mt-4 text-center">
                <h2 className="text-white text-sm font-bold uppercase">{user.name}</h2>
                <p 
                  className="text-sm font-bold uppercase mt-1"
                  style={{ color: '#00BFFF' }}
                >
                  {user.role}
                </p>
                <p className="text-white text-xs mt-1">ID: {user.idCode}</p>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-gray-300 text-xs">Astraronix Solutions</p>
              <p className="text-gray-400 text-xs mt-1">Internal Use Only</p>
              
              {/* QR Code placeholder */}
              <div className="absolute bottom-4 right-4 w-6 h-6 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold" style={{ color: '#0B1C48' }}>QR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back of ID Card */}
      <div className="relative">
        <div className="w-full max-w-sm mx-auto">
          <div 
            className="relative w-full h-64 rounded-lg overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #0B1C48 0%, #0B1C48 50%, rgba(0, 191, 255, 0.1) 100%)',
              border: '1px solid rgba(0, 191, 255, 0.3)'
            }}
          >
            {/* Top Section - Company Contact */}
            <div className="relative z-10 pt-4 text-center">
              <h3 className="text-white text-sm font-bold">COMPANY CONTACT</h3>
              <p className="text-white text-xs mt-2">Email: astraronixsolutions@gmail.com</p>
              <p className="text-white text-xs">Website: https://astraronix.vercel.app</p>
            </div>

            {/* Middle Section - Verification */}
            <div className="relative z-10 mt-6 text-center">
              <h3 
                className="text-sm font-bold uppercase"
                style={{ color: '#00BFFF' }}
              >
                VERIFICATION
              </h3>
              <div className="mt-3 text-white text-xs space-y-1">
                <p>If found, please return to</p>
                <p>Astraronix Solutions HQ</p>
                <p>or contact support.</p>
              </div>
            </div>

            {/* Bottom Section - Signature and Barcode */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-between items-end px-4">
              <div>
                <p className="text-gray-300 text-xs">Authorized Signature:</p>
                <div className="w-16 h-1 bg-gray-300 mt-1"></div>
              </div>
              
              <div className="w-12 h-6 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold" style={{ color: '#0B1C48' }}>BARCODE</span>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-1 left-0 right-0 text-center">
              <p className="text-gray-400 text-xs">Astraronix Solutions • Nairobi, Kenya</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={onGeneratePDF}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Generate PDF</span>
        </Button>
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
