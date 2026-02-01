# Backend Overview

This section covers the architecture and implementation of the Liara backend server.

## Core Structure

The backend is a standard Node.js server using the Express.js framework. It is responsible for:
- Authenticating users via JWTs provided by Supabase Auth.
- Providing a RESTful API for all frontend operations (chat, memory, etc.).
- Interacting with the Supabase database.
- Calling the OpenAI API for embeddings and chat completions.

## Modular Routing

To improve maintainability and prevent critical errors like the one encountered on 2025-06-13, the backend's routing logic has been completely refactored.

Previously, all API routes were defined in the main `index.js` file. Now, routes are organized into separate, modular files located in the `liara-backend/src/routes/` directory:

- **`chatSessionRoutes.js`**: Handles all endpoints related to chat conversations, such as fetching recent chats, loading messages for a session, and generating conversation details.
- **`memoryRoutes.js`**: Handles all endpoints for creating, reading, updating, deleting, and searching long-term memories.
- **`systemDocsRoutes.js`**: A simple router responsible for serving the markdown files for this System Overview documentation.

The main `index.js` file is now only responsible for initializing the Express app, applying middleware, and importing these router modules. This separation of concerns makes the codebase cleaner, easier to debug, and more robust against configuration errors. 