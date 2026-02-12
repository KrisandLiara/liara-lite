import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { X, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectTagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
  className?: string;
}

export const MultiSelectTagFilter: React.FC<MultiSelectTagFilterProps> = ({
  allTags,
  selectedTags,
  onSelectedTagsChange,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const handleToggleTag = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onSelectedTagsChange(newSelectedTags);
  };

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedTags.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="flex items-center gap-1 bg-slate-600/70 border-slate-500/80 text-sky-200 hover:bg-slate-500/70"
            >
              {tag}
              <button
                onClick={() => handleToggleTag(tag)}
                className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-slate-700"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleToggleTag(tag);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <X className="h-3 w-3 text-slate-400 hover:text-slate-200" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-slate-700/50 border-slate-600/70 text-slate-300 hover:bg-slate-600/60 hover:text-sky-300 focus:ring-sky-500 focus:ring-offset-slate-800"
          >
            {selectedTags.length > 0 ? `${selectedTags.length} tag(s) selected` : "Select tags..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0 bg-slate-800/95 border-slate-700/70 backdrop-blur-md text-slate-200"
          align="start"
        >
          <Command className="bg-transparent">
            <CommandInput 
              placeholder="Search tags..." 
              className="bg-slate-700/50 border-slate-600/70 text-slate-200 placeholder:text-slate-400 focus:ring-sky-500 focus:border-sky-500"
            />
            <CommandList className="[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-slate-800">
              <CommandEmpty className="py-6 text-center text-sm text-slate-400">No tags found.</CommandEmpty>
              <CommandGroup>
                {allTags.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => {
                      handleToggleTag(tag);
                    }}
                    className="hover:bg-slate-700/60 !text-slate-200 data-[selected=true]:bg-sky-600/30 data-[selected=true]:text-sky-100 aria-selected:bg-sky-600/30 aria-selected:text-sky-100"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTags.includes(tag) ? "opacity-100 text-sky-300" : "opacity-0"
                      )}
                    />
                    {tag}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}; 