import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EnrichedFileManager = React.forwardRef(({ onFileDeleted, onFilesFetched }, ref) => {
    const [files, setFiles] = useState<string[]>([]);
    const { toast } = useToast();
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const isLite = String(import.meta.env.VITE_LIARA_LITE || '').toLowerCase() === 'true';
    const apiBase = isLite ? '/api/lite' : '/api/import';

    const fetchFiles = async () => {
        try {
            const headers: Record<string, string> = {};
            if (!isLite) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("User not authenticated.");
                headers.Authorization = `Bearer ${session.access_token}`;
            }
            const response = await fetch(`${apiBase}/enriched-files`, { headers });
            if (!response.ok) throw new Error('Failed to fetch enriched files.');
            const data = await response.json();
            setFiles(data);
            onFilesFetched(data); // Inform parent about the new file list
        } catch (error) {
            toast({ title: 'Error', description: `Could not fetch enriched files: ${error.message}`, variant: 'destructive' });
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
            const response = await fetch(`${apiBase}/enriched-files/${encodeURIComponent(fileToDelete)}`, {
                method: 'DELETE',
                headers,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete file.');
            }
            toast({ title: 'Success', description: `File ${fileToDelete} deleted.` });
            fetchFiles(); // Refresh the list
            onFileDeleted(fileToDelete); // Notify parent component
        } catch (error) {
            toast({ title: 'Error', description: `Could not delete file: ${error.message}`, variant: 'destructive' });
        } finally {
            setFileToDelete(null);
            setIsDeleting(false);
        }
    };

    React.useImperativeHandle(ref, () => ({
        fetchFiles
    }));

    useEffect(() => {
        fetchFiles();
    }, []);

    return (
        <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Manage Enriched Files</h4>
            <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {files.length > 0 ? (
                    files.map(file => (
                        <div key={file} className="flex items-center justify-between p-1 hover:bg-gray-800 rounded">
                            <span className="text-xs truncate">{file}</span>
                            {fileToDelete === file ? (
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-red-400">Sure?</span>
                                    <Button onClick={handleConfirmDelete} size="icon" variant="ghost" className="h-7 w-7 hover:bg-green-500/20" disabled={isDeleting}>
                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-400" />}
                                    </Button>
                                    <Button onClick={handleCancelDelete} size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-500/20" disabled={isDeleting}>
                                        <X className="h-4 w-4 text-red-400" />
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteClick(file)}>
                                    <Trash2 className="h-4 w-4 text-red-500/70 hover:text-red-500" />
                                </Button>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-center text-gray-500">No enriched files found.</p>
                )}
            </div>
        </div>
    );
}); 