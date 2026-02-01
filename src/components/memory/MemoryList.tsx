import React from 'react';
import { SmallMemoryCard } from '@/components/memory/SmallMemoryCard';
import { MemoryEntry } from '@/lib/memory/types';
import { useMemory } from '@/contexts/MemoryContext';

interface MemoryListProps {
  memories: MemoryEntry[];
  isLoading: boolean;
  onMemoryClick: (memory: MemoryEntry) => void;
  onTagClick: (string) => void;
  searchType: string;
  searchQuery?: string;
}

export const MemoryList: React.FC<MemoryListProps> = ({
  memories,
  isLoading,
  onMemoryClick,
  onTagClick,
  searchType,
  searchQuery,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (memories.length === 0) {
    const message = searchType === 'semantic' 
      ? "I couldn't find a memory exactly matching that. Want me to try a broader search?" 
      : "No memories found. Try a different search or create a new memory.";
    return (
      <div className="text-center text-slate-400 py-12 text-lg bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm rounded-lg shadow-md p-6">
        {message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {memories.map((memory) => (
        <SmallMemoryCard
          key={memory.id}
          memory={memory}
          onClick={() => onMemoryClick(memory)}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
};
