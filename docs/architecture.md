# System Architecture

Liara is composed of a React frontend, an Express/Node backend, and Supabase for database, authentication, and serverless functions.

## Stack Overview

- **Frontend**: React + TypeScript built with Vite and styled via Tailwind CSS. Interactive diagrams use `reactflow`.
- **Backend**: Node.js with Express located in `liara-backend/`. Handles REST APIs and reads/writes to Supabase.
- **Supabase**: Provides PostgreSQL storage, authentication, and Deno based Edge Functions.
- **Containerization**: `docker-compose.yml` orchestrates `frontend` and `backend` containers. Nginx serves the compiled SPA on port `80` while the backend listens on port `3000`.

## Major Services

- **Chat Service** – `/api/save-memory` and the `chat-with-liara` function send user prompts to OpenAI and persist responses.
- **Memory Search** – `/api/query-memory` along with the `search_memories` database function performs vector similarity search on the `memories` table.
- **Personality Management** – settings stored in the `personality` table are consulted by Edge Functions to adjust the system prompt.

The overall architecture follows a typical SPA pattern with an API layer and database hosted on Supabase.
