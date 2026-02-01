
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.sender === "assistant";

  return (
    <div
      className={cn(
        "flex items-start gap-2 animate-fade-in",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && (
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-liara-light text-liara-primary text-xs">
            AI
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "rounded-lg p-3 max-w-[75%]",
          isAssistant
            ? "bg-white dark:bg-gray-800 border"
            : "bg-liara-primary text-white"
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        <div 
          className={cn(
            "text-xs mt-1",
            isAssistant ? "text-gray-500" : "text-liara-light"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {!isAssistant && (
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-liara-primary/20 text-liara-primary text-xs">
            You
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
