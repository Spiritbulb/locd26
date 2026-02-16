// src/context/NotificationContext.tsx
'use client';

import { createContext, useState, useContext, useEffect } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'default';

interface NotificationState {
  message: string;
  type: NotificationType;
  isVisible: boolean;
}

interface NotificationContextType {
  notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const notify = (message: string, type: NotificationType = 'success') => {
    setNotification({ message, type, isVisible: true });
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notification.isVisible && (
        <Notification 
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === null) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Notification component
const Notification = ({ 
  message, 
  type = 'success', 
  duration = 3000,
  onClose 
}: {
  message: string;
  type: NotificationType;
  duration?: number;
  onClose: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      const fadeOutTimer = setTimeout(onClose, 300); // Allow fade-out animation

      // Store fadeOutTimer in a ref or variable to clear on cleanup
      (Notification as any)._fadeOutTimer = fadeOutTimer;
    }, duration);

    return () => {
      clearTimeout(timer);
      if ((Notification as any)._fadeOutTimer) {
        clearTimeout((Notification as any)._fadeOutTimer);
      }
    };
  }, [duration, onClose]);

  const baseClasses = `
    fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 
    transform transition-all duration-300 font-medium
    ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
  `;

  const typeStyles = {
    success: 'bg-[#8a6e5d] text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-amber-500 text-black',
    info: 'bg-blue-500 text-white',
    default: 'bg-[#7e4507] text-white'
  };

  return (
    <div className={`${baseClasses} ${typeStyles[type] || typeStyles.default}`}>
      <div className="flex items-center gap-2">
        {/* Icon based on type */}
        {type === 'success' && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
        {type === 'error' && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        {type === 'warning' && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        {type === 'info' && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )}
        <span>{message}</span>
        
        {/* Close button */}
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 hover:opacity-80 transition-opacity"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};