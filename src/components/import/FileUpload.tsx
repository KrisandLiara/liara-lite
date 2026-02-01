import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  compact?: boolean;
}

export function FileUpload({ onFileSelect, compact = false }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    multiple: false
  });

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
  };

  return (
    <div className={compact ? "flex flex-col gap-1" : "flex flex-col items-center gap-2"}>
      <div
        {...getRootProps()}
        className={cn(
          compact 
            ? 'w-full border-2 border-dashed border-gray-300 rounded-lg p-2 text-center cursor-pointer hover:border-gray-400 transition-colors text-xs'
            : 'w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors',
          isDragActive && 'border-primary'
        )}
      >
        <input {...getInputProps()} />
        {selectedFile ? (
          <p className="text-green-500">{compact ? selectedFile.name : `File selected: ${selectedFile.name}`}</p>
        ) : isDragActive ? (
          <p>{compact ? "Drop file here..." : "Drop the file here ..."}</p>
        ) : (
          <p>{compact ? "Drop or click to select JSON file" : "Drag 'n' drop a conversation.json file here, or click to select"}</p>
        )}
      </div>
      {selectedFile && !compact && (
        <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
          Clear Selection
        </Button>
      )}
    </div>
  );
} 