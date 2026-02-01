
import { 
  MemoryEntry, 
  MemoryContext, 
  MemorySearchOptions 
} from './types';
import { getEmbedding } from './embeddings';
import { queryVectorMemory } from '@/lib/memory/vectorStore';
import { config } from '@/config';
import { normalizeMemoryEntries, normalizeMemoryEntry } from './compatibility';

const MAX_MEMORIES = 5;
const MAX_TOKENS = 2000;

export async function routeRelevantMemories(
  query: string, 
  userId: string | null,
  options: MemorySearchOptions = {}
): Promise<MemoryContext> {
  const {
    maxMemories = MAX_MEMORIES,
    maxTokens = MAX_TOKENS,
    includeSummary = true
  } = options;

  // Get query embedding
  const vector = await getEmbedding(query);

  // Query vector store
  const memories = await queryVectorMemory(vector, userId, {
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
      model_version: config.modelVersion,
      maxMemories,
      maxTokens,
      includeSummary
    }
  };
}

// Helper to merge similar memories
export async function mergeSimilarMemories(
  newMemory: MemoryEntry,
  existingMemories: MemoryEntry[],
  similarityThreshold: number = 0.9
): Promise<MemoryEntry[]> {
  if (!newMemory.embedding) {
    throw new Error('New memory is missing embedding vector');
  }
  
  const newVector = JSON.parse(newMemory.embedding);
  
  // Find similar memories
  const similarMemories = existingMemories.filter(mem => {
    if (!mem.embedding) return false;
    const memVector = JSON.parse(mem.embedding);
    const similarity = cosineSimilarity(newVector, memVector);
    return similarity > similarityThreshold;
  });

  if (similarMemories.length === 0) {
    return [...existingMemories, newMemory];
  }

  // Merge similar memories
  const mergedContent = await summarizeMemories([newMemory, ...similarMemories]);
  const mergedMemory: MemoryEntry = {
    ...newMemory,
    content: mergedContent,
    summary: mergedContent.slice(0, 200) + '...', // Truncate for summary
    updated_at: new Date().toISOString(),
    metadata: {
      ...(newMemory.metadata || {}),
      merged_from: similarMemories.map(m => m.id)
    }
  };

  // Remove old memories and add merged one
  return [
    ...existingMemories.filter(m => !similarMemories.includes(m)),
    mergedMemory
  ];
}

// Helper to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Helper to summarize memories
async function summarizeMemories(memories: MemoryEntry[]): Promise<string> {
  // TODO: Implement memory summarization using LLM
  return memories.map(m => m.content || '').join('\n\n');
}
