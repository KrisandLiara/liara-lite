import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useMemoryCore, Memory, Tag } from '@/hooks/memory/useMemoryCore';
import { useSearchMemories } from '@/hooks/memory/useSearchMemories';
import { useMemoryUIState, MemoryView } from '@/hooks/memory/useMemoryUIState';

interface MemoryContextType {
  // from useMemoryCore
  memories: Memory[];
  tags: Tag[];
  isLoading: boolean;
  fetchInitialData: () => void;
  isGeneratingDetails: boolean;
  generatedDetails: { topic: string; tags: string[] } | null;
  generateDetails: (conversationId: string) => Promise<{ topic: string; tags: string[]; } | null>;
  setGeneratedDetails: React.Dispatch<React.SetStateAction<{ topic: string; tags: string[]; } | null>>;
  setMemories: React.Dispatch<React.SetStateAction<Memory[]>>;
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;

  // Chat state from useMemoryCore
  messages: Memory[];
  setMessages: React.Dispatch<React.SetStateAction<Memory[]>>;
  currentConversationTitle: string | null;
  setCurrentConversationTitle: React.Dispatch<React.SetStateAction<string | null>>;
  loadedConversationTitle: string | null;
  setLoadedConversationTitle: React.Dispatch<React.SetStateAction<string | null>>;
  loadedConversationMessages: Memory[];
  setLoadedConversationMessages: React.Dispatch<React.SetStateAction<Memory[]>>;
  activeConversationId: string | null;
  setActiveConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  loadConversation: (conversationId: string) => Promise<void>;
  clearLoadedConversation: () => void;

  // from useSearchMemories
  isSearchLoading: boolean;
  handleSearch: (query?: string, searchTypeOverride?: "keyword" | "semantic" | "qa", similarityOverride?: number) => Promise<void>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  similarityThreshold: number;
  setSimilarityThreshold: React.Dispatch<React.SetStateAction<number>>;
  matchCount: number;
  setMatchCount: React.Dispatch<React.SetStateAction<number>>;
  filterTags: string[];
  setFilterTags: React.Dispatch<React.SetStateAction<string[]>>;
  searchType: "keyword" | "semantic" | "qa";
  setSearchType: React.Dispatch<React.SetStateAction<"keyword" | "semantic" | "qa">>;

  // from useMemoryUIState
  isDetailDialogOpen: boolean;
  isCreateDialogOpen: boolean;
  selectedMemory: any | null;
  activeView: MemoryView;
  selectedTags: string[];
  openDetailDialog: (memory: any) => void;
  closeDetailDialog: () => void;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  setActiveView: React.Dispatch<React.SetStateAction<MemoryView>>;
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedMemory: React.Dispatch<React.SetStateAction<any | null>>;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export const MemoryProvider = ({ children }: { children: ReactNode }) => {
  const core = useMemoryCore();
  const search = useSearchMemories(core.setMemories);
  const ui = useMemoryUIState();

  const value = useMemo(() => ({
    ...core,
    isSearchLoading: search.isLoading,
    handleSearch: search.handleSearch,
    searchQuery: search.searchQuery,
    setSearchQuery: search.setSearchQuery,
    similarityThreshold: search.similarityThreshold,
    setSimilarityThreshold: search.setSimilarityThreshold,
    matchCount: search.matchCount,
    setMatchCount: search.setMatchCount,
    filterTags: search.filterTags,
    setFilterTags: search.setFilterTags,
    searchType: search.searchType,
    setSearchType: search.setSearchType,
    // QA fields are not fully implemented in this pass
    qaAnswer: null,
    setQaAnswer: () => {},
    qaAnswerLoading: false,
    setQaAnswerLoading: () => {},
    ...ui,
    setGeneratedDetails: core.setGeneratedDetails,
    messages: core.messages,
    setMessages: core.setMessages,
    currentConversationTitle: core.currentConversationTitle,
    setCurrentConversationTitle: core.setCurrentConversationTitle,
    loadedConversationTitle: core.loadedConversationTitle,
    setLoadedConversationTitle: core.setLoadedConversationTitle,
    loadedConversationMessages: core.loadedConversationMessages,
    setLoadedConversationMessages: core.setLoadedConversationMessages,
    activeConversationId: core.activeConversationId,
    setActiveConversationId: core.setActiveConversationId,
    loadConversation: core.loadConversation,
    clearLoadedConversation: core.clearLoadedConversation,
  }), [core, search, ui]);

  return <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>;
};

export function useMemory() {
  const context = useContext(MemoryContext);
  if (context === undefined) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
};
