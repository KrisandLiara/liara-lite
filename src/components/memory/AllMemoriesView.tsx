import React from 'react';
import AdminActionsPanel from '@/components/memory/AdminActionsPanel';
import LiveStatusConsole from '@/components/memory/LiveStatusConsole';
import { useAdminActions } from '@/components/memory/useAdminActions';

export const AllMemoriesView: React.FC = () => {
    const {
        log,
        jobProgress,
        isJobRunning,
        lastAction,
        runAction,
        stopAction,
        restartAction,
    } = useAdminActions();

    return (
        <div className="p-4 md:p-6 space-y-6">
            <header className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-slate-100">Memory Control Center</h1>
                <p className="text-slate-400 max-w-3xl">
                    Monitor system status, manage memory data, and import new knowledge.
                </p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <AdminActionsPanel onRunAction={runAction} isJobRunning={isJobRunning} />
                </div>
                <div className="lg:col-span-2">
                    <LiveStatusConsole
                        log={log}
                        jobProgress={jobProgress}
                        isJobRunning={isJobRunning}
                        onStop={stopAction}
                        onRestart={restartAction}
                        lastAction={lastAction}
                    />
                </div>
            </div>
        </div>
    );
}; 