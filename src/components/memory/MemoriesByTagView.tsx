import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MemoryList } from './MemoryList';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MemoryEntry } from '@/lib/memory/types';
import { useMemory } from '@/contexts/MemoryContext';

interface MemoriesByTagViewProps {
  onMemoryClick: (memory: MemoryEntry) => void;
}

export const MemoriesByTagView: React.FC<MemoriesByTagViewProps> = ({ onMemoryClick }) => {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  
  const {
    filteredMemories,
    isLoading,
    handleSearch,
    searchType,
    setSearchType,
    similarityThreshold,
    setSimilarityThreshold,
  } = useMemory();

  useEffect(() => {
    if (tagName) {
      handleSearch(tagName, 'tag');
    }
  }, [tagName, handleSearch]);

  const handleSemanticSearch = () => {
    if (tagName) {
      handleSearch(tagName, 'semantic');
    }
  };

  const handleKeywordSearch = () => {
    if (tagName) {
      handleSearch(tagName, 'keyword');
    }
  };

  if (isLoading && filteredMemories.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-100">
          Memories tagged with: <span className="text-sky-400">{tagName}</span>
        </h2>
        <Button onClick={() => navigate('/app/memory/tags')}>Back to Tag Cloud</Button>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={() => handleSearch(tagName, 'tag')} variant={searchType === 'tag' ? 'default' : 'outline'}>Tag</Button>
        <Button onClick={handleKeywordSearch} variant={searchType === 'keyword' ? 'default' : 'outline'}>Keyword</Button>
        <Button onClick={handleSemanticSearch} variant={searchType === 'semantic' ? 'default' : 'outline'}>Semantic</Button>
      </div>
      
      {searchType === 'semantic' && (
        <div className="flex items-center gap-4 pt-2">
          <span className="text-sm font-medium text-slate-300">Similarity: {similarityThreshold.toFixed(2)}</span>
          <Slider
            min={0.7}
            max={1}
            step={0.01}
            value={[similarityThreshold]}
            onValueChange={(value) => setSimilarityThreshold(value[0])}
            onValueCommit={() => handleSearch(tagName, 'semantic')}
            className="w-64"
          />
        </div>
      )}
      
      <MemoryList
        memories={filteredMemories}
        isLoading={isLoading}
        onMemoryClick={onMemoryClick}
        onTagClick={(tag) => navigate(`/app/memory/tags/${tag}`)}
        searchQuery={tagName}
        searchType={searchType}
      />
    </div>
  );
}; 