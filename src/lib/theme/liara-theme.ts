// Liara Design System - Centralized Theme Configuration
// This file defines the complete visual identity for Liara

export const LiaraTheme = {
  // Core Brand Colors
  brand: {
    primary: '#9b87f5',     // Liara purple - main brand color
    secondary: '#7E69AB',    // Darker purple - secondary actions
    tertiary: '#6E59A5',     // Even darker purple - subtle elements
    light: '#E5DEFF',        // Light purple - backgrounds/highlights
    accent: '#38bdf8',       // Sky blue - interactive elements
  },

  // Background System - The foundation
  background: {
    primary: '#0f172a',      // slate-900 - main app background (like chat)
    secondary: '#1e293b',    // slate-800 - card/panel backgrounds
    tertiary: '#334155',     // slate-700 - elevated surfaces
    overlay: '#475569',      // slate-600 - overlays/modals
  },

  // Text System
  text: {
    primary: '#f1f5f9',      // slate-100 - main text
    secondary: '#e2e8f0',    // slate-200 - secondary text
    muted: '#94a3b8',        // slate-400 - muted/helper text
    accent: '#38bdf8',       // sky-400 - links/interactive text
  },

  // Interactive Elements
  interactive: {
    primary: '#38bdf8',      // sky-400 - primary buttons/links
    primaryHover: '#0ea5e9', // sky-500 - primary hover state
    secondary: '#64748b',    // slate-500 - secondary buttons
    secondaryHover: '#475569', // slate-600 - secondary hover
    success: '#10b981',      // emerald-500 - success states
    warning: '#f59e0b',      // amber-500 - warning states (like test mode)
    error: '#ef4444',        // red-500 - error states
    info: '#3b82f6',         // blue-500 - info states
  },

  // Status Colors (for logs, badges, etc.)
  status: {
    success: {
      bg: '#064e3b',         // emerald-900 - dark background
      border: '#10b981',     // emerald-500 - border
      text: '#6ee7b7',       // emerald-300 - text
    },
    warning: {
      bg: '#451a03',         // amber-900 - dark background  
      border: '#f59e0b',     // amber-500 - border
      text: '#fcd34d',       // amber-300 - text
    },
    error: {
      bg: '#7f1d1d',         // red-900 - dark background
      border: '#ef4444',     // red-500 - border
      text: '#fca5a5',       // red-300 - text
    },
    info: {
      bg: '#1e3a8a',         // blue-900 - dark background
      border: '#3b82f6',     // blue-500 - border
      text: '#93c5fd',       // blue-300 - text
    },
  },

  // Borders and Dividers
  border: {
    primary: '#334155',      // slate-700 - main borders
    secondary: '#475569',    // slate-600 - secondary borders
    accent: '#38bdf8',       // sky-400 - accent borders
    muted: '#1e293b',        // slate-800 - subtle dividers
  },

  // Semantic Color Mappings
  semantic: {
    // Highlights (like in system overview)
    highlight: '#fcd34d',    // amber-300 - yellow highlights
    highlightBg: '#451a03',  // amber-900 - highlight background
    
    // Code and technical elements
    code: {
      bg: '#1e1e1e',         // VS Code dark background
      text: '#d4d4d4',       // Light gray text
      comment: '#6a9955',    // Green comments
      keyword: '#569cd6',    // Blue keywords
    },

    // Console and logs
    console: {
      bg: '#0f172a',         // slate-900 - console background
      text: '#e2e8f0',       // slate-200 - console text
      prompt: '#38bdf8',     // sky-400 - prompt color
    },

    // Cards and surfaces
    surface: {
      elevated: '#1e293b',   // slate-800 - elevated cards
      sunken: '#0f172a',     // slate-900 - sunken areas
      glass: 'rgba(51, 65, 85, 0.3)', // slate-700 with opacity
    },
  },

  // Component-specific themes
  components: {
    // Import pipeline
    import: {
      estimator: {
        bg: '#1e293b',       // slate-800 - cost estimator background
        border: '#334155',   // slate-700 - border
        accent: '#10b981',   // emerald-500 - cost highlights
      },
      console: {
        bg: '#0f172a',       // slate-900 - console background
        collapsed: '#1e293b', // slate-800 - collapsed state
        text: '#e2e8f0',     // slate-200 - console text
      },
    },

    // System overview
    overview: {
      highlight: '#fcd34d',  // amber-300 - documentation highlights
      highlightBg: '#451a03', // amber-900 - highlight background
      card: '#1e293b',       // slate-800 - card background
    },

    // Memory system
    memory: {
      tag: '#38bdf8',        // sky-400 - tag color
      tagBg: '#1e3a8a',      // blue-900 - tag background
      search: '#10b981',     // emerald-500 - search highlights
    },
  },

  // Spacing and sizing (design tokens)
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    xxl: '3rem',     // 48px
  },

  // Border radius
  radius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
} as const;

