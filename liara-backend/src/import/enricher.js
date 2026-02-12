import OpenAI from 'openai';

function createOpenAIClient(apiKey) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OpenAI API key not configured. Provide x-openai-key (Liara Lite) or set OPENAI_API_KEY (backend).');
  }
  return new OpenAI({ apiKey: key });
}

async function getEmbedding(openai, text) {
  if (!text || text.trim().length === 0) return null;
  try {
    const response = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text.trim() });
    return response.data[0].embedding;
  } catch (error) {
    console.error(`Error generating embedding for text snippet: "${text.substring(0, 100)}..."`, error);
    throw error; 
  }
}

async function getTags(openai, text, model = 'gpt-4o-mini') {
  if (!text || text.trim().length === 0) return [];
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a tagging expert. Extract 2-5 relevant keywords or tags from the following text. Respond with a comma-separated list.' },
        { role: 'user', content: text }
      ],
      temperature: 0.2,
      max_tokens: 50,
    });
    return response.choices[0]?.message?.content?.split(',').map(tag => tag.trim()).filter(Boolean) ?? [];
  } catch (error) {
    console.error(`Error generating tags for text snippet: "${text.substring(0, 100)}..."`, error);
    throw error;
  }
}

async function getNamedEntities(openai, text, model = 'gpt-4o-mini') {
  if (!text || text.trim().length === 0) return {};
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { 
          role: 'system', 
          content: `You are a Named Entity Recognition expert. Extract entities from the text and categorize them. Return a JSON object with these categories:
- PERSON: People's names
- ORG: Organizations, companies, institutions
- GPE: Geopolitical entities (cities, countries, states)
- DATE: Dates and times
- PRODUCT: Products, software, tools
- EVENT: Named events, meetings, conferences
- MISC: Other significant entities

Format: {"PERSON": ["John Smith"], "ORG": ["OpenAI"], "GPE": ["New York"], "DATE": ["January 2025"], "PRODUCT": ["ChatGPT"], "EVENT": ["Conference 2025"], "MISC": ["Important Topic"]}

Only include categories that have entities. Be precise and avoid duplicates.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });
    
    const result = response.choices[0]?.message?.content;
    const entities = JSON.parse(result);
    
    // Clean and validate the entities
    const cleanedEntities = {};
    const validCategories = ['PERSON', 'ORG', 'GPE', 'DATE', 'PRODUCT', 'EVENT', 'MISC'];
    
    for (const [category, items] of Object.entries(entities)) {
      if (validCategories.includes(category) && Array.isArray(items) && items.length > 0) {
        cleanedEntities[category] = items.filter(item => 
          typeof item === 'string' && item.trim().length > 0
        ).map(item => item.trim());
      }
    }
    
    return cleanedEntities;
  } catch (error) {
    console.error(`Error extracting named entities for text snippet: "${text.substring(0, 100)}..."`, error);
    return {}; // Return empty object on error rather than throwing
  }
}

async function preprocessForEmbedding(content) {
  let processedContent = content;
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let codeBlocksReplaced = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'code';
    processedContent = processedContent.replace(match[0], `[codeblock:${language}]`);
    codeBlocksReplaced++;
  }

  const truncated = codeBlocksReplaced > 0;
  // If after stripping code, the message is effectively empty, we shouldn't embed it.
  const shouldSkip = processedContent.trim().length < 10 && truncated;

  return { processedContent, truncated, shouldSkip, codeBlocksReplaced };
}

const MAX_AI_MESSAGE_CHARS = 15000;

/**
 * Extracts meaningful text from complex message content (like JSON objects).
 * If the content is a simple string, it returns it directly.
 * If it's an object or a JSON string, it tries to find relevant text within it.
 * @param {*} content The message content.
 * @returns {string} The extracted text.
 */
function extractTextForProcessing(content) {
  if (typeof content === 'string') {
    try {
      // Try parsing the string to see if it's a JSON object
      const parsed = JSON.parse(content);
      // If it's an object, recursively call to extract text
      return extractTextForProcessing(parsed);
    } catch (e) {
      // Not a JSON string, return as is.
      return content;
    }
  }

  if (typeof content === 'object' && content !== null) {
    // If it's an array, join elements with a space.
    if (Array.isArray(content)) {
      return content.map(extractTextForProcessing).join(' ');
    }
    // For objects, look for common keys that might contain the main text.
    if (content.prompt) return content.prompt;
    if (content.text) return content.text;
    if (content.query) return content.query;
    if (content.message) return content.message;
    // Fallback: stringify the whole object, but this is less ideal.
    return JSON.stringify(content);
  }

  return String(content); // Fallback for other types
}

async function getConversationSummary(openai, convo, model = 'gpt-4o-mini', generateTopics = true) {
  if (!Array.isArray(convo.messages) || convo.messages.length === 0) {
    console.warn(`Conversation "${convo.title}" has no messages. Skipping summary.`);
    throw new Error('Conversation has no messages');
  }
  
  // If topic generation is disabled, use the conversation title as the topic
  if (!generateTopics) {
    const content = convo.messages.map(m => `${m.role}: ${m.content}`).join('\\n---\\n');
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: "You are a master summarizer. Your task is to distill a conversation into its essential core. Provide a concise, impactful one-sentence summary. **Do not use introductory phrases** like 'The conversation revolves around' or 'This is a discussion about'. Get straight to the point. Respond in JSON format with key `summary`." },
          { role: 'user', content: content }
        ],
        temperature: 0.2,
        max_tokens: 4096, 
        response_format: { type: 'json_object' },
      });
      const result = response.choices[0]?.message?.content;
      const summaryData = JSON.parse(result);
      return {
        summary: summaryData.summary ?? 'Summary not available.',
        topic: convo.title || 'General', // Use conversation title as topic
      };
    } catch (error) {
      console.error(`Error generating summary for conversation: "${convo.title}"`, error);
      throw error;
    }
  }
  
  // Original behavior: generate both summary and topic
  const content = convo.messages.map(m => `${m.role}: ${m.content}`).join('\\n---\\n');
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: "You are a master summarizer. Your task is to distill a conversation into its essential core. Provide a concise, impactful one-sentence summary and a general topic. **Do not use introductory phrases** like 'The conversation revolves around' or 'This is a discussion about'. Get straight to the point. Respond in JSON format with keys `summary` and `topic`." },
        { role: 'user', content: content }
      ],
      temperature: 0.2,
      max_tokens: 4096, 
      response_format: { type: 'json_object' },
    });
    const result = response.choices[0]?.message?.content;
    const summaryData = JSON.parse(result);
    return {
      summary: summaryData.summary ?? 'Summary not available.',
      topic: summaryData.topic ?? 'General',
    };
  } catch (error) {
    console.error(`Error generating summary for conversation: "${convo.title}"`, error);
    throw error;
  }
}

async function enrichMessage(openai, message, sendEvent, model = 'gpt-4o-mini', enableNER = false, nerUserOnly = false) {
  // Pre-emptive check for long AI messages to avoid API errors
  if ((message.role === 'assistant' || message.role === 'ai') && message.content.length > MAX_AI_MESSAGE_CHARS) {
    const logEntry = {
      message_id: message.id,
      role: message.role,
      timestamp: new Date().toISOString(),
      actions: [`AI message content length (${message.content.length}) exceeded limit of ${MAX_AI_MESSAGE_CHARS}. Replacing with placeholder.`],
      embedded: false,
      error: 'auto-truncated',
    };
    const enrichedMessage = {
      ...message,
      content: `[AI response was longer than ${MAX_AI_MESSAGE_CHARS} characters and has been replaced with this placeholder. It was not processed for embedding or tags.]`,
      tags: ['long-ai-response', 'auto-truncated'],
      embedding: null,
      metadata: { ...message.metadata, role_embedded: false, preprocessing: 'truncated' }
    };
    return { enrichedMessage, logEntry };
  }

  const logEntry = {
    message_id: message.id,
    role: message.role,
    timestamp: new Date().toISOString(),
    actions: [],
    embedded: false,
    error: null,
  };

  try {
    const textForEmbedding = extractTextForProcessing(message.content);
    const textForTags = extractTextForProcessing(message.content); // Can be the same or different logic if needed

    let contentToEmbed = textForEmbedding;
    
    // For assistant messages, preprocess to handle code blocks
    if (message.role === 'assistant') {
      const { processedContent, truncated, shouldSkip, codeBlocksReplaced } = await preprocessForEmbedding(message.content);
      if (truncated) {
        logEntry.actions.push(`Replaced ${codeBlocksReplaced} code block(s) with tags. Original length: ${message.content.length}, New length: ${processedContent.length}`);
      }
      if (shouldSkip) {
        logEntry.actions.push('Skipped embedding: content too short after preprocessing.');
        message.metadata = { ...message.metadata, role_embedded: false, preprocessing: 'skipped' };
        // This is a "controlled failure", so we create an error object for the log
        return { 
          error: {
            message_id: message.id,
            content: message.content,
            role: message.role,
            reason: 'Content too short after preprocessing.',
            stack: null,
          },
          enrichedMessage: message, 
          logEntry 
        };
      }
      contentToEmbed = processedContent;
    }

    logEntry.actions.push(`Sending content (length: ${contentToEmbed.length}) for embedding.`);
    
    // Prepare parallel operations
    const operations = [
      getEmbedding(openai, contentToEmbed),
      getTags(openai, textForTags, model), // Tags are generated from original content
    ];
    
    // Add NER if enabled and conditions are met
    if (enableNER) {
      // If nerUserOnly is true, only extract entities from user messages
      if (!nerUserOnly || message.role === 'user') {
        operations.push(getNamedEntities(openai, textForTags, model));
      }
    }
    
    const results = await Promise.all(operations);
    const [embedding, tags, namedEntities] = results;
    
    message.embedding = embedding;
    message.tags = tags;
    
    // Add named entities if NER was enabled and entities were extracted
    if (enableNER && namedEntities) {
      message.named_entities = namedEntities;
      const entityCount = Object.values(namedEntities).reduce((sum, arr) => sum + arr.length, 0);
      logEntry.actions.push(`Extracted ${entityCount} named entities across ${Object.keys(namedEntities).length} categories.`);
    } else if (enableNER && nerUserOnly && message.role !== 'user') {
      // For non-user messages when nerUserOnly is enabled, set empty entities
      message.named_entities = {};
      logEntry.actions.push('Skipped NER extraction (user prompts only mode).');
    }
    
    message.metadata = { ...message.metadata, role_embedded: true };
    logEntry.embedded = !!embedding; // Explicitly check if embedding was returned
    logEntry.actions.push(`Successfully generated tags. Tag count: ${tags.length}.`);
    logEntry.actions.push(embedding ? 'Successfully received embedding.' : 'Embedding call succeeded but returned NULL.');

  } catch (error) {
    logEntry.error = error.message;
    logEntry.actions.push('An error occurred during enrichment.');
    message.metadata = { ...message.metadata, role_embedded: false, error: error.message };
    console.error(`[enricher] Error enriching message ${message.id}:`, error);
    // Return an error object for the main loop to handle
    return { error: {
      message_id: message.id,
      content: message.content,
      role: message.role,
      reason: error.message,
      stack: error.stack,
    }, enrichedMessage: message, logEntry };
  }
  
  return { enrichedMessage: message, logEntry };
}

const noOp = () => {};

export async function enrichConversations(conversations, sendEvent = noOp, model = 'gpt-4o-mini', generateTopics = true, enableNER = false, nerUserOnly = false, options = {}) {
  const openai = createOpenAIClient(options.openaiApiKey);
  const enriched = [];
  const errors = [];
  const detailedLogs = [];
  const failedEnrichments = []; // New array for per-message failures
  const totalConversations = Array.isArray(conversations) ? conversations.length : 0;
  const totalMessages = Array.isArray(conversations)
    ? conversations.reduce((sum, c) => sum + (Array.isArray(c?.messages) ? c.messages.length : 0), 0)
    : 0;
  let processedConversations = 0;
  let processedMessages = 0;
  let lastProgressAt = 0;

  // Initial progress ping so the UI can immediately show "alive"
  sendEvent({
    type: 'progress',
    stage: 'start',
    processedConversations,
    totalConversations,
    processedMessages,
    totalMessages,
  });

  for (const convo of conversations) {
    const convoIdentifier = convo.title || convo.id || 'Unknown Conversation';
    let summary = 'Summary not generated yet.';
    let topic = 'Topic not generated yet.';

    try {
      sendEvent({ type: 'log', message: `Processing conversation: "${convoIdentifier}"` });
      // Conversation-level progress
      sendEvent({
        type: 'progress',
        stage: 'conversation',
        processedConversations,
        totalConversations,
        processedMessages,
        totalMessages,
        conversationTitle: convoIdentifier,
      });

      if (!Array.isArray(convo.messages)) {
        // This is a structural error, so we can skip the whole conversation.
        throw new Error(`Conversation is missing or has an invalid 'messages' array.`);
      }

      const enrichedMessages = [];
      for(const message of convo.messages) {
        const { enrichedMessage, logEntry, error } = await enrichMessage(openai, message, sendEvent, model, enableNER, nerUserOnly);
        if (error) {
          failedEnrichments.push(error);
        }
        enrichedMessages.push(enrichedMessage);
        detailedLogs.push(logEntry);
        processedMessages += 1;

        const now = Date.now();
        // Throttle progress events to avoid flooding the stream
        if (now - lastProgressAt > 750) {
          lastProgressAt = now;
          sendEvent({
            type: 'progress',
            stage: 'message',
            processedConversations,
            totalConversations,
            processedMessages,
            totalMessages,
            conversationTitle: convoIdentifier,
          });
        }
      }
      
      convo.messages = enrichedMessages; // Update messages before summarization

      try {
        const summaryResult = await getConversationSummary(openai, convo, model, generateTopics);
        summary = summaryResult.summary;
        topic = summaryResult.topic;
      } catch (summaryError) {
        console.error(`[enricher] Failed to generate summary for conversation: "${convoIdentifier}"`, summaryError);
        errors.push({ 
          conversation_id: convo.id,
          conversation_title: convo.title,
          error: `Failed to generate summary: ${summaryError.message}`,
          stack: summaryError.stack
        });
        summary = 'Failed to generate summary due to an error.';
        topic = 'Error';
      }

      enriched.push({
        ...convo,
        messages: convo.messages,
        summary: summary,
        topic: topic,
      });
      processedConversations += 1;

    } catch (error) {
      // This outer catch now only handles truly critical errors for a conversation, like the missing 'messages' array.
      console.error(`[enricher] Failed to process conversation: "${convoIdentifier}"`, error);
      errors.push({ 
        conversation_id: convo.id,
        conversation_title: convo.title,
        error: error.message,
        stack: error.stack
      });
      processedConversations += 1;
    }
  }
  
  sendEvent({
    type: 'progress',
    stage: 'done',
    processedConversations,
    totalConversations,
    processedMessages,
    totalMessages,
  });
  sendEvent({ type: 'log', message: `Enrichment complete. Success: ${enriched.length}, Failed Convos: ${errors.length}, Failed Messages: ${failedEnrichments.length}` });
  return { enriched, errors, detailedLogs, failedEnrichments };
} 