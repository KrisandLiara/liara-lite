
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "./hooks/useVoiceInput";

interface ChatInputBarProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  isGuest?: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSend, isLoading, isGuest = false }) => {
  const [input, setInput] = useState("");
  const { isRecording, handleToggleRecording } = useVoiceInput(setInput);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholder = isGuest ? "Message Liara (Guest Mode)..." : "Message Liara...";

  return (
    <div className="p-4 border-t bg-white dark:bg-gray-900 relative">
      <div className="flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px] resize-none"
        />
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleToggleRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            className={cn(
              "rounded-full",
              isRecording && "animate-pulse"
            )}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-full bg-liara-primary hover:bg-liara-secondary"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
