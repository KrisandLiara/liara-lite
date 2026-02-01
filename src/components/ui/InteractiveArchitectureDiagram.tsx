import React from 'react';
import ReactFlow, { MiniMap, Controls, Background, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  // Groups
  {
    id: 'user-interface-group',
    data: { label: 'User Interface' },
    position: { x: 325, y: 0 },
    className: 'light:bg-blue-100 dark:bg-blue-900 font-bold',
    style: {
      width: 250,
      height: 120,
    },
  },
  {
    id: 'backend-services-group',
    data: { label: 'Backend Services' },
    position: { x: 200, y: 150 },
    className: 'light:bg-green-100 dark:bg-green-900 font-bold',
    style: {
      width: 500,
      height: 120,
    },
  },
  {
    id: 'database-storage-group',
    data: { label: 'Database & Storage' },
    position: { x: 0, y: 300 },
    className: 'light:bg-orange-100 dark:bg-orange-900 font-bold',
    style: {
      width: 450,
      height: 120,
    },
  },
  {
    id: 'authentication-group',
    data: { label: 'Authentication' },
    position: { x: 500, y: 300 },
    className: 'light:bg-purple-100 dark:bg-purple-900 font-bold',
    style: {
      width: 200,
      height: 120,
    },
  },

  // Nodes
  {
    id: 'A',
    type: 'default',
    data: { label: 'Frontend: React + Vite' },
    position: { x: 25, y: 40 },
    parentNode: 'user-interface-group',
  },
  {
    id: 'F',
    type: 'default',
    data: { label: 'Node.js API Server' },
    position: { x: 25, y: 40 },
    parentNode: 'backend-services-group',
  },
  {
    id: 'B',
    type: 'default',
    data: { label: 'Supabase Edge Functions' },
    position: { x: 275, y: 40 },
    parentNode: 'backend-services-group',
  },
  {
    id: 'C',
    type: 'default',
    data: { label: 'Supabase DB: PostgreSQL' },
    position: { x: 25, y: 40 },
    parentNode: 'database-storage-group',
  },
  {
    id: 'D',
    type: 'default',
    data: { label: 'Vector Store: pgvector' },
    position: { x: 250, y: 40 },
    parentNode: 'database-storage-group',
  },
  {
    id: 'E',
    type: 'default',
    data: { label: 'Supabase Auth' },
    position: { x: 25, y: 40 },
    parentNode: 'authentication-group',
  },
];

const initialEdges: Edge[] = [
  { id: 'A-F', source: 'A', target: 'F', label: 'HTTP Requests', animated: true },
  { id: 'A-B', source: 'A', target: 'B', label: 'RPC & REST', animated: true },
  { id: 'B-C', source: 'B', target: 'C', label: 'DB Operations' },
  { id: 'F-C', source: 'F', target: 'C', label: 'DB Operations' },
  { id: 'B-D', source: 'B', target: 'D', label: 'Embed & Search' },
  { id: 'F-D', source: 'F', target: 'D', label: 'Embed & Search' },
  { id: 'A-E', source: 'A', target: 'E', label: 'Handles Auth State' },
  { id: 'B-E', source: 'B', target: 'E', label: 'Secure Endpoints' },
  { id: 'F-E', source: 'F', target: 'E', label: 'Secure Endpoints' },
];

const InteractiveArchitectureDiagram: React.FC = () => {
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

export default InteractiveArchitectureDiagram; 