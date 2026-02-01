import { MemoryEntry } from './types';

/**
 * Ensures backward compatibility by mapping between different property names
 * @param memory The memory entry to normalize
 * @returns A memory entry with new property names
 */
export function normalizeMemoryEntry(memory: any): MemoryEntry {
  const normalized = { ...memory } as MemoryEntry;
  
  // If there's an old 'full_text' field and no 'content', migrate it.
  // This is for handling truly old data structures before they are typed as MemoryEntry.
  if (!normalized.content && memory.full_text) {
    normalized.content = memory.full_text;
  }
  
  // Remove full_text if it was on the untyped input object, as it's not on MemoryEntry type anymore
  if (memory.full_text) {
    delete (normalized as any).full_text;
  }

  // Ensure content is at least an empty string if null/undefined
  if (normalized.content == null) {
    normalized.content = '';
  }
  
  return normalized;
}

/**
 * Normalize an array of memory entries for backward compatibility
 * @param memories Array of memory entries
 * @returns Normalized array of memory entries
 */
export function normalizeMemoryEntries(memories: any[]): MemoryEntry[] {
  return memories.map(normalizeMemoryEntry);
}
