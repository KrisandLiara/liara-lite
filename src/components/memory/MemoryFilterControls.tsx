import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, SortAsc, SortDesc, Calendar, Star, BookOpen, BrainCircuit } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type SortOption = 'newest' | 'oldest' | 'importance';

interface MemoryFilterControlsProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  sortOption: SortOption;
  onSortOptionChange: (option: SortOption) => void;
  isStoryMode: boolean;
  onStoryModeChange: (isStoryMode: boolean) => void;
  isSemanticMode: boolean;
  onSemanticModeChange: (isSemanticMode: boolean) => void;
  onSearch: () => void;
}

export const MemoryFilterControls: React.FC<MemoryFilterControlsProps> = ({
  searchTerm,
  onSearchTermChange,
  sortOption,
  onSortOptionChange,
  isStoryMode,
  onStoryModeChange,
  isSemanticMode,
  onSemanticModeChange,
  onSearch,
}) => {
  return (
    <div className="flex flex-col gap-4 mb-4 p-4 bg-slate-800/60 border border-slate-700/50 rounded-lg">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:w-auto flex-grow">
          <Input
            type="text"
            placeholder="Filter memories by keyword..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="bg-slate-700/50 border-slate-600 focus:bg-slate-700 pr-24"
          />
          <Button onClick={onSearch} size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2">
             <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </div>
        <div className="w-full sm:w-auto">
          <Select value={sortOption} onValueChange={(value: SortOption) => onSortOptionChange(value)}>
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-700/50 border-slate-600">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="newest">
                <div className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> Newest First</div>
              </SelectItem>
              <SelectItem value="oldest">
                 <div className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> Oldest First</div>
              </SelectItem>
              <SelectItem value="importance">
                 <div className="flex items-center"><Star className="h-4 w-4 mr-2" /> By Importance</div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-4 pt-2 border-t border-slate-700/50">
        <div className="flex items-center space-x-2">
            <BrainCircuit className="h-4 w-4 text-slate-400" />
            <Label htmlFor="semantic-mode-toggle" className="text-slate-300">Semantic</Label>
            <Switch
              id="semantic-mode-toggle"
              checked={isSemanticMode}
              onCheckedChange={onSemanticModeChange}
            />
        </div>
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-slate-400" />
          <Label htmlFor="story-mode-toggle" className="text-slate-300">Story Mode</Label>
          <Switch
            id="story-mode-toggle"
            checked={isStoryMode}
            onCheckedChange={onStoryModeChange}
          />
        </div>
      </div>
    </div>
  );
}; 