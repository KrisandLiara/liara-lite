# Supabase Edge Function: `answer_memory_question`

## Overview

The `answer_memory_question` Edge Function provides a Question & Answering (Q&A) capability over a user's stored memories. It takes a user's natural language question, searches for relevant memories, and then uses an OpenAI Large Language Model (LLM) to synthesize an answer based *only* on the retrieved memory snippets.

## File Location

`supabase/functions/answer_memory_question/index.ts`

## Functionality

1.  **CORS Handling**: Responds to OPTIONS requests for CORS preflight.
2.  **Input Validation**: Expects a JSON body with `question` (string) and `userId` (string).
3.  **Supabase Admin Client Initialization**: Creates a Supabase client with service role privileges to perform administrative tasks.
4.  **OpenAI API Key Retrieval**:
    *   First, checks if an `OPENAI_API_KEY_LOCAL_DEV` environment variable is set (typically for local development via a `.env` file or Supabase local env vars). If found, this key is used directly.
    *   If the local development key is not available, it invokes the `get-api-key` Edge Function to securely fetch the user's OpenAI API key associated with their `userId`.
    *   When calling `get-api-key`, it passes the `userId`, a list of `keyNames` (e.g., `['OpenAI', 'Guest/Personal', 'Default']`), and `type: "openai"` in the request body to specify that an OpenAI key is needed.
5.  **Question Embedding**:
    *   Generates a vector embedding for the user's question using OpenAI's `text-embedding-ada-002` model.
6.  **Semantic Search for Memories**:
    *   Calls the `search_memories` PostgreSQL RPC function.
    *   Uses the generated question embedding to find relevant memories.
    *   Applies a fixed similarity threshold (`SIMILARITY_THRESHOLD_FOR_QA = 0.25`).
    *   Limits the number of retrieved memory snippets (`MATCH_COUNT_FOR_QA_CONTEXT = 5`).
    *   Tag filtering is currently disabled (`p_tags: null`).
7.  **Context Preparation for LLM**:
    *   If no relevant memories are found, it returns a message indicating so.
    *   Otherwise, it constructs a context string for the LLM. This context includes:
        *   A system prompt instructing the LLM to answer based *only* on the provided snippets and not to use external knowledge.
        *   The user's original question.
        *   The content of the retrieved memory snippets, along with their topics (if available) and creation dates.
8.  **Answer Synthesis with LLM**:
    *   Sends a request to the OpenAI Chat Completions API (using `gpt-3.5-turbo` by default).
    *   The request includes the system prompt and the user-role content (question + snippets).
    *   Uses a low temperature (e.g., 0.3) for more factual answers.
9.  **Response**:
    *   Returns a JSON object containing the `answer` synthesized by the LLM.
    *   Handles various error states by returning appropriate JSON error messages and status codes.

## Environment Variables

The Edge Function relies on the following environment variables being set in the Supabase project settings (or locally for development):

*   `SUPABASE_URL`: The URL of your Supabase project.
*   `SUPABASE_SERVICE_ROLE_KEY`: The service role key for your Supabase project (allows admin privileges).
*   `OPENAI_API_KEY_LOCAL_DEV` (Optional, for local development): If set, this key will be used directly, bypassing the `get-api-key` call. This is useful for local testing without needing the full API key retrieval infrastructure.
    *   *Note: The function also invokes `get-api-key`, which itself likely relies on its own configuration for storing and retrieving user-specific OpenAI API keys.*

## Request Body

```json
{
  "question": "Your natural language question about your memories",
  "userId": "The ID of the user making the request"
}
```

## Success Response (200 OK)

```json
{
  "answer": "The LLM-generated answer based on the memory snippets."
}
```
Example if no memories found:
```json
{
  "answer": "I couldn't find any specific memories related to your question."
}
```

## Error Responses

*   **400 Bad Request**: If `question` or `userId` is missing.
    ```json
    {
      "error": "Missing question or userId"
    }
    ```
*   **500 Internal Server Error**: For various issues such as:
    *   Failure to retrieve OpenAI API key.
    *   Failure to generate question embedding.
    *   Failure during the `search_memories` RPC call.
    *   Failure to get an answer from the AI model.
    *   Any other unexpected server-side error.
    ```json
    {
      "error": "Descriptive error message",
      "details": "Optional additional details about the error"
    }
    ```

## Key Constants (Tunable)

Located at the top of `index.ts`:

*   `SIMILARITY_THRESHOLD_FOR_QA` (default: `0.25`): The minimum similarity score for a memory to be considered relevant.
*   `MATCH_COUNT_FOR_QA_CONTEXT` (default: `5`): The number of top memory snippets to provide to the LLM.
*   `OPENAI_EMBEDDING_MODEL` (default: `text-embedding-ada-002`)
*   `OPENAI_CHAT_MODEL` (default: `gpt-3.5-turbo`)
*   `DEFAULT_API_KEY_NAMES` (default: `['OpenAI', 'Guest/Personal', 'Default']`) 