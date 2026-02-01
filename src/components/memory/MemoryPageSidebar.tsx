import React from 'react';
import { NavLink } from 'react-router-dom';
import { BrainCircuit, Tags, Upload, Settings, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:text-primary hover:bg-slate-700/50',
    isActive && 'bg-slate-700 text-sky-300'
  );

export const MemoryPageSidebar: React.FC = () => {
  return (
    <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-300">
            Memory
        </h2>
        <nav className="grid items-start text-sm font-medium gap-1">
            <NavLink to="/app/memory/overview" className={navLinkClass}>
                <BarChart3 className="h-4 w-4" />
                Overview
            </NavLink>
            <NavLink to="/app/memory" end className={navLinkClass}>
                <BrainCircuit className="h-4 w-4" />
                All Memories
            </NavLink>
            <NavLink to="/app/memory/tag-cloud" className={navLinkClass}>
                <Tags className="h-4 w-4" />
                Tag Cloud
            </NavLink>
            <NavLink to="/app/import" className={navLinkClass}>
                <Upload className="h-4 w-4" />
                Import
            </NavLink>
            <NavLink to="/app/memory/admin" className={navLinkClass}>
                <Settings className="h-4 w-4" />
                Settings
            </NavLink>
        </nav>
    </div>
  );
}; 