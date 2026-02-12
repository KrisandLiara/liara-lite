import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import apiClient from '@/services/api';
import { parseConversationObjects } from '@/lib/import/parser';
import { preprocessConversations } from '@/lib/import/preprocessor';
import { TokenInfoBlock } from '@/components/import/TokenInfoBlock';

type LiteConversation = any;

type DbMode = 'file' | 'supabase';

export default function LiaraLitePage() {
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('liaraLite.openaiKey') || '');
  const [dbMode, setDbMode] = useState<DbMode>(() => (localStorage.getItem('liaraLite.dbMode') as DbMode) || 'file');

  const [fileName, setFileName] = useState<string>('');
  const [raw, setRaw] = useState<any[] | null>(null);
  const [pre, setPre] = useState<any[] | null>(null);
  const [enriched, setEnriched] = useState<any[] | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const [removeCodeBlocks, setRemoveCodeBlocks] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [showUser, setShowUser] = useState(true);
  const [enableNER, setEnableNER] = useState(true);
  const [nerUserOnly, setNerUserOnly] = useState(false);
  const [generateTopics, setGenerateTopics] = useState(true);
  const [model, setModel] = useState('gpt-4o-mini');
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; hasUrl?: boolean; hasKey?: boolean; looksLikeServiceRole?: boolean; error?: string } | null>(null);

  const parsedConversations = useMemo(() => {
    if (!raw) return [];
    return parseConversationObjects(raw);
  }, [raw]);

  const preprocessedConversations = useMemo(() => {
    if (!parsedConversations.length) return [];
    return preprocessConversations(parsedConversations as any, {
      removeCodeBlocks,
      showAI,
      showUser,
    });
  }, [parsedConversations, removeCodeBlocks, showAI, showUser]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const convo of enriched || []) {
      for (const msg of convo?.messages || []) {
        for (const t of (msg?.tags || [])) {
          if (!t) continue;
          counts.set(t, (counts.get(t) || 0) + 1);
        }
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 100);
  }, [enriched]);

  const onPickFile = async (f: File | null) => {
    if (!f) return;
    setFileName(f.name);
    setEnriched(null);
    const text = await f.text();
    const json = JSON.parse(text);
    const convos = Array.isArray(json) ? json : (json?.conversations || json?.data || []);
    setRaw(convos);
    setPre(null);
  };

  const onPrepare = () => {
    setPre(preprocessedConversations);
  };

  const onEnrich = async () => {
    localStorage.setItem('liaraLite.openaiKey', openaiKey);
    localStorage.setItem('liaraLite.dbMode', dbMode);

    if (!openaiKey.trim()) {
      alert('Please paste your OpenAI key first.');
      return;
    }
    if (!preprocessedConversations.length) {
      alert('Please import a conversations.json first.');
      return;
    }

    setIsBusy(true);
    try {
      const { data } = await apiClient.post('/lite/enrich', {
        conversations: preprocessedConversations,
        model,
        generateTopics,
        enableNER,
        nerUserOnly,
      }, {
        headers: { 'x-openai-key': openaiKey.trim() },
      });
      setEnriched(data.enriched || []);
    } finally {
      setIsBusy(false);
    }
  };

  const onLoadToDb = async () => {
    if (!enriched || enriched.length === 0) return;
    setIsBusy(true);
    try {
      await apiClient.post('/lite/load', { conversations: enriched, isTest: false });
      alert('Loaded into local Supabase DB.');
    } finally {
      setIsBusy(false);
    }
  };

  const checkDb = async () => {
    const { data } = await apiClient.get('/lite/db/status');
    setDbStatus(data);
  };

  useEffect(() => {
    if (dbMode === 'supabase') {
      checkDb().catch(() => {});
    }
  }, [dbMode]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold">Liara Lite</h1>
          <p className="text-slate-400">Local demo: paste key → import → enrich → tag cloud.</p>
        </header>

        <Card className="border-slate-700/50 bg-slate-900/40">
          <CardHeader>
            <CardTitle>1) Setup</CardTitle>
            <CardDescription>Paste your OpenAI key. Choose storage mode.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openaiKey">OpenAI API key</Label>
              <Input id="openaiKey" type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-..." />
              <div className="text-xs text-slate-500">Stored locally in your browser for this demo.</div>
            </div>
            <div className="space-y-2">
              <Label>Database mode</Label>
              <div className="flex gap-2">
                <Button variant={dbMode === 'file' ? 'default' : 'outline'} onClick={() => setDbMode('file')}>File-only</Button>
                <Button variant={dbMode === 'supabase' ? 'default' : 'outline'} onClick={() => setDbMode('supabase')}>Local Supabase</Button>
              </div>
              <div className="text-xs text-slate-500">
                File-only is simplest. Local Supabase adds persistence (optional).
              </div>
              {dbMode === 'supabase' && (
                <div className="text-xs text-slate-400 space-y-1">
                  <div>
                    DB status: <span className={dbStatus?.ok ? 'text-emerald-300' : 'text-amber-300'}>{dbStatus ? (dbStatus.ok ? 'Connected' : 'Not ready') : '—'}</span>
                  </div>
                  {dbStatus && !dbStatus.ok && (
                    <div className="text-slate-500">
                      {dbStatus.error || 'Configure SUPABASE_URL + SUPABASE_KEY (service role) in the backend env.'}
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={checkDb}>Check connection</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-slate-900/40">
          <CardHeader>
            <CardTitle>2) Import</CardTitle>
            <CardDescription>Pick your exported ChatGPT `conversations.json`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Input type="file" accept=".json,application/json" onChange={(e) => onPickFile(e.target.files?.[0] || null)} />
              <div className="text-xs text-slate-400">{fileName || 'No file selected'}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Checkbox checked={removeCodeBlocks} onCheckedChange={(v) => setRemoveCodeBlocks(Boolean(v))} />
                <span>Remove code blocks</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={showUser} onCheckedChange={(v) => setShowUser(Boolean(v))} />
                <span>Include user</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={showAI} onCheckedChange={(v) => setShowAI(Boolean(v))} />
                <span>Include assistant</span>
              </div>
            </div>

            <div className="text-sm text-slate-300">
              Parsed conversations: <span className="font-semibold">{parsedConversations.length}</span>
            </div>

            <Button onClick={onPrepare} variant="outline" disabled={!parsedConversations.length}>Prepare Preview</Button>

            {pre && (
              <div className="border-t border-slate-700/50 pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={generateTopics} onCheckedChange={(v) => setGenerateTopics(Boolean(v))} />
                      <span className="text-sm">Generate topic</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={enableNER} onCheckedChange={(v) => setEnableNER(Boolean(v))} />
                      <span className="text-sm">NER</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={nerUserOnly} onCheckedChange={(v) => setNerUserOnly(Boolean(v))} />
                      <span className="text-sm">NER user-only</span>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="model">Model</Label>
                      <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} />
                    </div>
                  </div>
                  <div className="rounded border border-slate-700/50 bg-slate-950/40 p-3">
                    <TokenInfoBlock conversations={pre as any} selectedModel={model} onModelChange={setModel} enableNER={enableNER} nerUserOnly={nerUserOnly} compact={true} />
                  </div>
                </div>

                <Button onClick={onEnrich} disabled={isBusy}>Enrich</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-slate-900/40">
          <CardHeader>
            <CardTitle>3) Tag Cloud</CardTitle>
            <CardDescription>Top tags from the enriched output.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!enriched ? (
              <div className="text-slate-400">No enriched data yet.</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {tagCounts.map(([tag, count]) => (
                    <span key={tag} className="text-slate-200" title={`${count} messages`}>
                      {tag}
                    </span>
                  ))}
                </div>

                {dbMode === 'supabase' && (
                  <Button onClick={onLoadToDb} disabled={isBusy || enriched.length === 0 || dbStatus?.ok === false} variant="outline">
                    Load into Local Supabase
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

