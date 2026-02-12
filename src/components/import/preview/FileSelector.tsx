import { useEffect, useState } from 'react';
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
  type: 'preprocessed' | 'enriched';
  timestamp: number;
  displayName: string;
  timeAgo: string;
}

interface UnifiedFileSelectorProps {
  selectedFile: string | null;
  onFileSelect: (filename: string | null, type: 'preprocessed' | 'enriched') => void;
  onPreviewFile?: (filename: string, type: 'preprocessed' | 'enriched') => void;
  disabled?: boolean;
  placeholder?: string;
  showNewOption?: boolean;
  compact?: boolean;
}

export const UnifiedFileSelector = ({ 
  selectedFile, 
  onFileSelect, 
  onPreviewFile,
  disabled = false,
  placeholder = "Select a file...",
  showNewOption = false,
  compact = false
}: UnifiedFileSelectorProps) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { addLog } = useImport();
  const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("User not authenticated.");
      }

      // Fetch both preprocessed and enriched files
      const [preprocessedResponse, enrichedResponse] = await Promise.all([
        fetch(`/api/import/preprocessed-files?token=${session.access_token}`),
        fetch(`/api/import/enriched-files?token=${session.access_token}`)
      ]);

      if (!preprocessedResponse.ok || !enrichedResponse.ok) {
        throw new Error('Failed to fetch files.');
      }

      const [preprocessedFiles, enrichedFiles] = await Promise.all([
        preprocessedResponse.json(),
        enrichedResponse.json()
      ]);

      const fileList = [
        ...preprocessedFiles
          .filter((file: string) => file.startsWith('preprocessed_conversations_'))
          .map((file: string) => ({
            name: file,
            type: 'preprocessed' as const,
            timestamp: parseInt(file.match(/[_-](\d+)\.json/)?.[1] || '0'),
          })),
        ...enrichedFiles
          .filter((file: string) => file.startsWith('enriched-data-'))
          .map((file: string) => ({
            name: file,
            type: 'enriched' as const,
            timestamp: parseInt(file.match(/[_-](\d+)\.json/)?.[1] || '0'),
          }))
      ].map(file => ({
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
  }, []);

  const handleSelect = (value: string) => {
    if (value === 'new') {
      onFileSelect?.(null, 'preprocessed');
      return;
    }
    const selectedFile = files.find(f => f.name === value);
    if (selectedFile) {
      onFileSelect?.(selectedFile.name, selectedFile.type);
      onPreviewFile?.(selectedFile.name, selectedFile.type);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("User not authenticated.");
      }
      
      const endpoint = type === 'preprocessed' ? 'preprocessed-files' : 'enriched-files';
      const url = `/api/import/${endpoint}/${encodeURIComponent(filename)}?token=${session.access_token}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
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
        value={selectedFile || (showNewOption ? 'new' : '')} 
        onValueChange={handleSelect}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className={compact ? "h-8 text-xs" : "h-10"}>
          <SelectValue placeholder={isLoading ? "Loading files..." : placeholder}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading files...
              </div>
            ) : selectedFileInfo ? (
              <div className="flex items-center gap-2">
                {selectedFileInfo.type === 'preprocessed' ? (
                  <FileText className="h-3 w-3 text-sky-400" />
                ) : (
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                )}
                <span className="truncate">{selectedFileInfo.displayName}</span>
                <Badge
                  variant="outline"
                  className={selectedFileInfo.type === 'preprocessed' 
                    ? 'bg-sky-600/20 text-sky-300 border-sky-500/40'
                    : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'}
                >
                  {selectedFileInfo.type === 'preprocessed' ? 'Preprocessed' : 'Enriched'}
                </Badge>
              </div>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
            {showNewOption && (
              <SelectItem value="new" className="text-sky-400">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  Process new file
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
                    ) : (
                      <Sparkles className="h-3 w-3 text-emerald-400" />
                    )}
                    <span className="font-medium">{formatFileName(file.name, file.type)}</span>
                    <Badge
                      variant="outline"
                      className={file.type === 'preprocessed' 
                        ? 'bg-sky-600/20 text-sky-300 border-sky-500/40'
                        : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'}
                    >
                      {file.type === 'preprocessed' ? 'Preprocessed' : 'Enriched'}
                    </Badge>
                  </div>
                </SelectItem>
              </div>
            ))}
          </div>
        </SelectContent>
      </Select>

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