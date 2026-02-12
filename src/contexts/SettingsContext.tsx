import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';

interface SettingsContextType {
  isTestMode: boolean;
  setIsTestMode: (isTest: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [isTestMode, setIsTestModeState] = useState<boolean>(() => {
    // Get the initial state from localStorage, or default to true
    const storedValue = localStorage.getItem('isTestMode');
    return storedValue !== null ? JSON.parse(storedValue) : true;
  });

  useEffect(() => {
    // Update localStorage whenever the state changes
    localStorage.setItem('isTestMode', JSON.stringify(isTestMode));
  }, [isTestMode]);

  const setIsTestMode = (isTest: boolean) => {
    setIsTestModeState(isTest);
  };

  const value = useMemo(() => ({
    isTestMode,
    setIsTestMode,
  }), [isTestMode]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 