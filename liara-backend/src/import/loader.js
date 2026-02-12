import { supabase } from '../clients.js';

/**
 * Converts a message object to the format expected by the DB for the 'messages' table.
 * @param {object} message - The message object to convert.
 * @param {string} memoryId - The ID of the memory this message belongs to.
 * @returns {object} The message in the format expected by the DB.
 */
function messageToDbSchema(message, memoryId) {
  return {
    memory_id: memoryId,
    role: message.role,
    content: message.content,
    // Ensure timestamp is a Date object before calling toISOString
    timestamp: new Date(message.timestamp).toISOString(),
    // These fields may not exist on preprocessed-only data
    tags: message.tags || [],
    embedding: message.embedding || null, 
  };
}

// Helper function to split an array into chunks
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Parses a timestamp robustly.
 * Handles different formats, including Unix seconds and various ISO strings.
 * @param {string | number} timestamp The timestamp to parse.
 * @returns {string} An ISO 8601 string or a default fallback.
 */
function parseTimestamp(timestamp) {
  if (!timestamp) {
    // Return a default or handle as an error
    return new Date('1970-01-01T00:00:00Z').toISOString(); 
  }

  // Check if it's a number (likely Unix timestamp in seconds or ms)
  if (typeof timestamp === 'number') {
    // If it looks like seconds (e.g., 1625097600), convert to milliseconds
    if (timestamp < 1000000000000) {
      return new Date(timestamp * 1000).toISOString();
    }
    return new Date(timestamp).toISOString();
  }
  
  // Try parsing directly, which works for ISO 8601 and other common formats
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }

  // Final fallback
  console.warn(`[loader] Could not parse timestamp: "${timestamp}". Using fallback.`);
  return new Date('1970-01-01T00:00:00Z').toISOString();
}

/**
 * Loads an array of processed conversations into the database.
 * Each message in a conversation becomes a distinct row in the memories table.
 * @param {Array<object>} conversations The conversations to load.
 * @param {string} userId The ID of the user.
 * @param {boolean} isTest Whether to load into the test table.
 * @returns {Promise<object>} An object with the count of inserted memories.
 */
export async function loadConversations(conversations, userId, isTest = false) {
  const memoriesTableName = isTest ? 'test_memories' : 'memories';
  
  const memoriesToInsert = conversations.flatMap(convo => 
    convo.messages.map(message => {
      // Ensure content is a string. If it's an object, stringify it.
      const contentAsString = typeof message.content === 'string' 
        ? message.content 
        : JSON.stringify(message.content);

      return {
        id: message.id,
        user_id: userId,
        content: contentAsString,
        role: message.role,
        timestamp: parseTimestamp(message.timestamp),
        
        conversation_title: convo.title,
        conversation_start_time: parseTimestamp(convo.create_time),
        source_chat_id: convo.id,

        embedding: message.embedding || null,
        summary: convo.summary || null,
        topic: convo.topic || null,
        tags: message.tags || [],
        named_entities: message.named_entities || {},
        metadata: message.metadata || {},
        
        source: 'chat_export',
      };
    })
  );

  if (memoriesToInsert.length === 0) {
    console.log('No memories to insert.');
    return { insertedCount: 0 };
  }

  // Batching the upsert operation
  const BATCH_SIZE = 100;
  const memoryBatches = chunkArray(memoriesToInsert, BATCH_SIZE);
  let totalInsertedCount = 0;

  console.log(`[loader] Starting to upsert ${memoriesToInsert.length} memories in ${memoryBatches.length} batches of ${BATCH_SIZE}.`);

  for (const batch of memoryBatches) {
    const { error } = await supabase
      .from(memoriesTableName)
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting memory batch:', error);
      throw new Error(`Failed to upsert memories: ${error.message}`);
    }
    totalInsertedCount += batch.length;
    console.log(`[loader] Successfully upserted batch. Total inserted: ${totalInsertedCount}/${memoriesToInsert.length}`);
  }

  console.log(`[loader] Finished upserting all memories.`);
  // Trigger facet refresh for semantic/test MVs so Tag Cloud stays fresh
  try {
    if (isTest) {
      await supabase.rpc('refresh_sem_facets');
    } else {
      await supabase.rpc('refresh_sem_facets');
    }
  } catch (e) {
    console.warn('[loader] Failed to refresh semantic facet counts:', e?.message || e);
  }
  return { insertedCount: totalInsertedCount };
}

export async function clearTestMemoriesForUser(userId) {
  if (!userId) {
    throw new Error('User ID must be provided to clear test memories.');
  }

  console.log(`[loader] Clearing all test_memories for user: ${userId}`);
  
  const { count, error } = await supabase
    .from('test_memories')
    .delete({ count: 'exact' })
    .eq('user_id', userId);
  
  if (error) {
    console.error(`[loader] Error clearing test memories for user ${userId}:`, error);
    throw error;
  }

  console.log(`[loader] Successfully deleted ${count} records from test_memories for user ${userId}.`);
  return { deletedCount: count };
} 