import { supabase } from '@/integrations/supabase/client';
import { 
  MemoryEntry, 
  CreateMemoryEntry, 
  MemorySearchResult,
  MemoryWithRelationships
} from './types';
import { getEmbedding } from './embeddings';
import { normalizeMemoryEntry, normalizeMemoryEntries } from './compatibility';
import { v4 as uuidv4 } from 'uuid';

// CreateMemoryEntry does NOT include guest_session_id for the memories table flow.
// It now includes optional fields like timestamp, related_to, source, model_version.
// It does NOT include created_at or updated_at, as those are set by the service.
type StoreMemoryInput = CreateMemoryEntry & {
  user_id?: string | null; // user_id is on CreateMemoryEntry, but can be overridden/ensured by MemoryService
  created_at: string;      // Added by MemoryService
  updated_at: string;      // Added by MemoryService (was last_referenced)
};

export async function storeMemory(dataIn: StoreMemoryInput): Promise<MemoryEntry> {
  const textToEmbed = dataIn.content || dataIn.summary || ''; 
  if (!textToEmbed.trim()) {
    // Allow storing memories with no content for embedding initially, 
    // e.g. if content is to be filled by an agent later.
    // However, embedding generation itself will fail or produce a generic vector.
    // For now, let's proceed, but this might need refinement based on use case.
    console.warn("Memory content or summary is empty. Embedding may be meaningless or fail.");
  }

  let embeddingValue: number[] | null = null;
  if (textToEmbed.trim()) {
    try {
      embeddingValue = await getEmbedding(textToEmbed);
    } catch (e) {
      console.error("Failed to generate embedding:", e);
      // Decide if to throw or proceed without embedding
      // For now, proceed without embedding if generation fails
    }
  }
  
  const newId = uuidv4();

  const memoryToInsert = {
    ...dataIn, // Spreads all fields from CreateMemoryEntry AND created_at, updated_at, user_id from StoreMemoryInput specific part
    id: newId,
    embedding: embeddingValue ? JSON.stringify(embeddingValue) : null,
    // Ensure all other CreateMemoryEntry fields are present if dataIn had them (e.g. topic, summary, content, role, conversation_title, timestamp, etc.)
    // user_id, created_at, updated_at are explicitly part of StoreMemoryInput and spread from dataIn.
  };

  // Remove undefined keys to prevent issues with Supabase insert if any optional fields are explicitly undefined
  // (Supabase client usually handles undefined well by omitting them, but this is safer)
  const cleanedMemoryToInsert = Object.fromEntries(
    Object.entries(memoryToInsert).filter(([, value]) => value !== undefined)
  );

  const { data, error } = await supabase
    .from('memories')
    .insert(cleanedMemoryToInsert)
    .select()
    .single();

  if (error) {
    console.error("Error storing memory in Supabase:", error);
    // Consider if specific error codes need special handling
    throw error;
  }

  if (!data) {
    throw new Error("Failed to store memory or retrieve the stored entry from Supabase.");
  }
  
  return normalizeMemoryEntry(data as MemoryEntry);
}

export async function queryVectorMemory(
  queryEmbedding: number[],
  userId: string | null = null,
  options: {
    similarityThreshold?: number;
    limit?: number;
    filterTags?: string[];
  } = {}
): Promise<MemoryEntry[]> {
  const {
    similarityThreshold = 0.7,
    limit = 10,
    filterTags = []
  } = options;

  try {
    // Convert embedding to string for RPC call
    const embeddingString = JSON.stringify(queryEmbedding);
    
    let query = supabase.rpc('search_memories', {
      query_embedding: embeddingString,
      similarity_threshold: similarityThreshold,
      match_count: limit
    });

    // Add user filter if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Add tag filters if provided
    if (filterTags.length > 0) {
      query = query.contains('tags', filterTags);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Convert search results to MemoryEntry format
    const searchResults = data as MemorySearchResult[];
    const memoryIds = searchResults.map(result => result.id);

    // Fetch full memory entries
    const { data: memories, error: fetchError } = await supabase
      .from('memories')
      .select('*')
      .in('id', memoryIds);

    if (fetchError) throw fetchError;

    // Add similarity scores to memories
    const memoriesWithSimilarity = (memories || []).map(memory => ({
      ...memory,
      similarity: searchResults.find(r => r.id === memory.id)?.similarity || 0
    }));

    return normalizeMemoryEntries(memoriesWithSimilarity);
  } catch (error) {
    console.error('Error querying vector memory:', error);
    throw new Error('Failed to query memory');
  }
}

export async function updateMemoryEmbedding(
  memoryId: string,
  text: string
): Promise<void> {
  try {
    const embedding = await getEmbedding(text);
    
    const { error } = await supabase
      .from('memories')
      .update({ 
        embedding: JSON.stringify(embedding),
        updated_at: new Date().toISOString()
      })
      .eq('id', memoryId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating memory embedding:', error);
    throw new Error('Failed to update memory embedding');
  }
}

export async function getRelatedMemories(
  memoryId: string,
  options: {
    relationshipType?: string;
    limit?: number;
  } = {}
): Promise<MemoryWithRelationships[]> {
  const { relationshipType, limit = 10 } = options;

  try {
    // First get the relationship data
    const { data: relationships, error: relError } = await supabase
      .from('memory_relationships')
      .select('target_memory_id, relationship_type, strength')
      .eq('source_memory_id', memoryId)
      .order('strength', { ascending: false })
      .limit(limit);

    if (relError) throw relError;

    if (!relationships?.length) return [];

    // Then fetch the actual memories
    const memoryIds = relationships.map(r => r.target_memory_id);
    const { data: memories, error: memError } = await supabase
      .from('memories')
      .select('*')
      .in('id', memoryIds);

    if (memError) throw memError;

    // Combine memory data with relationship info
    const memoriesWithRelationships = (memories || []).map(memory => ({
      ...memory,
      relationship_type: relationships.find(r => r.target_memory_id === memory.id)?.relationship_type,
      relationship_strength: relationships.find(r => r.target_memory_id === memory.id)?.strength
    }));

    return normalizeMemoryEntries(memoriesWithRelationships) as MemoryWithRelationships[];
  } catch (error) {
    console.error('Error getting related memories:', error);
    throw new Error('Failed to get related memories');
  }
}
