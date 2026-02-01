#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Directories
const IMPORT_DIR = path.join(__dirname, '../import');
const SESSIONS_DIR = path.join(IMPORT_DIR, 'sessions');
const ARCHIVE_DIR = path.join(IMPORT_DIR, 'archive');
const TEMP_DIR = path.join(IMPORT_DIR, 'temp');

// File patterns
const PREPROCESSED_PATTERN = /^preprocessed_conversations_(\d+)\.json$/;
const ENRICHED_PATTERN = /^enriched-data-(\d+)\.json$/;
const LOG_PATTERN = /^enrichment-log-(\d+)\.json$/;
const FAILED_LOG_PATTERN = /^enrichment-log-failed-(\d+)\.json$/;

async function ensureDirectories() {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  await fs.mkdir(TEMP_DIR, { recursive: true });
}

async function parseTimestamp(filename) {
  const preprocessedMatch = filename.match(PREPROCESSED_PATTERN);
  const enrichedMatch = filename.match(ENRICHED_PATTERN);
  const logMatch = filename.match(LOG_PATTERN);
  const failedLogMatch = filename.match(FAILED_LOG_PATTERN);
  
  const timestampStr = preprocessedMatch?.[1] || enrichedMatch?.[1] || logMatch?.[1] || failedLogMatch?.[1];
  
  if (timestampStr) {
    return new Date(parseInt(timestampStr));
  }
  
  return null;
}

async function getFileType(filename) {
  if (PREPROCESSED_PATTERN.test(filename)) return 'preprocessed';
  if (ENRICHED_PATTERN.test(filename)) return 'enriched';
  if (LOG_PATTERN.test(filename)) return 'processing-log';
  if (FAILED_LOG_PATTERN.test(filename)) return 'failed-log';
  return 'unknown';
}

async function groupFilesByTimestamp() {
  const files = await fs.readdir(IMPORT_DIR);
  const groups = new Map();
  
  for (const filename of files) {
    const filePath = path.join(IMPORT_DIR, filename);
    const stat = await fs.stat(filePath);
    
    if (stat.isFile()) {
      const timestamp = await parseTimestamp(filename);
      const fileType = await getFileType(filename);
      
      if (timestamp && fileType !== 'unknown') {
        const key = timestamp.getTime();
        
        if (!groups.has(key)) {
          groups.set(key, {
            timestamp,
            files: []
          });
        }
        
        groups.get(key).files.push({
          filename,
          type: fileType,
          path: filePath
        });
      }
    }
  }
  
  return groups;
}

async function createSession(timestamp, files) {
  const sessionId = `session-${timestamp.getTime()}`;
  const date = timestamp.toISOString().split('T')[0];
  const time = timestamp.toTimeString().slice(0, 8).replace(/:/g, '');
  
  // Determine session name based on files
  let sessionName = 'unknown-import';
  let totalConversations = 0;
  let status = 'failed';
  
  // Try to read preprocessed file for metadata
  const preprocessedFile = files.find(f => f.type === 'preprocessed');
  if (preprocessedFile) {
    try {
      const content = await fs.readFile(preprocessedFile.path, 'utf8');
      const data = JSON.parse(content);
      totalConversations = Array.isArray(data) ? data.length : 0;
      
      // Determine session name
      if (totalConversations <= 10) {
        sessionName = 'quick-test';
      } else if (totalConversations <= 50) {
        sessionName = 'standard-import';
      } else {
        sessionName = 'full-import';
      }
      
      status = 'processing';
    } catch (error) {
      console.warn(`Failed to read preprocessed file: ${preprocessedFile.filename}`);
    }
  }
  
  // Check if enriched file exists
  const enrichedFile = files.find(f => f.type === 'enriched');
  if (enrichedFile) {
    status = 'completed';
  }
  
  // Check for failed logs
  const failedLogFile = files.find(f => f.type === 'failed-log');
  if (failedLogFile) {
    status = 'failed';
  }
  
  // Create session directory
  const sessionPath = path.join(SESSIONS_DIR, date, `${sessionName}-${time}`);
  await fs.mkdir(sessionPath, { recursive: true });
  
  // Create logs directory
  const logsPath = path.join(sessionPath, 'logs');
  await fs.mkdir(logsPath, { recursive: true });
  
  // Move files to session directory
  const sessionFiles = {};
  
  for (const file of files) {
    let targetFilename;
    let targetDir = sessionPath;
    
    switch (file.type) {
      case 'preprocessed':
        targetFilename = 'preprocessed.json';
        sessionFiles.preprocessed = targetFilename;
        break;
      case 'enriched':
        targetFilename = 'enriched.json';
        sessionFiles.enriched = targetFilename;
        break;
      case 'processing-log':
        targetFilename = 'processing.log';
        targetDir = logsPath;
        break;
      case 'failed-log':
        targetFilename = 'failed.log';
        targetDir = logsPath;
        break;
      default:
        continue;
    }
    
    const targetPath = path.join(targetDir, targetFilename);
    await fs.rename(file.path, targetPath);
    console.log(`Moved: ${file.filename} → ${path.relative(IMPORT_DIR, targetPath)}`);
  }
  
  // Create session metadata
  const sessionData = {
    id: sessionId,
    name: `${sessionName} (${date})`,
    timestamp: timestamp.toISOString(),
    status,
    files: sessionFiles,
    metadata: {
      totalConversations,
      processedConversations: totalConversations,
      enrichedConversations: status === 'completed' ? totalConversations : 0,
      loadedConversations: 0,
      estimatedCost: 0,
      actualCost: 0,
      processingTime: 0
    },
    config: {
      migrated: true,
      originalTimestamp: timestamp.getTime()
    }
  };
  
  // Save metadata
  const metadataPath = path.join(sessionPath, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(sessionData, null, 2));
  
  console.log(`Created session: ${sessionData.name} (${sessionId})`);
  return sessionData;
}

