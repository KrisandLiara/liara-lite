import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import './RockerSwitch.css';

export const RockerSwitch: React.FC = () => {
  const { isTestMode, setIsTestMode } = useSettings();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs font-medium text-slate-400">PROD</span>
      <button
        onClick={() => setIsTestMode(!isTestMode)}
        className={cn('rocker-switch', { 'is-test-mode': isTestMode })}
        aria-label={`Switch to ${isTestMode ? 'Production' : 'Test'} mode`}
      >
        <span className="rocker-switch-handle" />
      </button>
      <span className="text-xs font-medium text-amber-400">TEST</span>
    </div>
  );
}; 