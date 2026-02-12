import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'log' | 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean; // Will keep for now, might be useful for a separate history later
  details?: string;
}

interface NotificationContextType {
  notifications: Notification[]; // Full history of notifications
  currentDisplayNotification: Notification | null; // The one to show temporarily
  addNotification: (message: string, type: NotificationType, details?: string) => void;
  // clearDisplayNotification: () => void; // May not be needed if auto-cleared
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentDisplayNotification, setCurrentDisplayNotification] = useState<Notification | null>(null);
  const [displayTimeoutId, setDisplayTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const addNotification = useCallback((message: string, type: NotificationType, details?: string) => {
    const newNotification: Notification = {
      id: uuidv4(),
      message,
      type,
      details,
      timestamp: new Date(),
      read: false, // Initially unread
    };
    // Add to history
    setNotifications(prevNotifications => [newNotification, ...prevNotifications.slice(0, 99)]);
    
    // Set for temporary display
    setCurrentDisplayNotification(newNotification);

    // Clear any existing timeout for the previous notification
    if (displayTimeoutId) {
      clearTimeout(displayTimeoutId);
    }

    // Set a new timeout to clear the current notification after 5 seconds
    const newTimeoutId = setTimeout(() => {
      setCurrentDisplayNotification(null);
      setDisplayTimeoutId(null);
      // Mark as read in the main list after it's hidden
      setNotifications(prev => prev.map(n => n.id === newNotification.id ? { ...n, read: true } : n));
    }, 5000);
    setDisplayTimeoutId(newTimeoutId);

  }, [displayTimeoutId]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (displayTimeoutId) {
        clearTimeout(displayTimeoutId);
      }
    };
  }, [displayTimeoutId]);

  return (
    <NotificationContext.Provider 
      value={{
        notifications,
        currentDisplayNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 