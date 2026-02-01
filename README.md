# Liara - Your Personal AI Memory and Chat Companion

Liara is a project designed to be a personal AI assistant that not only chats with you but also remembers your conversations and other important information, making it available for semantic search and contextual recall.

## Core Features

*   **Conversational AI:** Engage in natural conversations with Liara.
*   **Personal Memory:** Liara stores your notes, ideas, and chat history.
*   **Semantic Search:** Find relevant information from your memory using natural language queries.
*   **Contextual Recall:** Liara can use relevant memories to provide more informed and personalized responses during chats.
*   **User Authentication:** Secure access to your personal memory and conversations.
*   **Admin Panel:** (If applicable) For managing users, data, API keys, etc.
*   **System Overview Page**: A new admin-only dashboard providing detailed, interactive internal documentation about the system's architecture, data flows, and components. See [System Overview Documentation](./docs/system-overview.md) for more details.

## Chat System Architecture (Recent Refactor)

The chat system has been significantly refactored to provide a more robust and feature-rich experience. Key aspects include:

*   **Dedicated Chat Sessions (`public.chat_sessions` table):**
    *   Each conversation is stored as a distinct session with its own ID, user association, title, status, and timestamps.
    *   This table is the primary source for listing and managing conversations (e.g., recent conversations sidebar).

*   **Chronological Message History (`public.chat_history` table):**
    *   Individual messages (user, assistant, system) are stored with a link to their `chat_session_id`, user ID, role, content, and metadata.
    *   This table serves as the source of truth for reconstructing the flow of a conversation.

*   **Integration with Long-Term Memory (`public.memories` table):**
    *   While `chat_history` stores the raw conversation log, messages intended for long-term recall and semantic search are also processed and saved into the `memories` table.
    *   This involves generating vector embeddings for the message content.
    *   A `source_chat_id` in the `memories` table links back to the original message in `chat_history`.

*   **Key Chat Features:**
    *   **Contextual Conversations:** The AI now considers previous messages within the current active session to provide more relevant and coherent responses.
    *   **Rename Conversation Titles:** Users can edit and save new titles for their chat sessions.
    *   **Start New Chat:** Clear separation of chat sessions, allowing users to start fresh conversations easily.
    *   **Persistent History:** Conversations are saved and can be revisited.

*   **Backend API (`liara-backend/src/index.js`):
    *   Provides endpoints for saving messages (which also handles session creation/updates), fetching conversation lists, fetching messages for a session, and renaming conversation titles.

*   **Frontend Implementation (`src/`):
    *   React components for the chat interface, message display, conversation list, and header (including title editing).
    *   State management via React Context (`MemoryContext`) and custom hooks (`useMemoryState`) to handle chat data, session state, and user interactions.

## Tech Stack (Example - please update)

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS
*   **Backend:** Node.js, Express.js (for `liara-backend`)
*   **Database:** Supabase (PostgreSQL)
*   **AI/LLM:** OpenAI (GPT models)
*   **Vector Embeddings:** OpenAI (`text-embedding-ada-002`)
*   **Supabase Edge Functions:** For serverless logic like `chat-with-liara`.

## Getting Started

(Instructions on how to set up the project, environment variables, run frontend, run backend, etc.)

### Prerequisites

*   Node.js (version X.X.X)
*   npm/yarn
*   Supabase Account & Project
*   OpenAI API Key

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd liara-voice-chat
    ```
2.  **Frontend Setup (`src/` directory):
    ```bash
    # Navigate to frontend root if your main package.json is not there
    # cd frontend_directory_if_separate
    npm install
    # Create .env file and add your Supabase URL and Anon Key, and other necessary client-side vars
    # cp .env.example .env 
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
3.  **Backend Setup (`liara-backend/` directory):
    ```bash
    cd liara-backend
    npm install
    # Create .env file and add your Supabase URL, Service Role Key, OpenAI API Key, PORT, etc.
    # cp .env.example .env
    SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    OPENAI_API_KEY=your_openai_api_key
    PORT=3000
    ```
4.  **Supabase Setup:**
    *   Set up your database schema. Run the migrations located in `supabase/migrations/` using the Supabase CLI: `supabase db push` (after linking your project).
    *   Deploy Edge Functions: `supabase functions deploy chat-with-liara` (and any other functions).
    *   Ensure your API keys (for OpenAI, etc.) are configured in your `api_keys` table or environment variables for Edge Functions.

### Running the Application

1.  **Start the backend server (`liara-backend/`):
    ```bash
    npm start 
    # Or npm run dev, depending on your scripts
    ```
2.  **Start the frontend development server (main project root where `vite.config.ts` is):
    ```bash
    npm run dev
    ```
3.  Open your browser and navigate to `http://localhost:8080` (or your Vite dev port).

## Contributing

(Guidelines for contributing, if any)

## License

(Specify your project's license, e.g., MIT)
