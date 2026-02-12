import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMemoryContext } from '@/contexts/MemoryContext';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TagCloudEntry {
  tag: string;
  count: number;
}

const MAX_FONT_SIZE = 28; // text-2xl approx
const MIN_FONT_SIZE = 12; // text-xs approx
const TAG_DISPLAY_LIMIT = 100; // Show the top 100 most frequent tags

export const TopicCloudPanel: React.FC = () => {
  const [tags, setTags] = useState<TagCloudEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { isTestMode } = useSettings();
  const { setSearchQuery, setSearchType, handleSearch, addDebugMessage, useLongTermMemory } = useMemoryContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showTopArrow, setShowTopArrow] = useState(false);
  const [showBottomArrow, setShowBottomArrow] = useState(false);

  useEffect(() => {
    if (!useLongTermMemory) {
      setIsLoading(false);
      return;
    }
    const fetchTags = async () => {
      if (!user) {
        setIsLoading(false);
        setError("User not authenticated.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const { data: memories, error: queryError } = await supabase
            .from('memories')
            .select('tags')
            .eq('user_id', user.id)
            .eq('is_test', isTestMode);

        if (queryError) throw queryError;
        
        const tagCounts: { [key: string]: number } = {};
        memories.forEach(item => {
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    if (typeof tag === 'string') {
                      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    }
                });
            }
        });
        
        const aggregatedTags: TagCloudEntry[] = Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, TAG_DISPLAY_LIMIT); // Take only the top N tags

        setTags(aggregatedTags);
        addDebugMessage('info', 'Tag Cloud', `Fetched and processed ${aggregatedTags.length} tags.`);
      } catch (err) {
        console.error("Error fetching tag cloud data:", err);
        setError(err instanceof Error ? err.message : 'Failed to load tags');
        addDebugMessage('error', 'Tag Cloud Error', err instanceof Error ? err.message : 'Failed to load tags');
      }
      setIsLoading(false);
    };
    fetchTags();
  }, [addDebugMessage, user, useLongTermMemory]);

  useEffect(() => {
    const container = scrollContainerRef.current;

    const checkScroll = () => {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Use a small buffer to prevent floating point inaccuracies
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 1;

      setShowTopArrow(scrollTop > 0);
      setShowBottomArrow(!isAtBottom && scrollHeight > clientHeight);
    };

    if (container) {
      // Initial check
      checkScroll();
      // Listen for scroll events
      container.addEventListener('scroll', checkScroll);
      // Check again if the content/size changes
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener('scroll', checkScroll);
        resizeObserver.disconnect();
      };
    }
  }, [tags, isLoading]); // Re-run when tags load

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setSearchType('direct'); // Or 'semantic' if preferred for tag clicks
    handleSearch(tag);
    addDebugMessage('info', 'Tag Clicked', `Searching for tag: ${tag}`);
  };

  const calculateFontSize = (count: number, maxCount: number, minCount: number) => {
    if (maxCount === minCount) return MIN_FONT_SIZE; // Avoid division by zero if all counts are same
    const sizeRange = MAX_FONT_SIZE - MIN_FONT_SIZE;
    const countRange = maxCount - minCount;
    const relativeCount = count - minCount;
    const fontSize = MIN_FONT_SIZE + (relativeCount / countRange) * sizeRange;
    return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, fontSize)); // Clamp to min/max
  };

  return (
    <Card className="flex flex-col h-[250px] bg-slate-800/75 border-slate-700/50 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-sky-400">Tag Cloud</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden relative">
        {showTopArrow && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-full h-6 flex justify-center items-start pt-1 pointer-events-none">
                <ChevronUp className="w-5 h-5 text-slate-400 animate-pulse" />
            </div>
        )}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center text-red-400">
            <div>
              <p>Error:</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        ) : tags.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-slate-400">No tags found yet.</p>
          </div>
        ) : (
          <div ref={scrollContainerRef} className="h-full overflow-y-auto scrollbar-hide">
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center px-10 pt-8 pb-10">
              {tags.map((item) => (
                <span
                  key={item.tag}
                  className="cursor-pointer text-slate-300 hover:text-sky-300 transition-colors duration-150 ease-in-out"
                  style={{ fontSize: `${calculateFontSize(item.count, Math.max(...tags.map(t => t.count)), Math.min(...tags.map(t => t.count)))}px` }}
                  onClick={() => handleTagClick(item.tag)}
                  title={`${item.count} memories`}
                >
                  {item.tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {showBottomArrow && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-full h-8 flex justify-center items-end pb-1 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-slate-400 animate-pulse" />
            </div>
        )}
      </CardContent>
    </Card>
  );
}; 