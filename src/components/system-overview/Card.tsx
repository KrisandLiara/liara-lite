import React from 'react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

export const CardGrid = ({ children }: { children: React.ReactNode }) => {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">{children}</div>;
};

interface CardProps {
  title: string;
  icon: keyof typeof Icons;
  children: React.ReactNode;
}

export const Card = ({ title, icon, children }: CardProps) => {
  const LucideIcon = Icons[icon] as React.ElementType;
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
      <div className="flex items-center gap-3 mb-2">
        {LucideIcon && <LucideIcon className="h-6 w-6 text-sky-400" />}
        <h3 className="font-semibold text-lg text-white">{title}</h3>
      </div>
      <div className="text-slate-400 text-sm">{children}</div>
    </div>
  );
}; 