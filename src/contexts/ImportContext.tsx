import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import { parseConversationObjects } from '@/lib/import/parser';
import { preprocessConversations } from '@/lib/import/preprocessor';
import { LogEntry, PreviewConversation } from '@/lib/types/import';

interface ImportContextType {
    // State
    file: File | null;
    log: LogEntry[];
    isLoading: boolean;
    isClearing: boolean;
    isConfirmingClear: boolean;
    currentStage: 'idle' | 'processing' | 'enriching' | 'loading';
    isTestMode: boolean;
    preprocessedData: (PreviewConversation & { hasCode?: boolean })[];
    dataToLoad: any[] | null;
    enrichedData: any[] | null;
    enrichedFiles: string[];
    preprocessedFileName: string | null;
    selectedEnrichedFile: string | null;
    enrichSelection: Set<string>;
    includeSelection: Set<string>;
    userOnlySelection: Set<string>;
    enrichmentErrorIds: Set<string>;
    enrichmentErrors: any[];
    counts: { enriched: number; loaded: number };
    config: {
        removeCodeBlocks: boolean;
        isTestRun: boolean;
        enrichmentScope: string;
        generateTopics: boolean;
        enableNER: boolean;
        nerUserOnly: boolean;
        showAI: boolean;
        showUser: boolean;
        filterSinceLastImport: boolean;
        demoLimitEnabled?: boolean;
        demoLimitConversations?: number;
    };
    selectedModel: string;
    selectedPreprocessedFile: string | null;
    selectedSourceFile: string | null;
    isConsoleOpen: boolean;
    failedLogs: string[];
    selectedFailedLog: string | null;
    fileManagerRef: React.RefObject<any>;

    // State Setters
    setFile: (file: File | null) => void;
    setIsConfirmingClear: (isConfirming: boolean) => void;
    setConfig: (config: any) => void;
    setSelectedModel: (model: string) => void;
    setSelectedPreprocessedFile: (file: string | null) => void;
    setSelectedSourceFile: (file: string | null) => void;
    setSelectedEnrichedFile: (file: string | null) => void;
    setIsConsoleOpen: (isOpen: boolean) => void;
    setSelectedFailedLog: (log: string | null) => void;
    setDataToLoad: (data: any[] | null) => void;

