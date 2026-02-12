import React from 'react';
import { cn } from "@/lib/utils";
import * as Icons from 'lucide-react';

export const Icon = ({ name, className }: { name: keyof typeof Icons, className?: string }) => {
    const LucideIcon = Icons[name] as React.ElementType;
    const defaultClassName = "inline-block h-5 w-5 shrink-0";
    if (!LucideIcon) {
        return <Icons.HelpCircle className={cn(defaultClassName, className)} />;
    }
    return <LucideIcon className={cn(defaultClassName, className)} />;
}; 