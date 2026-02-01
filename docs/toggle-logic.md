# "Use Memory" Toggle Logic

The chat UI includes a toggle that determines whether each message should be persisted as a searchable memory.

- The toggle state lives in `useMemoryState.tsx` as the `useLongTermMemory` boolean.
- When **on**, `/api/save-memory` generates an embedding and inserts into `memories` in addition to `chat_history`.
- When **off**, messages are only stored in `chat_history` and skipped for embedding.

This allows users to keep transient conversations out of their long‑term memory base.
