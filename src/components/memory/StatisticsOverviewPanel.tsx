import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemoryContext } from '@/contexts/MemoryContext';
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit } from 'lucide-react';

const StatisticItem: React.FC<{ label: string; value: string | number | undefined; unit?: string }> = ({ label, value, unit }) => (
  <div className="text-sm">
    <span className="text-slate-400">{label}: </span>
    <span className="font-semibold text-slate-200">{value ?? 'N/A'}{unit && value !== undefined ? unit : ''}</span>
  </div>
);

export const StatisticsOverviewPanel: React.FC = () => {
  const { memoryOverviewStats, isLoading } = useMemoryContext();

  if (isLoading && !memoryOverviewStats) {
    return (
      <Card className="w-full bg-slate-800/75 border-slate-700/50 backdrop-blur-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-sky-400 flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5 text-sky-400" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-2">
          <Skeleton className="h-4 w-3/4 bg-slate-700/60" />
          <Skeleton className="h-4 w-1/2 bg-slate-700/60" />
          <Skeleton className="h-4 w-2/3 bg-slate-700/60" />
          <Skeleton className="h-4 w-3/5 bg-slate-700/60" />
          <Skeleton className="h-4 w-1/2 bg-slate-700/60" />
        </CardContent>
      </Card>
    );
  }

  if (!memoryOverviewStats) {
    return (
      <Card className="w-full bg-slate-800/75 border-slate-700/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg text-sky-400 flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5 text-sky-400" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Memory overview statistics are not available.</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <Card className="w-full bg-slate-800/75 border-slate-700/50 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-sky-400 flex items-center">
          <BrainCircuit className="mr-2 h-5 w-5 text-sky-400" /> 
          Memory Core Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-2">
        <StatisticItem label="Total Memories" value={memoryOverviewStats.total_memories} />
        <StatisticItem label="Oldest Memory" value={formatDate(memoryOverviewStats.oldest_memory_date)} />
        <StatisticItem label="Newest Memory" value={formatDate(memoryOverviewStats.newest_memory_date)} />
        <StatisticItem label="Avg. Tags per Memory" value={memoryOverviewStats.avg_tags_per_memory?.toFixed(1)} />
        <StatisticItem label="Total Unique Tags" value={memoryOverviewStats.total_unique_tags} />
      </CardContent>
    </Card>
  );
}; 