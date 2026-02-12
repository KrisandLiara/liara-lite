// File Management Configuration and Utilities

export interface FileManagementConfig {
  // Retention policies
  retentionDays: {
    completed: number;
    failed: number;
    processing: number;
    archived: number;
  };
  
  // Auto-cleanup settings
  autoCleanup: {
    enabled: boolean;
    intervalHours: number;
    maxSessions: number;
    maxStorageGB: number;
  };
  
  // File naming conventions
  naming: {
    sessionPrefix: string;
    dateFormat: string;
    timeFormat: string;
  };
  
  // Directory structure
  directories: {
    sessions: string;
    archive: string;
    temp: string;
    templates: string;
  };
}

export const DEFAULT_FILE_CONFIG: FileManagementConfig = {
  retentionDays: {
    completed: 90,    // Keep completed sessions for 3 months
    failed: 30,       // Keep failed sessions for 1 month
    processing: 7,    // Clean up stuck processing sessions after 1 week
    archived: 365     // Keep archived sessions for 1 year
  },
  
  autoCleanup: {
    enabled: true,
    intervalHours: 24,  // Run cleanup daily
    maxSessions: 100,   // Keep max 100 sessions
    maxStorageGB: 5     // Keep max 5GB of import data
  },
  
  naming: {
    sessionPrefix: 'session',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HHmmss'
  },
  
  directories: {
    sessions: 'import/sessions',
    archive: 'import/archive',
    temp: 'import/temp',
    templates: 'import/templates'
  }
};

export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  config: {
    enrichmentScope: string;
    removeCodeBlocks: boolean;
    isTestRun: boolean;
    model: string;
  };
  icon: string;
  estimatedTime: number; // minutes
}

export const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: 'quick-test',
    name: 'Quick Test',
    description: 'Process first 10 lines for rapid testing',
    config: {
      enrichmentScope: 'lines-10',
      removeCodeBlocks: true,
      isTestRun: true,
      model: 'gpt-4o-mini'
    },
    icon: 'zap',
    estimatedTime: 2
  },
  {
    id: 'standard-import',
    name: 'Standard Import',
    description: 'Process 50 conversations with balanced settings',
    config: {
      enrichmentScope: 'conversations-50',
      removeCodeBlocks: true,
      isTestRun: false,
      model: 'gpt-4o'
    },
    icon: 'target',
    estimatedTime: 15
  },
  {
    id: 'full-import',
    name: 'Full Import',
    description: 'Process all conversations with premium model',
    config: {
      enrichmentScope: 'conversations--1',
      removeCodeBlocks: false,
      isTestRun: false,
      model: 'gpt-4-turbo'
    },
    icon: 'database',
    estimatedTime: 60
  },
  {
    id: 'code-analysis',
    name: 'Code Analysis',
    description: 'Specialized for code-heavy conversations',
    config: {
      enrichmentScope: 'conversations-25',
      removeCodeBlocks: false,
      isTestRun: false,
      model: 'gpt-4-turbo'
    },
    icon: 'code',
    estimatedTime: 30
  }
];

export class FileManager {
  constructor(private config: FileManagementConfig = DEFAULT_FILE_CONFIG) {}

  generateSessionPath(sessionName: string, timestamp: Date): string {
    const date = timestamp.toISOString().split('T')[0];
    const time = timestamp.toTimeString().slice(0, 8).replace(/:/g, '');
    const sanitizedName = sessionName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    
    return `${this.config.directories.sessions}/${date}/${sanitizedName}-${time}`;
  }

  generateSessionId(timestamp: Date = new Date()): string {
    return `${this.config.naming.sessionPrefix}-${timestamp.getTime()}`;
  }

  getSessionTemplate(templateId: string): SessionTemplate | undefined {
    return SESSION_TEMPLATES.find(t => t.id === templateId);
  }

  async calculateDirectorySize(path: string): Promise<number> {
    // This would be implemented to calculate directory size
    // For now, return 0 as placeholder
    return 0;
  }

  async shouldCleanup(): Promise<boolean> {
    if (!this.config.autoCleanup.enabled) return false;
    
    // Check storage limits, session counts, etc.
    const storageSize = await this.calculateDirectorySize(this.config.directories.sessions);
    const storageLimitBytes = this.config.autoCleanup.maxStorageGB * 1024 * 1024 * 1024;
    
    return storageSize > storageLimitBytes;
  }

  getRetentionDate(status: string): Date {
    const days = this.config.retentionDays[status as keyof typeof this.config.retentionDays] || 30;
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  isSessionExpired(session: any): boolean {
    const sessionDate = new Date(session.timestamp);
    const retentionDate = this.getRetentionDate(session.status);
    return sessionDate < retentionDate;
  }

  async getCleanupCandidates(sessions: any[]): Promise<any[]> {
    return sessions.filter(session => this.isSessionExpired(session));
  }

  async createSessionFromTemplate(templateId: string, name?: string): Promise<any> {
    const template = this.getSessionTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const timestamp = new Date();
    const sessionId = this.generateSessionId(timestamp);
    const sessionName = name || `${template.name} ${timestamp.toLocaleDateString()}`;

    return {
      id: sessionId,
      name: sessionName,
      timestamp: timestamp.toISOString(),
      status: 'processing',
      files: {},
      metadata: {
        totalConversations: 0,
        processedConversations: 0,
        enrichedConversations: 0,
        loadedConversations: 0,
        estimatedCost: 0,
        estimatedTime: template.estimatedTime
      },
      config: {
        ...template.config,
        templateId,
        createdFrom: 'template'
      }
    };
  }
}

export const fileManager = new FileManager();

// File utilities
export const FileUtils = {
  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },

  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  },

  sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9-_\.]/g, '-');
  },

  isValidJsonFile(filename: string): boolean {
    return this.getFileExtension(filename) === 'json';
  },

  generateUniqueFilename(baseName: string, extension: string): string {
    const timestamp = Date.now();
    return `${baseName}-${timestamp}.${extension}`;
  }
};

// Session status utilities
export const SessionStatus = {
  getStatusColor(status: string): string {
    switch (status) {
      case 'processing': return 'text-blue-400';
      case 'enriching': return 'text-yellow-400';
      case 'completed': return 'text-emerald-400';
      case 'failed': return 'text-red-400';
      case 'archived': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  },

  getStatusIcon(status: string): string {
    switch (status) {
      case 'processing': return 'loader-2';
      case 'enriching': return 'loader-2';
      case 'completed': return 'check-circle';
      case 'failed': return 'x-circle';
      case 'archived': return 'archive';
      default: return 'clock';
    }
  },

  isActive(status: string): boolean {
    return ['processing', 'enriching'].includes(status);
  },

  isComplete(status: string): boolean {
    return status === 'completed';
  },

  canRetry(status: string): boolean {
    return status === 'failed';
  },

  canArchive(status: string): boolean {
    return !['archived', 'processing', 'enriching'].includes(status);
  }
}; 