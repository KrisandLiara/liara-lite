# Liara Lite (local demo)

Liara Lite is a **no-auth**, **local-only** demo build focused on the cornerstone workflow:

**Setup → Import → Enrich → Explore**

## Run

1. Install deps:

```bash
npm install
cd liara-backend && npm install
cd ..
```

2. Start everything (Supabase + backend + frontend) in lite mode:

```bash
npm run liara:lite
```

3. Open:

- `http://localhost:8080`

## How it works (brief)

### What you import
- A raw ChatGPT export (commonly `conversations.json`) or another supported source JSON.

### What Liara Lite produces
Liara Lite writes generated artifacts to disk (default `import/` folder):

- **Preprocessed** (normalized structure):
  - `import/preprocessed/preprocessed_conversations_<timestamp>.json`
- **Enriched** (adds analysis per message):
  - `import/enriched/enriched-data-<timestamp>.json`
- **Enrichment logs** (audit / troubleshooting):
  - `import/enrichment-log-<timestamp>.json` (and sometimes `*-failed-*.json`)

These folders are **gitignored** by default.

### What “enrichment” adds
Enrichment runs through the backend and annotates each message with extra fields used by the UI:

- **Tags**: `messages[].tags` (topic/intent/style labels; can be literal or semantic)
- **Named entities**: `messages[].named_entities` (NER grouped by category: PERSON / ORG / LOC / DATE / …)

The Lite UI asks you for an **OpenAI API key** and sends it to the backend as `x-openai-key` for enrichment calls.

### How Data Explorer reads the file
Data Explorer loads an `enriched-data-*.json` and:

- builds tag/entity counts directly from `messages[].tags` and `messages[].named_entities`
- shows **Matching Conversations** by scanning messages for the selected token
- builds the **Type 3 Entity Explorer** graph by computing a token index + co-occurrence from the loaded file

Tuning is shared with Maps Lab and persisted locally (browser storage), so your knobs stick across sessions.

## Recommended: 2 terminals (faster + more reliable on Windows)

Terminal A (Supabase only):

```bash
npm run liara:lite:supabase
```

Terminal B (frontend + backend only):

```bash
npm run liara:lite:app
```

For long enrich runs (avoids backend restarts mid-stream):

```bash
npm run liara:lite:app:stable
```

## Notes

- **No authentication**: lite mode bypasses auth middleware and uses a fixed local user id.
- **OpenAI key**: you paste it into the Lite UI. It is sent to the backend as `x-openai-key` for enrichment requests.
- **Database mode**:
  - **File-only (default)**: simplest demo (no Supabase required). **Enrichment + Tag Cloud work fully**.
  - **Local Supabase (optional)**: persistence (loads enriched data into local DB). If “DB status” shows *Not ready*, set backend env vars:
    - `SUPABASE_URL` = your local project URL (shown by `supabase status`)
    - `SUPABASE_KEY` = your local `service_role` key (shown by `supabase status`)

- **Where files are saved**:
  - Preprocessed: `import/preprocessed/preprocessed_conversations_<timestamp>.json`
  - Enriched: `import/enriched/enriched-data-<timestamp>.json`
  - Override the base folder with `LIARA_LITE_IMPORT_DIR` (absolute path, or relative to repo root).

- **Privacy**: `import/preprocessed/` and `import/enriched/` are gitignored by default. Do not commit exports or enriched outputs.

## More details

- Pipeline internals: `docs/DATA_PIPELINE_README.md`
