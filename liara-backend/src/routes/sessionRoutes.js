const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Session storage directory
const SESSIONS_DIR = path.join(__dirname, '../../import/sessions');
const ARCHIVE_DIR = path.join(__dirname, '../../import/archive');
const TEMP_DIR = path.join(__dirname, '../../import/temp');

// Ensure directories exist
const ensureDirectories = async () => {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  await fs.mkdir(TEMP_DIR, { recursive: true });
};

// Generate session path
const generateSessionPath = (sessionName, timestamp) => {
  const date = new Date(timestamp).toISOString().split('T')[0];
  const time = new Date(timestamp).toTimeString().slice(0, 8).replace(/:/g, '');
  const sanitizedName = sessionName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  return path.join(SESSIONS_DIR, date, `${sanitizedName}-${time}`);
};

// Create session metadata
const createSessionMetadata = (sessionData) => ({
  id: sessionData.id,
  name: sessionData.name,
  timestamp: sessionData.timestamp,
  status: sessionData.status || 'processing',
  files: sessionData.files || {},
  metadata: {
    totalConversations: sessionData.metadata?.totalConversations || 0,
    processedConversations: sessionData.metadata?.processedConversations || 0,
    enrichedConversations: sessionData.metadata?.enrichedConversations || 0,
    loadedConversations: sessionData.metadata?.loadedConversations || 0,
    estimatedCost: sessionData.metadata?.estimatedCost || 0,
    actualCost: sessionData.metadata?.actualCost || 0,
    processingTime: sessionData.metadata?.processingTime || 0
  },
  config: sessionData.config || {}
});

