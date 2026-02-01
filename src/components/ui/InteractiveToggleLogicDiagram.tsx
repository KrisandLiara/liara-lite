import React from 'react';
import ReactFlow, { MiniMap, Controls, Background, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  { id: 'start', data: { label: 'User Toggles "Use Memory" Switch' }, position: { x: 250, y: 0 }, type: 'input' },
  { id: 'state', data: { label: 'State Change' }, position: { x: 250, y: 100 } },
  { id: 'on', data: { label: 'Message sent to backend' }, position: { x: 50, y: 200 } },
  { id: 'off', data: { label: 'Message sent to backend' }, position: { x: 450, y: 200 } },
  { id: 'embed', data: { label: 'Backend generates embedding' }, position: { x: 50, y: 300 } },
  { id: 'save', data: { label: "Message saved to 'memories' table" }, position: { x: 50, y: 400 } },
  { id: 'searchable', data: { label: 'Message available for semantic search' }, position: { x: 50, y: 500 }, type: 'output' },
  { id: 'not-saved', data: { label: "Message NOT saved to 'memories' table" }, position: { x: 450, y: 300 } },
  { id: 'only-history', data: { label: "Message only in 'chat_history'" }, position: { x: 450, y: 400 }, type: 'output' },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'start', target: 'state' },
  { id: 'e2', source: 'state', target: 'on', label: 'ON', style: { stroke: '#48BB78' } },
  { id: 'e3', source: 'state', target: 'off', label: 'OFF', style: { stroke: '#F56565' } },
  { id: 'e4', source: 'on', target: 'embed', animated: true },
  { id: 'e5', source: 'embed', target: 'save', animated: true },
  { id: 'e6', source: 'save', target: 'searchable', animated: true },
  { id: 'e7', source: 'off', target: 'not-saved' },
  { id: 'e8', source: 'not-saved', target: 'only-history' },
];

const InteractiveToggleLogicDiagram: React.FC = () => {
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

export default InteractiveToggleLogicDiagram; 