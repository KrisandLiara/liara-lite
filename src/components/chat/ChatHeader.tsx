import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit3, Check, X, Sparkles, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ChatHeaderProps {
  title: string;
  isGuest?: boolean;
  onNewChat?: () => void;
  onRenameTitle?: (newTitle: string) => void;
  canRename?: boolean;
  useMemory: boolean;
  onUseMemoryChange: (checked: boolean) => void;
  onGenerateDetails?: () => void;
  isGeneratingDetails?: boolean;
  generatedTopic?: string | null;
  generatedTags?: string[] | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  isGuest = false,
  onNewChat,
  onRenameTitle,
  canRename = false,
  useMemory,
  onUseMemoryChange,
  onGenerateDetails,
  isGeneratingDetails = false,
  generatedTopic = null,
  generatedTags = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(title);

  useEffect(() => {
    if (!isEditing) {
      setEditText(title);
    }
  }, [title, isEditing]);

  const handleEditClick = () => {
    setEditText(title);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editText.trim() && editText.trim() !== title) {
      onRenameTitle?.(editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(title);
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSave();
    }
    if (event.key === 'Escape') {
      handleCancel();
    }
  };

  const displayedTitle = isGuest ? "Guest Chat" : title;

  return (
    <div className="px-4 py-3 border-b bg-white dark:bg-gray-900 flex justify-between items-center">
      <div className="flex items-center gap-2 min-w-0">
        {isEditing ? (
          <input 
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="text-lg font-semibold bg-transparent border border-liara-primary rounded px-1 py-0 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-liara-primary"
            autoFocus
          />
        ) : (
          <h1 className="text-lg font-semibold text-liara-primary truncate" title={displayedTitle}>
            {displayedTitle}
          </h1>
        )}
        {canRename && !isGuest && !isEditing && onRenameTitle && (
          <Edit3 size={16} className="text-gray-500 hover:text-liara-primary cursor-pointer" onClick={handleEditClick} />
        )}
        
        {/* Display Tags if they exist */}
        {generatedTags && generatedTags.length > 0 && (
          <div className="flex items-center gap-1 ml-2">
            {generatedTags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded-full text-[10px]">
                {tag}
              </span>
            ))}
          </div>
        )}

        {isEditing && (
          <>
            <Check size={18} className="text-green-500 hover:text-green-400 cursor-pointer" onClick={handleSave} />
            <X size={18} className="text-red-500 hover:text-red-400 cursor-pointer" onClick={handleCancel} />
          </>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Generate/Generated Details Button */}
        {canRename && !isGuest && onGenerateDetails && (
          <Button
            size="sm"
            variant={generatedTopic ? "success" : "outline"}
            className="gap-2"
            onClick={onGenerateDetails}
            disabled={isGeneratingDetails || !!generatedTopic}
          >
            {isGeneratingDetails ? (
              <Loader2 size={16} className="animate-spin" />
            ) : generatedTopic ? (
              <Sparkles size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            {generatedTopic ? "Details Generated" : "Generate Details"}
          </Button>
        )}

        {!isGuest && (
          <div className="flex items-center gap-2">
            <Label htmlFor="memory-switch" className="text-sm text-gray-400">Use Memory</Label>
            <Switch 
              id="use-memory-toggle" 
              checked={useMemory}
              onCheckedChange={onUseMemoryChange}
            />
          </div>
        )}

        {onNewChat && !isGuest && (
          <Button 
            variant="outline"
            size="sm"
            onClick={onNewChat}
            className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
          >
            <PlusCircle size={16} />
            New Chat
          </Button>
        )}
      </div>
    </div>
  );
};
