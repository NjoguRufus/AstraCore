import React, { useRef } from 'react';
import { User } from '../../types';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface UnifiedIDCardProps {
  user: User;
  compact?: boolean;
  showDownloadButton?: boolean;
  className?: string;
}

export const UnifiedIDCard: React.FC<UnifiedIDCardProps> = ({
  user,
  compact = false,
  showDownloadButton = true,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!user) {
    return <p className="text-center text-gray-500 mt-10">Loading your ID card...</p>;
  }

  const { name: displayName, role, idCode: id, photoURL } = user;
  const initials = displayName.split(' ').map(n => n[0]).join('');

  // Unified PDF download function
  const downloadAsPDF = async () => {
    if (!cardRef.current) return;
    
    try {
      const element = cardRef.current;
      const canvas = await html2canvas(element, { 
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: compact ? 320 : 640,
        height: compact ? 192 : 384,
        logging: false,
        imageTimeout: 15000,
        removeContainer: true
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ 
        orientation: "landscape", 
        unit: "mm", 
        format: [85, 54] // Credit card size
      });
      
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit the card properly
      const imgWidth = width;
      const imgHeight = (canvas.height * width) / canvas.width;
      
      // Center the image
      const yOffset = (height - imgHeight) / 2;
      
      pdf.addImage(imgData, "PNG", 0, yOffset, imgWidth, imgHeight);
      pdf.save(`${displayName.replace(' ', '_')}_Astraronix_ID_Card.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (compact) {
    // Compact version for profile pages
    return (
      <div className={`relative ${className}`}>
        <div 
          ref={cardRef}
          className="relative w-80 h-48 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0B1C48 0%, #0B1C48 50%, rgba(0, 191, 255, 0.1) 100%)',
            border: '1px solid rgba(0, 191, 255, 0.3)'
          }}
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
                {photoURL ? (
                  <img 
                    src={photoURL} 
                    alt={displayName}
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
              <h2 className="text-white text-xs font-bold uppercase">{displayName}</h2>
              <p className="text-white text-xs mt-1">ID: {id}</p>
              <p 
                className="text-xs font-bold uppercase mt-1"
                style={{ color: '#00BFFF' }}
              >
                {role}
              </p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <p className="text-gray-300 text-xs mt-4">Astraronix Solutions - Internal Use Only</p>
          </div>
        </div>

        {/* Download Button */}
        {showDownloadButton && (
          <button
            onClick={downloadAsPDF}
            className="w-full mt-3 bg-[#0B1C48] hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium shadow-md transition text-sm flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download ID Card</span>
          </button>
        )}

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
  }

  // Full version for dedicated ID card pages
  return (
    <div className={`min-h-screen bg-gray-100 flex flex-col items-center justify-center p-10 space-y-6 ${className}`}>
      {/* ID CARD */}
      <div ref={cardRef} className="relative flex flex-col md:flex-row items-center gap-10 bg-white shadow-2xl rounded-3xl p-10">
        {/* FRONT SIDE */}
        <div className="relative w-80 h-[460px] bg-[#0B1C48] rounded-3xl text-white flex flex-col items-center justify-between p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/30 to-transparent rounded-3xl blur-3xl"></div>

          {/* Logo */}
          <div className="z-10 text-center">
            <h1 className="text-2xl font-bold tracking-wide">ASTRARONIX</h1>
            <p className="text-xs uppercase text-sky-400 mt-1">Innovate. Build. Elevate.</p>
          </div>

          {/* Profile */}
          <div className="z-10 relative">
            <div className="absolute inset-0 rounded-full bg-sky-400 blur-md opacity-40"></div>
            <img
              src={photoURL || "https://i.pravatar.cc/200"}
              alt="profile"
              className="relative w-28 h-28 object-cover rounded-full border-4 border-sky-400 shadow-lg"
            />
          </div>

          {/* Info */}
          <div className="z-10 text-center space-y-1">
            <h2 className="text-lg font-semibold">{displayName}</h2>
            <p className="text-xs text-gray-300">ID: {id}</p>
            <p className="text-sky-400 text-sm font-medium uppercase">{role}</p>
          </div>

          {/* Company Info */}
          <div className="z-10 text-center space-y-3 mt-6">
            <p className="text-xs text-gray-300">Astraronix Solutions - Internal Use Only</p>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="relative w-80 h-[460px] bg-[#0B1C48] rounded-3xl text-white flex flex-col justify-between p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/30 to-transparent rounded-3xl blur-3xl"></div>

          {/* Company Contact */}
          <div className="z-10 text-center">
            <h3 className="text-lg font-bold mb-4">COMPANY CONTACT</h3>
            <div className="space-y-2 text-sm">
              <p>Email: astraronixsolutions@gmail.com</p>
              <p>Website: https://astraronix.vercel.app</p>
            </div>
          </div>

          {/* Verification */}
          <div className="z-10 text-center">
            <h3 className="text-lg font-bold text-sky-400 mb-4">VERIFICATION</h3>
            <div className="space-y-2 text-sm">
              <p>If found, please return to</p>
              <p>Astraronix Solutions HQ</p>
              <p>or contact support.</p>
            </div>
          </div>

          {/* Signature and Barcode */}
          <div className="z-10 flex justify-between items-end">
            <div>
              <p className="text-sm mb-2">Authorized Signature:</p>
              <div className="w-20 h-1 bg-gray-300"></div>
            </div>
            <div className="w-16 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-xs font-bold text-[#0B1C48]">BARCODE</span>
            </div>
          </div>

          {/* Footer */}
          <div className="z-10 text-center text-xs text-gray-300">
            <p>Astraronix Solutions • Nairobi, Kenya</p>
          </div>
        </div>
      </div>

      {/* Download Button */}
      {showDownloadButton && (
        <button
          onClick={downloadAsPDF}
          className="bg-[#0B1C48] hover:bg-sky-600 text-white px-8 py-3 rounded-lg font-medium shadow-lg transition flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Download ID Card</span>
        </button>
      )}
    </div>
  );
};