// Helper functions for theme usage
export const getStatusColor = (type: 'success' | 'warning' | 'error' | 'info', element: 'bg' | 'border' | 'text') => {
  return LiaraTheme.status[type][element];
};

export const getComponentTheme = (component: keyof typeof LiaraTheme.components) => {
  return LiaraTheme.components[component];
};

// CSS Custom Properties Generator
export const generateCSSVariables = () => {
  return `
    :root {
      /* Brand Colors */
      --liara-brand-primary: ${LiaraTheme.brand.primary};
      --liara-brand-secondary: ${LiaraTheme.brand.secondary};
      --liara-brand-tertiary: ${LiaraTheme.brand.tertiary};
      --liara-brand-light: ${LiaraTheme.brand.light};
      --liara-brand-accent: ${LiaraTheme.brand.accent};

      /* Backgrounds */
      --liara-bg-primary: ${LiaraTheme.background.primary};
      --liara-bg-secondary: ${LiaraTheme.background.secondary};
      --liara-bg-tertiary: ${LiaraTheme.background.tertiary};
      --liara-bg-overlay: ${LiaraTheme.background.overlay};

      /* Text */
      --liara-text-primary: ${LiaraTheme.text.primary};
      --liara-text-secondary: ${LiaraTheme.text.secondary};
      --liara-text-muted: ${LiaraTheme.text.muted};
      --liara-text-accent: ${LiaraTheme.text.accent};

      /* Interactive */
      --liara-interactive-primary: ${LiaraTheme.interactive.primary};
      --liara-interactive-primary-hover: ${LiaraTheme.interactive.primaryHover};
      --liara-interactive-success: ${LiaraTheme.interactive.success};
      --liara-interactive-warning: ${LiaraTheme.interactive.warning};
      --liara-interactive-error: ${LiaraTheme.interactive.error};

      /* Semantic */
      --liara-highlight: ${LiaraTheme.semantic.highlight};
      --liara-highlight-bg: ${LiaraTheme.semantic.highlightBg};
    }
  `;
};

// Tailwind-compatible class generator
export const liaraClasses = {
  // Backgrounds
  bgPrimary: 'bg-slate-900',     // --liara-bg-primary
  bgSecondary: 'bg-slate-800',   // --liara-bg-secondary
  bgTertiary: 'bg-slate-700',    // --liara-bg-tertiary
  
  // Text
  textPrimary: 'text-slate-100', // --liara-text-primary
  textSecondary: 'text-slate-200', // --liara-text-secondary
  textMuted: 'text-slate-400',   // --liara-text-muted
  textAccent: 'text-sky-400',    // --liara-text-accent
  
  // Interactive
  buttonPrimary: 'bg-sky-400 hover:bg-sky-500 text-slate-900',
  buttonSecondary: 'bg-slate-600 hover:bg-slate-500 text-slate-100',
  
  // Status
  success: 'text-emerald-300 bg-emerald-900 border-emerald-500',
  warning: 'text-amber-300 bg-amber-900 border-amber-500',
  error: 'text-red-300 bg-red-900 border-red-500',
  info: 'text-blue-300 bg-blue-900 border-blue-500',
  
  // Highlights
  highlight: 'text-amber-300 bg-amber-900',
  
  // Cards
  card: 'bg-slate-800 border-slate-700',
  cardElevated: 'bg-slate-700 border-slate-600',
} as const; 