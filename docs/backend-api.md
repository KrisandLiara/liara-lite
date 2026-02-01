# Backend: API Endpoints

A detailed breakdown of the available API endpoints, their functions, expected inputs, and outputs.

## `/api/chat-sessions`

Handles operations related to chat conversations. All routes are authenticated.

### `GET /:id/messages`
- **Description**: Fetches the data required to display a full chat session.
- **Key Logic**: This endpoint now correctly retrieves data from multiple sources:
    1. It fetches the `title` of the conversation directly from the `chat_sessions` table.
    2. It fetches the paginated list of individual chat messages from the `chat_history` table.
    3. **Crucially, it fetches the `tags` and `summary` from the associated "conversation summary" record in the `memories` table.** This resolves a previous bug where it was incorrectly trying to read from a non-existent `metadata` column on the `chat_sessions` table.

### `POST /:id/generate-details`
- **Description**: Generates a topic, summary, and tags for an entire conversation, creates a memory of it, and updates the session title.
- **Key Logic**: This endpoint was corrected to only update the `title` of the record in the `chat_sessions` table with the newly generated topic. It no longer attempts to write tags and summary data to the `chat_sessions` table, which was causing an error due to the non-existent `metadata` column. All generated details are correctly stored in the `memories` table. 