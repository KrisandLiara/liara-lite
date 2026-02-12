import React from 'react';
import { NavLink } from 'react-router-dom';
import { Wand2, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:text-primary hover:bg-slate-700/50',
    isActive && 'bg-slate-700 text-sky-300'
  );

export const PersonalityPageSidebar: React.FC = () => {
  return (
    <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-300">
            Personality
        </h2>
        <nav className="grid items-start text-sm font-medium gap-1">
            <NavLink to="/app/personality" end className={navLinkClass}>
                <Wand2 className="h-4 w-4" />
                Core Identity
            </NavLink>
            <NavLink to="/app/personality/presets" className={navLinkClass}>
                <Library className="h-4 w-4" />
                Preset Library
            </NavLink>
        </nav>
    </div>
  );
}; 