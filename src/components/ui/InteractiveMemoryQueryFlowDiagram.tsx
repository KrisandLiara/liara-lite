import React from 'react';
import ReactFlow, { MiniMap, Controls, Background, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  { id: 'user', data: { label: 'User' }, position: { x: 50, y: 0 }, type: 'input' },
  { id: 'frontend', data: { label: 'Frontend' }, position: { x: 50, y: 100 } },
  { id: 'backend', data: { label: 'Backend (Edge Function)' }, position: { x: 250, y: 100 } },
  { id: 'db-chat', data: { label: 'DB (chat_history)' }, position: { x: 250, y: 250 } },
  { id: 'db-memories', data: { label: 'MemoriesDB (memories)' }, position: { x: 450, y: 100 } },
  { id: 'llm', data: { label: 'LLM (OpenAI)' }, position: { x: 250, y: 400 }, type: 'output' },
];

const initialEdges: Edge[] = [
    { id: 'e1', source: 'user', target: 'frontend', label: 'Asks "Do you remember..."', animated: true },
    { id: 'e2', source: 'frontend', target: 'backend', label: 'Sends prompt + session ID', animated: true },
    
    // Parallel actions
    { id: 'e3', source: 'backend', target: 'db-chat', label: 'Save prompt to history' },
    { id: 'e4', source: 'backend', target: 'db-memories', label: 'Embed & semantic search', animated: true, style: { stroke: '#63B3ED' } },
    { id: 'e5', source: 'db-memories', target: 'backend', label: 'Return relevant memories', animated: true, style: { stroke: '#63B3ED' } },

    { id: 'e6', source: 'backend', target: 'llm', label: 'Construct prompt with memories', animated: true },
    { id: 'e7', source: 'llm', target: 'backend', label: 'Generate answer from context' },
    
    // Parallel response
    { id: 'e8', source: 'backend', target: 'db-chat', label: 'Save AI response' },
    { id: 'e9', source: 'backend', target: 'frontend', label: 'Stream response to UI', animated: true },
    { id: 'e10', source: 'frontend', target: 'user', label: 'Display final answer' },
];

const InteractiveMemoryQueryFlowDiagram: React.FC = () => {
  return (
    <div style={{ height: '500px' }} className="rounded-lg border bg-card text-card-foreground shadow-sm">
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

export default InteractiveMemoryQueryFlowDiagram; 