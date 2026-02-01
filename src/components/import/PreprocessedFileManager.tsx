import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, X, Trash2, Clock, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PreprocessedFileManagerProps {
  onFileSelected: (filename: string | null) => void;
  onPreviewFile?: (filename: string) => void;
  selectedFile?: string | null;
  disabled?: boolean;
  compact?: boolean;
}

interface FileInfo {
  name: string;
  timestamp: number;
  displayName: string;
  timeAgo: string;
}

export const PreprocessedFileManager: React.FC<PreprocessedFileManagerProps> = ({ 
  onFileSelected, 
  onPreviewFile,
  selectedFile,
  disabled = false,
  compact = false
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const { toast } = useToast();
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isLite = String(import.meta.env.VITE_LIARA_LITE || '').toLowerCase() === 'true';
  const apiBase = isLite ? '/api/lite' : '/api/import';

  const parseFileName = (filename: string): FileInfo => {
    // Extract timestamp from filename like: preprocessed_conversations_1751314939633.json
    const timestampMatch = filename.match(/(\d{13})/);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    let timeAgo: string;
    if (diffMins < 1) {
      timeAgo = 'Just now';
    } else if (diffMins < 60) {
      timeAgo = `${diffMins}m ago`;
    } else if (diffHours < 24) {
      timeAgo = `${diffHours}h ago`;
    } else {
      timeAgo = `${diffDays}d ago`;
    }
    
    const displayName = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    return {
      name: filename,
      timestamp,
      displayName,
      timeAgo
    };
  };

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (!isLite) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("User not authenticated.");
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${apiBase}/preprocessed-files`, { headers });
      if (!response.ok) throw new Error('Failed to fetch preprocessed files.');
      
      const data = await response.json();
      const parsedFiles = data.map(parseFileName).sort((a, b) => b.timestamp - a.timestamp);
      setFiles(parsedFiles);
    } catch (error) {
      console.error('Error fetching preprocessed files:', error);
      toast({ 
        title: 'Error', 
        description: `Could not fetch preprocessed files: ${error.message}`, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile || !onPreviewFile) return;
    
    setIsPreviewing(true);
    try {
      await onPreviewFile(selectedFile);
      toast({ 
        title: 'Preview Loaded', 
        description: `Showing content from ${parseFileName(selectedFile).displayName}` 
      });
    } catch (error) {
      toast({ 
        title: 'Preview Error', 
        description: `Could not preview file: ${error.message}`, 
        variant: 'destructive' 
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDeleteClick = (filename: string) => {
    setFileToDelete(filename);
  };

  const handleCancelDelete = () => {
    setFileToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);

    try {
      const headers: Record<string, string> = {};
      if (!isLite) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("User not authenticated.");
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${apiBase}/preprocessed-files/${encodeURIComponent(fileToDelete)}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file.');
      }
      
      toast({ title: 'Success', description: `File deleted successfully.` });
      
      // If the deleted file was selected, clear selection
      if (selectedFile === fileToDelete) {
        onFileSelected(null);
      }
      
      fetchFiles(); // Refresh the list
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: `Could not delete file: ${error.message}`, 
        variant: 'destructive' 
      });
    } finally {
      setFileToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleFileSelect = (filename: string) => {
    onFileSelected(filename === 'new' ? null : filename);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="space-y-1">
        {!compact && (
          <Label className="text-xs font-medium text-slate-400">Load Existing Preprocessed File</Label>
        )}
        <div className="flex gap-2">
          <Select 
            value={selectedFile || 'new'} 
            onValueChange={handleFileSelect}
            disabled={disabled || isLoading}
          >
            <SelectTrigger className={compact ? "flex-1 h-8 text-xs" : "flex-1 h-8 text-xs bg-slate-700 border-slate-600"}>
              <SelectValue placeholder={compact ? "Select file..." : "Select preprocessed file..."} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="new" className="text-slate-200 focus:bg-slate-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span>Process new file</span>
                </div>
              </SelectItem>
              {files.map((file) => (
                <SelectItem key={file.name} value={file.name} className="text-slate-200 focus:bg-slate-700">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-sky-400" />
                      <span className="font-medium">{file.displayName}</span>
                    </div>
                    <span className="text-xs text-slate-400 ml-2">{file.timeAgo}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Preview Button */}
          {selectedFile && onPreviewFile && (
            <Button
              onClick={handlePreview}
              disabled={isPreviewing || disabled}
              variant="outline"
              size="sm"
              className="h-8 px-2 border-sky-500/50 text-sky-400 hover:bg-sky-500/10"
            >
              {isPreviewing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
            </Button>
          )}
          
          {selectedFile && !compact && (
            <Button
              onClick={() => handleDeleteClick(selectedFile)}
              disabled={isDeleting || disabled}
              variant="outline"
              size="sm"
              className="h-8 px-2 border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation - Hide in compact mode */}
      {fileToDelete && !compact && (
        <div className="flex items-center justify-between p-2 rounded-md bg-slate-800 border border-red-500/50">
          <span className="text-xs text-red-400">Delete "{parseFileName(fileToDelete).displayName}"?</span>
          <div className="flex gap-1">
            <Button 
              onClick={handleConfirmDelete} 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2 hover:bg-green-500/20" 
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-green-400" />}
            </Button>
            <Button 
              onClick={handleCancelDelete} 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2 hover:bg-red-500/20" 
              disabled={isDeleting}
            >
              <X className="h-3 w-3 text-red-400" />
            </Button>
          </div>
        </div>
      )}

      {files.length === 0 && !isLoading && !compact && (
        <p className="text-xs text-slate-500 text-center py-2">No preprocessed files found.</p>
      )}
    </div>
  );
}; 