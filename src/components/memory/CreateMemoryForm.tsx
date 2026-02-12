import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { useToast } from "@/hooks/use-toast"; // Keep this commented out
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext'; // Added import

interface CreateMemoryFormProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (memory: {
    topic: string;
    summary: string;
    content: string;
    full_text?: string;
    importance: number;
    tags: string[];
  }) => void;
}

export const CreateMemoryForm: React.FC<CreateMemoryFormProps> = ({
  isOpen,
  isLoading,
  onClose,
  onSubmit,
}) => {
  const [memory, setMemory] = useState({
    topic: "",
    summary: "",
    content: "",
    importance: 1,
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState("");
  // const { toast } = useToast(); // Keep this commented out
  const { addNotification } = useNotifications(); // Use notifications hook

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMemory(prev => ({ ...prev, [name]: value }));
  };

  const handleImportanceChange = (value: number) => {
    setMemory(prev => ({ ...prev, importance: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !memory.tags.includes(tagInput.trim())) {
      setMemory(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setMemory(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = () => {
    if (!memory.topic || !memory.content) {
      // For now, we'll just prevent submission and rely on future UI for inline errors.
      // console.warn("CreateMemoryForm: Topic and content are required.");
      addNotification("Topic and content are required.", "warning", "CreateMemoryForm Validation Error");
      return;
    }
    
    onSubmit(memory);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-800/85 border-slate-700/60 backdrop-blur-md text-slate-200 shadow-2xl">
        <DialogHeader className="border-b border-slate-700/50 pb-3 mb-4">
          <DialogTitle className="text-sky-400 text-xl">Create New Memory</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-3 -mr-1">
          <div className="space-y-5 pr-1">
            <div className="space-y-1.5">
              <label htmlFor="topic" className="text-sm font-medium text-slate-300">Topic</label>
              <Input
                id="topic"
                name="topic"
                placeholder="Enter memory topic"
                value={memory.topic}
                onChange={handleChange}
                className="bg-slate-700/50 border-slate-600/70 text-slate-200 placeholder:text-slate-400 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="summary" className="text-sm font-medium text-slate-300">Summary (Optional)</label>
              <Input
                id="summary"
                name="summary"
                placeholder="Brief summary or key points"
                value={memory.summary}
                onChange={handleChange}
                className="bg-slate-700/50 border-slate-600/70 text-slate-200 placeholder:text-slate-400 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="content" className="text-sm font-medium text-slate-300">Content</label>
              <Textarea
                id="content"
                name="content"
                placeholder="Full memory content, details, context..."
                value={memory.content}
                onChange={handleChange}
                rows={6}
                className="bg-slate-700/50 border-slate-600/70 text-slate-200 placeholder:text-slate-400 focus:ring-sky-500 focus:border-sky-500 resize-y [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-track]:bg-slate-700/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Importance</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <Button
                    key={level}
                    type="button"
                    variant={memory.importance === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleImportanceChange(level)}
                    className={memory.importance === level 
                      ? "bg-sky-600 text-white hover:bg-sky-500 focus:ring-sky-500 focus:ring-offset-slate-800" 
                      : "bg-slate-700/50 border-slate-600/70 text-slate-300 hover:bg-slate-600/60 hover:text-sky-300 focus:ring-sky-500 focus:ring-offset-slate-800"}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tags" className="text-sm font-medium text-slate-300">Tags (Optional)</label>
              <div className="flex items-center space-x-2">
                <Input
                  id="tags"
                  placeholder="Type a tag and press Enter or Add"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="bg-slate-700/50 border-slate-600/70 text-slate-200 placeholder:text-slate-400 focus:ring-sky-500 focus:border-sky-500"
                />
                <Button 
                  type="button" 
                  onClick={addTag} 
                  size="sm"
                  className="bg-slate-600/80 border-slate-500/90 text-sky-200 hover:bg-slate-500/80 focus:ring-sky-500 focus:ring-offset-slate-800 px-3 whitespace-nowrap"
                >
                  Add Tag
                </Button>
              </div>
              {memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {memory.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-slate-600/70 border border-slate-500/80 text-sky-200 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 cursor-default"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-slate-400 hover:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-slate-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-slate-700/50 pt-4 mt-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="bg-slate-700/50 border-slate-600/70 text-slate-300 hover:bg-slate-600/60 hover:text-sky-300 focus:ring-sky-500 focus:ring-offset-slate-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-sky-600 text-white hover:bg-sky-500 focus:ring-sky-500 focus:ring-offset-slate-800"
          >
            {isLoading ? "Creating..." : "Create Memory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
