import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Users, Database } from 'lucide-react';

interface QuickPresetsProps {
  onPresetSelect: (scope: string) => void;
  currentScope: string;
  disabled?: boolean;
}

export const QuickPresets: React.FC<QuickPresetsProps> = ({ 
  onPresetSelect, 
  currentScope, 
  disabled = false 
}) => {
  const presets = [
    {
      id: 'conversations-10',
      label: 'Quick Test',
      description: '10 conversations',
      icon: Zap,
      variant: 'outline' as const,
    },
    {
      id: 'conversations-50',
      label: 'Standard',
      description: '50 conversations',
      icon: Users,
      variant: 'outline' as const,
    },
    {
      id: 'conversations--1',
      label: 'Full Import',
      description: 'All selected',
      icon: Database,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-400">Quick Presets</div>
      <div className="grid grid-cols-3 gap-1">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isActive = currentScope === preset.id;
          
          return (
            <Button
              key={preset.id}
              variant={isActive ? "default" : preset.variant}
              size="sm"
              className={`h-auto p-1.5 flex flex-col items-center gap-0.5 ${
                isActive 
                  ? 'bg-sky-600 hover:bg-sky-700 text-white' 
                  : 'hover:bg-slate-700'
              }`}
              onClick={() => onPresetSelect(preset.id)}
              disabled={disabled}
            >
              <Icon className="w-3 h-3" />
              <div className="text-xs font-medium leading-none">{preset.label}</div>
              <div className="text-xs text-slate-400 leading-none">{preset.description}</div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}; 