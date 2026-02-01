import { useState, useCallback, useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast"
import { Memory } from './useMemoryCore';
import { supabase } from '@/integrations/supabase/client';

export function useSearchMemories(setMemories: React.Dispatch<React.SetStateAction<Memory[]>>) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Search-specific state
  const [searchQuery, setSearchQuery] = useState("");
  const [similarityThreshold, setSimilarityThreshold] = useState(0.78);
  const [matchCount, setMatchCount] = useState(10);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [searchType, setSearchType] = useState<"keyword" | "semantic" | "qa">("semantic");
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [qaAnswerLoading, setQaAnswerLoading] = useState<boolean>(false);

  const handleSearch = useCallback(async (
    query?: string, 
    searchTypeOverride?: "keyword" | "semantic" | "qa", 
    similarityOverride?: number
  ) => {
    const finalQuery = query ?? searchQuery;
    if (!finalQuery.trim()) {
      toast({ title: 'Search query cannot be empty.', variant: 'destructive' });
      setMemories([]);
      return;
    }

    setIsLoading(true);
    const finalSearchType = searchTypeOverride || searchType;
    
    try {
        const { data, error } = await supabase.rpc('search_memories', {
            p_query: finalQuery,
            p_match_threshold: similarityOverride ?? similarityThreshold,
            p_match_count: matchCount,
            p_filter_tags: filterTags.length > 0 ? filterTags : null,
        });

      if (error) throw error;

      setMemories(data || []);
      toast({ title: 'Search complete', description: `Found ${data?.length || 0} memories.` });

    } catch (err: any) {
      toast({
        title: "Search failed",
        description: err.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [setMemories, filterTags, similarityThreshold, matchCount, searchType, searchQuery, toast]);

  return useMemo(() => ({
    isLoading,
    handleSearch,
    searchQuery,
    setSearchQuery,
    similarityThreshold,
    setSimilarityThreshold,
    matchCount,
    setMatchCount,
    filterTags,
    setFilterTags,
    searchType,
    setSearchType,
    qaAnswer,
    setQaAnswer,
    qaAnswerLoading,
    setQaAnswerLoading,
  }), [
    isLoading, handleSearch, searchQuery, similarityThreshold, matchCount, 
    filterTags, searchType, qaAnswer, qaAnswerLoading
  ]);
}
