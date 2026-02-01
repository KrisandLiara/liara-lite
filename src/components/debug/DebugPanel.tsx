import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DebugMessage {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'warning';
  title: string;
  message: string;
}

interface DebugPanelProps {
  messages: DebugMessage[];
  onClear: () => void;
  className?: string;
}

const typeClasses = {
  info: 'text-sky-400',
  error: 'text-red-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
};

export const DebugPanel: React.FC<DebugPanelProps> = ({ messages, onClear, className }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableView) {
        scrollableView.scrollTop = scrollableView.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className={`flex flex-col h-full bg-slate-900 text-slate-300 ${className}`}>
      <ScrollArea className="flex-grow" ref={scrollAreaRef}>
        <div className="p-3 space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className="font-mono text-xs leading-relaxed">
              <span className="text-slate-500 mr-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              <span className={`${typeClasses[msg.type]} font-bold`}>{msg.title}:</span>
              <span className="text-slate-300 ml-1">{msg.message}</span>
            </div>
          ))}
          {messages.length === 0 && <p className="text-slate-500 text-center py-4">No debug messages.</p>}
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-slate-700/50 flex justify-end">
         <Button variant="ghost" size="sm" onClick={onClear} className="text-slate-400 hover:text-red-400 hover:bg-red-900/50">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
      </div>
    </div>
  );
}; 