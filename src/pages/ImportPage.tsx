import React, { useEffect, useMemo, useState } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import LiveStatusConsole from '@/components/memory/LiveStatusConsole';
import { PreprocessedPreview, EnrichedPreview } from '@/components/import/preview';
import { StepProgress } from '@/components/import/StepIndicator';
import { TokenInfoBlock } from '@/components/import/TokenInfoBlock';
import { QuickPresets } from '@/components/import/QuickPresets';
import { FileUpload } from '@/components/import/FileUpload';
import { EnrichedFileManager } from '@/components/import/EnrichedFileManager';
import { PreprocessedFileManager } from '@/components/import/PreprocessedFileManager';
import { FileSelector } from '@/components/import/preview/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Loader2, Check, X, Sparkles, Eye, Database } from 'lucide-react';
import { ImportProvider, useImport } from '@/contexts/ImportContext';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import './ImportPage.css';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Info } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

// Helper function to format enriched file names for display
const formatEnrichedFileName = (filename: string) => {
  if (!filename) return '';
  
  // Extract timestamp from filename like "enriched-data-1751818578449.json"
  const match = filename.match(/enriched-data-(\d+)\.json/);
  if (match) {
    const timestamp = parseInt(match[1]);
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${formattedDate} - ${filename}`;
  }
  
  return filename;
};

// Minimal Step 1 Component - Only show when no data loaded
const MinimalStep1 = () => {
  const {
    file,
    isLoading,
    currentStage,
    enrichStreamStatus,
    failedLogs,
    selectedFailedLog,
    selectedPreprocessedFile,
    selectedEnrichedFile,
    preprocessedData,
    setFile,
    setSelectedFailedLog,
    setSelectedPreprocessedFile,
    fetchFailedLogs,
    handleProcess,
    handleLoadFailedLog,
    handleLoadPreprocessedFile,
    config,
    setConfig,
    setDataToLoad,
    handlePreviewEnrichedFile,
    handleSelectEnrichedFile,
    selectedSourceFile,
    setSelectedSourceFile,
    setSelectedEnrichedFile,
    preprocessedFileName,
  } = useImport();

  const handleUnifiedFileSelect = async (filename: string | null, type: 'preprocessed' | 'enriched' | 'source') => {
    if (filename) {
      if (type === 'preprocessed') {
        // Do not auto-load; allow user to click Preview
        setSelectedPreprocessedFile(filename);
        setSelectedSourceFile(null);
        setSelectedEnrichedFile(null);
      } else if (type === 'enriched') {
        handleSelectEnrichedFile(filename);
        setSelectedSourceFile(null);
      }
    } else if (type === 'source') {
      // Source selected: filename is a pseudoName in Lite; actual File is in context `file`
    }

    if (type === 'source') {
      setSelectedSourceFile(filename || null);
      setSelectedPreprocessedFile(null);
      setSelectedEnrichedFile(null);
    }
  };

  const handleUnifiedFilePreview = async (filename: string, type: 'preprocessed' | 'enriched' | 'source') => {
    if (type === 'preprocessed') {
      await handleLoadPreprocessedFile(filename);
    } else if (type === 'enriched') {
      handleSelectEnrichedFile(filename);
      await handlePreviewEnrichedFile();
    } else {
      // Source JSON selected: process directly into preprocessed preview
      await handleProcess();
    }
  };

  // Determine current selected file (prefer enriched if set)
  const currentSelectedFile = selectedEnrichedFile || selectedPreprocessedFile || selectedSourceFile || null;

  // If we have data loaded, show minimal file switcher
  if (preprocessedData.length > 0) {
    return (
      <div className="mb-4 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300 font-medium">Data Source:</span>
          <div className="flex-1 max-w-md">
            <FileSelector
              selectedFile={currentSelectedFile}
              onFileSelect={handleUnifiedFileSelect}
              onPreviewFile={handleUnifiedFilePreview}
              disabled={isLoading}
              placeholder="- Select file -"
              showNewOption={true}
              compact={true}
              refreshKey={preprocessedFileName || null}
            />
          </div>
          <div className="flex items-center gap-2">
            <FileUpload onFileSelect={setFile} compact={true} />
            <Button 
              onClick={handleProcess} 
              disabled={!file || isLoading} 
              variant="outline"
              size="sm"
            >
              {isLoading && currentStage === 'processing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Process New
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Initial load state - maximized layout
  return (
    <div className="mb-6">
      <Card className="border-slate-700/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/50 flex items-center justify-center text-lg font-bold">1</div>
            <div>
              <CardTitle className="text-xl">Import Data</CardTitle>
              <CardDescription className="mt-1">
                Load a `conversations.json` file or select an existing preprocessed file
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Unified File Manager */}
          <div>
            <FileSelector
              selectedFile={currentSelectedFile}
              onFileSelect={handleUnifiedFileSelect}
              onPreviewFile={handleUnifiedFilePreview}
              disabled={isLoading}
              placeholder="- Select file -"
              showNewOption={true}
              compact={false}
              refreshKey={preprocessedFileName || null}
            />
          </div>
          {selectedSourceFile && file && (
            <div className="flex items-center gap-3 text-xs text-slate-400 -mt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="liteSourceLast50_step1"
                  checked={Boolean((config as any).demoLimitEnabled)}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, demoLimitEnabled: Boolean(checked), demoLimitConversations: 50 }))}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="liteSourceLast50_step1" className="text-xs text-slate-300">
                  Load only last 50 conversations (fast demo)
                </Label>
              </div>
              <span>{Math.round((file.size / (1024 * 1024)) * 10) / 10} MB</span>
            </div>
          )}
          
          {/* Main Processing Section */}
          {!currentSelectedFile && (
            <div className="space-y-4">
              {/* File Upload Area - Enhanced */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                <div className="lg:col-span-2">
                  <FileUpload onFileSelect={setFile} />
                </div>
                
                {/* Prominent Process Button */}
                <div className="space-y-2">
                  <Button 
                    onClick={handleProcess} 
                    disabled={!file || isLoading} 
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-lg shadow-blue-500/25"
                  >
                    {isLoading && currentStage === 'processing' && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Process File
                  </Button>
                  
                  {/* Options */}
                  {isLite ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center justify-center space-x-2">
                        <Checkbox
                          id="demoLimit"
                          checked={Boolean((config as any).demoLimitEnabled)}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, demoLimitEnabled: Boolean(checked) }))}
                        />
                        <Label htmlFor="demoLimit" className="text-xs">
                          Demo limit (recommended for <code className="text-slate-300">conversations.json</code>)
                        </Label>
                      </div>
                      {Boolean((config as any).demoLimitEnabled) && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-slate-400">Max conversations:</Label>
                          <Select
                            value={String((config as any).demoLimitConversations ?? 50)}
                            onValueChange={(v) => setConfig(prev => ({ ...prev, demoLimitConversations: Number(v) }))}
                          >
                            <SelectTrigger className="h-8 w-[120px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Checkbox id="isTestRun" checked={config.isTestRun} onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isTestRun: Boolean(checked) }))} />
                      <Label htmlFor="isTestRun" className="text-xs">Test Run (first 50)</Label>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Compact retry section */}
              {failedLogs.length > 0 && (
                <div className="p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-amber-200">Retry Failed Enrichments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedFailedLog || ''} onValueChange={setSelectedFailedLog}>
                      <SelectTrigger className="flex-1 h-8 text-xs">
                        <SelectValue placeholder="Select failed log to retry..." />
                      </SelectTrigger>
                      <SelectContent>
                        {failedLogs.map(log => (
                          <SelectItem key={log} value={log}>{log}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleLoadFailedLog} 
                      disabled={!selectedFailedLog || isLoading}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      Load for Retry
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const LiteSetupStrip = () => {
  const isLite = String(import.meta.env.VITE_LIARA_LITE || '').toLowerCase() === 'true';
  const [key, setKey] = React.useState(() => localStorage.getItem('liaraLite.openaiKey') || '');

  if (!isLite) return null;

  return (
    <Card className="border-slate-700/50 bg-slate-900/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Liara Lite – Setup</CardTitle>
        <CardDescription>Paste your OpenAI key (stored locally). File import + previews behave like the full app.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="liteOpenAi">OpenAI API key</Label>
          <Input
            id="liteOpenAi"
            type="password"
            placeholder="sk-..."
            value={key}
            onChange={(e) => {
              const v = e.target.value;
              setKey(v);
              localStorage.setItem('liaraLite.openaiKey', v);
            }}
          />
          <div className="text-xs text-slate-500">Used for enrichment requests (sent as `x-openai-key`).</div>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact Step 2 Component - Enrich Data (formerly Step 3)
const CompactStep2 = () => {
  const {
    isLoading,
    currentStage,
    preprocessedData,
    includeSelection,
    config,
    setConfig,
    handleEnrichStream,
  } = useImport();

  const getConversationsForEnrichment = () => {
    const [mode, amountStr] = config.enrichmentScope.split('-');
    const amount = parseInt(amountStr, 10);
    const conversationsToProcess = preprocessedData.filter(c => includeSelection.has(c.id));
    if (mode === 'conversations') {
      if (amount === -1) return conversationsToProcess;
      return conversationsToProcess.slice(0, amount);
    }
    if (mode === 'lines') {
      const selectedLines = [];
      let linesCount = 0;
      for (const convo of conversationsToProcess) {
        if (linesCount >= amount) break;
        const messagesForConvo = [];
        for (const msg of convo.messages) {
          if (linesCount >= amount) break;
          messagesForConvo.push(msg);
          linesCount++;
        }
        if (messagesForConvo.length > 0) {
          selectedLines.push({ ...convo, messages: messagesForConvo });
        }
      }
      return selectedLines;
    }
    return [];
  };

  return (
    <div className={cn("compact-card", preprocessedData.length > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none')}>
      <div className="compact-card-header">
        <h3 className="compact-card-title">Step 2: Enrich Data</h3>
        <p className="compact-card-description">Generate AI-powered summaries, tags, and embeddings.</p>
      </div>
      
      {/* What We're Enriching - Info Section */}
      <div className="mb-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0"></div>
          <div className="text-xs text-slate-300 leading-relaxed">
            <p className="font-medium text-sky-400 mb-1">AI Processing:</p>
            <ul className="space-y-0.5 text-slate-400">
              <li>• <span className="text-emerald-400">Tags</span> - 2-5 relevant keywords per message</li>
              <li>• <span className="text-emerald-400">Embeddings</span> - Vector representations for semantic search</li>
              <li>• <span className="text-emerald-400">Summaries</span> - One-sentence conversation summaries</li>
              <li>• <span className={!config.generateTopics ? "text-emerald-400" : "text-slate-500"}>Topics</span> - {!config.generateTopics ? "Uses original ChatGPT conversation titles" : "AI-generated conversation topics"}</li>
              <li>• <span className={config.enableNER ? "text-emerald-400" : "text-slate-500"}>Named Entities</span> - {config.enableNER ? (config.nerUserOnly ? "Extract from user prompts only" : "Extract people, places, organizations, dates") : "Disabled (saves tokens and time)"}</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="step2-content">
        {/* Enrichment Scope */}
        <div className="mb-3">
          <Label className="compact-label">Processing Scope</Label>
          <div className="flex gap-2 mt-1">
            <Button 
              onClick={() => setConfig(prev => ({ ...prev, enrichmentScope: 'conversations-10' }))}
              variant={config.enrichmentScope === 'conversations-10' ? 'default' : 'outline'}
              className="compact-button-small text-xs"
            >
              First 10
            </Button>
            <Button 
              onClick={() => setConfig(prev => ({ ...prev, enrichmentScope: 'conversations--1' }))}
              variant={config.enrichmentScope === 'conversations--1' ? 'default' : 'outline'}
              className="compact-button-small text-xs"
            >
              All Selected
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Processing: <span className="font-medium text-sky-400">{config.enrichmentScope === 'conversations--1' ? 'All selected' : 'First 10'} conversations</span></p>
        </div>

        {/* AI Options */}
        <div className="mb-3 space-y-2">
          <Label className="compact-label">AI Options</Label>
          
          {/* Topic Generation Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="generateTopics" 
              checked={config.generateTopics} 
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, generateTopics: Boolean(checked) }))} 
            />
            <Label htmlFor="generateTopics" className="text-xs text-slate-300 cursor-pointer">
              Generate topics with AI
            </Label>
          </div>
          <div className="text-xs text-slate-500 pl-6 -mt-1">
            <p>{config.generateTopics ? "AI will create general topic categories" : "Uses original ChatGPT conversation titles (recommended)"}</p>
          </div>
          
          {/* Named Entity Recognition Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="enableNER" 
              checked={config.enableNER} 
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableNER: Boolean(checked) }))} 
            />
            <Label htmlFor="enableNER" className="text-xs text-slate-300 cursor-pointer">
              Extract named entities (NER)
            </Label>
          </div>
          {config.enableNER && (
            <div className="flex items-center space-x-2 pl-6">
              <Checkbox 
                id="nerUserOnly" 
                checked={config.nerUserOnly} 
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, nerUserOnly: Boolean(checked) }))} 
              />
              <Label htmlFor="nerUserOnly" className="text-xs text-slate-300 cursor-pointer">
                User prompts only
              </Label>
            </div>
          )}
          <div className="text-xs text-slate-500 pl-6 -mt-1">
            <p>{config.enableNER ? 
              (config.nerUserOnly ? 
                "Extracts entities only from user messages (saves ~50% tokens)" : 
                "Extracts people, places, organizations, dates, products, and events from all messages"
              ) : 
              "Disabled to save processing time and tokens"
            }</p>
          </div>
        </div>

        {/* Enrich Button */}
        <Button 
          onClick={() => handleEnrichStream(getConversationsForEnrichment())} 
          disabled={isLoading || includeSelection.size === 0} 
          className="compact-button glassy-primary w-full"
        >
          {isLoading && currentStage === 'enriching' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Start Enrichment
        </Button>
        
        <div className="text-xs text-slate-500 mt-2">
          <p>• Uses GPT-4o Mini for tags/summaries, text-embedding-3-small for vectors</p>
        </div>
      </div>
    </div>
  );
};

// Final Step Component - Enhanced
const FinalStep = () => {
  const {
    isLoading,
    isClearing,
    isConfirmingClear,
    enrichedFiles,
    selectedEnrichedFile,
    setIsConfirmingClear,
    handleSelectEnrichedFile,
    handlePreviewEnrichedFile,
    handleLoadFromFile,
    handleConfirmClear,
  } = useImport();

  const isLite = String(import.meta.env.VITE_LIARA_LITE || '').toLowerCase() === 'true';
  const { isTestMode } = useSettings();

  const handleUnifiedFileSelect = async (filename: string | null, type: 'preprocessed' | 'enriched') => {
    if (type !== 'enriched') return; // Step 4 accepts enriched only
    if (filename) {
      handleSelectEnrichedFile(filename);
      await handlePreviewEnrichedFile(); // auto-preview on select
    }
  };

  const handleUnifiedFilePreview = async (filename: string, type: 'preprocessed' | 'enriched') => {
    if (type !== 'enriched') return;
    handleSelectEnrichedFile(filename);
    await handlePreviewEnrichedFile();
  };

  if (enrichedFiles.length === 0) return null;

  return (
    <div className="mt-6">
      <Card className="border-slate-700/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/50 flex items-center justify-center text-lg font-bold">4</div>
            <div>
              <CardTitle className="text-xl">Load to Memory Database</CardTitle>
              <CardDescription className="mt-1">
                Import your enriched conversations into Liara's semantic memory system
              </CardDescription>
            </div>
          </div>
          
          {/* Loading Info */}
          {!isLite && isTestMode && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-200">
                <span className="text-sm font-medium">Test Mode Active</span>
                <span className="text-xs">Data will be loaded to test_memories table</span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 items-end">
            <div className="space-y-2 lg:ml-auto lg:w-80">
              <Button 
                onClick={handlePreviewEnrichedFile} 
                disabled={!selectedEnrichedFile || isLoading} 
                variant="outline"
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview Data
              </Button>
              <Button 
                onClick={handleLoadFromFile} 
                disabled={!selectedEnrichedFile || isLoading}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 shadow-lg shadow-green-500/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-5 w-5" />
                    Load to Database
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Test Mode Clear Button */}
          {!isLite && isTestMode && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-200">Test Database Management</h4>
                  <p className="text-xs text-slate-400">Clear test memories before loading new data</p>
                </div>
                <div className="flex items-center gap-2">
                  {isConfirmingClear ? (
                    <>
                      <Button 
                        onClick={handleConfirmClear} 
                        disabled={isClearing}
                        variant="destructive"
                        size="sm"
                      >
                        {isClearing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                        {isClearing ? 'Clearing...' : 'Confirm Clear'}
                      </Button>
                      <Button 
                        onClick={() => setIsConfirmingClear(false)} 
                        variant="outline"
                        size="sm"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setIsConfirmingClear(true)} 
                      variant="outline"
                      size="sm"
                    >
                      Clear Test Memories
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ImportPageContent = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const {
    log,
    preprocessedData,
    dataToLoad,
    enrichedData,
    currentStage,
    enrichStreamStatus,
    isConsoleOpen,
    setIsConsoleOpen,
    fileManagerRef,
    handleFileDeleted,
    handleFilesFetched,
    // For unified selector wiring
    selectedPreprocessedFile,
    setSelectedPreprocessedFile,
    handleLoadPreprocessedFile,
    handlePreviewEnrichedFile,
    handleSelectEnrichedFile,
    selectedEnrichedFile,
    setSelectedEnrichedFile,
    selectedSourceFile,
    setSelectedSourceFile,
    handleLoadFromFile,
    isLoading,
    file,
    handleProcess,
    config,
    setConfig,
    preprocessedFileName,
  } = useImport();

  // Optional deep-link from Tag Cloud page: /?open=enriched&file=enriched-data-....
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const open = params.get('open');
    const file = params.get('file');
    if (open === 'enriched' && file) {
      handleSelectEnrichedFile(file);
      handlePreviewEnrichedFile().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnifiedFileSelect = async (filename: string | null, type: 'preprocessed' | 'enriched' | 'source') => {
    try { console.debug('[Index selector] onFileSelect', { filename, type }); } catch {}
    if (type === 'preprocessed' && filename) {
      setSelectedPreprocessedFile(filename);
      setSelectedSourceFile(null);
      setSelectedEnrichedFile(null);
      return;
    }
    if (type === 'enriched' && filename) {
      handleSelectEnrichedFile(filename);
      setSelectedSourceFile(null);
      return;
    }
    if (type === 'source') {
      setSelectedSourceFile(filename || null);
      setSelectedPreprocessedFile(null);
      setSelectedEnrichedFile(null);
    }
  };

  const handleUnifiedFilePreview = async (filename: string, type: 'preprocessed' | 'enriched' | 'source') => {
    try { console.debug('[Index selector] onPreviewFile', { filename, type }); } catch {}
    if (type === 'enriched' && filename) {
      handleSelectEnrichedFile(filename);
      await handlePreviewEnrichedFile();
      return;
    }
    if (type === 'preprocessed' && filename) {
      await handleLoadPreprocessedFile(filename);
      return;
    }
    if (type === 'source') {
      // Process the locally selected JSON file
      await handleProcess();
    }
  };

  // Only switch to Enriched preview when we actually have enriched data
  // and there is no preprocessed preview loaded. Selecting a preprocessed
  // file alone should not switch the view until Preview is clicked.
  const showEnriched = Boolean(enrichedData) && Boolean(selectedEnrichedFile);

  return (
    <div className="liara-page min-h-screen">
      <div className="mx-auto p-4 w-[96%] xl:w-[98%]">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-100">ChatGPT Import Pipeline</h1>
              <p className="text-slate-400 mt-2 text-lg">Transform your conversation exports into intelligent, searchable memories</p>
            </div>
            <Sheet open={isAboutOpen} onOpenChange={setIsAboutOpen}>
              <SheetTrigger asChild>
                <div className="flex gap-2 items-center mt-1">
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={
                        selectedEnrichedFile
                          ? `/tag-cloud?file=${encodeURIComponent(selectedEnrichedFile)}`
                          : "/tag-cloud"
                      }
                    >
                      Tag Cloud
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Info className="h-4 w-4 mr-2" />
                    About / Info
                  </Button>
                </div>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[92vw] sm:w-[520px] lg:w-[33vw] max-w-none border-slate-800 bg-slate-950/95 text-slate-100 overflow-y-auto"
              >
                <SheetHeader className="pr-6">
                  <SheetTitle className="text-slate-100">Liara Lite — How it works</SheetTitle>
                  <SheetDescription className="text-slate-400">
                    Local demo flow: import → preprocess → enrich → preview → (optional) load to local Supabase.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 text-sm">
                  <div className="space-y-2">
                    <div className="font-semibold text-slate-200">Stages</div>
                    <ul className="space-y-2 text-slate-300">
                      <li>
                        <span className="font-semibold">1) Import</span>: select <span className="font-mono text-slate-200">conversations.json</span> (Source) or pick an existing preprocessed/enriched file.
                      </li>
                      <li>
                        <span className="font-semibold">2) Prepare Data (Apply &amp; Save)</span>: this is where preprocessing is applied and a <span className="font-mono text-slate-200">preprocessed_conversations_*.json</span> is written.
                        Options like <span className="font-semibold">Remove Code</span> and per-conversation <span className="font-semibold">User only</span> take effect here.
                      </li>
                      <li>
                        <span className="font-semibold">3) AI Enrichment</span>: backend calls OpenAI to generate embeddings/tags/summaries and writes <span className="font-mono text-slate-200">enriched-data-*.json</span>.
                        Your key is sent as <span className="font-mono text-slate-200">x-openai-key</span>.
                      </li>
                      <li>
                        <span className="font-semibold">4) Preview / Load</span>: preview enriched output in the UI. Optionally load into local Supabase for persistence.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="font-semibold text-slate-200">What “Enriched” contains</div>
                    <ul className="space-y-1 text-slate-300">
                      <li>
                        <span className="font-semibold">Tags (keywords)</span>: stored on each message as <span className="font-mono text-slate-200">msg.tags</span>.
                      </li>
                      <li>
                        <span className="font-semibold">NER (entities)</span>: stored on each message as <span className="font-mono text-slate-200">msg.named_entities</span> (PERSON / ORG / LOC / DATE / etc).
                      </li>
                      <li>
                        <span className="font-semibold">Embeddings</span>: stored on each message as <span className="font-mono text-slate-200">msg.embedding</span> (used for semantic search in the full app / DB mode).
                      </li>
                      <li>
                        <span className="font-semibold">Conversation summary</span>: stored on the conversation as <span className="font-mono text-slate-200">convo.summary</span> (and optional <span className="font-mono text-slate-200">convo.topic</span>).
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="font-semibold text-slate-200">Files &amp; folders</div>
                    <ul className="space-y-1 text-slate-300">
                      <li>
                        <span className="font-semibold">Preprocessed</span>: <span className="font-mono text-slate-200">import/preprocessed/</span>
                      </li>
                      <li>
                        <span className="font-semibold">Enriched</span>: <span className="font-mono text-slate-200">import/enriched/</span>
                      </li>
                      <li className="text-slate-400">
                        You can override the base folder with <span className="font-mono text-slate-200">LIARA_LITE_IMPORT_DIR</span>.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="font-semibold text-slate-200">Tag Cloud (file-only)</div>
                    <ul className="space-y-1 text-slate-300">
                      <li>
                        Tag Cloud reads <span className="font-mono text-slate-200">enriched-data-*.json</span> directly — no DB required.
                      </li>
                      <li>
                        Click a tag/entity to filter matching conversations. Click the header chip to jump through matches (with glow highlight).
                      </li>
                      <li className="text-slate-400">
                        NER entries show their category badge (PERSON / ORG / LOC / …).
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="font-semibold text-slate-200">Demo tips (keep it fast)</div>
                    <ul className="space-y-1 text-slate-300">
                      <li>Use <span className="font-semibold">Load only last 50</span> for big exports.</li>
                      <li>Use selection checkboxes to enrich only the conversations you care about.</li>
                      <li>Start with <span className="font-semibold">GPT-4o Mini</span>, then switch models only if you need higher quality summaries/tags.</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="font-semibold text-slate-200">Troubleshooting</div>
                    <ul className="space-y-1 text-slate-300">
                      <li>
                        If the UI looks “stuck” during enrichment: watch <span className="font-semibold">Running / Last update / X/Y msgs</span> in the Live Status header.
                      </li>
                      <li>
                        If Vite shows <span className="font-mono text-slate-200">ECONNREFUSED /api/…</span>: you likely have two backends running or the backend is restarting.
                      </li>
                      <li className="text-slate-400">
                        For long enrich runs, use separate terminals and run the app in stable mode: <span className="font-mono text-slate-200">npm run liara:lite:app:stable</span>.
                      </li>
                    </ul>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <div className="mb-6">
          <LiteSetupStrip />
        </div>

        {/* Live Status Console - Enhanced */}
        {log.length > 0 && (
          <div className="mb-6">
            <Collapsible open={isConsoleOpen} onOpenChange={setIsConsoleOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 transition-colors border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-200 font-medium text-lg">Live Processing Status</span>
                  </div>
                  {currentStage === 'enriching' && enrichStreamStatus && (
                    <div className="ml-3 text-xs text-slate-400 flex items-center gap-2">
                      <span>
                        Running{' '}
                        {Math.max(0, Math.floor((Date.now() - enrichStreamStatus.startedAt) / 1000))}s
                      </span>
                      <span className="opacity-60">•</span>
                      <span>
                        Last update{' '}
                        {Math.max(0, Math.floor((Date.now() - enrichStreamStatus.lastEventAt) / 1000))}s ago
                      </span>
                      {enrichStreamStatus.totalMessages > 0 && (
                        <>
                          <span className="opacity-60">•</span>
                          <span>
                            {enrichStreamStatus.processedMessages}/{enrichStreamStatus.totalMessages} msgs
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {!isConsoleOpen && log.length > 0 && (
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-slate-400">Latest:</span>
                      <span className={`font-mono text-sm ${
                        log[0].type === 'error' ? 'text-red-400' :
                        log[0].type === 'warning' ? 'text-yellow-400' :
                        log[0].type === 'success' ? 'text-green-400' :
                        'text-blue-400'
                      }`}>
                        {log[0].message}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">{log.length} message{log.length !== 1 ? 's' : ''}</span>
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3">
                  <LiveStatusConsole 
                    log={log} 
                    stage={currentStage}
                    isStreaming={currentStage === 'enriching' || currentStage === 'processing'}
                    summaryText={currentStage === 'processing' ? 'Preparing preview' : currentStage === 'enriching' ? 'Streaming enrichment' : undefined}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Optional step progress */}
        <div className="mb-4">
          <StepProgress
            currentStep={showEnriched ? 4 : preprocessedData.length > 0 ? 3 : 1}
            steps={[
              { title: 'Import', isComplete: preprocessedData.length > 0 || !!enrichedData },
              { title: 'Preprocess', isComplete: preprocessedData.length > 0 },
              { title: 'Enrich', isComplete: !!enrichedData },
              { title: 'Load', isComplete: false },
            ]}
          />
        </div>

        {/* 2x2 Grid: Step Bubbles (index only) */}
        {preprocessedData.length === 0 && !enrichedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1 Bubble */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/50 flex items-center justify-center text-sm font-bold">1</div>
              <h3 className="text-slate-100 font-semibold">Import</h3>
            </div>
            <p className="text-slate-400 text-sm mb-3">Choose or upload a file. You can preview preprocessed or enriched sources here; enriched files can also be loaded to DB directly.</p>
            <div className="max-w-md mb-3">
              <FileSelector
                selectedFile={selectedPreprocessedFile || selectedEnrichedFile || selectedSourceFile || null}
                onFileSelect={handleUnifiedFileSelect}
                onPreviewFile={handleUnifiedFilePreview}
                disabled={isLoading}
                placeholder="- Select file -"
                showNewOption={true}
                compact={true}
                refreshKey={preprocessedFileName || null}
              />
            </div>
            {selectedSourceFile && file && (
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="liteSourceLast50_bubble"
                    checked={Boolean((config as any).demoLimitEnabled)}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, demoLimitEnabled: Boolean(checked), demoLimitConversations: 50 }))}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="liteSourceLast50_bubble" className="text-xs text-slate-300">
                    Load only last 50 conversations (fast demo)
                  </Label>
                </div>
                <span>{Math.round((file.size / (1024 * 1024)) * 10) / 10} MB</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (selectedEnrichedFile) {
                    handleUnifiedFilePreview(selectedEnrichedFile, 'enriched');
                    return;
                  }
                  if (selectedPreprocessedFile) {
                    handleUnifiedFilePreview(selectedPreprocessedFile, 'preprocessed');
                    return;
                  }
                  if (file) {
                    handleUnifiedFilePreview('source', 'source');
                  }
                }}
                disabled={!(selectedPreprocessedFile || selectedEnrichedFile || file) || isLoading}
                variant="outline"
                size="sm"
              >
                <Eye className="mr-2 h-4 w-4" /> Preview
              </Button>
              {selectedEnrichedFile && (
                <Button onClick={handleLoadFromFile} disabled={isLoading} size="sm">
                  <Database className="mr-2 h-4 w-4" /> Load to DB
                </Button>
              )}
            </div>
          </div>

          {/* Step 2 Bubble */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-sm font-bold">2</div>
              <h3 className="text-slate-100 font-semibold">Preprocess</h3>
            </div>
            <p className="text-slate-400 text-sm mb-2">Clean and prepare: remove code for context-only previews, choose test run (50), and build a consistent data shape.</p>
            <ul className="text-slate-400 text-xs list-disc pl-5 space-y-1">
              <li>Remove code (places placeholders; never touches images or transcripts)</li>
              <li>Test run (first 50 conversations)</li>
              <li>Retry failed enrichments from saved logs</li>
            </ul>
          </div>

          {/* Step 3 Bubble */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 flex items-center justify-center text-sm font-bold">3</div>
              <h3 className="text-slate-100 font-semibold">Enrich</h3>
            </div>
            <p className="text-slate-400 text-sm mb-2">Generate tags, summaries, embeddings, and optional named entities. Scope can be “first 10” or “all selected”.</p>
            <ul className="text-slate-400 text-xs list-disc pl-5 space-y-1">
              <li>Tags (2–5 per message)</li>
              <li>Summaries (1 per conversation)</li>
              <li>Embeddings (vector search)</li>
              <li>NER (people, orgs, LOC, products, events, dates)</li>
            </ul>
          </div>

          {/* Step 4 Bubble */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/50 flex items-center justify-center text-sm font-bold">4</div>
              <h3 className="text-slate-100 font-semibold">Load</h3>
            </div>
            <p className="text-slate-400 text-sm mb-2">Review enriched data and load to the memory database.</p>
            <ul className="text-slate-400 text-xs list-disc pl-5 space-y-1">
              <li>Preview enriched file</li>
              <li>Load to DB</li>
              <li>Clear test memories (Test Mode)</li>
            </ul>
            <div className="flex gap-2 mt-3">
              <Button onClick={handlePreviewEnrichedFile} disabled={!selectedEnrichedFile || isLoading} variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" /> Preview Data
              </Button>
              <Button onClick={handleLoadFromFile} disabled={!selectedEnrichedFile || isLoading} size="sm">
                <Database className="mr-2 h-4 w-4" /> Load to DB
              </Button>
            </div>
          </div>
        </div>
        )}

        {/* Main Data Preview - Enhanced */}
        {(preprocessedData.length > 0 || enrichedData) && (
          <div className="my-6">
            {showEnriched ? <EnrichedPreview /> : <PreprocessedPreview />}
          </div>
        )}
        
        {/* Hidden EnrichedFileManager for functionality */}
        <div className="hidden">
          <EnrichedFileManager 
            ref={fileManagerRef} 
            onFileDeleted={handleFileDeleted} 
            onFilesFetched={handleFilesFetched} 
          />
        </div>
      </div>
    </div>
  );
}

const ImportPage = () => {
  return (
    <ImportProvider>
      <ImportPageContent />
    </ImportProvider>
  )
}

export default ImportPage;