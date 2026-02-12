import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, Settings2, ChevronLeft, ChevronRight, MessageSquareText } from 'lucide-react';
import { MultiSelectTagFilter } from './MultiSelectTagFilter';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchType: 'semantic' | 'direct' | 'qa';
  onSearchTypeChange: (type: 'semantic' | 'direct' | 'qa') => void;
  loading: boolean;
  qaAnswerLoading: boolean;
  resultsCount: number | null;
  totalMemoriesFound: number | null;
  similarityThreshold: number;
  onSimilarityThresholdChange: (value: number) => void;
  matchCount: number;
  onMatchCountChange: (value: number) => void;
  allTags: string[];
  selectedFilterTags: string[];
  onSelectedFilterTagsChange: (tags: string[]) => void;
  currentMemoryIndex: number | null;
  setCurrentMemoryIndex: (index: number | null) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  searchQuery,
  onSearchQueryChange,
  searchType,
  onSearchTypeChange,
  loading,
  qaAnswerLoading,
  resultsCount,
  totalMemoriesFound,
  similarityThreshold,
  onSimilarityThresholdChange,
  matchCount,
  onMatchCountChange,
  allTags,
  selectedFilterTags,
  onSelectedFilterTagsChange,
  currentMemoryIndex,
  setCurrentMemoryIndex,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const overallLoading = loading || qaAnswerLoading;

  const handleActualSearch = () => {
    if (overallLoading) return;
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleActualSearch();
    }
  };

  const cycleSearchType = () => {
    if (searchType === 'direct') onSearchTypeChange('semantic');
    else if (searchType === 'semantic') onSearchTypeChange('qa');
    else onSearchTypeChange('direct');
  };

  const getSearchTypeLabel = () => {
    if (searchType === 'semantic') return "Semantic Mode";
    if (searchType === 'direct') return "Keyword Mode";
    return "Q&A Mode";
  };

  const getPlaceholderText = () => {
    if (searchType === 'qa') return "Ask your memory a question...";
    if (searchType === 'semantic') return "Semantic search for memories...";
    return "Keyword search for memories...";
  };

  const canGoPrev = !overallLoading && searchType !== 'qa' && typeof resultsCount === 'number' && resultsCount > 0 && typeof currentMemoryIndex === 'number' && currentMemoryIndex > 0;
  const canGoNext = !overallLoading && searchType !== 'qa' && typeof resultsCount === 'number' && resultsCount > 0 && typeof currentMemoryIndex === 'number' && currentMemoryIndex < resultsCount - 1;

  const handlePrev = () => {
    if (canGoPrev && typeof currentMemoryIndex === 'number') {
      setCurrentMemoryIndex(currentMemoryIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext && typeof currentMemoryIndex === 'number') {
      setCurrentMemoryIndex(currentMemoryIndex + 1);
    } else if (!overallLoading && searchType !== 'qa' && typeof resultsCount === 'number' && resultsCount > 0 && currentMemoryIndex === null) {
      setCurrentMemoryIndex(0);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm rounded-lg shadow-md">
      <div className="flex items-center gap-2">
        <div className="relative flex-grow">
          {searchType === 'qa' ? 
            <MessageSquareText className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" /> : 
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          }
          <Input
            type="text"
            placeholder={getPlaceholderText()}
            className="pl-9 bg-slate-700/50 border-slate-600/70 text-slate-200 placeholder:text-slate-400 focus:ring-sky-500 focus:border-sky-500"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={overallLoading}
          />
        </div>
        <Button 
          onClick={handleActualSearch} 
          disabled={overallLoading}
          className="bg-sky-600 text-white hover:bg-sky-500 focus:ring-sky-500 focus:ring-offset-slate-800"
        >
          {overallLoading ? (searchType === 'qa' ? "Thinking..." : "Searching...") : (searchType === 'qa' ? "Ask" : "Search")}
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="search-mode"
              checked={searchType === "semantic" || searchType === "qa"}
              onCheckedChange={cycleSearchType}
              className="[&>span]:bg-slate-600 data-[state=checked]:[&>span]:bg-sky-500 focus:ring-sky-500 focus:ring-offset-slate-800"
            />
            <Label htmlFor="search-mode" className="text-slate-300 min-w-[100px]">
              {getSearchTypeLabel()}
            </Label>
          </div>
          {!overallLoading && searchType !== 'qa' && (typeof resultsCount === 'number' && resultsCount >=0) && (
            <div className="flex items-center space-x-2 ml-3">
              <span className="text-sm text-slate-400">
                {typeof totalMemoriesFound === 'number'
                  ? `Displaying ${resultsCount} of ${totalMemoriesFound}${currentMemoryIndex !== null ? ` (item ${currentMemoryIndex + 1})` : ''}`
                  : `Found: ${resultsCount} result${resultsCount === 1 ? "" : "s"}`}
              </span>
              {resultsCount > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrev}
                    disabled={!canGoPrev}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-sky-300 disabled:text-slate-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={!canGoNext && !(currentMemoryIndex === null && resultsCount > 0)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-sky-300 disabled:text-slate-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
          {searchType === 'qa' && qaAnswerLoading && (
             <span className="text-sm text-slate-400 ml-3">Finding an answer...</span>
          )}
        </div>
        
        {searchType !== 'qa' && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 bg-slate-700/50 border-slate-600/70 text-slate-300 hover:bg-slate-600/60 hover:text-sky-300 focus:ring-sky-500 focus:ring-offset-slate-800"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings2 className="h-4 w-4" /> Advanced
            </Button>
          </div>
        )}
      </div>

      {searchType !== 'qa' && showAdvanced && (
        <div className="p-4 border border-slate-700/60 rounded-md mt-2 space-y-6 bg-slate-700/40 backdrop-blur-sm">
          {searchType === 'semantic' && (
            <>
              <div>
                <Label htmlFor="similarity-threshold" className="block mb-2 text-sm font-medium text-slate-300">
                  Similarity Threshold: {similarityThreshold.toFixed(2)}
                </Label>
                <Slider
                  id="similarity-threshold"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[similarityThreshold]}
                  onValueChange={(value) => onSimilarityThresholdChange(value[0])}
                  disabled={overallLoading}
                  className="[&>span:first-child]:bg-sky-500 [&>span:first-child_span]:bg-slate-100"
                />
              </div>
              <div>
                <Label htmlFor="match-count" className="block mb-2 text-sm font-medium text-slate-300">
                  Number of Results
                </Label>
                <Input
                  id="match-count"
                  type="number"
                  value={matchCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) {
                      onMatchCountChange(val);
                    }
                  }}
                  min={1}
                  max={100}
                  disabled={overallLoading}
                  className="w-24 bg-slate-700/50 border-slate-600/70 text-slate-200 placeholder:text-slate-400 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="tag-filter" className="block mb-2 text-sm font-medium text-slate-300">
              Filter by Tags
            </Label>
            <MultiSelectTagFilter
              allTags={allTags}
              selectedTags={selectedFilterTags}
              onSelectedTagsChange={onSelectedFilterTagsChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 