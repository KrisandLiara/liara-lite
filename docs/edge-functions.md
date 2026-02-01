# Server-Side Logic

Liara exposes both REST endpoints (via Express) and Supabase Edge Functions.

## Node.js API Endpoints

- `GET /api/chat-sessions/recent` – list recent conversations
- `GET /api/chat-sessions/:id/messages` – fetch messages for a session
- `PUT /api/chat-sessions/:id/title` – rename a conversation
- `DELETE /api/chat-sessions/:id` – remove a conversation
- `POST /api/query-memory` – semantic search of memories
- `POST /api/save-memory` – store chat messages and optional memory entries
- `GET /api/summary/:id` – fetch a summarized memory item

All endpoints apply the `authenticate` middleware which verifies the Supabase JWT.

## Supabase Edge Functions

- **`chat-with-liara`** – Core chat agent that assembles system prompts, retrieves personality settings, and calls OpenAI.
- **`answer_memory_question`** – Specialized Q&A agent that performs vector search then answers based solely on returned memories.
- **`delete-chat-session`** – Invokes an RPC to remove a chat session and its related data.

These functions run in Deno and are deployed through the Supabase CLI.
