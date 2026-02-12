# Database Table Definitions

Below are the primary tables used by Liara. Column lists are simplified for clarity.

## `chat_sessions`
Metadata for each conversation thread.
```
id (uuid)             – primary key
user_id (uuid)        – owner of the session
guest_session_id      – optional guest link
title (text)          – conversation title
status (text)         – active/archived
created_at, updated_at
```

## `chat_history`
Chronological log of messages within a session.
```
id (uuid)             – primary key
chat_session_id (uuid) – FK to chat_sessions
user_id (uuid)
role (text)           – user | assistant | system
content (text)
metadata (jsonb)
created_at
```

## `memories`
Long‑term memory store with semantic embeddings.
```
id (uuid)             – primary key
content (text)
embedding (vector)
summary (text)
user_id (uuid)
source_chat_id (uuid) – links back to chat_history
importance (real)
role (text)
tags (text[])
metadata (jsonb)
created_at, updated_at
```

Additional tables such as `hard_memory_entries`, `api_keys`, and `personality` support specialized features like factual data storage and user prompts.
