# Frontend Component Architecture

The React SPA is organized around context providers and reusable UI pieces.

## Key Components

- **`AppLayout.tsx`** – Wraps pages with header, sidebar, and main content area.
- **`Sidebar.tsx`** – Shows either recent conversations or the System Overview navigation depending on route.
- **`ChatPage.tsx`** – Container for the chat interface including message list and input box.
- **`MemoryManager` pages/components** – CRUD interface for long‑term memories.
- **`SystemOverviewPage.tsx`** – Admin-only documentation hub that loads markdown sections via `EditableSectionContent`.

## Important Hooks

- **`useMemoryState`** – Central state and API interaction logic (chat sessions, saving messages, searching memories, pagination, etc.).
- **`useMemorySearch`** – Handles vector search and Q&A requests.
- **`useAuth`** – Wraps Supabase auth session management and exposes `signIn`/`signOut` helpers.

The application relies heavily on React Context to share these hooks across components.
