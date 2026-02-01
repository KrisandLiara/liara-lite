import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { enrichConversations } from '../import/enricher.js';
import { loadConversations } from '../import/loader.js';
import { supabase } from '../clients.js';

const router = express.Router();

const LITE_USER_ID = process.env.LIARA_LITE_USER_ID || '00000000-0000-0000-0000-000000000001';

// --- Import file storage (same layout as main app) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../../../');

// By default we store files under "<repo>/import".
// Override with LIARA_LITE_IMPORT_DIR:
// - absolute path: used as-is
// - relative path: resolved relative to repo root
const IMPORT_DIR = (() => {
  const override = String(process.env.LIARA_LITE_IMPORT_DIR || '').trim();
  if (!override) return path.join(REPO_ROOT, 'import');
  return path.isAbsolute(override) ? override : path.resolve(REPO_ROOT, override);
})();
const ENRICHED_DIR = path.join(IMPORT_DIR, 'enriched');
const PREPROCESSED_DIR = path.join(IMPORT_DIR, 'preprocessed');
const getFilePath = (fileName, dir) => path.join(dir, fileName);

const ensureImportDirs = async () => {
  try { await fs.access(IMPORT_DIR); } catch { await fs.mkdir(IMPORT_DIR, { recursive: true }); }
  try { await fs.access(ENRICHED_DIR); } catch { await fs.mkdir(ENRICHED_DIR, { recursive: true }); }
  try { await fs.access(PREPROCESSED_DIR); } catch { await fs.mkdir(PREPROCESSED_DIR, { recursive: true }); }
};

// GET /api/lite/storage-info
// Helps the UI show where preprocessed/enriched files are read/written.
router.get('/storage-info', async (_req, res) => {
  res.json({
    importDir: IMPORT_DIR,
    preprocessedDir: PREPROCESSED_DIR,
    enrichedDir: ENRICHED_DIR,
  });
});

// GET /api/lite/db/status
// Returns basic connectivity info for the optional "Local Supabase" mode.
router.get('/db/status', async (_req, res) => {
  try {
    const hasUrl = Boolean(process.env.SUPABASE_URL);
    const hasKey = Boolean(process.env.SUPABASE_KEY);

    if (!hasUrl || !hasKey) {
      return res.json({ ok: false, hasUrl, hasKey, error: 'SUPABASE_URL / SUPABASE_KEY not configured' });
    }

    // Service-role key is recommended for Lite because it bypasses RLS and avoids auth complexity.
    const looksLikeServiceRole = String(process.env.SUPABASE_KEY).includes('service_role');

    if (!supabase) {
      return res.json({ ok: false, hasUrl, hasKey, looksLikeServiceRole, error: 'Supabase client not initialized' });
    }

    const { error } = await supabase.from('memories').select('id').limit(1);

    if (error) {
      return res.json({ ok: false, hasUrl, hasKey, looksLikeServiceRole, error: error.message });
    }

    return res.json({ ok: true, hasUrl, hasKey, looksLikeServiceRole });
  } catch (err) {
    console.error('Error in GET /api/lite/db/status:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// --- File APIs (Lite) ---

// GET /api/lite/preprocessed-files
router.get('/preprocessed-files', async (_req, res) => {
  await ensureImportDirs();
  try {
    const allFiles = await fs.readdir(PREPROCESSED_DIR);
    res.json(allFiles.sort().reverse());
  } catch (error) {
    console.error('[/api/lite/preprocessed-files]: Failed to list files:', error);
    res.status(500).json({ error: 'Failed to list preprocessed files.' });
  }
});

// GET /api/lite/enriched-files
router.get('/enriched-files', async (_req, res) => {
  await ensureImportDirs();
  try {
    const allFiles = await fs.readdir(ENRICHED_DIR);
    res.json(allFiles.sort().reverse());
  } catch (error) {
    console.error('[/api/lite/enriched-files]: Failed to list files:', error);
    res.status(500).json({ error: 'Failed to list enriched files.' });
  }
});

// DELETE /api/lite/preprocessed-files/:filename
router.delete('/preprocessed-files/:filename', async (req, res) => {
  await ensureImportDirs();
  const { filename } = req.params;
  const sanitized = path.basename(filename);
  if (sanitized !== filename) return res.status(400).json({ error: 'Invalid filename.' });
  try {
    const filePath = getFilePath(sanitized, PREPROCESSED_DIR);
    if (path.dirname(filePath) !== PREPROCESSED_DIR) return res.status(403).json({ error: 'Access denied.' });
    await fs.unlink(filePath);
    res.json({ ok: true });
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: 'File not found.' });
    console.error('[/api/lite/preprocessed-files]: delete failed:', error);
    res.status(500).json({ error: 'Failed to delete preprocessed file.' });
  }
});

// DELETE /api/lite/enriched-files/:filename
router.delete('/enriched-files/:filename', async (req, res) => {
  await ensureImportDirs();
  const { filename } = req.params;
  const sanitized = path.basename(filename);
  if (sanitized !== filename) return res.status(400).json({ error: 'Invalid filename.' });
  try {
    const filePath = getFilePath(sanitized, ENRICHED_DIR);
    if (path.dirname(filePath) !== ENRICHED_DIR) return res.status(403).json({ error: 'Access denied.' });
    await fs.unlink(filePath);
    res.json({ ok: true });
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: 'File not found.' });
    console.error('[/api/lite/enriched-files]: delete failed:', error);
    res.status(500).json({ error: 'Failed to delete enriched file.' });
  }
});

