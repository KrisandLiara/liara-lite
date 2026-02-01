import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Folder, 
  File, 
  Trash2, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Archive,
  Search,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useImport } from '@/contexts/ImportContext';
import { formatCurrency, formatTime } from '@/lib/import/tokenEstimator';

interface ImportSession {
  id: string;
  name: string;
  timestamp: Date;
  status: 'processing' | 'enriching' | 'completed' | 'failed' | 'archived';
  files: {
    original?: string;
    preprocessed?: string;
    enriched?: string;
    loaded?: string;
  };
  metadata: {
    totalConversations: number;
    processedConversations: number;
    enrichedConversations: number;
    loadedConversations: number;
    estimatedCost: number;
    actualCost?: number;
    processingTime?: number;
  };
  config: any;
}

export const SessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    handleLoadSession, 
    handleDeleteSession, 
    handleArchiveSession,
    handleExportSession 
  } = useImport();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/import/sessions');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'enriching':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-slate-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-900 text-blue-300 border-blue-500';
      case 'enriching':
        return 'bg-yellow-900 text-yellow-300 border-yellow-500';
      case 'completed':
        return 'bg-emerald-900 text-emerald-300 border-emerald-500';
      case 'failed':
        return 'bg-red-900 text-red-300 border-red-500';
      case 'archived':
        return 'bg-slate-900 text-slate-300 border-slate-500';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  const handleSessionAction = async (sessionId: string, action: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'load':
          await handleLoadSession(sessionId);
          break;
        case 'delete':
          await handleDeleteSession(sessionId);
          await loadSessions();
          break;
        case 'archive':
          await handleArchiveSession(sessionId);
          await loadSessions();
          break;
        case 'export':
          await handleExportSession(sessionId);
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} session:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async (name: string) => {
    const newSession: ImportSession = {
      id: `session-${Date.now()}`,
      name: name || `Import ${new Date().toLocaleDateString()}`,
      timestamp: new Date(),
      status: 'processing',
      files: {},
      metadata: {
        totalConversations: 0,
        processedConversations: 0,
        enrichedConversations: 0,
        loadedConversations: 0,
        estimatedCost: 0
      },
      config: {}
    };
    
    setSessions(prev => [newSession, ...prev]);
    setSelectedSession(newSession.id);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Import Sessions
          </CardTitle>
          <Button 
            onClick={() => createNewSession('')}
            size="sm"
            className="glassy-primary"
          >
            <Upload className="w-4 h-4 mr-1" />
            New Session
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="enriching">Enriching</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sessions List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-400">Loading sessions...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              {searchTerm || statusFilter !== 'all' ? 'No matching sessions found' : 'No sessions yet'}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <Card 
                key={session.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedSession === session.id 
                    ? 'bg-slate-700 border-slate-500' 
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                }`}
                onClick={() => setSelectedSession(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(session.status)}
                      <span className="font-medium text-slate-200 truncate">
                        {session.name}
                      </span>
                      <Badge className={`text-xs ${getStatusColor(session.status)}`}>
                        {session.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {session.timestamp.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <File className="w-3 h-3" />
                        {session.metadata.totalConversations} convos
                      </div>
                      {session.metadata.estimatedCost > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(session.metadata.estimatedCost)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {session.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSessionAction(session.id, 'load');
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Upload className="w-3 h-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSessionAction(session.id, 'export');
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    
                    {session.status !== 'archived' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSessionAction(session.id, 'archive');
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Archive className="w-3 h-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSessionAction(session.id, 'delete');
                      }}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Session Details */}
        {selectedSession && (
          <SessionDetails 
            session={sessions.find(s => s.id === selectedSession)!}
            onUpdate={loadSessions}
          />
        )}
      </CardContent>
    </Card>
  );
};

interface SessionDetailsProps {
  session: ImportSession;
  onUpdate: () => void;
}

const SessionDetails: React.FC<SessionDetailsProps> = ({ session, onUpdate }) => {
  return (
    <Card className="bg-slate-800 border-slate-600">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Session Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400">Created:</span>
            <div className="text-slate-200">{session.timestamp.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-slate-400">Status:</span>
            <div className="text-slate-200">{session.status}</div>
          </div>
          <div>
            <span className="text-slate-400">Conversations:</span>
            <div className="text-slate-200">{session.metadata.totalConversations}</div>
          </div>
          <div>
            <span className="text-slate-400">Processed:</span>
            <div className="text-slate-200">{session.metadata.processedConversations}</div>
          </div>
        </div>

        {/* File Status */}
        <div className="space-y-1">
          <span className="text-xs text-slate-400">Files:</span>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(session.files).map(([type, filename]) => (
              <div key={type} className="flex items-center gap-1">
                <File className="w-3 h-3 text-slate-400" />
                <span className="text-slate-300 capitalize">{type}</span>
                {filename && <CheckCircle className="w-3 h-3 text-emerald-400" />}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        {session.status === 'processing' || session.status === 'enriching' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Progress</span>
              <span>{Math.round((session.metadata.processedConversations / session.metadata.totalConversations) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1">
              <div 
                className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(session.metadata.processedConversations / session.metadata.totalConversations) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 