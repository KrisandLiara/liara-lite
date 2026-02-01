import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/import/FileUpload';
import { useImport } from '@/contexts/ImportContext';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Stage1_Process = () => {
    const {
        file,
        isLoading,
        currentStage,
        failedLogs,
        selectedFailedLog,
        setFile,
        setSelectedFailedLog,
        fetchFailedLogs,
        handleProcess,
        handleLoadFailedLog,
        config,
        setConfig,
    } = useImport();

    return (
        <Card className="min-h-[110px]">
            <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-base">Step 1: Process File</CardTitle>
                <CardDescription className="text-xs">Load a `conversations.json` file to begin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
                <FileUpload onFileSelect={setFile} />

                {/* Horizontal layout for checkbox and button */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="isTestRun" checked={config.isTestRun} onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isTestRun: Boolean(checked) }))} />
                        <Label htmlFor="isTestRun" className="text-xs">Test Run (first 50)</Label>
                    </div>
                    <Button onClick={handleProcess} disabled={!file || isLoading} className="glassy-primary px-4 h-8">
                        {isLoading && currentStage === 'processing' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Process File
                    </Button>
                </div>

                {/* Compact retry section */}
                <div className="border-t pt-2 mt-2">
                    <Label className="text-xs text-muted-foreground mb-1 block">Or retry a failed enrichment log:</Label>
                    <div className="flex gap-2">
                        <Select onValueChange={setSelectedFailedLog} onOpenChange={fetchFailedLogs}>
                            <SelectTrigger className="flex-1 h-8">
                                <SelectValue placeholder="Select failed log..." />
                            </SelectTrigger>
                            <SelectContent>
                                {failedLogs.map(logFile => (
                                    <SelectItem key={logFile} value={logFile}>{logFile}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleLoadFailedLog} disabled={!selectedFailedLog || isLoading} variant="secondary" size="sm" className="h-8 px-3">
                            Load for Retry
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}; 