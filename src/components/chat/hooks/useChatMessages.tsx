import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/components/ui/use-toast";
import { Message } from "../types";
import { useNotifications } from "@/contexts/NotificationContext";

export const useChatMessages = (isGuest: boolean = false) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm Liara, your AI assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  // const { toast } = useToast();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Create or retrieve guest session if user is not logged in
    if (isGuest && !user) {
      const storedSessionId = localStorage.getItem('guestSessionId');
      if (storedSessionId) {
        setGuestSessionId(storedSessionId);
      } else {
        const newSessionId = uuidv4();
        localStorage.setItem('guestSessionId', newSessionId);
        setGuestSessionId(newSessionId);
        
        // Create guest session in database
        createGuestSession(newSessionId);
      }
    }
  }, [isGuest, user]);

  const createGuestSession = async (sessionId: string) => {
    try {
      await supabase.from('guest_sessions').insert({
        id: sessionId,
        session_token: sessionId
      });
    } catch (error) {
      console.error("Error creating guest session:", error);
      addNotification("Could not create guest session.", "error", error instanceof Error ? error.message : String(error));
    }
  };

  const sendMessage = async (input: string) => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Chat history entry without AI response yet
      const entryData = {
        user_input: input,
        ai_response: "", // Will be updated after response
        user_id: user?.id || null,
        guest_session_id: isGuest ? guestSessionId : null,
        chat_session_id: null, // For now, we're not using chat sessions
      };
      
      // Insert user message to database
      const { error: insertError } = await supabase.from('chat_history').insert(entryData);
      
      if (insertError) {
        console.error("Error saving chat message:", insertError);
        addNotification("Could not save your message.", "error", insertError.message);
      }

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('chat-with-liara', {
        body: {
          userMessage: input,
          userId: user?.id || null,
          guestSessionId: isGuest ? guestSessionId : null,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const aiResponse = data?.aiResponse || "I'm sorry, I couldn't process your request right now.";
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Update the AI response in the database
      await supabase
        .from('chat_history')
        .update({ ai_response: aiResponse })
        .eq('user_input', input)
        .eq('user_id', user?.id || null)
        .eq('guest_session_id', isGuest ? guestSessionId : null);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error processing message:", error);
      // toast({
      //   title: "Error",
      //   description: "Failed to get a response. Please try again.",
      //   variant: "destructive",
      // });
      addNotification("Failed to get a response. Please try again.", "error", error instanceof Error ? error.message : String(error));
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    guestSessionId,
    sendMessage
  };
};
