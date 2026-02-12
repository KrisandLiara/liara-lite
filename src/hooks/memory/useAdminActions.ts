import { useState, useCallback, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast"
import { LogEntry, JobProgress } from '@/components/memory/LiveStatusConsole';

type AdminAction = 'rebuild-missing' | 'force-rebuild' | 'enrich-all' | 'diagnose';

export function useAdminActions() {
    const { toast } = useToast();
    const [log, setLog] = useState<LogEntry[]>([]);
    const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);
    const [isJobRunning, setIsJobRunning] = useState(false);
    const [lastAction, setLastAction] = useState<AdminAction | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const addLogEntry = useCallback((type: LogEntry['type'], message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLog(prevLog => [{ type, message, timestamp }, ...prevLog]);
    }, []);

    const stopAction = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setIsJobRunning(false);
            addLogEntry('warning', `Job '${lastAction}' manually stopped.`);
            toast({
                title: "Job Stopped",
                description: `The ${lastAction?.replace('-', ' ')} process was cancelled.`,
            });
        }
    }, [addLogEntry, lastAction, toast]);
    
    const runAction = useCallback(async (action: AdminAction) => {
        if (isJobRunning) {
            toast({ title: "A job is already in progress.", variant: "destructive" });
            return;
        }

        setLog([]);
        setJobProgress(null);
        setIsJobRunning(true);
        setLastAction(action);
        addLogEntry('info', `Starting job: '${action}'...`);

        const endpointMap: Record<AdminAction, string> = {
            'rebuild-missing': '/api/memories/rebuild-embeddings?rebuild_missing=true',
            'force-rebuild': '/api/memories/rebuild-embeddings?force_rebuild=true',
            'diagnose': '/api/memories/diagnose-embeddings',
            'enrich-all': '/api/memories/enrich-all'
        };

        const url = endpointMap[action];
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            addLogEntry('info', 'Connection to backend established. Awaiting data...');
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'progress') {
                    setJobProgress(data.payload);
                    addLogEntry('progress', `Processed: ${data.payload.processed}/${data.payload.total}. Failed: ${data.payload.failed}`);
                } else if (data.type === 'log') {
                    addLogEntry(data.log_type || 'info', data.message);
                } else if (data.type === 'complete') {
                    addLogEntry('success', data.message);
                    toast({
                        title: "Job Complete",
                        description: data.message,
                    });
                    eventSource.close();
                    setIsJobRunning(false);
                }
            } catch (error) {
                addLogEntry('error', 'Failed to parse message from server.');
                console.error('SSE Error:', error);
            }
        };

        eventSource.onerror = (err) => {
            addLogEntry('error', 'Connection error. The job may have been interrupted.');
            console.error('EventSource failed:', err);
            eventSource.close();
            setIsJobRunning(false);
        };

    }, [isJobRunning, toast, addLogEntry]);

    const restartAction = useCallback(() => {
        if (lastAction) {
            runAction(lastAction);
        }
    }, [lastAction, runAction]);


    return {
        log,
        jobProgress,
        isJobRunning,
        lastAction,
        runAction,
        stopAction,
        restartAction,
    };
}
