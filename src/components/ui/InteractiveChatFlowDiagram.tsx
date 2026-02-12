import React from 'react';
import ReactFlow, { MiniMap, Controls, Background, Node, Edge, Position } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  { id: 'user', data: { label: 'User' }, position: { x: 0, y: 50 } },
  { id: 'frontend', data: { label: 'Frontend' }, position: { x: 200, y: 50 } },
  { id: 'backend', data: { label: 'Backend (Edge Function)' }, position: { x: 400, y: 50 }, style: { width: 180 } },
  { id: 'llm', data: { label: 'LLM (OpenAI)' }, position: { x: 600, y: 50 } },
  { id: 'db-chat', data: { label: 'DB (chat_history)' }, position: { x: 400, y: 250 } },
  { id: 'db-memories', data: { label: 'MemoriesDB (memories)' }, position: { x: 600, y: 250 } },
  
  { id: 'prompt-step', data: { label: '1. User enters prompt' }, position: { x: 0, y: 150 }, type: 'input' },
  { id: 'send-step', data: { label: '2. Send prompt + session ID' }, position: { x: 200, y: 150 } },
  { id: 'context-step', data: { label: '3. Fetch context & save prompt' }, position: { x: 400, y: 150 } },
  { id: 'llm-step', data: { label: '4. Send full prompt to LLM' }, position: { x: 600, y: 150 } },
  { id: 'response-step', data: { label: '5. Stream response' }, position: { x: 600, y: 350 }, type: 'output' },
  { id: 'store-step', data: { label: '6. Store response & send to UI' }, position: { x: 400, y: 350 } },
  { id: 'display-step', data: { label: '7. Display streaming response' }, position: { x: 200, y: 350 }, type: 'output' },
  
  { 
    id: 'memory-alt', 
    data: { label: '"Use Memory" is ON' }, 
    position: { x: 400, y: 450 }, 
    style: { backgroundColor: 'rgba(255, 255, 0, 0.1)', width: 380, height: 100 }
  },
  { id: 'memory-step', data: { label: 'Embed & save prompt/response' }, position: { x: 25, y: 40 }, parentNode: 'memory-alt' },
];

const initialEdges: Edge[] = [
  // Main flow
  { id: 'e-user-prompt', source: 'user', target: 'frontend', label: 'Enters prompt' },
  { id: 'e-frontend-backend', source: 'frontend', target: 'backend', label: 'Sends prompt', animated: true },
  
  // Parallel actions
  { id: 'e-backend-db-fetch', source: 'backend', target: 'db-chat', label: 'Get history', sourceHandle: 'b', targetHandle: 't' },
  { id: 'e-db-backend-return', source: 'db-chat', target: 'backend', label: 'Return context', sourceHandle: 't', targetHandle: 'b' },
  { id: 'e-backend-db-save', source: 'backend', target: 'db-chat', label: 'Save prompt', sourceHandle: 'b', targetHandle: 't' },

  // LLM interaction
  { id: 'e-backend-llm', source: 'backend', target: 'llm', label: 'Send full prompt', animated: true },
  { id: 'e-llm-backend', source: 'llm', target: 'backend', label: 'Stream response', animated: true },
  
  // Response flow
  { id: 'e-backend-db-save-resp', source: 'backend', target: 'db-chat', label: 'Save AI response' },
  { id: 'e-backend-frontend-stream', source: 'backend', target: 'frontend', label: 'Stream to UI', animated: true },
  { id: 'e-frontend-user-display', source: 'frontend', target: 'user', label: 'Display response' },
  
  // Memory flow
  { id: 'e-backend-memories', source: 'backend', target: 'memory-alt', label: 'If memory ON', animated: true, style: { stroke: '#f6ad55' } },
  { id: 'e-memory-db', source: 'memory-alt', target: 'db-memories', label: 'Embed & Save' },
];

const InteractiveChatFlowDiagram: React.FC = () => {
  return (
    <div style={{ height: '600px' }} className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default InteractiveChatFlowDiagram; 