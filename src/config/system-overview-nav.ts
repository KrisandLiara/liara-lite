import { NavItem } from '@/lib/types/site';

export const navItems: NavItem[] = [
  // ===== OVERVIEW =====
  {
    name: 'Overview',
    path: 'project/overview',
    icon: 'Home',
    items: [
      { name: 'System Overview', path: 'project/overview' },
      { name: 'Quick Start', path: 'quick-start' },
      { name: 'System Status', path: 'project/system-status' },
      { name: 'Recent Work', path: 'project/recent-work' },
      { name: 'Changelog', path: 'changelog' },
      { name: 'Philosophy', path: 'philosophy' }
    ]
  },

  // ===== ARCHITECTURE =====
  {
    name: 'Architecture',
    path: 'architecture',
    icon: 'Network',
    items: [
      { name: 'Application Architecture', path: 'architecture/application-architecture' },
      { name: 'Frontend', path: 'architecture/frontend' },
      { name: 'Backend', path: 'architecture/backend' },
      { name: 'Database', path: 'architecture/database' },
      { name: 'Component Diagram', path: 'architecture/component-diagram' },
      { name: 'Deployment', path: 'architecture/deployment-diagram' }
    ]
  },

  // ===== FEATURES =====
  {
    name: 'Features',
    path: 'features',
    icon: 'Sparkles',
    items: [
      { name: 'Overview', path: 'features' },
      {
        name: 'Memory Overview',
        path: 'features/memory-overview',
        items: [
          { name: 'Overview', path: 'features/memory-overview' },
          { name: 'Tag Inspector', path: 'features/memory-overview/tag-inspector' },
          { name: 'Facets & Cloud', path: 'features/memory-overview/facets-cloud' }
        ]
      },
      {
        name: 'Import',
        path: 'features/import',
        items: [
          { name: 'Overview', path: 'features/import' },
          { name: 'Import Pipeline UI', path: 'features/import-pipeline-ui' },
          { name: 'Code Tagging', path: 'features/import-code-tagging' },
          { name: 'Image Tagging', path: 'features/import-image-tagging' },
          { name: 'Data Flow', path: 'data-flow/import-pipeline' }
        ]
      },
      { name: 'Memory Page Features', path: 'features/memory-page-features' },
      { name: 'Chat Features', path: 'modules/chat-module' },
      { name: 'Design System', path: 'design-system-showcase' }
    ]
  },

  // ===== DATA FLOW =====
  {
    name: 'Data Flow',
    path: 'data-flow',
    icon: 'GitBranch',
    items: [
      { name: 'Chat Session', path: 'data-flow/chat-session-flow' },
      { name: 'Memory Save', path: 'data-flow/memory-save-flow' },
      { name: 'Semantic Recall', path: 'data-flow/semantic-recall-flow' },
      { name: 'Import Pipeline', path: 'data-flow/import-pipeline' }
    ]
  },

  // ===== BACKEND =====
  {
    name: 'Backend',
    path: 'backend',
    icon: 'Server',
    items: [
      { name: 'Server Overview', path: 'backend/server-overview' },
      { name: 'API Endpoints', path: 'backend/02-api-endpoints' },
      { name: 'Middleware & Auth', path: 'middleware-auth' },
      { name: 'Edge Functions', path: 'edge-functions' },
      { name: 'Database', path: 'database' }
    ]
  },

  // ===== DEVELOPMENT =====
  {
    name: 'Development',
    path: 'development',
    icon: 'Code',
    items: [
      { name: 'Dev Environment', path: 'development/dev-environment-script' },
      { name: 'Database Workflow', path: 'development/database-workflow' },
      { name: 'CLI Tools & Scripts', path: 'development/cli-tools-scripts' },
      { name: 'Containerization', path: 'development/containerization' },
      { name: 'Debugging & Logs', path: 'development/debugging-logs' },
      { name: 'Documentation Workflow', path: 'development/documentation-workflow' },
      { name: 'Environments', path: 'environments' },
      { name: 'Troubleshooting', path: 'troubleshooting' }
    ]
  },

  // ===== ROADMAP =====
  {
    name: 'Roadmap',
    path: 'roadmap',
    icon: 'Map',
    items: [
      { name: 'Milestones', path: 'roadmap/milestones' },
      { name: 'In Progress', path: 'roadmap/in-progress' },
      { name: 'Feature Backlog', path: 'roadmap/feature-backlog' }
    ]
  }
];
