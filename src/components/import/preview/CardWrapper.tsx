import React from 'react';
import { cn } from '@/lib/utils';

interface CardWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      "bg-slate-900/50 border border-slate-800/50 rounded-lg overflow-hidden",
      className
    )}>
      {children}
    </div>
  );
};

export const CardHeaderWrapper: React.FC<CardWrapperProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      "p-6 border-b border-slate-800/50",
      className
    )}>
      {children}
    </div>
  );
};

export const CardContentWrapper: React.FC<CardWrapperProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      "p-6",
      className
    )}>
      {children}
    </div>
  );
}; 