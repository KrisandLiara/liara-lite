import { useMemoryContext, ChatSession } from '@/contexts/MemoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

const RecentConversationsList: React.FC = () => {
  const {
    recentConversations,
    recentConversationsLoading,
    loadConversation,
    loadedConversationTitle,
    deleteConversation
  } = useMemoryContext();

  const handleConversationClick = (conversationId: string) => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  };

  const handleDeleteConversation = (event: React.MouseEvent, conversationId: string) => {
    event.stopPropagation();
    console.log("Delete conversation:", conversationId);
  };

  const handleRenameConversation = (event: React.MouseEvent, conversationId: string) => {
    event.stopPropagation();
    console.log("Rename conversation:", conversationId);
  };

  if (recentConversationsLoading && recentConversations.length === 0) {
    return (
      <div>Loading conversations...</div>
    );
  }

  return (
    <ul>
      {recentConversations.map(conversation => (
        <li
          key={conversation.id}
          onClick={() => handleConversationClick(conversation.id)}
          className={`
            p-2 rounded-md hover:bg-gray-700 cursor-pointer transition-colors duration-150 ease-in-out
            truncate group
            ${loadedConversationTitle === conversation.title ? 'bg-gray-700 font-semibold' : ''}
          `}
          title={conversation.title || 'Untitled Conversation'}
        >
          <div className="flex justify-between items-center w-full">
            <span className="text-sm text-gray-200 group-hover:text-white truncate flex-grow">
              {conversation.title || 'Untitled Conversation'}
            </span>
            <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-in-out">
              <button
                onClick={(e) => handleRenameConversation(e, conversation.id)}
                className="p-1 hover:bg-gray-600 rounded text-xs"
                title="Rename conversation"
              >
                R
              </button>
              <button
                onClick={(e) => handleDeleteConversation(e, conversation.id)}
                className="p-1 hover:bg-gray-600 rounded text-xs text-red-400 hover:text-red-300"
                title="Delete conversation"
              >
                D
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-400 group-hover:text-gray-300">
            {new Date(conversation.updated_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default RecentConversationsList;
