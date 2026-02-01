import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MemoryEntry } from '@/lib/memory/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StoryViewProps {
  memories: MemoryEntry[];
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const StoryView: React.FC<StoryViewProps> = ({ memories }) => {
  // Group memories by conversation session ID
  const memoriesBySession = memories.reduce((acc, memory) => {
    const sessionId = memory.metadata?.chat_session_id || 'manual_entry';
    if (!acc[sessionId]) {
      acc[sessionId] = {
        title: memory.metadata?.original_title || memory.topic || 'Manual Memories',
        date: memory.created_at,
        memories: [],
      };
    }
    acc[sessionId].memories.push(memory);
    return acc;
  }, {} as Record<string, { title: string; date: string; memories: MemoryEntry[] }>);

  // Sort sessions by date (newest first)
  const sortedSessions = Object.values(memoriesBySession).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {sortedSessions.map((session, index) => (
        <Card key={index} className="bg-slate-800/70 border-slate-700/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-sky-400">{session.title}</CardTitle>
            <p className="text-sm text-slate-400">🗓️ {formatDate(session.date)}</p>
          </CardHeader>
          <CardContent className="prose prose-sm prose-invert max-w-none text-slate-200 space-y-4">
            {session.memories
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // sort memories within session
              .map(memory => (
                <div key={memory.id} className="p-4 border-t border-slate-700/50 first:border-t-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {memory.summary || memory.content}
                  </ReactMarkdown>
                </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 