import React, { useState, useEffect } from 'react';
import { useMemory } from '@/contexts/MemoryContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ConversationItem } from './ConversationItem';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast"

interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
}

interface RecentConversationsListProps {
  isCollapsed: boolean;
}

export const RecentConversationsList: React.FC<RecentConversationsListProps> = ({ isCollapsed }) => {
  const { activeConversationId, loadConversation } = useMemory();
  const { session } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchConversations = async () => {
      if (!session) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_recent_chat_sessions_for_user', {
          p_user_id: session.user.id,
          p_limit: 20
        });

        if (error) throw error;
        setConversations(data || []);
      } catch (error: any) {
        toast({
          title: "Error fetching conversations",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversations();
  }, [session, toast]);


  if (isCollapsed) {
    return null;
  }

  const handleConversationClick = (conversationId: string) => {
    console.log('[RecentConversationsList] handleConversationClick triggered with ID:', conversationId);
    loadConversation(conversationId);
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    // Implementation of handleDelete
    console.log(`TODO: Delete conversation ${id}`);
    return false;
  };

  return (
    <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-sidebar-border">
            <h2 className={cn("font-bold text-lg text-sidebar-foreground", isCollapsed && "hidden")}>
                Recent Chats
            </h2>
        </div>
        <div className="flex-1 min-h-0 p-3">
          <ScrollArea className="h-full w-full">
            <ul className="space-y-1">
              {conversations.map((c) => (
                <ConversationItem
                  key={c.id}
                  convo={{ id: c.id, title: c.title, updated_at: c.last_message_at }}
                  isActive={c.id === activeConversationId}
                  onClick={() => handleConversationClick(c.id)}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
            {isLoading && (
              <div className="space-y-2 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-gray-700 rounded-md" />
                ))}
              </div>
            )}
            {!isLoading && conversations.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">No recent conversations found.</p>
            )}
          </ScrollArea>
        </div>
    </div>
  );
}; 