
import React, { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { Message } from "./types";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const endOfMessagesRef = useRef<null | HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 rounded-full bg-liara-primary animate-pulse-light"></div>
          <div className="w-2 h-2 rounded-full bg-liara-primary animate-pulse-light" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-2 h-2 rounded-full bg-liara-primary animate-pulse-light" style={{ animationDelay: "0.4s" }}></div>
          <span>Liara is thinking...</span>
        </div>
      )}
      
      <div ref={endOfMessagesRef} />
    </div>
  );
};
