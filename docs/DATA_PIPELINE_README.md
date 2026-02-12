# 🧠 Liara Data Import & Enrichment Pipeline v0.15.6

This document outlines the complete, user-driven pipeline for importing, enriching, and loading raw ChatGPT conversation exports (`conversations.json`) into the Liara memory system. The entire process is managed through the redesigned "Import Data" page featuring an ultra-compact workflow interface with integrated token estimation.

---

## 📌 Pipeline Overview

The pipeline transforms raw JSON data into structured, vectorized memories through a series of steps controlled by the user on the frontend, with heavy lifting performed by the backend. The v0.15.6 redesign features a compact 2x2 grid layout with integrated token estimation and real-time cost feedback.

### 🎯 New Features in v0.15.6

- **Integrated Token Estimation**: Real-time cost calculation with multi-model support
- **Ultra-Compact Layout**: 2x2 grid design maximizing screen space efficiency  
- **Smart Token Counting**: Only estimates costs for AI-enriched conversations
- **Visual Progress Indicators**: Clear step progression with completion status
- **Professional UX**: Modern design with consistent spacing and typography

```mermaid
graph TD
    subgraph "Frontend: /app/memory/import"
        A[1. User Uploads `conversations.json`] --> B{2. Frontend Parses & Previews Data};
        B --> C{3. User Selects Conversations};
        C --> D[4. User Triggers Enrichment];
        D --> E{5. Live Console Shows Progress};
        E --> F[6. User Triggers Load to Database];
    end

    subgraph "Backend: Node.js API"
        G[/api/import/enrich]
        H[/api/import/load]
        I[/api/import/stream-logs]
    end

    subgraph "External Services"
        J[OpenAI API]
    end
    
    subgraph "Database"
        K[Supabase PostgreSQL]
    end

    D -- "POST" --> G;
    G -- "Calls for embedding, summary, tags" --> J;
    G -- "Streams logs" --> I;
    I -- "Server-Sent Events" --> E;
    F -- "POST with enriched data" --> H;
    H -- "Upserts memories" --> K;

```

---

## 🔧 Stages & Components

### 1. File Upload & Parsing (Frontend)
- **Input**: The user provides a `conversations.json` file exported from ChatGPT.
- **Action**: The frontend parses this file entirely in the browser, validating its structure and organizing it into a list of distinct conversations. This parsed data is then displayed in a preview grid, allowing the user to see every message in every conversation.

### 2. Conversation Selection (Frontend)
- **Action**: The user can review the parsed conversations in the data grid. Using checkboxes, they can select which specific conversations they wish to include in the subsequent enrichment and loading steps.

### 3. Data Enrichment (Backend & OpenAI)
- **Trigger**: The user clicks the "Enrich Selected" button and chooses the scope of the operation (e.g., `10 lines`, `50 conversations`, `All selected`).
- **Endpoint**: `POST /api/import/enrich`
- **Process**:
    1.  The backend receives the raw text of the selected conversations.
    2.  For each user and assistant message, it makes parallel calls to the OpenAI API to generate:
        - A **vector embedding** (`text-embedding-3-small`) for semantic search.
        - A concise **summary** of the message content.
        - A list of relevant **tags**.
    3.  **Code Handling**: Before embedding, any code blocks in assistant messages are replaced with a `[codeblock:language]` tag to avoid token overflow and improve embedding quality. The original code is preserved in the database.
- **Output**: The backend returns the fully enriched data (including embeddings, summaries, and tags) to the frontend.

### 4. Live Status Updates (Backend to Frontend)
- **Endpoint**: `/api/import/stream-logs`
- **Mechanism**: While the enrichment process is running, the backend sends Server-Sent Events (SSE) to the frontend. The "Live Status Console" on the import page listens to this stream and displays real-time log messages, such as "Processing conversation 5 of 20...".

### 5. Loading to Database (Backend & Supabase)
- **Trigger**: The user clicks the "Load to DB" button.
- **Endpoint**: `POST /api/import/load`
- **Action**: The frontend sends the complete dataset (both enriched and non-enriched selected conversations) to the backend. The backend then performs a bulk `upsert` operation into the `memories` table in the Supabase PostgreSQL database.
- **Idempotency**: The `upsert` operation ensures that re-running the load step with the same data will not create duplicate entries. It will instead update existing memories if they have changed.

### 6. Logging and Auditing
- For each enrichment run, the backend generates two files in the `/import` directory for auditing:
    - `enriched-data-[timestamp].json`: The complete, enriched data that was sent to the database.
    - `enrichment-log-[timestamp].json`: A detailed log of every action taken on every message during the enrichment step.

---

## ✅ Final Result

The pipeline concludes with new, structured data in the `memories` table, ready for semantic recall by the Liara AI assistant. The `test_memories` table can also be targeted for safe testing.

---

## 🧬 Core Columns Used

- `full_text` — Raw user or assistant text
- `summary` — Condensed meaning of the entry
- `embedding` — Vector representation (1536d)
- `importance` — Float from 0–10, used in ranking
- `pinned` — Whether it's locked into long-term memory
- `metadata` — JSON with role, filename, timestamp, etc.
- `type`, `tags`, `source_type` — Categorization for later filtering

---

## ✅ Validation Output

If `validate_memory_csv.py` says:
```
✅ All checks passed. File is valid and ready for import!
```
Then you're safe to push to Supabase or memory DB.

---

## 🌱 Future Upgrades

- [ ] Add memory type classifier (question, reflection, command, etc.)
- [ ] Automatic importance scoring via LLM
- [ ] Deduplication before insert
- [ ] Scheduled batch embed/update jobs
- [ ] Integration with LangChain for live semantic querying
- [ ] Embedding fallback detection + reprocess pipeline
- [ ] Optional tagging (`#health`, `#car`, `#project`) from NLP

---

## 🧠 Usage Summary

1. **Export ChatGPT conversation** → save as `.json`
2. Convert to `.csv` (if needed) and run:  
   ```bash
   python clean_memory_csv.py
   ```
3. Embed:
   - Via JavaScript script or call OpenAI directly
4. Validate final result:
   ```bash
   python validate_memory_csv.py
   ```
5. Import `embedded_chat_export_cleaned.csv` into `memory_entries` table

---

## 👩‍💻 Author & Maintainer

Developed by **Kris & Liara**  
This pipeline powers the semantic recall system of the Liara AI assistant.