// GET /api/lite/file-content?fileName=...&from=enriched|preprocessed
router.get('/file-content', async (req, res) => {
  await ensureImportDirs();
  const { fileName, from } = req.query;
  if (!fileName) return res.status(400).json({ error: 'fileName is required' });
  try {
    let dir = IMPORT_DIR;
    if (from === 'enriched') dir = ENRICHED_DIR;
    if (from === 'preprocessed') dir = PREPROCESSED_DIR;
    const filePath = getFilePath(String(fileName), dir);
    if (path.dirname(filePath) !== dir) return res.status(403).json({ error: 'Access denied.' });
    const content = await fs.readFile(filePath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: 'File not found.' });
    console.error('[/api/lite/file-content]: read failed:', error);
    res.status(500).json({ error: 'Failed to read file content.' });
  }
});

// POST /api/lite/save-preprocessed
router.post('/save-preprocessed', async (req, res) => {
  await ensureImportDirs();
  const { data, originalFileName } = req.body || {};
  const timestamp = Date.now();
  const safeOriginalName = String(originalFileName || 'conversations')
    .replace('.json', '')
    .replace(/[^a-zA-Z0-9]/g, '_');
  const newFileName = `preprocessed_conversations_${timestamp}.json`;
  try {
    await fs.writeFile(getFilePath(newFileName, PREPROCESSED_DIR), JSON.stringify(data || [], null, 2));
    res.json({ message: 'Preprocessed file saved successfully.', fileName: newFileName, original: safeOriginalName });
  } catch (error) {
    console.error('[/api/lite/save-preprocessed]: Failed to save file:', error);
    res.status(500).json({ error: 'Failed to save preprocessed file.' });
  }
});

