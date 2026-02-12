import React from 'react';
import ReactFlow, { MiniMap, Controls, Background, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  // Groups
  {
    id: 'state-group',
    data: { label: 'State Management' },
    position: { x: 50, y: 0 },
    className: 'light:bg-cyan-100 dark:bg-cyan-900 font-bold',
    style: { width: 180, height: 220 },
  },
  {
    id: 'ui-group',
    data: { label: 'Pages & UI' },
    position: { x: 300, y: 0 },
    className: 'light:bg-teal-100 dark:bg-teal-900 font-bold',
    style: { width: 180, height: 320 },
  },
  {
    id: 'data-group',
    data: { label: 'Data Components' },
    position: { x: 550, y: 0 },
    className: 'light:bg-emerald-100 dark:bg-emerald-900 font-bold',
    style: { width: 180, height: 150 },
  },

  // Nodes in State Management
  { id: 'AuthContext', data: { label: 'AuthContext' }, position: { x: 15, y: 40 }, parentNode: 'state-group' },
  { id: 'MemoryContext', data: { label: 'MemoryContext' }, position: { x: 15, y: 80 }, parentNode: 'state-group' },
  { id: 'useAuth', data: { label: 'useAuth' }, position: { x: 15, y: 120 }, parentNode: 'state-group' },
  { id: 'useMemoryState', data: { label: 'useMemoryState' }, position: { x: 15, y: 160 }, parentNode: 'state-group' },
  
  // Nodes in Pages & UI
  { id: 'AppLayout', data: { label: 'AppLayout' }, position: { x: 15, y: 40 }, parentNode: 'ui-group' },
  { id: 'ChatPage', data: { label: 'ChatPage' }, position: { x: 15, y: 80 }, parentNode: 'ui-group' },
  { id: 'MemoryPage', data: { label: 'MemoryPage' }, position: { x: 15, y: 120 }, parentNode: 'ui-group' },
  { id: 'SystemOverviewPage', data: { label: 'SystemOverviewPage' }, position: { x: 15, y: 160 }, parentNode: 'ui-group' },
  { id: 'ChatInterface', data: { label: 'ChatInterface' }, position: { x: 15, y: 200 }, parentNode: 'ui-group' },
  { id: 'MemorySearch', data: { label: 'MemorySearch' }, position: { x: 15, y: 240 }, parentNode: 'ui-group' },

  // Nodes in Data Components
  { id: 'RecentConversationsList', data: { label: 'RecentConversationsList' }, position: { x: 15, y: 40 }, parentNode: 'data-group' },
  { id: 'AdminPage', data: { label: 'AdminPage' }, position: { x: 15, y: 80 }, parentNode: 'data-group' },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'AppLayout', target: 'ChatPage', label: 'wraps' },
  { id: 'e2', source: 'ui-group', target: 'state-group', label: 'uses hooks' },
  { id: 'e3', source: 'MemoryContext', target: 'useMemoryState', label: 'provides' },
  { id: 'e4', source: 'AuthContext', target: 'useAuth', label: 'provides' },
  { id: 'e5', source: 'useMemoryState', target: 'RecentConversationsList', label: 'drives' },
];

const InteractiveComponentDiagram: React.FC = () => {
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

export default InteractiveComponentDiagram; 