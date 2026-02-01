import { useState, useMemo, useCallback } from 'react';

export type MemoryView = 'all' | 'tag' | 'story' | 'search';

export function useMemoryUIState() {
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<any | null>(null);
  const [activeView, setActiveView] = useState<MemoryView>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const openDetailDialog = useCallback((memory: any) => {
    setSelectedMemory(memory);
    setIsDetailDialogOpen(true);
  }, []);

  const closeDetailDialog = useCallback(() => {
    setSelectedMemory(null);
    setIsDetailDialogOpen(false);
  }, []);

  const openCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const closeCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);
  
  return useMemo(() => ({
    isDetailDialogOpen,
    isCreateDialogOpen,
    selectedMemory,
    activeView,
    selectedTags,
    openDetailDialog,
    closeDetailDialog,
    openCreateDialog,
    closeCreateDialog,
    setActiveView,
    setSelectedTags,
    setSelectedMemory,
  }), [
    isDetailDialogOpen, isCreateDialogOpen, selectedMemory, activeView, selectedTags,
    openDetailDialog, closeDetailDialog, openCreateDialog, closeCreateDialog,
  ]);
}
