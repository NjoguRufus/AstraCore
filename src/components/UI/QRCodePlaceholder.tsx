import React from 'react';

interface QRCodePlaceholderProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodePlaceholder: React.FC<QRCodePlaceholderProps> = ({ 
  value, 
  size = 32, 
  className = "" 
}) => {
  // For now, we'll use a placeholder. In a real implementation, you'd use a QR code library
  return (
    <div 
      className={`bg-white rounded flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div 
            key={i}
            className={`w-1 h-1 rounded-sm ${
              i % 3 === 0 || i % 3 === 2 || i < 3 || i > 5 
                ? 'bg-gray-800' 
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
