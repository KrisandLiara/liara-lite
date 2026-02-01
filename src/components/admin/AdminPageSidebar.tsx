import React from 'react';
import { NavLink } from 'react-router-dom';
import { Key, Database, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:text-primary hover:bg-slate-700/50',
    isActive && 'bg-slate-700 text-sky-300'
  );

export const AdminPageSidebar: React.FC = () => {
  return (
    <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-300">
            Admin
        </h2>
        <nav className="grid items-start text-sm font-medium gap-1">
            <NavLink to="/app/admin/api-keys" end className={navLinkClass}>
                <Key className="h-4 w-4" />
                API Keys
            </NavLink>
            <NavLink to="/app/admin/database" className={navLinkClass}>
                <Database className="h-4 w-4" />
                Database Info
            </NavLink>
             <NavLink to="/app/admin/stats" className={navLinkClass}>
                <BarChart className="h-4 w-4" />
                Usage Stats
            </NavLink>
        </nav>
    </div>
  );
}; 