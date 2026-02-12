import { supabase } from '@/integrations/supabase/client';
import { 
  MemoryEntry, 
  CreateMemoryEntry, 
  UpdateMemoryEntry,
  MemoryContext,
  MemoryWithRelationships,
  MemorySearchOptions,
  MemoryRelationshipOptions
} from './types';
import { getEmbedding } from './embeddings';
import { storeMemory, queryVectorMemory, updateMemoryEmbedding, getRelatedMemories } from './vectorStore';
import { mergeSimilarMemories } from './memoryRouter';
import { normalizeMemoryEntries, normalizeMemoryEntry } from './compatibility';
import { v4 as uuidv4 } from 'uuid';

export class MemoryService {
  private userId: string | null;

  constructor(userId: string | null = null) {
    this.userId = userId;
  }

  async createMemory(memory: CreateMemoryEntry): Promise<MemoryEntry> {
    const finalUserId = memory.user_id !== undefined ? memory.user_id : this.userId;

    // CreateMemoryEntry does NOT have guest_session_id, created_at, or updated_at.
    // It has: topic, summary, importance, tags, content, role, conversation_title, user_id (optional),
    // and other optional fields like timestamp, related_to, source, model_version.

    // We construct an object matching StoreMemoryInput for storeMemory().
    const objectForStoreMemory: Parameters<typeof storeMemory>[0] = {
      ...memory, // Spread all fields from the input CreateMemoryEntry object
      user_id: finalUserId, // Explicitly set user_id
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // guest_session_id is not part of CreateMemoryEntry or StoreMemoryInput for this flow,
    // so no check for (objectForStoreMemory.user_id && objectForStoreMemory.guest_session_id) is needed.

    const newMemory = await storeMemory(objectForStoreMemory);

    // Check for similar memories and merge if needed
    const similarMemories = await this.findSimilarMemories(newMemory);
    if (similarMemories.length > 0) {
      const mergedMemories = await mergeSimilarMemories(
        newMemory,
        similarMemories,
        0.8
      );
      if (mergedMemories.length < similarMemories.length + 1) {
        // If memories were merged, update the database
        await this.updateMemories(mergedMemories);
        return normalizeMemoryEntry(mergedMemories[0]); // Return the merged memory
      }
    }

    return normalizeMemoryEntry(newMemory);
  }

  async updateMemory(id: string, update: UpdateMemoryEntry): Promise<MemoryEntry> {
    const { data, error } = await supabase
      .from('memories')
      .update({
        ...update,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return normalizeMemoryEntry(data);
  }

  async deleteMemory(id: string): Promise<void> {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getMemory(id: string): Promise<MemoryEntry | null> {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return normalizeMemoryEntry(data);
  }

  async findSimilarMemories(
    memory: MemoryEntry,
    options: MemorySearchOptions = {}
  ): Promise<MemoryEntry[]> {
    if (!memory.embedding) {
      throw new Error('Memory does not have an embedding');
    }
    
    const embedding = JSON.parse(memory.embedding);
    const memories = await queryVectorMemory(embedding, this.userId, {
      ...options,
      filterTags: memory.tags
    });

    return normalizeMemoryEntries(memories);
  }

  async searchMemories(
    query: string,
    options: MemorySearchOptions = {}
  ): Promise<MemoryContext> {
    const {
      maxMemories = 10,
      maxTokens = 2000,
      includeSummary = false
    } = options;

    // Get query embedding
    const queryEmbedding = await getEmbedding(query);

    // Search for relevant memories
    const memories = await queryVectorMemory(queryEmbedding, this.userId, {
      limit: maxMemories
    });

    // Normalize memories for backward compatibility
    const normalizedMemories = normalizeMemoryEntries(memories);

    // Calculate total tokens
    const totalTokens = normalizedMemories.reduce((sum, memory) => 
      sum + (memory.token_count || 0), 0);

    // Generate summary if requested
    let summary = '';
    if (includeSummary && normalizedMemories.length > 0) {
      // TODO: Implement summary generation using LLM
      summary = 'Summary generation not yet implemented';
    }

    return {
      memories: normalizedMemories,
      summary,
      totalTokens,
      metadata: {
        search_query: query,
        timestamp: new Date().toISOString(),
        model_version: '1.0.0',
        maxMemories,
        maxTokens,
        includeSummary
      }
    };
  }

  async getRelatedMemories(
    memoryId: string,
    options: MemoryRelationshipOptions = {}
  ): Promise<MemoryWithRelationships[]> {
    const results = await getRelatedMemories(memoryId, options);
    return results.map(memory => normalizeMemoryEntry(memory) as MemoryWithRelationships);
  }

  private async updateMemories(memories: MemoryEntry[]): Promise<void> {
    // Update each memory in the database
    for (const memory of memories) {
      const { error } = await supabase
        .from('memories')
        .update({
          ...memory,
          updated_at: new Date().toISOString()
        })
        .eq('id', memory.id);

      if (error) throw error;
    }
  }
}