// GET /api/import/sessions - List all sessions
router.get('/sessions', async (req, res) => {
  try {
    await ensureDirectories();
    
    const sessions = [];
    const dateDirs = await fs.readdir(SESSIONS_DIR);
    
    for (const dateDir of dateDirs) {
      const datePath = path.join(SESSIONS_DIR, dateDir);
      const stat = await fs.stat(datePath);
      
      if (stat.isDirectory()) {
        const sessionDirs = await fs.readdir(datePath);
        
        for (const sessionDir of sessionDirs) {
          const sessionPath = path.join(datePath, sessionDir);
          const metadataPath = path.join(sessionPath, 'metadata.json');
          
          try {
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            const sessionData = JSON.parse(metadataContent);
            sessions.push(createSessionMetadata(sessionData));
          } catch (error) {
            console.warn(`Failed to read session metadata: ${sessionPath}`, error.message);
          }
        }
      }
    }
    
    // Sort by timestamp, newest first
    sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({ sessions });
  } catch (error) {
    console.error('Failed to list sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// POST /api/import/sessions - Create new session
router.post('/sessions', async (req, res) => {
  try {
    const { name, config } = req.body;
    const timestamp = new Date();
    const sessionId = `session-${Date.now()}`;
    
    const sessionData = {
      id: sessionId,
      name: name || `Import ${timestamp.toLocaleDateString()}`,
      timestamp: timestamp.toISOString(),
      status: 'processing',
      files: {},
      metadata: {
        totalConversations: 0,
        processedConversations: 0,
        enrichedConversations: 0,
        loadedConversations: 0,
        estimatedCost: 0
      },
      config: config || {}
    };
    
    const sessionPath = generateSessionPath(sessionData.name, timestamp);
    await fs.mkdir(sessionPath, { recursive: true });
    
    // Create logs directory
    const logsPath = path.join(sessionPath, 'logs');
    await fs.mkdir(logsPath, { recursive: true });
    
    // Save metadata
    const metadataPath = path.join(sessionPath, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(sessionData, null, 2));
    
    res.json({ 
      session: createSessionMetadata(sessionData),
      path: sessionPath 
    });
  } catch (error) {
    console.error('Failed to create session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /api/import/sessions/:id - Get session details
router.get('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await findSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ session: createSessionMetadata(session.data) });
  } catch (error) {
    console.error('Failed to get session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// PUT /api/import/sessions/:id - Update session
router.put('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const updates = req.body;
    
    const session = await findSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const updatedData = { ...session.data, ...updates };
    const metadataPath = path.join(session.path, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(updatedData, null, 2));
    
    res.json({ session: createSessionMetadata(updatedData) });
  } catch (error) {
    console.error('Failed to update session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// POST /api/import/sessions/:id/archive - Archive session
router.post('/sessions/:id/archive', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await findSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Update status to archived
    const updatedData = { ...session.data, status: 'archived' };
    const metadataPath = path.join(session.path, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(updatedData, null, 2));
    
    // Move to archive directory
    const archivePath = path.join(ARCHIVE_DIR, path.basename(session.path));
    await fs.rename(session.path, archivePath);
    
    res.json({ 
      message: 'Session archived successfully',
      session: createSessionMetadata(updatedData)
    });
  } catch (error) {
    console.error('Failed to archive session:', error);
    res.status(500).json({ error: 'Failed to archive session' });
  }
});

// DELETE /api/import/sessions/:id - Delete session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await findSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Remove session directory
    await fs.rm(session.path, { recursive: true, force: true });
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Failed to delete session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// POST /api/import/sessions/:id/export - Export session data
router.post('/sessions/:id/export', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await findSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Create export package
    const exportData = {
      session: session.data,
      files: {}
    };
    
    // Read all session files
    const files = ['original.json', 'preprocessed.json', 'enriched.json', 'loaded.json'];
    for (const filename of files) {
      const filePath = path.join(session.path, filename);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        exportData.files[filename] = JSON.parse(content);
      } catch (error) {
        // File doesn't exist, skip it
      }
    }
    
    res.json(exportData);
  } catch (error) {
    console.error('Failed to export session:', error);
    res.status(500).json({ error: 'Failed to export session' });
  }
});

// POST /api/import/sessions/:id/load - Load session data into current workflow
router.post('/sessions/:id/load', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await findSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Read the enriched data file
    const enrichedPath = path.join(session.path, 'enriched.json');
    const enrichedContent = await fs.readFile(enrichedPath, 'utf8');
    const enrichedData = JSON.parse(enrichedContent);
    
    res.json({ 
      message: 'Session loaded successfully',
      data: enrichedData,
      session: createSessionMetadata(session.data)
    });
  } catch (error) {
    console.error('Failed to load session:', error);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

// POST /api/import/sessions/cleanup - Clean up old sessions
router.post('/sessions/cleanup', async (req, res) => {
  try {
    const { olderThanDays = 30, status = 'completed' } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let cleanedCount = 0;
    const dateDirs = await fs.readdir(SESSIONS_DIR);
    
    for (const dateDir of dateDirs) {
      const datePath = path.join(SESSIONS_DIR, dateDir);
      const sessionDirs = await fs.readdir(datePath);
      
      for (const sessionDir of sessionDirs) {
        const sessionPath = path.join(datePath, sessionDir);
        const metadataPath = path.join(sessionPath, 'metadata.json');
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf8');
          const sessionData = JSON.parse(metadataContent);
          const sessionDate = new Date(sessionData.timestamp);
          
          if (sessionDate < cutoffDate && sessionData.status === status) {
            await fs.rm(sessionPath, { recursive: true, force: true });
            cleanedCount++;
          }
        } catch (error) {
          console.warn(`Failed to process session: ${sessionPath}`, error.message);
        }
      }
    }
    
    res.json({ 
      message: `Cleaned up ${cleanedCount} sessions`,
      cleanedCount 
    });
  } catch (error) {
    console.error('Failed to cleanup sessions:', error);
    res.status(500).json({ error: 'Failed to cleanup sessions' });
  }
});

// Helper function to find session by ID
const findSession = async (sessionId) => {
  const dateDirs = await fs.readdir(SESSIONS_DIR);
  
  for (const dateDir of dateDirs) {
    const datePath = path.join(SESSIONS_DIR, dateDir);
    const sessionDirs = await fs.readdir(datePath);
    
    for (const sessionDir of sessionDirs) {
      const sessionPath = path.join(datePath, sessionDir);
      const metadataPath = path.join(sessionPath, 'metadata.json');
      
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        const sessionData = JSON.parse(metadataContent);
        
        if (sessionData.id === sessionId) {
          return { data: sessionData, path: sessionPath };
        }
      } catch (error) {
        // Skip invalid sessions
      }
    }
  }
  
  return null;
};

module.exports = router; 