# `memories` Table Documentation

The `memories` table stores semantic and contextual memory entries used by Liara, your AI assistant. This table enables long-term memory, personalized context retrieval, and dynamic behavioral shaping for Liara's responses.

---

## 🎯 Purpose

The `memories` table acts as the central semantic memory store for user interactions, system insights, and enriched contextual knowledge. This database is queried via vector search or metadata-based filters to help generate personalized, memory-informed responses.

---

## 📄 Column Descriptions

| Column Name               | Type          | Description                                                                           | Status                             |
| ------------------------- | ------------- | ------------------------------------------------------------------------------------- | ---------------------------------- |
| `id`                      | `uuid`        | Unique identifier for the memory row.                                                 | Required                           |
| `content`                 | `text`        | Main body of the memory. Typically the user or assistant message.                     | Used                               |
| `embedding`               | `vector`      | Vector representation of `content` for semantic search (1536-dim OpenAI compatible).  | Used                               |
| `importance`              | `float4`      | Weight of memory (0.0–10.0), impacts recall priority.                                 | Used                               |
| `timestamp`               | `timestamptz` | Original interaction timestamp (not necessarily the row creation time).               | Used                               |
| `user_id`                 | `uuid`        | FK to the user. Used for multi-user memory separation.                                | Unused (future multi-user support) |
| `related_to`              | `uuid`        | FK to another memory for linking related ideas.                                       | Partially Used                     |
| `source`                  | `text`        | Memory source descriptor (e.g., "chat", "tool", "file"). Required.                    | Used                               |
| `model_version`           | `text`        | Notes the OpenAI or other model version used.                                         | Optional                           |
| `metadata`                | `jsonb`       | Extended metadata object (e.g., location, mood, tags, app source, context hints).     | Unused                             |
| `created_at`              | `timestamptz` | Auto-filled row creation timestamp.                                                   | Used                               |
| `updated_at`              | `timestamptz` | Auto-updated timestamp on row edit.                                                   | Used                               |
| `summary`                 | `text`        | Short, generated summary of the `content`.                                            | Used                               |
| `topic`                   | `text`        | Topic label (e.g., "Cars", "Life", "Tech Support").                                   | Used                               |
| `sentiment`               | `text`        | Mood or emotional tone, often generated via AI (e.g., positive, neutral, frustrated). | Optional                           |
| `type`                    | `text`        | Memory type (e.g., "prompt", "reflection", "question", "memory\_request").            | Used                               |
| `source_type`             | `text`        | Label of source origin, e.g., "chat\_export" or "live\_chat".                         | Used                               |
| `tags`                    | `text`        | Comma-separated tags for filtering, searching.                                        | Optional                           |
| `pinned`                  | `bool`        | If true, memory is always retained and prioritized.                                   | Used                               |
| `reference_links`         | `text`        | Optional text references or URLs.                                                     | Optional                           |
| `reference_to`            | `uuid`        | Links to another memory row (used to group or reply-thread memory).                   | Optional                           |
| `role`                    | `text`        | Message role (e.g., "user", "assistant", "tool").                                     | Used                               |
| `create_time`             | `timestamptz` | Same as `timestamp` but original from export source.                                  | Redundant (can merge)              |
| `message_id`              | `uuid`        | Unique identifier for the original message (from ChatGPT export or tool).             | Used                               |
| `parent_id`               | `uuid`        | For threading or parent-child structures.                                             | Optional                           |
| `conversation_title`      | `text`        | Title of the originating conversation.                                                | Used                               |
| `conversation_start_time` | `timestamptz` | When the conversation began.                                                          | Used                               |

---

## 💡 Future Use / Ideas

* `metadata`: Can be used to store structured data (location, device, user behavior context, etc.)
* `related_to`: Use for linked chains of memory (e.g., stories, procedures)
* `pinned`: Flagged by user as always important (e.g., "Remember my birthday is July 10")
* `model_version`: Useful for auditing response quality or analyzing drift

---

## 🛠️ Usage Example

* Query vector similarity using `embedding`
* Filter memories by `type = 'reflection' AND importance > 5`
* Retrieve pinned entries with `WHERE pinned = true`
* Analyze trends in `topic`, `sentiment`, or `source_type`

---

## ✅ Tips for Importing

* Ensure no nulls in required fields like `source`, `content`, `timestamp`
* Convert all embedding values to valid float strings
* Vector field must be in correct format (e.g., `[0.123, 0.456, ...]` as a single string)

---

Let me know if you want to visualize or export this schema into diagrams, charts, or JSON schema format!
