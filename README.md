# Liara Lite

Liara Lite lets you **explore and search your ChatGPT conversations** in a visual, intuitive way.

You export your chats (e.g. from ChatGPT’s export), we add extra structure and context (tags, named entities), and present it so you can browse your data and conversations contextually—while staying searchable and easy to read.

**Import → Enrich → Explore**

- **Import**: Your exported ChatGPT JSON (or similar conversation export)
- **Enrich**: AI adds tags and entities to each message (OpenAI key required)
- **Explore**: Tag clouds, entity graphs, matching conversations, and jump‑through matches

All processing runs on your machine. Outputs go to a local `import/` folder (gitignored).

## Quick start

```bash
npm install
cd liara-backend && npm install
cd ..
npm run liara:lite
```

Open `http://localhost:8080`.

### One-click launchers (Windows)

- **Liara Lite**: double-click `scripts\Start-Liara-Lite.bat` (no Docker required)
- **Liara Full**: double-click `scripts\Start-Liara-Full.bat` (needs Docker Desktop for Supabase)
- **Desktop shortcuts**: run `.\scripts\Create-Desktop-Shortcuts.ps1` to create shortcut icons on your Desktop

## How it works (short)

- **Import**: pick a source JSON (e.g. ChatGPT `conversations.json`)
- **Preprocess**: normalizes structure into `import/preprocessed/*.json`
- **Enrich**: backend calls OpenAI (your key) to annotate messages with:
  - `messages[].tags`
  - `messages[].named_entities` (PERSON/ORG/LOC/DATE/…)
  - writes `import/enriched/enriched-data-*.json` + `import/enrichment-log-*.json`
- **Explore**:
  - Data Explorer reads the enriched JSON directly (no DB required)
  - Maps Lab uses the same token index + tuning settings

## Run commands (Windows-friendly)

- **All-in-one**:

```bash
npm run liara:lite
```

- **Two terminals (faster/more reliable)**:

```bash
# Terminal A
npm run liara:lite:supabase
```

```bash
# Terminal B
npm run liara:lite:app
```

For long enrich runs:

```bash
npm run liara:lite:app:stable
```

## Docs

- Lite guide (recommended): `README_LIARA_LITE.md`
- Pipeline internals: `docs/DATA_PIPELINE_README.md`

## Privacy

The following are **gitignored** and should never be committed:

- `import/preprocessed/`
- `import/enriched/`
- `import/enrichment-log*.json`

## About

Liara Lite is standalone and self-contained. It shares code with a larger project (memory DB, semantic search, etc.); see `docs/` if you’re interested in that.