// POST /api/lite/enrich-stream
router.post('/enrich-stream', async (req, res) => {
  await ensureImportDirs();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Heartbeat so the UI can show "still running" even during long OpenAI calls
  const hb = setInterval(() => {
    try {
      sendEvent({ type: 'heartbeat', t: Date.now() });
    } catch {
      // ignore
    }
  }, 10_000);
  req.on('close', () => clearInterval(hb));

  const openaiApiKey = String(req.headers['x-openai-key'] || '').trim();
  const { preprocessedFileName, model, generateTopics, enableNER, nerUserOnly } = req.body || {};
  if (!preprocessedFileName) {
    sendEvent({ type: 'error', message: 'Request body must contain preprocessedFileName.' });
    return res.end();
  }

  try {
    const filePath = getFilePath(String(preprocessedFileName), PREPROCESSED_DIR);
    if (path.dirname(filePath) !== PREPROCESSED_DIR) {
      sendEvent({ type: 'error', message: 'Access denied.' });
      return res.end();
    }
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const conversations = JSON.parse(fileContent);

    const timestamp = Date.now();
    const enrichedDataFileName = `enriched-data-${timestamp}.json`;

    sendEvent({ type: 'log', message: `Starting enrichment...` });
    const { enriched, errors, detailedLogs, failedEnrichments } = await enrichConversations(
      conversations,
      sendEvent,
      model || 'gpt-4o-mini',
      Boolean(generateTopics),
      Boolean(enableNER),
      Boolean(nerUserOnly),
      { openaiApiKey: openaiApiKey || undefined }
    );

    const enrichedDataPath = getFilePath(enrichedDataFileName, ENRICHED_DIR);
    await fs.writeFile(enrichedDataPath, JSON.stringify(enriched, null, 2));

    sendEvent({
      type: 'done',
      payload: {
        enrichedFileName: enrichedDataFileName,
        errors,
        enrichedCount: enriched.length,
        errorCount: errors.length,
        failedEnrichments,
        detailedLogsCount: detailedLogs.length,
      },
    });
  } catch (error) {
    console.error('[/api/lite/enrich-stream]: error:', error);
    sendEvent({ type: 'error', message: error?.message || 'Server error' });
  } finally {
    clearInterval(hb);
    res.end();
  }
});

// POST /api/lite/enrich
// Body: { conversations: any[], model?, generateTopics?, enableNER?, nerUserOnly? }
// Header: x-openai-key (recommended)
router.post('/enrich', async (req, res) => {
  try {
    const openaiApiKey = String(req.headers['x-openai-key'] || '').trim();
    const { conversations, model, generateTopics = true, enableNER = false, nerUserOnly = false } = req.body || {};

    if (!Array.isArray(conversations) || conversations.length === 0) {
      return res.status(400).json({ error: 'conversations must be a non-empty array' });
    }

    const { enriched, errors, detailedLogs, failedEnrichments } = await enrichConversations(
      conversations,
      () => {}, // no SSE here for lite; keep it simple
      model || 'gpt-4o-mini',
      Boolean(generateTopics),
      Boolean(enableNER),
      Boolean(nerUserOnly),
      { openaiApiKey: openaiApiKey || undefined }
    );

    res.json({ enriched, errors, detailedLogs, failedEnrichments });
  } catch (err) {
    console.error('Error in POST /api/lite/enrich:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/lite/load
// Body: { conversations: any[], isTest?: boolean }
router.post('/load', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(400).json({
        error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_KEY (service_role) for DB loading.',
      });
    }
    const { conversations, isTest = false, fileName } = req.body || {};
    if (fileName && !conversations) {
      await ensureImportDirs();
      const filePath = getFilePath(String(fileName), ENRICHED_DIR);
      if (path.dirname(filePath) !== ENRICHED_DIR) return res.status(403).json({ error: 'Access denied.' });
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      const { insertedCount } = await loadConversations(parsed, LITE_USER_ID, Boolean(isTest));
      return res.json({ insertedCount });
    }
    if (!Array.isArray(conversations) || conversations.length === 0) {
      return res.status(400).json({ error: 'conversations must be a non-empty array' });
    }
    const { insertedCount } = await loadConversations(conversations, LITE_USER_ID, Boolean(isTest));
    res.json({ insertedCount });
  } catch (err) {
    console.error('Error in POST /api/lite/load:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/lite/clear-test-memories
router.post('/clear-test-memories', async (_req, res) => {
  try {
    if (!supabase) return res.status(400).json({ error: 'SUPABASE_URL / SUPABASE_KEY not configured' });
    const { error } = await supabase.from('test_memories').delete().eq('user_id', LITE_USER_ID);
    if (error) throw error;
    res.json({ deletedCount: 0 });
  } catch (err) {
    console.error('Error in POST /api/lite/clear-test-memories:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

