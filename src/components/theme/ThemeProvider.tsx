import React from 'react';
import { LiaraTheme, generateCSSVariables } from '@/lib/theme/liara-theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const LiaraThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  React.useEffect(() => {
    // Inject CSS variables into the document
    const style = document.createElement('style');
    style.textContent = generateCSSVariables();
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="liara-app bg-slate-900 text-slate-100 min-h-screen">
      {children}
    </div>
  );
};

// Hook for accessing theme values in components
export const useLiaraTheme = () => {
  return LiaraTheme;
}; 