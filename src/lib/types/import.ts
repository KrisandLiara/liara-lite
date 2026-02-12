export interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export interface PreviewConversation {
    id: string;
    title: string;
    messages: { id: string; content: string; role: string; }[];
    message_count: number;
    create_time: number;
    hasCode?: boolean;
    error?: string;
} 