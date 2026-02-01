import { useEffect, useState, useRef } from 'react';
import { FileText, Sparkles, Trash2, Check, Clock, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useImport } from '@/contexts/ImportContext';

interface FileInfo {
  name: string;
  type: 'preprocessed' | 'enriched' | 'source';
  timestamp: number;
  displayName: string;
  timeAgo: string;
}

interface UnifiedFileSelectorProps {
  selectedFile: string | null;
  onFileSelect: (filename: string | null, type: 'preprocessed' | 'enriched' | 'source') => void;
  onPreviewFile?: (filename: string, type: 'preprocessed' | 'enriched' | 'source') => void;
  disabled?: boolean;
  placeholder?: string;
  showNewOption?: boolean;
  compact?: boolean;
  allowedTypes?: Array<'preprocessed' | 'enriched' | 'source'>; // optional type filter
  refreshKey?: string | number | null; // re-fetch file list when this changes (e.g. after save)
}

export const UnifiedFileSelector = ({ 
  selectedFile, 
  onFileSelect, 
  onPreviewFile,
  disabled = false,
  placeholder = "Select a file...",
  showNewOption = false,
  compact = false,
  allowedTypes,
  refreshKey
}: UnifiedFileSelectorProps) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { addLog, setFile } = useImport();
  const isLite = String(import.meta.env.VITE_LIARA_LITE || '').toLowerCase() === 'true';
  const apiBase = isLite ? '/api/lite' : '/api/import';
  const [storageHint, setStorageHint] = useState<string>('');
  const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(selectedFile || undefined);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  // Sync external selection
  useEffect(() => {
    if (selectedFile) setSelectedValue(selectedFile);
  }, [selectedFile]);

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const formatFileName = (filename: string, type: 'preprocessed' | 'enriched') => {
    const match = filename.match(/[_-](\d+)\.json/);
    if (!match) return filename;
    
    const timestamp = parseInt(match[1]);
    const date = new Date(timestamp);
    const timeAgo = formatTimeAgo(timestamp);
    
    return `${date.toLocaleDateString()} (${timeAgo})`;
  };

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      if (isLite) {
        try {
          const resp = await fetch(`${apiBase}/storage-info`);
          if (resp.ok) {
            const info = await resp.json();
            const p = info?.preprocessedDir ? `Preprocessed: ${info.preprocessedDir}` : '';
            const e = info?.enrichedDir ? `Enriched: ${info.enrichedDir}` : '';
            const text = [p, e].filter(Boolean).join(' • ');
            setStorageHint(text);
          }
        } catch {}
      }

      const headers: Record<string, string> = {};
      if (!isLite) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("User not authenticated.");
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      // Fetch both preprocessed and enriched files
      const [preprocessedResponse, enrichedResponse] = await Promise.all([
        fetch(`${apiBase}/preprocessed-files`, { headers }),
        fetch(`${apiBase}/enriched-files`, { headers })
      ]);

      if (!preprocessedResponse.ok || !enrichedResponse.ok) {
        throw new Error('Failed to fetch files.');
      }

      const [preprocessedFiles, enrichedFiles] = await Promise.all([
        preprocessedResponse.json(),
        enrichedResponse.json()
      ]);

      let combined: FileInfo[] = [
        ...preprocessedFiles
          .filter((file: string) => file.startsWith('preprocessed_conversations_'))
          .map((file: string) => ({
            name: file,
            type: 'preprocessed' as const,
            timestamp: parseInt(file.match(/[_-](\d+)\.json/)?.[1] || '0'),
            displayName: '',
            timeAgo: ''
          })),
        ...enrichedFiles
          .filter((file: string) => file.startsWith('enriched-data-'))
          .map((file: string) => ({
            name: file,
            type: 'enriched' as const,
            timestamp: parseInt(file.match(/[_-](\d+)\.json/)?.[1] || '0'),
            displayName: '',
            timeAgo: ''
          }))
      ];

      if (allowedTypes && allowedTypes.length > 0) {
        combined = combined.filter(f => allowedTypes.includes(f.type));
      }

      const fileList = combined.map(file => ({
        ...file,
        displayName: formatFileName(file.name, file.type),
        timeAgo: formatTimeAgo(file.timestamp)
      }));

      // Sort by timestamp, newest first
      fileList.sort((a, b) => b.timestamp - a.timestamp);
      setFiles(fileList);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshKey]);

  const handleSelect = (value: string) => {
    if (value === 'new') {
      // Trigger local file picker after dropdown closes
      setTimeout(() => {
        uploadInputRef.current?.click();
      }, 0);
      return;
    }
    const selectedFile = files.find(f => f.name === value);
    if (selectedFile) {
      // Selection should NOT auto-preview; allow caller to drive preview explicitly
      try { console.debug('[UnifiedFileSelector] selected', selectedFile); } catch {}
      setSelectedValue(selectedFile.name);
      onFileSelect?.(selectedFile.name, selectedFile.type);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent, filename: string, type: 'preprocessed' | 'enriched') => {
    e.stopPropagation();
    if (onPreviewFile) {
      onPreviewFile(filename, type);
    }
  };

  const handleDeleteClick = async (filename: string, type: 'preprocessed' | 'enriched') => {
    setIsDeleting(true);

    try {
      const headers: Record<string, string> = {};
      if (!isLite) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("User not authenticated.");
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      const endpoint = type === 'preprocessed' ? 'preprocessed-files' : 'enriched-files';
      const url = `${apiBase}/${endpoint}/${encodeURIComponent(filename)}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        const responseData = await response.json().catch(() => null);
        throw new Error(responseData?.error || 'Failed to delete file');
      }

      addLog(`🗑️ Deleted ${type} file: ${filename}`, 'success');
      
      // Refresh file list
      await loadFiles();
      
      if (selectedFile === filename) {
        onFileSelect?.(null, type);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: `Failed to delete file: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const selectedFileInfo = files.find(f => f.name === selectedFile);

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <Select 
        value={selectedValue || ''} 
        onValueChange={handleSelect}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className={compact ? "h-8 text-xs" : "h-10"}>
          <SelectValue placeholder={isLoading ? "Loading files..." : (placeholder || "- Select file -")}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading files...
              </div>
            ) : (selectedValue && files.find(f => f.name === selectedValue)) ? (
              <div className="flex items-center gap-2">
                {files.find(f => f.name === selectedValue)?.type === 'preprocessed' ? (
                  <FileText className="h-3 w-3 text-sky-400" />
                ) : files.find(f => f.name === selectedValue)?.type === 'enriched' ? (
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                ) : (
                  <FileText className="h-3 w-3 text-blue-400" />
                )}
                <span className="truncate">{files.find(f => f.name === selectedValue)?.displayName}</span>
                <Badge
                  variant="outline"
                  className={
                    files.find(f => f.name === selectedValue)?.type === 'preprocessed' ? 'bg-sky-600/20 text-sky-300 border-sky-500/40'
                    : files.find(f => f.name === selectedValue)?.type === 'enriched' ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                  }
                >
                  {files.find(f => f.name === selectedValue)?.type === 'preprocessed' ? 'Preprocessed' : files.find(f => f.name === selectedValue)?.type === 'enriched' ? 'Enriched' : 'Source'}
                </Badge>
              </div>
            ) : null}
          </SelectValue>
        </SelectTrigger>

        {isLite && storageHint && (
          <div className="text-[11px] text-slate-500 mt-1 truncate" title={storageHint}>
            {storageHint}
          </div>
        )}
        
        <SelectContent>
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
            {showNewOption && (
              <SelectItem
                value="new"
                className="text-sky-400"
                // Use pointer down to keep user gesture for programmatic click
                onPointerDown={(e) => {
                  try { console.debug('[UnifiedFileSelector] New -> trigger file dialog'); } catch {}
                  e.preventDefault();
                  uploadInputRef.current?.click();
                }}
                // Prevent Radix from trying to set the value to 'new'
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  Import JSON file
                </div>
              </SelectItem>
            )}
            {files.map((file) => (
              <div key={file.name} className="relative group">
                <div 
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-50 cursor-pointer hover:bg-red-900/20 p-1 rounded"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFileToDelete(file);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </div>
                <SelectItem
                  value={file.name}
                  className="text-slate-200 focus:bg-slate-700 pl-8"
                >
                  <div className="flex items-center gap-2">
                    {file.type === 'preprocessed' ? (
                      <FileText className="h-3 w-3 text-sky-400" />
                    ) : file.type === 'enriched' ? (
                      <Sparkles className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <FileText className="h-3 w-3 text-blue-400" />
                    )}
                    <span className="font-medium">{formatFileName(file.name, file.type)}</span>
                    <Badge
                      variant="outline"
                      className={file.type === 'preprocessed' 
                        ? 'bg-sky-600/20 text-sky-300 border-sky-500/40'
                        : file.type === 'enriched' ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-blue-600/20 text-blue-300 border-blue-500/40'}
                    >
                      {file.type === 'preprocessed' ? 'Preprocessed' : file.type === 'enriched' ? 'Enriched' : 'Source'}
                    </Badge>
                  </div>
                </SelectItem>
              </div>
            ))}
          </div>
        </SelectContent>
      </Select>

      {/* Hidden input for JSON upload */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            setFile(file);
            addLog(`Selected source JSON: ${file.name}`);
            const pseudoName = `source:${file.name}`;
            const sourceItem: FileInfo = {
              name: pseudoName,
              type: 'source',
              timestamp: Date.now(),
              displayName: file.name,
              timeAgo: 'just now'
            };
            setFiles((prev) => [sourceItem, ...prev.filter(f => f.name !== pseudoName)]);
            setSelectedValue(pseudoName);
            // Inform parent that a source was chosen (use pseudoName to track selection upstream if needed)
            onFileSelect?.(pseudoName, 'source');
          } catch (err) {
            toast({ title: 'Upload error', description: 'Could not select JSON file', variant: 'destructive' });
          } finally {
            // reset input so selecting the same file again re-triggers change
            e.currentTarget.value = '';
          }
        }}
      />

      <AlertDialog open={isDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900/90 backdrop-blur-sm border border-slate-800 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-200">Delete File</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete {fileToDelete?.displayName || fileToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setFileToDelete(null);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (fileToDelete) {
                  handleDeleteClick(fileToDelete.name, fileToDelete.type);
                }
              }}
              className="bg-red-900/90 hover:bg-red-800 text-red-100 border border-red-800/50"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 