    // Functions
    addLog: (message: string, type?: LogEntry['type']) => void;
    resetState: () => void;
    fetchFailedLogs: () => Promise<void>;
    handleFilesFetched: (files: string[]) => void;
    handleFileDeleted: (deletedFilename: string) => void;
    handleSelectEnrichedFile: (fileName: string) => void;
    handleSelectAllUserOnly: (selected: boolean) => void;
    handlePreviewEnrichedFile: () => Promise<void>;
    handleLoadFailedLog: () => Promise<void>;
    handleProcess: () => Promise<void>;
    handleEnrichStream: (conversationsToEnrich: any[]) => Promise<void>;
    handleLoadFromFile: (isTest?: boolean) => Promise<void>;
    handleConfirmClear: () => Promise<void>;
    handleEnrichSelect: (id: string, selected: boolean) => void;
    handleIncludeSelect: (id: string, selected: boolean) => void;
    handleUserOnlySelect: (id: string, selected: boolean) => void;
    handleSelectAllEnrich: (selected: boolean) => void;
    handleSelectAllInclude: (selected: boolean) => void;
    saveAndApplyPreprocessing: () => void;
    handleLoadPreprocessedFile: (filename: string) => Promise<void>;
    enrichStreamStatus?: {
        startedAt: number;
        lastEventAt: number;
        processedMessages: number;
        totalMessages: number;
        processedConversations: number;
        totalConversations: number;
    } | null;
}

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export const ImportProvider = ({ children }: { children: React.ReactNode }) => {
    const { toast } = useToast();
    const { isTestMode } = useSettings();
    const isLite = String(import.meta.env.VITE_LIARA_LITE || '').toLowerCase() === 'true';
    const apiBase = isLite ? '/api/lite' : '/api/import';
    const LITE_LAST_ENRICHED_FILE_KEY = 'liaraLite.selectedEnrichedFile';
    
    const [file, setFile] = useState<File | null>(null);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);
    const [currentStage, setCurrentStage] = useState<'idle' | 'processing' | 'enriching' | 'loading'>('idle');
    const [preprocessedData, setPreprocessedData] = useState<PreviewConversation[]>([]);
    const [rawParsedData, setRawParsedData] = useState<any[]>([]);
    const [dataToLoad, setDataToLoad] = useState<any[] | null>(null);
    const [enrichedData, setEnrichedData] = useState<any[] | null>(null);
    const [enrichedFiles, setEnrichedFiles] = useState<string[]>([]);
    const [preprocessedFileName, setPreprocessedFileName] = useState<string | null>(null);
    const [selectedEnrichedFile, setSelectedEnrichedFile] = useState<string | null>(null);
    const [enrichSelection, setEnrichSelection] = useState<Set<string>>(new Set());
    const [includeSelection, setIncludeSelection] = useState<Set<string>>(new Set());
    const [userOnlySelection, setUserOnlySelection] = useState<Set<string>>(new Set());
    const [enrichmentErrorIds, setEnrichmentErrorIds] = useState<Set<string>>(new Set());
    const [enrichmentErrors, setEnrichmentErrors] = useState<any[]>([]);
    const [counts, setCounts] = useState({ enriched: 0, loaded: 0 });
    const [config, setConfig] = useState({ 
        removeCodeBlocks: true, 
        // Full app: quick test run. Lite: replaced by demoLimit* below (keep false to avoid confusion).
        isTestRun: isLite ? false : true, 
        enrichmentScope: 'conversations-10', 
        generateTopics: false, 
        enableNER: true,
        nerUserOnly: false,
        showAI: true,
        showUser: true,
        filterSinceLastImport: false,

        // Lite-only: keep huge ChatGPT exports fast + demo-friendly.
        demoLimitEnabled: isLite ? true : false,
        demoLimitConversations: 50
    });
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [selectedPreprocessedFile, setSelectedPreprocessedFile] = useState<string | null>(null);
    const [selectedSourceFile, setSelectedSourceFile] = useState<string | null>(null);
    const [isConsoleOpen, setIsConsoleOpen] = useState(false);
    const [failedLogs, setFailedLogs] = useState<string[]>([]);
    const [selectedFailedLog, setSelectedFailedLog] = useState<string | null>(null);
    const [enrichStreamStatus, setEnrichStreamStatus] = useState<ImportContextType['enrichStreamStatus']>(null);
    const fileManagerRef = useRef(null);

    // Lite UX: remember the last selected enriched file across page navigation / refresh.
    useEffect(() => {
        if (!isLite) return;
        try {
            const saved = window.localStorage.getItem(LITE_LAST_ENRICHED_FILE_KEY);
            if (saved) setSelectedEnrichedFile(saved);
        } catch {
            // ignore localStorage failures (privacy mode, etc.)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLite]);

    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLog(prev => [{ message, type, timestamp }, ...prev]);
    };

    const saveAndApplyPreprocessing = async () => {
        if (rawParsedData.length === 0) return;
        addLog('🔄 Applying preprocessing options and saving to file...', 'info');
        addLog(`📋 Config: removeCode=${config.removeCodeBlocks}, showUser=${config.showUser}, showAI=${config.showAI}`, 'info');
        
        // Filter out conversations with no messages after author filtering
        let preprocessed = preprocessConversations(rawParsedData, config)
            .filter(convo => convo.messages.length > 0);

        // Per-conversation "User Only" (remove assistant messages) based on selection set.
        if (userOnlySelection.size > 0) {
            const userRoles = new Set(['user', 'human']);
            const before = preprocessed.length;
            preprocessed = preprocessed
                .map(convo => {
                    if (!userOnlySelection.has(convo.id)) return convo;
                    const messages = (convo.messages || []).filter((m: any) => userRoles.has(String(m.role || m.author || '').toLowerCase()));
                    return { ...convo, messages };
                })
                .filter(convo => (convo.messages || []).length > 0);
            addLog(`👤 User-only applied to ${userOnlySelection.size} conversations (${before} → ${preprocessed.length} with non-empty messages).`, 'info');
        }
        
        addLog(`✂️ Filtered from ${rawParsedData.length} to ${preprocessed.length} conversations after author filtering`, 'info');
        
        // Recalculate hasCode flag after preprocessing using unified detector
        const conversationsWithUpdatedCodeFlag = preprocessed.map(convo => {
            const hasCode = convo.messages.some(msg => {
                if (typeof msg.content !== 'string') return false;
                // If removal was enabled, the detector should see zero renderable code now
                // Use a light check for speed: look for fences or strong code tokens
                return /```/.test(msg.content) || /\bat\s+[^\n]+\((?:.*\.(?:js|ts):\d+:\d+)\)/.test(msg.content);
            });
            return { ...convo, hasCode };
        });
        
        addLog(`🏷️ Code detection: ${conversationsWithUpdatedCodeFlag.filter(c => c.hasCode).length} conversations still have code`, 'info');
        
        // Update the view to show the processed content
        const previewConversations = conversationsWithUpdatedCodeFlag.map(c => ({
            ...c,
            message_count: c.messages.length,
        }));
        setPreprocessedData(previewConversations);
        addLog(`✅ Updated preview with ${previewConversations.length} processed conversations`, 'success');

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (!isLite) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("User not authenticated.");
                headers.Authorization = `Bearer ${session.access_token}`;
            }
            const response = await fetch(`${apiBase}/save-preprocessed`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ data: conversationsWithUpdatedCodeFlag, originalFileName: file?.name || 'unknown_file' }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to save preprocessed file.');
            setPreprocessedFileName(result.fileName);
            addLog(`💾 Saved preprocessed data to ${result.fileName}`, 'success');
            toast({ title: "Preview Refreshed & Saved", description: `Saved to ${result.fileName}` });
        } catch (error) {
            addLog(`❌ Error saving preprocessed file: ${error.message}`, 'error');
            toast({ title: "Save Error", description: `Could not save preprocessed file: ${error.message}`, variant: "destructive" });
        }
    };

    const handleLoadPreprocessedFile = async (filename: string) => {
        setIsLoading(true);
        addLog(`Loading preprocessed file: ${filename}...`);
        try {
            const headers: Record<string, string> = {};
            if (!isLite) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("User not authenticated.");
                headers.Authorization = `Bearer ${session.access_token}`;
            }
            const response = await fetch(`${apiBase}/file-content?fileName=${encodeURIComponent(filename)}&from=preprocessed`, { headers });
            if (!response.ok) throw new Error('Failed to fetch file content.');
            
            const data = await response.json();
            
            // Update the preview with loaded data
            const previewConversations = data.map(c => ({
                ...c,
                message_count: c.messages.length,
            }));
            setPreprocessedData(previewConversations);
            setPreprocessedFileName(filename);
            setSelectedPreprocessedFile(filename);
            // When switching to preprocessed, clear enriched selection and data so UI swaps correctly
            setSelectedEnrichedFile(null);
            setEnrichedData(null);
            
            // Set selections
            const allIds = new Set(data.map(c => c.id));
            setEnrichSelection(allIds);
            setIncludeSelection(allIds);
            
            addLog(`Successfully loaded ${data.length} conversations from ${filename}.`, 'success');
            toast({ title: "File Loaded", description: `Loaded ${data.length} conversations from ${filename}` });
        } catch (error) {
            addLog(`Error loading preprocessed file: ${error.message}`, 'error');
            toast({ title: "Load Error", description: `Could not load file: ${error.message}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fileManagerRef.current?.fetchFiles();
    }, []);

    const resetState = (clearLogs = true) => {
        if(clearLogs) setLog([]);
        setCurrentStage('idle');
        setCounts({ enriched: 0, loaded: 0 });
        setPreprocessedData([]);
        setRawParsedData([]);
        setEnrichedFiles([]);
        setSelectedEnrichedFile(null);
        setDataToLoad(null);
        setEnrichSelection(new Set());
        setIncludeSelection(new Set());
        setUserOnlySelection(new Set());
        setEnrichmentErrorIds(new Set());
        setEnrichmentErrors([]);
    };

    const fetchFailedLogs = React.useCallback(async () => {
        if (isLite) {
            setFailedLogs([]);
            return;
        }
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("User not authenticated.");
            const response = await fetch(`/api/import/files?type=enrichment-log-failed&token=${session.access_token}`);
            if (!response.ok) throw new Error('Failed to fetch failed logs.');
            const data = await response.json();
            setFailedLogs(data);
        } catch (error) {
            // Don't call addLog here to avoid infinite loops during dropdown operations
            console.error('Could not fetch list of failed logs:', error.message);
        }
    }, [isLite]);
    
    const handleFilesFetched = (files: string[]) => {
        setEnrichedFiles(files);
        if (selectedEnrichedFile && !files.includes(selectedEnrichedFile)) {
            setSelectedEnrichedFile(null);
            if (isLite) {
                try { window.localStorage.removeItem(LITE_LAST_ENRICHED_FILE_KEY); } catch { /* ignore */ }
            }
        }
    };

    const handleFileDeleted = (deletedFilename: string) => {
        if (selectedEnrichedFile === deletedFilename) {
            setSelectedEnrichedFile(null);
            setDataToLoad(null);
            if (isLite) {
                try { window.localStorage.removeItem(LITE_LAST_ENRICHED_FILE_KEY); } catch { /* ignore */ }
            }
        }
    };

    const handleSelectEnrichedFile = (fileName: string) => {
        setSelectedEnrichedFile(fileName);
        setDataToLoad(null);
        if (isLite) {
            try { window.localStorage.setItem(LITE_LAST_ENRICHED_FILE_KEY, fileName); } catch { /* ignore */ }
        }
    };

    const handleSelectAllUserOnly = (selected: boolean) => {
        setUserOnlySelection(() => {
            if (!selected) return new Set();
            return new Set(preprocessedData.map(c => c.id));
        });
    };

    const handlePreviewEnrichedFile = async () => {
        if (!selectedEnrichedFile) return;
        addLog(`Loading preview for ${selectedEnrichedFile}...`);
        try {
            const headers: Record<string, string> = {};
            if (!isLite) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("User not authenticated.");
                headers.Authorization = `Bearer ${session.access_token}`;
            }
            const response = await fetch(`${apiBase}/file-content?fileName=${encodeURIComponent(selectedEnrichedFile)}&from=enriched`, { headers });
            if (!response.ok) throw new Error('Failed to fetch file content.');
            const data = await response.json();
            setEnrichedData(data);
            toast({ title: "Preview Ready", description: `Showing content from ${selectedEnrichedFile}` });
        } catch (error) {
            addLog(`Could not load content for ${selectedEnrichedFile}: ${error.message}`, 'error');
        }
    };
    
    const handleLoadFailedLog = async () => {
        if (isLite) return;
        if (!selectedFailedLog) return;
        setIsLoading(true);
        addLog(`Loading failed log: ${selectedFailedLog}...`);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("User not authenticated.");
            const response = await fetch(`/api/import/file-content?fileName=${selectedFailedLog}&token=${session.access_token}`);
            if (!response.ok) throw new Error('Failed to fetch failed log content.');
            const failedMessages = await response.json();
            const convosMap = new Map<string, PreviewConversation>();
            failedMessages.forEach(msg => {
                const convoId = msg.conversation_id;
                if (!convosMap.has(convoId)) {
                    convosMap.set(convoId, {
                        id: convoId,
                        title: msg.conversation_title,
                        messages: [],
                        message_count: 0,
                        error: `Contains ${failedMessages.filter(m => m.conversation_id === convoId).length} failed messages.`
                    });
                }
                convosMap.get(convoId)?.messages.push({
                    id: msg.message_id,
                    content: msg.content,
                    role: msg.author,
                });
            });
            const reconstructedConvos = Array.from(convosMap.values());
            reconstructedConvos.forEach(c => c.message_count = c.messages.length);
            setPreprocessedData(reconstructedConvos);
            const allIds = new Set(reconstructedConvos.map(c => c.id));
            setEnrichSelection(allIds);
            setIncludeSelection(allIds);
            addLog(`Successfully loaded ${reconstructedConvos.length} conversations with failed messages for retry.`, 'success');
            toast({ title: "Ready to Retry" });
        } catch (error) {
            addLog(`Error loading failed log: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        setIsLoading(true);
        setCurrentStage('processing');
        resetState();
        addLog(`Reading and processing ${file.name} in browser...`);
        try {
            const isConversationExport = file.name.toLowerCase().includes('conversations');
            const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
            if (isConversationExport) {
                addLog(`File size: ~${sizeMb} MB`);
            }

            // Lite guardrails: if file is big, auto-enable demo limit.
            if (isLite && isConversationExport && file.size > 5 * 1024 * 1024 && !config.demoLimitEnabled) {
                addLog(`Large export detected (>5MB). Enabling Demo limit to keep runtime reasonable.`, 'warning');
                setConfig(prev => ({ ...prev, demoLimitEnabled: true, demoLimitConversations: Math.min(prev.demoLimitConversations || 50, 50) }));
                toast({
                    title: 'Large conversations.json',
                    description: 'Demo limit was enabled automatically (max 50 conversations) to keep enrichment fast.',
                });
            }

            // Extreme sizes: cap to a safe max rather than crashing the browser.
            const MAX_ALL_CONVOS_LITE = 500;
            const extremeSize = isLite && isConversationExport && file.size > 120 * 1024 * 1024;
            if (extremeSize) {
                addLog(`Very large export detected (>120MB). Capping processing to last ${MAX_ALL_CONVOS_LITE} conversations.`, 'warning');
                setConfig(prev => ({ ...prev, demoLimitEnabled: false }));
            }

            const fileContent = await file.text();
            const allRawConvos = JSON.parse(fileContent);
            addLog(`Parsed ${allRawConvos.length} total conversations.`);

            let conversationsToProcess = allRawConvos;

            const normalizeEpoch = (value: any) => {
                if (value === null || value === undefined) return null;
                const n = Number(value);
                if (!Number.isFinite(n) || n <= 0) return null;
                return n < 1e12 ? Math.round(n * 1000) : Math.round(n);
            };

            const getConvoTimeMs = (c: any) => {
                return (
                    normalizeEpoch(c?.update_time) ??
                    normalizeEpoch(c?.create_time) ??
                    0
                );
            };

            const pickMostRecent = (arr: any[], n: number) => {
                // Sort by timestamp desc so we always pick the newest items regardless of JSON order.
                const sorted = Array.isArray(arr) ? arr.slice().sort((a, b) => getConvoTimeMs(b) - getConvoTimeMs(a)) : [];
                return sorted.slice(0, n);
            };

            // Lite demo limit (preferred): take the most recent N (last N in file).
            if (isLite && isConversationExport && config.demoLimitEnabled) {
                const n = Math.max(1, Math.min(500, Number(config.demoLimitConversations || 50)));
                conversationsToProcess = pickMostRecent(allRawConvos, n);
                addLog(`Demo limit enabled: Previewing the most recent ${n} conversations.`, 'warning');
            } else if (!isLite && config.isTestRun) {
                // Full app test run
                conversationsToProcess = allRawConvos.slice(0, 50);
                addLog(`Test Run enabled: Previewing the first 50 conversations.`, 'warning');
            } else if (isLite && isConversationExport && allRawConvos.length > MAX_ALL_CONVOS_LITE) {
                // If user chooses "all", still cap in Lite to keep runtime reasonable.
                conversationsToProcess = pickMostRecent(allRawConvos, MAX_ALL_CONVOS_LITE);
                addLog(`All selected, but Lite caps to most recent ${MAX_ALL_CONVOS_LITE} conversations for safety.`, 'warning');
            }
            
            let parsed = parseConversationObjects(conversationsToProcess);
            
            // Add code flag to each conversation
            parsed = parsed.map(convo => ({
                ...convo,
                hasCode: convo.messages.some(msg => /```/.test(msg.content))
            }));

            setRawParsedData(parsed); 
            // Initially, show the raw, unprocessed data in the preview
            setPreprocessedData(parsed);

            const allIds = new Set(parsed.map(c => c.id));
            setEnrichSelection(allIds);
            setIncludeSelection(allIds);
            
            addLog(`Successfully processed ${parsed.length} conversations for preview.`, 'success');
            toast({ title: "Preview Ready" });
        } catch (error: any) {
            addLog(`An error occurred during client-side processing: ${error.message}`, 'error');
            toast({ title: 'Error', description: 'Could not process file for preview.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
            setCurrentStage('idle');
        }
    };

    const handleEnrichStream = async (conversationsToEnrich) => {
        if (!preprocessedFileName) {
            addLog('Cannot enrich: no preprocessed file has been saved.', 'error');
            toast({ title: 'Error', description: 'Please process and save a file first.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        setCurrentStage('enriching');
        setEnrichStreamStatus({
            startedAt: Date.now(),
            lastEventAt: Date.now(),
            processedMessages: 0,
            totalMessages: Array.isArray(conversationsToEnrich)
                ? conversationsToEnrich.reduce((sum, convo) => sum + (convo?.messages?.length || 0), 0)
                : 0,
            processedConversations: 0,
            totalConversations: Array.isArray(conversationsToEnrich) ? conversationsToEnrich.length : 0,
        });
        
        const messagesToEnrichCount = conversationsToEnrich.reduce((sum, convo) => sum + convo.messages.length, 0);
        addLog(`Sending preprocessed file ${preprocessedFileName} to backend for streaming enrichment...`);
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (!isLite) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("User not authenticated.");
                headers.Authorization = `Bearer ${session.access_token}`;
            } else {
                const key = localStorage.getItem('liaraLite.openaiKey') || '';
                if (key.trim()) headers['x-openai-key'] = key.trim();
            }

            const response = await fetch(`${apiBase}/enrich-stream`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ 
                    preprocessedFileName, 
                    model: selectedModel, 
                    generateTopics: config.generateTopics,
                    enableNER: config.enableNER,
                    nerUserOnly: config.nerUserOnly
                }),
            });
            if (!response.body) {
                throw new Error("ReadableStream not available.");
            }
            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
            let buffer = '';
            const processStream = async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    buffer += value;
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const json = line.substring(6);
                            const parsedData = JSON.parse(json);
                            setEnrichStreamStatus(prev => prev ? ({ ...prev, lastEventAt: Date.now() }) : prev);
                            if (parsedData.type === 'log') {
                                addLog(`[backend] ${parsedData.message}`, 'info');
                            } else if (parsedData.type === 'heartbeat') {
                                // keepalive only (lastEventAt updated above)
                            } else if (parsedData.type === 'progress') {
                                setEnrichStreamStatus(prev => {
                                    if (!prev) return prev;
                                    return {
                                        ...prev,
                                        processedMessages: Number(parsedData.processedMessages ?? prev.processedMessages),
                                        totalMessages: Number(parsedData.totalMessages ?? prev.totalMessages),
                                        processedConversations: Number(parsedData.processedConversations ?? prev.processedConversations),
                                        totalConversations: Number(parsedData.totalConversations ?? prev.totalConversations),
                                        lastEventAt: Date.now(),
                                    };
                                });
                            } else if (parsedData.type === 'done') {
                                const { payload } = parsedData;
                                setEnrichmentErrors(payload.failedEnrichments || []);
                                
                                let successMessage = `Enrichment complete. `;
                                const isLineMode = config.enrichmentScope.startsWith('lines-');
                                if (isLineMode) {
                                    successMessage += `${messagesToEnrichCount} lines enriched across ${payload.enrichedCount} conversations.`;
                                } else {
                                    successMessage += `${payload.enrichedCount} conversations enriched.`;
                                }
                                successMessage += ` Results saved to ${payload.enrichedFileName}.`;
                                addLog(successMessage, 'success');
                                await fileManagerRef.current?.fetchFiles();
                                handleSelectEnrichedFile(payload.enrichedFileName);
                                // Auto-preview freshly enriched file for immediate review
                                try {
                                    const hdrs: Record<string, string> = {};
                                    if (!isLite) {
                                        const { data: { session } } = await supabase.auth.getSession();
                                        if (session) hdrs.Authorization = `Bearer ${session.access_token}`;
                                    }
                                    const previewResp = await fetch(`${apiBase}/file-content?fileName=${encodeURIComponent(payload.enrichedFileName)}&from=enriched`, { headers: hdrs });
                                    if (previewResp.ok) {
                                        const previewData = await previewResp.json();
                                        setEnrichedData(previewData);
                                    }
                                } catch {}
                                toast({ title: "Enrichment Complete", description: `Results saved to ${payload.enrichedFileName}` });
                                setIsLoading(false);
                                setCurrentStage('idle');
                                setEnrichStreamStatus(null);
                                return; 
                            } else if (parsedData.type === 'error') {
                                throw new Error(parsedData.message);
                            }
                        }
                    }
                }
            };
            await processStream();
        } catch (error: any) {
            addLog(`An error occurred during enrichment: ${error.message}`, 'error');
            toast({ title: 'Error', description: 'Could not enrich data.', variant: 'destructive' });
            setIsLoading(false);
            setCurrentStage('idle');
            setEnrichStreamStatus(null);
        }
    };
    
    const handleLoadFromFile = async (isTest?: boolean) => {
        if (!selectedEnrichedFile) return;
        setIsLoading(true);
        setCurrentStage('loading');
        const useTest = isLite ? false : (typeof isTest === 'boolean' ? isTest : isTestMode);
        addLog(`Sending request to load ${selectedEnrichedFile} into the ${useTest ? 'test' : 'main'} database...`);
        const queryParams = new URLSearchParams({ isTest: String(useTest) });
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (!isLite) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("User not authenticated.");
                headers.Authorization = `Bearer ${session.access_token}`;
            }
            const response = await fetch(`${apiBase}/load?${queryParams}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ fileName: selectedEnrichedFile })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => null);
                throw new Error(err?.error || `Request failed with status ${response.status}`);
            }

            // Lite uses a simple JSON response; full app may stream progress lines.
            if (isLite) {
                const result = await response.json().catch(() => ({} as any));
                const insertedCount = Number(result?.insertedCount || 0);
                if (insertedCount > 0) addLog(`Successfully loaded ${insertedCount} memories from ${selectedEnrichedFile}.`, 'success');
                setCounts(prev => ({ ...prev, loaded: insertedCount }));
                toast({ title: 'Load Complete', description: `${insertedCount} memories from ${selectedEnrichedFile} have been loaded.` });
                return;
            }

            // Streaming response (full app)
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let totalMemories = 0;
            let loadedCount = 0;

            if (reader) {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (!line.trim()) continue;
                            try {
                                const update = JSON.parse(line);
                                if (update.type === 'progress') {
                                    if (!totalMemories) {
                                        totalMemories = update.total;
                                        addLog(`Starting to load ${totalMemories} memories...`);
                                    }
                                    loadedCount = update.loaded;
                                    addLog(`[loader] Successfully upserted batch. Total inserted: ${loadedCount}/${totalMemories}`, 'info');
                                    setCounts(prev => ({ ...prev, loaded: loadedCount }));
                                } else if (update.type === 'complete') {
                                    addLog(`[loader] Finished upserting all memories.`, 'success');
                                }
                            } catch (e) {
                                console.warn('Error parsing progress update:', e);
                            }
                        }
                    }
                } finally {
                    reader.releaseLock();
                }
            }

            if (loadedCount > 0) addLog(`Successfully loaded ${loadedCount} memories from ${selectedEnrichedFile}.`, 'success');
            setCounts(prev => ({ ...prev, loaded: loadedCount }));
            toast({ title: 'Load Complete', description: `${loadedCount} memories from ${selectedEnrichedFile} have been loaded.` });
        } catch (error: any) {
            addLog(`An error occurred during loading: ${error.message}`, 'error');
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
            setCurrentStage('idle');
        }
    };
    
    const handleConfirmClear = async () => {
        setIsClearing(true);
        addLog(`Attempting to clear the test_memories table...`);
        try {
            const headers: Record<string, string> = {};
            if (!isLite) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("User not authenticated.");
                headers.Authorization = `Bearer ${session.access_token}`;
            }
            const response = await fetch(`${apiBase}/clear-test-memories`, {
                method: 'POST',
                headers,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to clear test memories.');
            addLog(`Successfully cleared ${result.deletedCount} memories from the test database.`, 'success');
            toast({ title: 'Test Memories Cleared' });
        } catch (error: any) {
            addLog(`An error occurred while clearing test memories: ${error.message}`, 'error');
            toast({ title: 'Error', description: 'Could not clear test memories.', variant: 'destructive' });
        } finally {
            setIsClearing(false);
            setIsConfirmingClear(false);
        }
    };

    const handleEnrichSelect = (id: string, selected: boolean) => {
        setEnrichSelection(prev => {
            const newSelection = new Set(prev);
            if (selected) {
                newSelection.add(id);
            } else {
                newSelection.delete(id);
            }
            return newSelection;
        });
    };

    const handleIncludeSelect = (id: string, selected: boolean) => {
        setIncludeSelection(prev => {
            const newSelection = new Set(prev);
            if (selected) {
                newSelection.add(id);
            } else {
                newSelection.delete(id);
            }
            return newSelection;
        });
    };

    const handleUserOnlySelect = (id: string, selected: boolean) => {
        setUserOnlySelection(prev => {
            const newSelection = new Set(prev);
            if (selected) {
                newSelection.add(id);
            } else {
                newSelection.delete(id);
            }
            return newSelection;
        });
    };

    const handleSelectAllEnrich = (selected: boolean) => {
        if (selected) {
            setEnrichSelection(new Set(preprocessedData.map(c => c.id)));
        } else {
            setEnrichSelection(new Set());
        }
    };

    const handleSelectAllInclude = (selected: boolean) => {
        if (selected) {
            setIncludeSelection(new Set(preprocessedData.map(c => c.id)));
        } else {
            setIncludeSelection(new Set());
        }
    };

    const value = {
        file, setFile,
        log,
        isLoading,
        isClearing,
        isConfirmingClear, setIsConfirmingClear,
        currentStage,
        isTestMode,
        preprocessedData,
        dataToLoad, setDataToLoad,
        enrichedData,
        enrichedFiles,
        preprocessedFileName,
        selectedEnrichedFile,
        enrichSelection,
        includeSelection,
        userOnlySelection,
        enrichmentErrorIds,
        enrichmentErrors,
        counts,
        config, setConfig,
        selectedModel, setSelectedModel,
        selectedPreprocessedFile, setSelectedPreprocessedFile,
        selectedSourceFile, setSelectedSourceFile,
        setSelectedEnrichedFile,
        isConsoleOpen, setIsConsoleOpen,
        failedLogs,
        selectedFailedLog, setSelectedFailedLog,
        fileManagerRef,
        addLog,
        resetState,
        fetchFailedLogs,
        handleFilesFetched,
        handleFileDeleted,
        handleSelectEnrichedFile,
        handlePreviewEnrichedFile,
        handleLoadFailedLog,
        handleProcess,
        handleEnrichStream,
        handleLoadFromFile,
        handleConfirmClear,
        handleEnrichSelect,
        handleIncludeSelect,
        handleSelectAllEnrich,
        handleSelectAllInclude,
        handleSelectAllUserOnly,
        saveAndApplyPreprocessing,
        handleLoadPreprocessedFile,
        handleUserOnlySelect,
        enrichStreamStatus,
    };

    return <ImportContext.Provider value={value}>{children}</ImportContext.Provider>;
};

export const useImport = (): ImportContextType => {
    const context = useContext(ImportContext);
    if (context === undefined) {
        throw new Error('useImport must be used within an ImportProvider');
    }
    return context;
}; 