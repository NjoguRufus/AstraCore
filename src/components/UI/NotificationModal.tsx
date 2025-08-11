import React, { useEffect } from 'react';

interface NotificationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200',
          icon: 'text-emerald-600',
          titleColor: 'text-emerald-800',
          messageColor: 'text-emerald-700',
          progressColor: 'bg-emerald-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          progressColor: 'bg-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200',
          icon: 'text-amber-600',
          titleColor: 'text-amber-800',
          messageColor: 'text-amber-700',
          progressColor: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700',
          progressColor: 'bg-blue-500'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative w-full max-w-md transform overflow-hidden rounded-xl ${styles.bg} border shadow-2xl transition-all`}>
          {/* Progress Bar */}
          <div className="h-1 bg-gray-200">
            <div 
              className={`h-full ${styles.progressColor} transition-all duration-${duration} ease-linear`}
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="px-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${styles.icon}`}>
                  {type === 'success' && (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {type === 'error' && (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {type === 'warning' && (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                  {type === 'info' && (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h3 className={`ml-3 text-xl font-semibold ${styles.titleColor}`}>{title}</h3>
              </div>
              
              {/* Close button */}
              <button
                type="button"
                className={`rounded-lg p-1.5 ${styles.icon} hover:bg-opacity-20 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                onClick={onClose}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Message */}
            <div className="mt-3">
              <p className={`text-sm leading-relaxed ${styles.messageColor}`}>{message}</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              type="button"
              className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              onClick={onClose}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
