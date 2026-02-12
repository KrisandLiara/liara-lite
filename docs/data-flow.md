# Data & Logic Flows

This page describes how messages and memories move through the system.

## End‑to‑End Chat Flow

1. **User Input** – A user types a message on `ChatPage`. The component uses `useMemoryState` to send the text to the backend.
2. **Backend Save** – `POST /api/save-memory` stores the message in `chat_history`. If no `chat_session_id` is supplied a new session is created in `chat_sessions`.
3. **Embedding & Memory** – When the `useLongTermMemory` toggle is enabled, the backend generates an OpenAI embedding and inserts a row into `memories` with `source_chat_id` pointing back to the chat message.
4. **LLM Call** – The `chat-with-liara` Edge Function builds a system prompt (respecting user personality settings) and sends chat history plus the latest user message to OpenAI. The response is returned to the frontend and also saved through `/api/save-memory` as an assistant message.

## Memory Query Flow

1. **Search Request** – When searching memories or invoking the Q&A agent, the frontend calls `/api/query-memory` or the `answer_memory_question` function.
2. **Vector Search** – A question embedding is produced via OpenAI and passed to the `search_memories` SQL function which performs similarity search over `memories.embedding`.
3. **Context Injection** – Matching memories are provided to the LLM to formulate a contextual answer which is returned to the user.
