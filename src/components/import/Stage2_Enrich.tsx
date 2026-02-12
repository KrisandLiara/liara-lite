import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useImport } from '@/contexts/ImportContext';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickPresets } from './QuickPresets';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export const Stage2_Enrich = () => {
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
        <Card className={cn("transition-opacity duration-500 min-h-[110px]", preprocessedData.length > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none')}>
            <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-base">Step 2: Enrich Data</CardTitle>
                <CardDescription className="text-xs">Generate summaries, tags, and embeddings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
                {/* Horizontal layout for presets and button */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                        <QuickPresets 
                            onPresetSelect={(scope) => setConfig(prev => ({ ...prev, enrichmentScope: scope }))}
                            currentScope={config.enrichmentScope}
                            disabled={isLoading || includeSelection.size === 0}
                        />
                    </div>
                    <Button onClick={() => handleEnrichStream(getConversationsForEnrichment())} disabled={isLoading || includeSelection.size === 0} className="glassy-primary px-4 h-8">
                        {isLoading && currentStage === 'enriching' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Enrich Data
                    </Button>
                </div>

                {/* Advanced Options - Collapsible */}
                <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors">
                        <ChevronDown className="w-4 h-4" />
                        Advanced Options
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-3">
                        <p className="text-xs text-slate-400">Enriching: <span className="font-medium text-sky-400">First {config.enrichmentScope.split('-')[1] === '-1' ? 'all' : config.enrichmentScope.split('-')[1]} {config.enrichmentScope.startsWith('lines') ? 'lines' : 'conversations'} from selected</span></p>

                        <RadioGroup value={config.enrichmentScope} onValueChange={(value) => setConfig(prev => ({ ...prev, enrichmentScope: value }))}>
                            <Label className="text-sm font-medium">By Lines</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="lines-10" id="lines-10" />
                                    <Label htmlFor="lines-10" className="text-sm">10 Lines</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="lines-50" id="lines-50" />
                                    <Label htmlFor="lines-50" className="text-sm">50 Lines</Label>
                                </div>
                            </div>
                            
                            <Label className="text-sm font-medium pt-2">By Conversations</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="conversations-10" id="conv-10" />
                                    <Label htmlFor="conv-10" className="text-sm">10 Conversations</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="conversations-50" id="conv-50" />
                                    <Label htmlFor="conv-50" className="text-sm">50 Conversations</Label>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                <RadioGroupItem value="conversations--1" id="conv-all" />
                                <Label htmlFor="conv-all" className="text-sm">All Selected ({includeSelection.size})</Label>
                            </div>
                        </RadioGroup>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}; 