async function cleanupOrphanedFiles() {
  const files = await fs.readdir(IMPORT_DIR);
  const orphanedFiles = [];
  
  for (const filename of files) {
    const filePath = path.join(IMPORT_DIR, filename);
    const stat = await fs.stat(filePath);
    
    if (stat.isFile()) {
      const timestamp = await parseTimestamp(filename);
      const fileType = await getFileType(filename);
      
      if (!timestamp || fileType === 'unknown') {
        orphanedFiles.push({ filename, path: filePath });
      }
    }
  }
  
  if (orphanedFiles.length > 0) {
    console.log(`\nFound ${orphanedFiles.length} orphaned files:`);
    
    for (const file of orphanedFiles) {
      console.log(`  - ${file.filename}`);
      
      // Move to temp directory
      const tempPath = path.join(TEMP_DIR, file.filename);
      await fs.rename(file.path, tempPath);
      console.log(`    Moved to temp: ${path.relative(IMPORT_DIR, tempPath)}`);
    }
  }
}

async function generateReport(sessions) {
  console.log('\n📊 Migration Report:');
  console.log('='.repeat(50));
  
  const statusCounts = {};
  let totalConversations = 0;
  
  for (const session of sessions) {
    statusCounts[session.status] = (statusCounts[session.status] || 0) + 1;
    totalConversations += session.metadata.totalConversations;
  }
  
  console.log(`Total sessions migrated: ${sessions.length}`);
  console.log(`Total conversations: ${totalConversations}`);
  console.log('\nSession status breakdown:');
  
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  ${status}: ${count}`);
  }
  
  console.log('\n📁 New directory structure:');
  console.log(`${IMPORT_DIR}/`);
  console.log(`├── sessions/`);
  console.log(`│   ├── 2025-01-31/`);
  console.log(`│   │   ├── quick-test-143952/`);
  console.log(`│   │   │   ├── metadata.json`);
  console.log(`│   │   │   ├── preprocessed.json`);
  console.log(`│   │   │   ├── enriched.json`);
  console.log(`│   │   │   └── logs/`);
  console.log(`│   │   │       ├── processing.log`);
  console.log(`│   │   │       └── failed.log`);
  console.log(`│   │   └── [other sessions...]`);
  console.log(`├── archive/`);
  console.log(`├── temp/`);
  console.log(`└── [remaining files...]`);
}

async function main() {
  try {
    console.log('🧹 Starting import files cleanup and migration...\n');
    
    // Ensure directories exist
    await ensureDirectories();
    
    // Group files by timestamp
    console.log('📂 Analyzing existing files...');
    const fileGroups = await groupFilesByTimestamp();
    console.log(`Found ${fileGroups.size} import sessions to migrate\n`);
    
    // Create sessions
    console.log('🏗️  Creating organized sessions...');
    const sessions = [];
    
    for (const [timestamp, group] of fileGroups) {
      const session = await createSession(group.timestamp, group.files);
      sessions.push(session);
    }
    
    // Clean up orphaned files
    console.log('\n🗑️  Cleaning up orphaned files...');
    await cleanupOrphanedFiles();
    
    // Generate report
    await generateReport(sessions);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Test the new SessionManager component');
    console.log('   2. Verify sessions load correctly in the UI');
    console.log('   3. Remove old files from temp/ if everything looks good');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
if (require.main === module) {
  main();
}

module.exports = { main }; 