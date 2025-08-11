
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          titleColor: 'text-red-800'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200',
          icon: 'text-amber-600',
          button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          titleColor: 'text-amber-800'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          titleColor: 'text-blue-800'
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
          onClick={onCancel}
        />
        
        {/* Modal */}
        <div className={`relative w-full max-w-md transform overflow-hidden rounded-xl ${styles.bg} border shadow-2xl transition-all`}>
          <div className="px-6 py-6">
            {/* Header */}
            <div className="flex items-center mb-4">
              <div className={`flex-shrink-0 ${styles.icon}`}>
                {type === 'danger' && (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
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
            
            {/* Message */}
            <div className="mt-3">
              <p className="text-gray-700 leading-relaxed">{message}</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`inline-flex justify-center rounded-lg border border-transparent px-5 py-2.5 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${styles.button}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
