import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useImport } from '@/contexts/ImportContext';
import { Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnrichedFileManager } from '@/components/import/EnrichedFileManager';
import { useSettings } from '@/contexts/SettingsContext';
import { refreshFacets } from '@/services/memory/facets';

export const Stage3_Load = () => {
    const {
        isLoading,
        isClearing,
        isConfirmingClear,
        preprocessedData,
        enrichedFiles,
        selectedEnrichedFile,
        fileManagerRef,
        setIsConfirmingClear,
        handleFilesFetched,
        handleFileDeleted,
        handleSelectEnrichedFile,
        handlePreviewEnrichedFile,
        handleLoadFromFile,
        handleConfirmClear,
    } = useImport();

    const { isTestMode } = useSettings();

    return (
        <Card className={cn("transition-opacity duration-500 min-h-[70px]", preprocessedData.length > 0 || enrichedFiles.length > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none')}>
            <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-base">Step 3: Load to Database</CardTitle>
                <CardDescription className="text-xs">Select an enriched file to review and load.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
                {/* Horizontal File Selection and Actions */}
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <Label className="text-xs font-medium mb-1 block">Select Enriched File</Label>
                        <Select onValueChange={handleSelectEnrichedFile} value={selectedEnrichedFile || ''}>
                            <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select a file..." />
                            </SelectTrigger>
                            <SelectContent>
                                {enrichedFiles.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={handlePreviewEnrichedFile} 
                            disabled={!selectedEnrichedFile || isLoading} 
                            variant="outline"
                            size="sm"
                            className="h-8 px-3"
                        >
                            Preview
                        </Button>
                        <Button 
                            onClick={handleLoadFromFile} 
                            disabled={!selectedEnrichedFile || isLoading} 
                            className="glassy-primary h-8 px-3"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                            Load to DB
                        </Button>
                    </div>
                </div>

                {/* Compact Clear Button */}
                {isTestMode && (
                    <div className="pt-1 border-t border-slate-700">
                        {!isConfirmingClear ? (
                            <Button
                                onClick={() => setIsConfirmingClear(true)}
                                className="glassy-destructive w-full h-7 text-xs"
                                disabled={isLoading}
                            >
                                !! CAUTION !! Clear Test Memories
                            </Button>
                        ) : (
                            <div className="flex justify-between items-center w-full p-1 rounded-md bg-slate-900 border border-red-500/80">
                                <span className="text-white font-medium text-xs">Are you sure?</span>
                                <div className="flex gap-1">
                                    <Button onClick={handleConfirmClear} size="icon" variant="ghost" className="h-5 w-5 hover:bg-green-500/20" disabled={isClearing}>
                                        {isClearing ? <Loader2 className="h-2 w-2 animate-spin" /> : <Check className="h-2 w-2 text-green-400" />}
                                    </Button>
                                    <Button onClick={() => setIsConfirmingClear(false)} size="icon" variant="ghost" className="h-5 w-5 hover:bg-red-500/20" disabled={isClearing}>
                                        <X className="h-2 w-2 text-red-400" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Rebuild facet counts for overview (hard memory) */}
                <div className="pt-2">
                    <Button
                        onClick={async ()=>{ await refreshFacets('hard'); }}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 w-full"
                    >
                        Rebuild Facet Counts (Overview)
                    </Button>
                </div>

                {/* Compact File Manager */}
                <div className="pt-0">
                    <EnrichedFileManager ref={fileManagerRef} onFileDeleted={handleFileDeleted} onFilesFetched={handleFilesFetched} />
                </div>
            </CardContent>
        </Card>
    );
}; 