import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface NotificationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ModalContextType {
  showConfirmation: (config: Omit<ConfirmationModalState, 'isOpen'>) => Promise<boolean>;
  showNotification: (config: Omit<NotificationModalState, 'isOpen'>) => void;
  confirmationModal: ConfirmationModalState;
  notificationModal: NotificationModalState;
  closeConfirmation: () => void;
  closeNotification: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info'
  });

  const [notificationModal, setNotificationModal] = useState<NotificationModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    duration: 5000
  });

  const showConfirmation = (config: Omit<ConfirmationModalState, 'isOpen'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmationModal({
        ...config,
        isOpen: true,
        onConfirm: () => {
          setConfirmationModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmationModal(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const showNotification = (config: Omit<NotificationModalState, 'isOpen'>) => {
    setNotificationModal({
      ...config,
      isOpen: true
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  };

  const closeNotification = () => {
    setNotificationModal(prev => ({ ...prev, isOpen: false }));
  };

  const value: ModalContextType = {
    showConfirmation,
    showNotification,
    confirmationModal,
    notificationModal,
    closeConfirmation,
    closeNotification
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};