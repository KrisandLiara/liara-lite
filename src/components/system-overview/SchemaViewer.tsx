import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export const SchemaViewer: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [schema, setSchema] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const fetchSchema = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/docs/schema');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.text();
            setSchema(data);
            setIsVisible(true);
            toast.success('Schema loaded successfully.');
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to load schema: ${errorMessage}`);
            toast.error(`Failed to load schema: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleVisibility = () => {
        if (!schema) {
            fetchSchema();
        } else {
            setIsVisible(!isVisible);
        }
    };

    return (
        <div className="mt-4">
            <Button onClick={handleToggleVisibility} disabled={isLoading}>
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isVisible ? (
                    <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                    <Eye className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Loading...' : isVisible ? 'Hide Schema' : 'Show Schema'}
            </Button>

            {error && <div className="mt-4 text-red-500">{error}</div>}

            {isVisible && schema && (
                <div className="mt-4 p-4 bg-slate-900 rounded-md max-h-[600px] overflow-auto">
                    <pre className="text-sm text-slate-300"><code>{schema}</code></pre>
                </div>
            )}
        </div>
    );
}; 