import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Check, X } from 'lucide-react';

export interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

interface ConversationItemProps {
  convo: ChatSession;
  isActive: boolean;
  onClick: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({ convo, isActive, onClick, onDelete }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the conversation from being selected
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      const result = await onDelete(convo.id);
      if (!result) {
        setIsDeleting(false);
        setIsConfirmingDelete(false);
      }
    } catch (error) {
      console.error("Deletion failed in component:", error);
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  const timeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null; // Don't render anything if the date is invalid
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return null; // Don't render anything on error
    }
  };

  return (
    <li
      className={`p-2.5 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors duration-150 ease-in-out group flex justify-between items-center ${
        isActive ? 'bg-gray-700' : ''
      }`}
      onClick={() => !isConfirmingDelete && onClick(convo.id)}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate group-hover:text-white ${
          isActive ? 'text-white' : 'text-gray-100'
        }`} title={convo.title}>
          {convo.title || 'Untitled Conversation'}
        </p>
        <p className={`text-xs group-hover:text-gray-300 ${
          isActive ? 'text-gray-300' : 'text-gray-400'
        }`}>
          {timeAgo(convo.updated_at)}
        </p>
      </div>
      <div className="flex items-center pl-2">
        {isConfirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Confirm?</span>
            <Check 
              size={18} 
              className="text-green-500 hover:text-green-400 cursor-pointer" 
              onClick={handleConfirmDelete} 
            />
            <X 
              size={18} 
              className="text-red-500 hover:text-red-400 cursor-pointer" 
              onClick={handleCancelDelete} 
            />
          </div>
        ) : (
          <Trash2 
            size={16} 
            className="text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity" 
            onClick={handleDeleteClick}
          />
        )}
      </div>
    </li>
  );
}; 