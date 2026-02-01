import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils'; // For potential styling

// Helper to get appropriate color based on notification type
const getNotificationStyle = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-600/90 text-white';
    case 'error':
      return 'bg-red-600/90 text-white';
    case 'warning':
      return 'bg-yellow-500/90 text-black';
    case 'info':
      return 'bg-sky-600/90 text-white';
    case 'log':
      return 'bg-slate-600/90 text-white';
    default:
      return 'bg-gray-700/90 text-white';
  }
};

export const NotificationArea: React.FC = () => {
  const { currentDisplayNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentDisplayNotification) {
      setIsVisible(true);
      // The timeout to hide is managed in the context
      // Here we just react to its presence
    } else {
      // Add a short delay before setting to false to allow for fade-out animations if added later
      const timer = setTimeout(() => setIsVisible(false), 300); // Corresponds to a typical fade-out duration
      return () => clearTimeout(timer);
    }
  }, [currentDisplayNotification]);

  if (!isVisible || !currentDisplayNotification) {
    return null; // Don't render anything if no notification or not visible
  }

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-[100] w-auto max-w-sm px-4 py-2 rounded-md shadow-lg text-sm font-medium transition-all duration-300",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none",
        getNotificationStyle(currentDisplayNotification.type)
      )}
    >
      {currentDisplayNotification.message}
    </div>
  );
};