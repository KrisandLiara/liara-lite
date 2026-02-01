import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, AlertTriangle, Sparkles, Check, X, HeartPulse } from 'lucide-react';

interface AdminActionsPanelProps {
    onRunAction: (action: string) => void;
    isJobRunning: boolean;
}

const AdminActionsPanel: React.FC<AdminActionsPanelProps> = ({ onRunAction, isJobRunning }) => {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [confirmingAction, setConfirmingAction] = useState<string | null>(null);

    useEffect(() => {
        const checkUserRole = async () => {
            if (user) {
                try {
                    const { data, error } = await supabase
                        .from('user_profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();
                    
                    if (error) {
                        console.error('Error fetching user role for admin panel:', error);
                        setIsAdmin(false);
                        return;
                    }
                    
                    setIsAdmin(data?.role === 'admin');
                } catch (error) {
                    console.error('Error checking user role for admin panel:', error);
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
        };

        checkUserRole();
    }, [user]);

    useEffect(() => {
        if (confirmingAction) {
            const timer = setTimeout(() => setConfirmingAction(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [confirmingAction]);

    const handleInitialClick = (action: 'rebuild-missing' | 'force-rebuild' | 'enrich-all' | 'diagnose') => {
        if (isJobRunning) return;
        setConfirmingAction(action);
    };

    const handleConfirmClick = (action: 'rebuild-missing' | 'force-rebuild' | 'enrich-all' | 'diagnose') => {
        setConfirmingAction(null);
        onRunAction(action);
    };

    const handleCancelClick = () => {
        setConfirmingAction(null);
    };

    if (!isAdmin) {
        return null;
    }

  return (
    <Card className="bg-slate-800/40 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-sky-300">Admin Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rebuild Missing */}
        <div>
            <div className="h-10">
                {confirmingAction === 'rebuild-missing' ? (
                    <div className="w-full flex gap-2">
                        <Button onClick={() => handleConfirmClick('rebuild-missing')} className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"><Check className="h-4 w-4" /> Confirm</Button>
                        <Button onClick={handleCancelClick} variant="secondary" className="bg-red-500 hover:bg-red-600 text-white px-3"><X className="h-4 w-4" /></Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => handleInitialClick('rebuild-missing')}
                        disabled={isJobRunning || (!!confirmingAction)}
                        className="w-full gap-2"
                        variant="outline"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Rebuild Missing Embeddings
                    </Button>
                )}
            </div>
            <p className="text-xs text-slate-400 mt-2 px-1">
                Scans for memories without an embedding and generates one. Quickest option.
            </p>
        </div>

        {/* Force Rebuild */}
        <div>
            <div className="h-10">
                {confirmingAction === 'force-rebuild' ? (
                    <div className="w-full flex gap-2">
                        <Button onClick={() => handleConfirmClick('force-rebuild')} className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"><Check className="h-4 w-4" /> Confirm</Button>
                        <Button onClick={handleCancelClick} variant="secondary" className="bg-red-500 hover:bg-red-600 text-white px-3"><X className="h-4 w-4" /></Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => handleInitialClick('force-rebuild')}
                        disabled={isJobRunning || (!!confirmingAction)}
                        className="w-full gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        variant="outline"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Force Rebuild All
                    </Button>
                )}
            </div>
            <p className="text-xs text-slate-400 mt-2 px-1">
                Re-generates embeddings for every memory. Use if you suspect data corruption.
            </p>
        </div>

        {/* Diagnose Embeddings */}
        <div>
            <div className="h-10">
                {confirmingAction === 'diagnose' ? (
                    <div className="w-full flex gap-2">
                        <Button onClick={() => handleConfirmClick('diagnose')} className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"><Check className="h-4 w-4" /> Confirm</Button>
                        <Button onClick={handleCancelClick} variant="secondary" className="bg-red-500 hover:bg-red-600 text-white px-3"><X className="h-4 w-4" /></Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => handleInitialClick('diagnose')}
                        disabled={isJobRunning || (!!confirmingAction)}
                        className="w-full gap-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                        variant="outline"
                    >
                        <HeartPulse className="h-4 w-4" />
                        Diagnose Embeddings
                    </Button>
                )}
            </div>
            <p className="text-xs text-slate-400 mt-2 px-1">
                Scans all memories for embedding issues like corruption or staleness. Read-only.
            </p>
        </div>

        {/* Enrich All */}
        <div>
            <div className="h-10">
                {confirmingAction === 'enrich-all' ? (
                    <div className="w-full flex gap-2">
                        <Button onClick={() => handleConfirmClick('enrich-all')} className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"><Check className="h-4 w-4" /> Confirm</Button>
                        <Button onClick={handleCancelClick} variant="secondary" className="bg-red-500 hover:bg-red-600 text-white px-3"><X className="h-4 w-4" /></Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => handleInitialClick('enrich-all')}
                        disabled={isJobRunning || (!!confirmingAction)}
                        className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Sparkles className="h-4 w-4" />
                        Enrich All Memories
                    </Button>
                )}
            </div>
            <p className="text-xs text-slate-400 mt-2 px-1">
                Slowest option. Generates new tags and sentiment for all memories.
            </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminActionsPanel;
