import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { FileCode2 } from 'lucide-react';

interface FileSelectorProps {
  fileType: 'preprocessed' | 'enriched' | 'errors';
  selectedFile: string | null;
  onFileSelect: (fileName: string | null) => void;
  refreshKey: number;
}

export const FileSelector: React.FC<FileSelectorProps> = ({ fileType, selectedFile, onFileSelect, refreshKey }) => {
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("User not authenticated.");

        const response = await fetch(`/api/import/files?type=${fileType}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch file list.');
        
        const fileList = await response.json();
        setFiles(fileList);
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, [fileType, toast, refreshKey]);

  return (
    <ScrollArea className="h-32 w-full rounded-md border border-slate-700 bg-slate-900/50 p-2">
      {isLoading ? (
        <p className="text-slate-400">Loading files...</p>
      ) : files.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-4">No {fileType} files found.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {files.map(file => (
            <button
              key={file}
              onClick={() => onFileSelect(selectedFile === file ? null : file)}
              className={cn(
                'text-left text-sm p-2 rounded-md flex items-center gap-2 w-full',
                selectedFile === file 
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50' 
                  : 'hover:bg-slate-700/50'
              )}
            >
              <FileCode2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{file}</span>
            </button>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}; 