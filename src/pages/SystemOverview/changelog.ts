// No longer using JSX components, so React import removed

export interface Change {
  type?: 'feature' | 'fix' | 'refactor' | 'docs' | 'perf';
  title?: string;
  description?: string;
  category?: string;
  summary?: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: Change[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: "v0.17.7",
    date: "2026-02-01",
    changes: [
      {
        type: 'feature',
        title: 'Liara Lite (local-only demo)',
        description:
          'Added a streamlined, no-auth local demo flow focused on Setup → Import → Enrich → Tag Cloud. Runs in file-only mode by default and can optionally load to local Supabase.'
      },
      {
        type: 'feature',
        title: 'Lite Tag Cloud + NER explorer (file-backed)',
        description:
          'Tag Cloud now reads enriched JSON directly, includes an NER cloud with category badges, conversation browser with jump-through-matches, and visual “glow” indicators for jump targets.'
      },
      {
        type: 'improvement',
        title: 'More reliable Windows dev workflow',
        description:
          'Added split run scripts for Supabase vs app, a stable app mode (no nodemon restarts), and live enrich progress/heartbeat so long runs never appear stuck.'
      }
    ]
  },
  {
    version: "v0.17.6",
    date: "2025-08-17",
    changes: [
      {
        type: 'feature',
        title: 'Memory Overview – Facets, Cloud, Tag Inspector',
        description:
          'Added new Memory Overview with contextual facets, keyword cloud, and a Tag Inspector modal showing co-facets, timeline, sources, and examples. Supports INCLUDE/EXCLUDE selections; debounced search and sorting.'
      },
      {
        type: 'feature',
        title: 'Hard/Test Facet Infrastructure',
        description:
          'Introduced per-user facet views and materialized views for hard_memory_entries and test_hard_memory_entries, with RPCs for refreshing counts. Test mode routes to test tables automatically.'
      },
      {
        type: 'docs',
        title: 'Documentation – Memory Overview',
        description:
          'Added System Overview docs for the Memory Overview feature, including navigation links under Features → Memory Overview.'
      }
    ]
  },
  {
    version: "v0.17.5",
    date: "2025-08-17",
    changes: [
      {
        type: 'feature',
        title: 'Memory Facets Foundation (Stage 0)',
        description:
          'Added per-user facet layer for Memory Overview: flattened views for keywords and NER buckets on test (v_test_*) and prod (v_mem_*) tables, plus fast rollups via materialized views mv_test_facet_counts and mv_mem_facet_counts. Ensures named_entities JSONB and GIN indexes exist.'
      },
      {
        type: 'feature',
        title: 'Facets API Endpoint',
        description:
          'Introduced GET /api/memories/facets with auth, test=true flag, optional bucket filters, and per-bucket limits. Results are scoped by user_id and ordered by frequency.'
      },
      {
        type: 'perf',
        title: 'Precomputed Counts',
        description:
          'Facet counts are served from materialized views for snappy UI. Added recommended REFRESH MATERIALIZED VIEW steps after imports.'
      },
      {
        type: 'docs',
        title: 'Hybrid DB Workflow',
        description:
          'Documented safe workflow: create idempotent migrations, apply locally with supabase db push, verify in Studio, then promote to prod with supabase link + db push when approved.'
      }
    ]
  },
  {
    version: "v0.17.4",
    date: "2025-08-16",
    changes: [
      { type: 'feature', title: 'Unified file selector everywhere', description: 'Single selector now appears on the index page, Preprocessed preview (Step 2–3), and Enriched preview (Step 3–4). Lists both Preprocessed and Enriched files and adds a new "Import JSON file" (Source) option.' },
      { type: 'feature', title: 'Source JSON import (client-side)', description: 'Selecting "Import JSON file" opens a local picker and runs the existing browser-side processing path on Preview. No backend fetches for pseudo filenames; results render directly in Preprocessed preview.' },
      { type: 'fix', title: 'Preview routing by type', description: 'Preview now loads based on the selected type: Preprocessed → loads file; Enriched → previews file; Source → processes local JSON. Eliminates 404s hitting /file-content?fileName=source.' },
      { type: 'improvement', title: 'Selector UX polish', description: 'Shows "- Select file -" placeholder when empty. Selector reflects the actual selection across views (e.g., enriched selection shows correctly after switching from preprocessed).' },
      { type: 'fix', title: 'Radix button nesting/Slot errors', description: 'Removed button-in-button in accordion headers. Chips (tags, +N, image/voice) are now role=button spans with stopPropagation; accordion trigger remains stable to avoid React.Children.only errors.' },
      { type: 'improvement', title: 'Step 2 JSON import', description: 'Added JSON import option to Step 2 selector; Preview processes Source locally. Added small status logs to the live console for visibility.' }
    ]
  },
  {
    version: "v0.17.3",
    date: "2025-08-16",
    changes: [
      { type: 'feature', title: 'Top-5 header tags with +N popover', description: 'Header shows the 5 most frequent tags by message presence; remaining tags appear in a scrollable popover.' },
      { type: 'improvement', title: 'Per-message tag counts', description: 'Tag counters reflect once-per-message occurrence rather than total word frequency.' },
      { type: 'improvement', title: 'Per-conversation tag colors', description: 'Stable color mapping for tags within a conversation; header chips and message highlights share the same palette.' },
      { type: 'feature', title: 'Inline tag highlighting in messages', description: 'Literal tag matches are underlined with color in message text.' },
      { type: 'feature', title: 'Semantic match hint', description: 'After scroll-to on semantic-only matches, a transient “semantic” badge appears near the author label and fades away. Rapid clicks recycle the same hint.' }
    ]
  },
  {
    version: "v0.17.2",
    date: "2025-08-16",
    changes: [
      {
        type: 'feature',
        title: 'Unified Enriched Preview (Stages 3 & 4)',
        description: 'Merged Stage 3 preview controls and Stage 4 load controls into a two-bubble layout. Added compact enriched file selector and toolbar in Stage 4, with right-aligned conversations-ready count.'
      },
      {
        type: 'improvement',
        title: 'Consistent Stage Colors',
        description: 'Standardized Stage 3 as emerald/green and Stage 4 as violet/purple across the import UI (badges, headers, bubbles).'
      },
      {
        type: 'improvement',
        title: 'Contextual Visibility',
        description: 'When enriched preview is active, Step 1 and the large Step 4 footer block are hidden to keep focus on preview and load toolbar.'
      },
      {
        type: 'improvement',
        title: 'Preview Options & Filters',
        description: 'Added Show tags, Compact messages, and Show placeholders toggles; added filters for Has code, Has images, Has voice with live preview updates.'
      }
    ]
  },
  {
    version: "v0.17.1",
    date: "2025-08-11",
    changes: [
      {
        type: 'fix',
        title: 'Final stubborn inline/log removals',
        description: 'Strengthened detection for Express response patterns and added post-replacement trimming so lines like "[Inline Code]Full error object … res.status(500).json(…)" collapse to a clean placeholder. Two-pass removal retained.'
      },
      {
        type: 'improvement',
        title: 'Placeholder visuals and counters',
        description: 'Placeholders render in emerald and are not counted as code or scroll targets; message IDs stay neutral for placeholder-only content (user and assistant).' 
      }
    ]
  },
  {
    version: "v0.17.0",
    date: "2025-08-11",
    changes: [
      {
        type: 'feature',
        title: 'Unified code visualization = removal',
        description: 'Highlights now exactly match what the remover deletes via a shared renderability filter.'
      },
      {
        type: 'improvement',
        title: 'Soft vs hard detection pipeline',
        description: 'Non‑aggressive mode is conservative (markdown, natural sentence, math, separator guards). Conversation-level threshold uses a light counter; aggressive mode (≥20 messages) enables segment capture and unification.'
      },
      {
        type: 'fix',
        title: 'Media precedence',
        description: 'Voice and image messages never get code tags; image‑generation metadata takes precedence.'
      },
      {
        type: 'fix',
        title: 'Inline code + prose parentheses',
        description: 'Inline backticks require strong signals; prose like “function (chill, focus, social…)” no longer counts as code.'
      },
      {
        type: 'improvement',
        title: 'Math rendering (KaTeX) & LaTeX ignore',
        description: 'Added KaTeX for MDX; LaTeX markers are ignored by code detection to avoid false positives.'
      }
    ]
  },
  {
    version: "v0.16.2",
    date: "2025-08-10",
    changes: [
      {
        type: 'feature',
        title: 'Softer non-aggressive code detection',
        description: 'Added markdown/natural-sentence guards, separator-line handling, and safer global token checks to avoid prose false-positives.'
      },
      {
        type: 'fix',
        title: 'Media precedence (voice/image)',
        description: 'Voice and image messages are never tagged as code; image-generation metadata takes precedence.'
      },
      {
        type: 'fix',
        title: 'Inline backticks require strong signals',
        description: 'Stray formatting ticks no longer produce Inline Code tags in non-aggressive mode.'
      },
      {
        type: 'fix',
        title: 'Natural-language function(...) guard',
        description: 'Treats prose like “function (chill, focus, social, etc.)” as text in non-aggressive mode.'
      },
      {
        type: 'fix',
        title: 'Regex stability',
        description: 'Resolved character class hyphen ordering to prevent range errors in browsers.'
      }
    ]
  },
  {
    version: "v0.16.1",
    date: "2024-03-26",
    changes: [
      {
        type: 'feature',
        title: 'Enhanced Code Detection & Highlighting',
        description: 'Improved code block detection with intelligent pattern matching for various code types, error messages, and user messages. Added unified detection logic that perfectly matches preprocessing removal, ensuring accurate preview of what will be removed.',
      },
      {
        type: 'improvement',
        title: 'Code Block UI Refinements',
        description: 'Enhanced code block display with cleaner context separation, consistent color themes for user/AI messages, and better visual organization. Context text now appears outside highlighted blocks for clarity.',
      },
      {
        type: 'feature',
        title: 'Smart Code Block Grouping',
        description: 'Added intelligent code block grouping that combines related code fragments, error messages, and stack traces into cohesive blocks. Special handling for user messages with code introductions and "code-heavy" conversations.',
      }
    ]
  },
  {
    version: "v0.16.0",
    date: "2024-03-26",
    changes: [
      {
        type: 'feature',
        title: 'Enhanced Image Detection & Highlighting',
        description: 'Unified image detection logic across the application to handle all image formats consistently. Added support for AI-generated images with plain text prompts, JSON format prompts, and image markers. Message IDs are now properly highlighted with the indigo theme for all image types.',
      },
      {
        type: 'refactor',
        title: 'Unified Content Detection',
        description: 'Centralized content detection logic into shared functions, ensuring consistent behavior between tag counters, message ID highlighting, and tag navigation. Added comprehensive debug logging for better visibility into content detection.',
      },
      {
        type: 'improvement',
        title: 'Image Preview Enhancement',
        description: 'Improved image preview display with consistent styling for both user-uploaded and AI-generated images. Added clear visual distinction for AI-generated images and better formatting of image metadata.',
      }
    ]
  },
  {
    version: "v0.15.8",
    date: "2024-03-26",
    changes: [
      {
        type: 'fix',
        title: 'Image Tag Detection',
        description: 'Fixed image tag detection and visibility in import preview. Improved detection to rely primarily on metadata.',
      },
      {
        type: 'fix',
        title: 'File Upload Error',
        description: 'Fixed "Assignment to constant variable" error during file upload by correcting variable declarations.',
      }
    ]
  },
  {
    version: "v0.15.16",
    date: "2025-07-29",
    changes: [
      {
        type: 'fix',
        title: 'Image Tag Detection',
        description: 'Fixed image tag detection to ensure consistent behavior between UI counters and tag clicking. Added comprehensive debug logging to track content detection.',
      },
      {
        type: 'refactor',
        title: 'Content Detection Logic',
        description: 'Unified image detection logic across the application, ensuring the same detection rules are used for both displaying tags and handling clicks.',
      }
    ],
  },
  {
    version: "v0.15.15",
    date: "2025-07-29",
    changes: [
      {
        type: 'fix',
        title: 'Image Tag Detection',
        description: 'Fixed image tag detection to properly handle all image content types, including image generation, markdown images, and HTML images. Added better handling of edge cases and improved filtering of voice content.',
      }
    ],
  },
  {
    version: "v0.15.14",
    date: "2025-07-29",
    changes: [
      {
        type: 'fix',
        title: 'Tag Navigation Improvements',
        description: 'Fixed tag cycling to properly handle multiple messages of the same type. Added better state management and debug logging for tag navigation.',
      },
      {
        type: 'refactor',
        title: 'Content Detection Logic',
        description: 'Unified image detection logic across the application. Created shared detection functions to ensure consistent behavior between counters and tag navigation.',
      },
      {
        type: 'fix',
        title: 'Tag Cycling Reset',
        description: 'Added automatic reset of tag cycling when message list changes, ensuring smoother navigation through tagged messages.',
      }
    ],
  },
  {
    version: "v0.15.13",
    date: "2025-07-29",
    changes: [
      {
        type: 'feature',
        title: 'Accurate Content Type Counters',
        description: 'Added accurate message type counters in conversation headers. Each tag (voice, image, code) now shows the exact count of messages containing that content type.',
      },
      {
        type: 'fix',
        title: 'Image Detection Improvements',
        description: 'Fixed image detection to properly handle various content types. Improved accuracy by excluding voice transcripts and sound data from image counts, while correctly identifying image generation content and unknown content types.',
      },
      {
        type: 'refactor',
        title: 'Content Detection Logic',
        description: 'Unified content detection logic to ensure consistent behavior between tag display and content counting. Enhanced detection patterns with better type checking and metadata handling.',
      }
    ],
  },
  {
    version: "v0.15.12",
    date: "2025-07-28",
    changes: [
      {
        type: 'feature',
        title: 'Enhanced Code Detection',
        description: 'Improved code detection with robust pattern matching for various programming constructs. Added support for detecting code in both string content and structured data, with better recognition of code blocks, TypeScript types, and common programming patterns.',
      },
      {
        type: 'fix',
        title: 'Code Tag Consistency',
        description: 'Fixed code tag display in conversation headers to match the improved detection logic. Code detection now properly identifies both explicit code blocks and inferred code content based on programming patterns.',
      }
    ],
  },
  {
    version: "v0.15.11",
    date: "2025-07-28",
    changes: [
      {
        type: 'feature',
        title: 'Enhanced Image Generation Detection',
        description: 'Improved detection and display of image generation content in the import preview. Added dedicated "Image Generation" badge with prompt and size details, and fixed conversation header tags to properly identify image generation conversations.',
      },
      {
        type: 'fix',
        title: 'Content Type Detection Improvements',
        description: 'Enhanced content type detection to properly handle JSON string content, ensuring image generation properties are correctly identified in both message content and conversation headers.',
      }
    ],
  },
  {
    version: "v0.15.10",
    date: "2025-07-28",
    changes: [
      {
        type: 'fix',
        title: 'Critical Dependency Resolution',
        description: 'Fixed critical dependency conflicts by standardizing React to v18.2.0. Resolved issues with React 19 alpha that were causing incompatibilities with react-helmet-async and other packages. Also fixed PostCSS configuration for proper Tailwind integration.',
      },
      {
        type: 'refactor',
        title: 'Import System Component Fixes',
        description: 'Fixed FileSelector component exports and imports to properly handle the UnifiedFileSelector component. Enhanced component organization in the import preview system.',
      }
    ],
  },
  {
    version: "0.16.0",
    date: "2024-03-24",
    title: "Import UI Enhancements - Content Type Navigation & Visual Improvements",
    changes: [
      {
        type: "enhancement",
        description: "Enhanced content type navigation in import preview",
        details: [
          "Improved tag-based message navigation with smooth scrolling and visual feedback",
          "Added distinct color themes for different content types (amber for voice, indigo for images, purple for code)",
          "Implemented consistent styling across tags, message IDs, and content indicators",
          "Enhanced visual feedback when cycling through tagged messages",
          "Added white highlight effect for end-of-cycle indication"
        ]
      },
      {
        type: "enhancement",
        description: "Refined voice content detection and display",
        details: [
          "Improved voice content detection to avoid false positives",
          "Enhanced transcript display with better visual hierarchy",
          "Added smarter detection for voice-related content vs discussions about voice features"
        ]
      },
      {
        type: "enhancement",
        description: "Visual consistency improvements",
        details: [
          "Standardized color schemes across all content types",
          "Improved message ID highlighting to match content type",
          "Enhanced content type indicators with consistent styling and icons",
          "Added smooth transitions and hover effects for better interactivity"
        ]
      }
    ]
  },
  {
    version: "0.15.8",
    date: "2024-03-24",
    title: "Import UI Enhancements - Tag Navigation",
    changes: [
      {
        type: "enhancement",
        description: "Enhanced tag-based message navigation in import preview",
        details: [
          "Improved tag cycling behavior to only scroll through messages with specific tags",
          "Added visual feedback for end-of-cycle with white highlight",
          "Automatic reset to first tagged message after reaching the end",
          "Fixed message ID highlighting and positioning",
          "Optimized scroll behavior in conversation preview"
        ]
      }
    ]
  },
  {
    version: "v0.15.9",
    date: "2025-01-12",
    changes: [
      {
        type: 'refactor',
        title: 'Enhanced File Selector Component',
        description: 'Completely refactored the file selector component with improved UI/UX. Added glassy modern design, better file organization, and more intuitive delete functionality. The component now properly handles both preprocessed and enriched files with clear visual distinction.',
      },
      {
        type: 'fix',
        title: 'Improved File Preview System',
        description: 'Fixed issues with file preview functionality. Preprocessed and enriched files now correctly display their respective previews without mixing content types. Enhanced error handling and user feedback for file operations.',
      },
      {
        type: 'perf',
        title: 'Enhanced Development Experience',
        description: 'Improved the development script (dev-manager.cjs) with better process management, more reliable hot reloading, and enhanced restart capabilities. Fixed issues with the restart command and added better cleanup for Windows systems.',
      },
      {
        type: 'feature',
        title: 'Modern Dialog Design',
        description: 'Implemented a new glassy, modern design for confirmation dialogs. Added frosted glass effect with proper backdrop blur and refined button styling for better visual hierarchy.',
      },
    ],
  },
  {
    version: "v0.15.8",
    date: "2025-01-11",
    changes: [
      {
        type: 'feature',
        title: 'Enhanced Tag Navigation System',
        description: 'Completely overhauled tag clicking behavior to properly target the first message on initial click. Fixed cycling logic that was skipping the first message and jumping to the second one. Tag navigation now starts from index 0 and cycles correctly through all matching messages.',
      },
      {
        type: 'feature', 
        title: 'Smart Visual Feedback for Tag Cycling',
        description: 'Added intelligent white glow indication system. Regular navigation shows blue glow, while white glow appears on the last message to indicate "next click will cycle back to first". Also shows white glow on conversation row when no messages found with the selected tag.',
      },
      {
        type: 'feature',
        title: 'Optimized Code Badge Positioning', 
        description: 'Moved Code badge from right column to left column alongside Voice and Image badges for better organization and visual consistency. All content detection badges are now grouped together in the main content area.',
      },
      {
        type: 'feature',
        title: 'Targeted Voice Tag Navigation',
        description: 'Enhanced Voice tag to specifically target only voice messages missing transcript data (problematic voice content) rather than all voice messages. This makes the Voice tag more useful for identifying messages that need attention.',
      },
      {
        type: 'perf',
        title: 'Dramatically Faster Tag Response Times',
        description: 'Reduced tag click response delays by 70% (850ms → 250ms total). Optimized accordion opening delay from 700ms to 200ms and scroll positioning delay from 150ms to 50ms for much more responsive user experience.',
      },
      {
        type: 'fix',
        title: 'Advanced Scroll Positioning for First Messages',
        description: 'Implemented three-tier adaptive scroll positioning system: Ultra-conservative (0-120px), Reduced padding (120-200px), and Normal padding (200px+). This prevents scrolling past first messages while maintaining optimal positioning for others.',
      },
    ],
  },
  {
    version: "v0.15.7",
    date: "2025-01-11",
    type: "minor" as const,
    title: "Interactive Tag Navigation",
    description: "Enhanced DataPreview with clickable tag functionality for seamless message navigation.",
    changes: [
      {
        type: "feature" as const,
        category: "Import Pipeline",
        title: "Clickable Tags System",
        description: "Tags are now interactive across all locations - click any tag to automatically open the conversation and jump to the first message with that tag. Subsequent clicks cycle through all messages containing the tag.",
        impact: "major" as const
      },
      {
        type: "enhancement" as const,
        category: "Import Pipeline", 
        title: "Smart Message Navigation",
        description: "Smooth scrolling within the preview container centers target messages with visual highlight effects (blue glow) that fade after 3 seconds for clear identification.",
        impact: "moderate" as const
      },
      {
        type: "enhancement" as const,
        category: "Import Pipeline",
        title: "Enhanced Event Handling", 
        description: "Robust click event management prevents interference with accordion expansion, ensuring reliable tag navigation across conversation headers, enrichment sections, message tags, and summary tags.",
        impact: "moderate" as const
      },
      {
        type: "improvement" as const,
        category: "Import Pipeline",
        title: "Ultra-Compact Enrichment Section",
        description: "Redesigned AI Enrichment section with collapsible interface - shows only token counter and model selection initially, expanding to show all options when needed.",
        impact: "moderate" as const
      }
    ]
  },
  {
    version: "v0.15.21",
    date: "2025-01-31",
    title: "Enhanced Development Experience & Message ID Highlighting",
    summary: "Supercharged dev manager with better hot reloading and distinctive message ID highlighting for different content types.",
    features: [
      "🚀 **Enhanced Dev Manager**: Supercharged hot reloading with better environment variables",
      "🔥 **Improved Hot Reload**: Enhanced HMR messages with throttling and better visual feedback",
      "🎨 **Distinctive Message ID Highlighting**: Color-coded message IDs based on content type",
      "⚡ **Optimized Environment**: Better environment variables for improved hot reloading performance",
      "🛠️ **Simplified Restart**: Keep it simple - just Ctrl+C and restart when needed"
    ],
    fixes: [
      "🔧 Fixed hot reload reliability issues with better environment configuration",
      "🎯 Enhanced message ID highlighting with purple for code, amber for voice, emerald for images",
      "📱 Better HMR message filtering to reduce console spam",
      "🧹 Simplified restart approach - removed complex input handling that caused issues",
      "💡 Clear instructions for when hot reload isn't working"
    ],
    technical: [
      "Enhanced environment variable configuration for hot reloading",
      "Enhanced message ID detection for code blocks, voice, and image content",
      "Improved HMR message throttling and filtering",
      "Simplified service management approach",
      "Better startup messaging and user guidance"
    ]
  },
  {
    version: "v0.15.20",
    date: "2025-01-31",
    title: "User-Only Enrichment & Image Generation Detection",
    summary: "Added selective enrichment mode and comprehensive image generation conversation detection with clean content handling.",
    features: [
      "👤 **User-Only Enrichment**: New per-conversation option to enrich only user prompts while preserving AI responses",
      "🎨 **Image Generation Detection**: Smart detection of image generation conversations with blue badges",
      "🔍 **Enhanced Content Detection**: Improved voice and image detection using metadata and content analysis",
      "🎯 **Clean Mixed Content**: Better handling of conversations with both text and media content",
      "📊 **Three-Column Layout**: Include | Enrich | User Only selection for maximum flexibility"
    ],
    fixes: [
      "🧹 Removed redundant content placeholders while keeping visual badges",
      "🎨 Cleaner conversation display without duplicate content indicators",
      "🔍 More reliable content type detection using multiple detection methods",
      "📱 Better content formatting with proper line breaks and spacing",
      "🎯 Improved mixed content handling with separated placeholders"
    ],
    technical: [
      "Enhanced parser content extraction with metadata-based detection",
      "Added userOnlySelection state management in ImportContext",
      "Improved content detection algorithms for image generation",
      "Enhanced badge system with color-coded content type indicators",
      "Better content cleanup and formatting in parser"
    ]
  },
  {
    version: "v0.15.19",
    date: "2025-01-31",
    changes: [
      {
        type: 'feature',
        title: 'Voice Conversation Detection',
        description: 'Added intelligent voice conversation detection that identifies conversations about voice/audio topics using keyword analysis. Voice conversations are automatically flagged with a "Voice" badge and "Coming Soon" indicator for future voice processing features.',
      },
      {
        type: 'fix',
        title: 'Fixed [object Object] Display Issue',
        description: 'Resolved issue where voice conversations and complex message content were displaying as "[object Object]" by implementing safe content rendering. Non-string content is now properly handled with descriptive placeholders like "[Voice/Audio Content]", "[Image]", and "[Document/File]".',
      },
      {
        type: 'improvement',
        title: 'Enhanced Preview Styling',
        description: 'Improved enhanced preview styling with better contrast and theme consistency. Strengthened NER entity highlighting with more vibrant colors and better visual distinction. Enhanced message container styling with improved padding, borders, and spacing.',
      },
      {
        type: 'improvement',
        title: 'Refined Voice Detection Logic',
        description: 'Made voice conversation detection more precise by focusing on actual voice content placeholders rather than text conversations that merely mention voice-related terms. This eliminates false positives while maintaining accurate detection of genuine voice conversations.',
      },
      {
        type: 'fix',
        title: 'Fixed Code Removal and Debug Logging',
        description: 'Fixed issue where "Code Detected" badges persisted even after applying "Remove Code" preprocessing. Enhanced debug logging to display in the live console instead of browser console, providing better visibility into voice detection, code removal, and preprocessing operations.',
      },
    ],
  },
  {
    version: "v0.15.18",
    date: "2025-01-31",
    changes: [
      {
        type: 'feature',
        title: 'Expandable Summary with More/Less Button',
        description: 'Added expandable summary feature for long conversation summaries. Summaries longer than 150 characters now show a "More/Less" button to expand or collapse the full content, preventing cut-off text.',
      },
      {
        type: 'feature',
        title: 'Top 5 Conversation Tags Display',
        description: 'Added display of the 5 most common tags from all messages within each conversation. Tags are ranked by frequency and shown below the summary with compact styling.',
      },
      {
        type: 'improvement',
        title: 'Better Tag Analytics',
        description: 'Implemented tag frequency analysis across conversation messages to surface the most relevant tags for each conversation, providing better content insights.',
      },
    ],
  },
  {
    version: "v0.15.17",
    date: "2025-01-31",
    changes: [
      {
        type: 'fix',
        title: 'Improved Summary Layout',
        description: 'Moved conversation summary to the main line below topic name with line-clamp-2 for better space utilization. Removed separate scrollable summary box for cleaner, more compact layout.',
      },
      {
        type: 'fix',
        title: 'Enable NER by Default',
        description: 'Fixed issue where Named Entity Recognition was disabled by default, causing empty named_entities fields in the database. NER is now enabled by default to ensure entity extraction works properly.',
      },
      {
        type: 'improvement',
        title: 'Added Line-Clamp CSS Utility',
        description: 'Added line-clamp-2 CSS utility for proper text truncation, ensuring summaries display consistently across different content lengths.',
      },
    ],
  },
  {
    version: "v0.15.16",
    date: "2025-01-31",
    changes: [
      {
        type: 'improvement',
        title: 'Enhanced Enriched Data Preview UI',
        description: 'Improved the enriched data preview with better layout, font consistency, and enhanced NER entity highlighting. Message tags moved to the right side to avoid blocking content.',
      },
      {
        type: 'feature',
        title: 'Scrollable Conversation Summaries',
        description: 'Added scrollable summary boxes for long conversation summaries with custom thin scrollbar styling. Summaries are now contained in a compact, scrollable area.',
      },
      {
        type: 'feature',
        title: 'Subtle NER Entity Highlighting',
        description: 'Improved Named Entity Recognition highlighting with subtle underlines and background colors. Entities are highlighted with different tones: purple for people, green for organizations, blue for places, etc.',
      },
      {
        type: 'feature',
        title: 'NER Badge in Conversation Headers',
        description: 'Added "NER" badge to conversation headers when Named Entity Recognition data is present, making it easy to identify enriched conversations with entity extraction.',
      },
      {
        type: 'improvement',
        title: 'Consistent Typography and Spacing',
        description: 'Standardized font sizes and spacing throughout the data preview. Made fonts consistent between regular and enriched data views while maintaining visual hierarchy.',
      },
    ],
  },
  {
    version: "v0.15.15",
    date: "2025-01-31",
    changes: [
      {
        type: 'improvement',
        title: 'Default to Original ChatGPT Titles',
        description: 'Changed topic generation default to use original ChatGPT conversation titles instead of AI-generated topics. This preserves the original conversation context and makes it easier to compare with ChatGPT history and rebuild conversations.',
      },
      {
        type: 'improvement',
        title: 'Enhanced Topic Generation UI',
        description: 'Updated UI indicators to show green for original ChatGPT titles, added "(recommended)" label for using original titles, and improved description text for topic generation options.',
      },
    ],
  },
  {
    version: "v0.15.14",
    date: "2025-01-31",
    changes: [
      {
        type: 'feature',
        title: 'Enhanced Data Preview with Entity Highlighting',
        description: 'Added comprehensive enriched data preview with color-coded named entity highlighting and improved conversation display. Enhanced conversation headers with enrichment badges and summaries.',
      },
      {
        type: 'feature',
        title: 'UI Reorganization: Step 2 Moved to Data Preview Header',
        description:
          'Moved all Step 2 (Prepare Data) controls directly into the Data Preview header where they logically belong. This creates a more intuitive workflow where data preparation happens in the same interface where you view and select conversations.',
      },
      {
        type: 'improvement',
        title: 'Simplified 3-Step Flow',
        description:
          'Streamlined the import process to 3 clear steps: 1) Import Data, 2) Enrich Data, 3) Load to Database. Step 2 preparation is now integrated into the data preview interface.',
      },
      {
        type: 'improvement',
        title: 'Enhanced Data Preview Header',
        description:
          'Added comprehensive preprocessing controls to the data preview header including presets (Full Fidelity, Clean & Lean, AI-Only), author filters, code removal options, and bulk selection controls.',
      },
      {
        type: 'improvement',
        title: 'Cleaner 2-Column Layout',
        description:
          'Simplified layout to 2 columns: Left (Steps 1 & 2), Right (Token Info & Step 3). This provides better use of screen space and clearer visual hierarchy.',
      },
    ],
  },
  {
    version: "v0.15.13",
    date: "2025-01-31",
    changes: [
      {
        type: 'feature',
        title: 'Major UI Reorganization: 4-Step Import Flow',
        description:
          'Completely restructured the import pipeline into a logical 4-step process: 1) Import Data (load file), 2) Prepare Data (select & preprocess), 3) Enrich Data (AI processing), 4) Load to Database. This provides much clearer workflow separation and improved user experience.',
      },
      {
        type: 'feature',
        title: 'Enhanced Data Preparation Step',
        description:
          'Moved all preprocessing controls to dedicated Step 2 with selection summary showing "X of Y conversations selected" and clear Apply & Save workflow. Users now have a dedicated stage for data preparation before enrichment.',
      },
      {
        type: 'feature',
        title: 'Simplified Enrichment Controls',
        description:
          'Streamlined Step 3 enrichment with simple "First 10" vs "All Selected" options instead of complex preset buttons. Removed unnecessary Quick Presets in favor of clearer processing scope selection.',
      },
      {
        type: 'feature',
        title: '3-Column Layout Design',
        description:
          'Implemented new grid layout with dedicated center column for token information (300px fixed width). Left and right columns contain Steps 1-2 and Steps 3-4 respectively, providing better visual balance and information hierarchy.',
      },
    ],
  },
  {
    version: "v0.15.12",
    date: "2025-01-31",
    type: "patch" as const,
    title: "Bug Fixes: Token Counter & Database Migration",
    summary: "Fixed token counter not updating when NER options change and resolved database migration error for hard_memory_entries table.",
    features: [
      {
        title: "Fixed Token Counter Updates",
        description: "Token counter now properly updates when toggling NER options, showing accurate cost estimates in real-time",
        type: "fix" as const
      },
      {
        title: "Fixed Database Migration Error",
        description: "Resolved migration error by correctly targeting only memories and test_memories tables for NER field addition (removed unnecessary hard_memory_entries references)",
        type: "fix" as const
      },
      {
        title: "Enhanced Time Estimation for NER",
        description: "Estimated processing time now accounts for NER operations, showing increased time when NER is enabled (~0.5s per message processed)",
        type: "improvement" as const
      },
      {
        title: "Fixed Token Counter Selection Updates",
        description: "Token estimates now properly update when selecting/deselecting conversations in data preview by memoizing conversation selection",
        type: "fix" as const
      }
    ]
  },
  {
    version: 'v0.15.11',
    date: '2025-01-31',
    changes: [
      {
        type: 'feature',
        title: 'User-Only Named Entity Recognition',
        description:
          'Added "User prompts only" option for NER processing. When enabled, extracts entities exclusively from user messages, reducing token usage by approximately 50% while focusing on the most valuable content for entity extraction.',
      },
      {
        type: 'feature',
        title: 'Enhanced Token Calculation for NER',
        description:
          'Updated token estimator to accurately account for Named Entity Recognition processing. Calculates separate token costs for tags, summaries, and NER operations with precise estimates for user-only vs all-message processing modes.',
      },
      {
        type: 'feature',
        title: 'Smart NER Processing Logic',
        description:
          'Implemented intelligent NER processing that conditionally applies entity extraction based on message role and user preferences. Provides detailed logging showing when NER is skipped for optimization.',
      },
      {
        type: 'feature',
        title: 'Real-Time Cost Optimization Feedback',
        description:
          'Enhanced UI to show token savings when user-only NER is enabled. Displays "saves ~50% tokens" messaging and updates cost estimates in real-time as users toggle between processing modes.',
      },
    ],
  },
  {
    version: 'v0.15.10',
    date: '2025-01-31',
    changes: [
      {
        type: 'feature',
        title: 'Enhanced Preprocessing Filters',
        description:
          'Added comprehensive filtering options to Step 1 of the import pipeline. Users can now filter by author (User/AI), enable timestamp-based filtering for incremental imports, and use quick preset configurations for different import scenarios.',
      },
      {
        type: 'feature',
        title: 'Author-Based Message Filtering',
        description:
          'Implemented granular control over message inclusion with separate toggles for User and AI messages. Allows for specialized import workflows like AI-only responses or user-only queries with real-time preview updates.',
      },
      {
        type: 'feature',
        title: 'Cleaning Presets System',
        description:
          'Added three quick preset configurations: "Full Fidelity" (everything included), "Clean & Lean" (code blocks removed), and "AI-Only" (assistant responses only). Presets provide one-click optimization for different use cases.',
      },
      {
        type: 'feature',
        title: 'Smart Conversation Filtering',
        description:
          'Enhanced preprocessor to automatically remove conversations that become empty after author filtering. Includes visual feedback showing active filter status and maintains data integrity throughout the pipeline.',
      },
    ],
  },
  {
    version: 'v0.15.9',
    date: '2025-01-31',
    changes: [
      {
        type: 'feature',
        title: 'Named Entity Recognition (NER)',
        description:
          'Added Named Entity Recognition to the enrichment pipeline. Extracts and categorizes entities like people, organizations, locations, dates, products, and events from conversation content. Stores results in a new named_entities JSONB field for advanced search and analysis.',
      },
      {
        type: 'feature',
        title: 'NER Configuration Toggle',
        description:
          'Implemented "Extract named entities (NER)" checkbox in Advanced Options. Users can enable/disable NER processing to balance enrichment depth with token usage and processing time. Provides real-time feedback on entity extraction status.',
      },
      {
        type: 'feature',
        title: 'Database Schema Enhancement',
        description:
          'Added named_entities JSONB field to both memories and hard_memory_entries tables. Includes GIN indexes for efficient entity searches and proper field documentation with entity structure examples.',
      },
      {
        type: 'feature',
        title: 'Enhanced Enrichment Pipeline',
        description:
          'Integrated NER processing into the existing enrichment workflow with parallel execution for optimal performance. Provides detailed logging of entity extraction results and graceful error handling.',
      },
    ],
  },
  {
    version: 'v0.15.8',
    date: '2025-01-31',
    changes: [
      {
        type: 'feature',
        title: 'Optional Topic Generation',
        description:
          'Added configurable topic generation with a toggle option in Advanced Options. Users can now choose between AI-generated topics or use the original conversation titles from their ChatGPT export data, providing more flexibility and reducing token usage when desired.',
      },
      {
        type: 'feature',
        title: 'Enhanced Enrichment Configuration',
        description:
          'Implemented "Generate topics with AI" checkbox in the Advanced Options section. When disabled, the system uses conversation titles from the import data as topics, maintaining context while reducing processing costs and time.',
      },
      {
        type: 'feature',
        title: 'Backend Topic Generation Support',
        description:
          'Enhanced enrichment API endpoints to accept generateTopics parameter. Modified the enrichment process to conditionally generate topics or use existing conversation titles based on user preference.',
      },
      {
        type: 'feature',
        title: 'Dynamic UI Feedback',
        description:
          'Updated the enrichment info section to dynamically display current topic generation mode. Shows "AI-generated conversation topics" or "Uses conversation titles from import data" based on the toggle state.',
      },
    ],
  },
  {
    version: 'v0.15.7',
    date: '2025-01-31',
    changes: [
      {
        type: 'feature',
        title: 'Preprocessed File Management System',
        description:
          'Added comprehensive file management for preprocessed conversation files. Users can now select from existing preprocessed files instead of reprocessing the same data repeatedly. Features smart timestamp parsing, human-readable file names, delete functionality, and seamless workflow integration.',
      },
      {
        type: 'feature',
        title: 'Intelligent File Selection Interface',
        description:
          'Created PreprocessedFileManager component with dropdown selection showing files as "1/31/2025 2:15 PM (2h ago)" format. Includes "Process new file" option, real-time sorting by newest first, and integrated delete functionality with confirmation dialogs.',
      },
      {
        type: 'feature',
        title: 'Backend API for File Management',
        description:
          'Implemented secure REST endpoints for listing and deleting preprocessed files. Added support for loading files from preprocessed directory with proper path traversal protection and authentication middleware.',
      },
      {
        type: 'refactor',
        title: 'Enhanced Import Workflow Logic',
        description:
          'Improved Step 1 to conditionally show file upload interface only when processing new files. Added automatic data loading when selecting existing preprocessed files and proper state synchronization between file selection and conversation data.',
      },
    ],
  },
  {
    version: 'v0.15.6',
    date: '2025-01-31',
    changes: [
      {
        type: 'feature',
        title: 'Integrated Token Estimation System',
        description:
          'Completely redesigned the token estimation system by removing popup dialogs and integrating cost estimation directly into the main workflow. The Token Info block now shows real-time estimates with model selection dropdown, updating automatically based on enrichment selections.',
      },
      {
        type: 'feature',
        title: 'Smart Token Counting Logic',
        description:
          'Implemented intelligent token counting that only estimates costs for conversations selected for enrichment (AI processing), not just database inclusion. This provides accurate cost estimates since only enriched conversations consume AI tokens and incur costs.',
      },
      {
        type: 'feature',
        title: 'Ultra-Compact Import Layout',
        description:
          'Achieved maximum space efficiency with a 2x2 grid layout featuring compact internal layouts for each step. Step 1 uses top/bottom row structure, Step 2 has horizontal preset/button layout, Step 3 combines file selection with action buttons, and Token Info displays comprehensive cost breakdown in minimal space.',
      },
      {
        type: 'feature',
        title: 'Advanced Component Architecture',
        description:
          'Created modular component system with StepIndicator, TokenInfoBlock, QuickPresets, and TokenBadge components. Each component is highly optimized for space efficiency while maintaining full functionality and professional appearance.',
      },
      {
        type: 'refactor',
        title: 'CSS Grid-Based Layout System',
        description:
          'Implemented custom CSS grid layouts with ImportPage.css providing precise control over component positioning and sizing. Features responsive design with compact button heights (26px/24px), minimal padding, and optimized spacing throughout.',
      },
      {
        type: 'feature',
        title: 'Enhanced User Experience',
        description:
          'Added visual step progression indicators, quick preset buttons with icons, collapsible advanced options, and real-time cost updates. The interface now provides immediate feedback and clear workflow guidance while maintaining professional aesthetics.',
      },
    ],
  },
  {
    version: 'v0.15.5',
    date: '2024-08-17',
    changes: [
      {
        type: 'feature',
        title: 'Token & Cost Estimation System',
        description:
          'Added a comprehensive token and cost estimation system to Stage 2 of the import pipeline. Users can now see real-time estimates of tokens, costs, and processing time across multiple AI models (GPT-4 Turbo, GPT-4o, GPT-4o Mini, GPT-3.5 Turbo) before starting enrichment.',
      },
      {
        type: 'feature',
        title: 'Enhanced Live Status Console',
        description:
          'Improved the console UI to show the latest log message inline when collapsed, with real-time streaming updates, message count, and type-based color coding. The console now stays collapsed during all operations, allowing users to monitor progress without screen space consumption.',
      },
      {
        type: 'refactor',
        title: 'Unified Liara Design System',
        description:
          'Implemented a comprehensive design system with centralized theme management. All pages now use consistent slate-900 backgrounds, unified color schemes, and proper dark theme integration. Created centralized theme configuration for maintainable styling across the application.',
      },
      {
        type: 'refactor',
        title: 'Compact Import Pipeline Layout',
        description:
          'Redesigned the import page layout for maximum space efficiency. Token cost estimator moved to top-right corner, Step 2 merged with counter area, Step 3 compacted to bottom-right. Reduced margins and padding throughout for better space utilization and cleaner appearance.',
      },
      {
        type: 'feature',
        title: 'Professional Workflow Interface',
        description:
          'Completely redesigned import pipeline with horizontal workflow layout, visual step progress indicators, floating token cost badges, quick preset buttons, and collapsible advanced options. Added consistent card heights and professional visual hierarchy for better user experience.',
      },
    ],
  },
  {
    version: 'v0.15.4',
    date: '2024-08-16',
    changes: [
      {
        type: 'feature',
        title: 'Interactive Import Preprocessing',
        description:
          'The import pipeline now features a "dry run" mode. It visually highlights potential code blocks in the Data Preview stage without modifying the data, allowing for review before committing to changes with a "Save & Apply" button.',
      },
      {
        type: 'feature',
        title: 'Per-Message Failure Tracking',
        description:
          'The enrichment process now tracks individual message failures. Failed messages are visually flagged in the UI with a red border and an icon providing the specific error reason on hover.',
      },
      {
        type: 'feature',
        title: 'Full Metadata Ingestion',
        description: 'The data parser and backend loader have been updated to capture and store the complete, rich metadata object from the original `conversations.json` file into the database `metadata` (jsonb) column.',
      },
       {
        type: 'feature',
        title: 'In-App Documentation for Features',
        description: 'Added a help icon to the "Remove Code" feature that links directly to a new, detailed documentation page explaining the end-to-end logic.',
      },
      {
        type: 'refactor',
        title: 'File-Based Import Workflow',
        description:
          'Updated the import pipeline to be file-based. The frontend pre-processor now saves its results to a file on the backend, which is then used as the definitive source for the enrichment stage.',
      },
    ],
  },
  {
    version: 'v0.15.3',
    date: '2024-08-16',
    changes: [
      {
        type: 'refactor',
        title: 'Complete "MAX Mode" Refactor of Import Pipeline',
        description:
          'The entire Import Pipeline UI has been refactored into a fully modular, component-based architecture using a centralized React Context for more robust and maintainable state management. This enhances scalability and developer experience for future feature additions.',
      },
    ],
  },
  {
    version: 'v0.15.2',
    date: '2024-08-15',
    changes: [
      {
        category: "New Feature",
        summary: "Granular import controls added to the Import Page for finer control over the enrichment process."
      },
      {
        category: "New Feature",
        summary: "Live backend logging is now streamed to the UI during data enrichment via a new SSE endpoint."
      },
      {
        category: "New Feature",
        summary: "Added a \"Clear Test Memories\" button with a custom inline confirmation UI to the Import Page."
      },
      {
        category: "New Feature",
        summary: "Added a new `enrichment-log-failed-[timestamp].json` file to the import process to capture detailed information about any messages that fail enrichment, simplifying debugging."
      },
      {
        category: "Enhancement",
        summary: "Updated enrichment logic to correctly generate vector embeddings for both user and assistant messages."
      },
      {
        category: "Enhancement",
        summary: "Improved AI summarization prompts to produce more direct and less repetitive summaries."
      },
      {
        category: "Enhancement",
        summary: "Data loader now uses an `upsert` operation, making the import process idempotent and preventing database errors."
      },
      {
        category: "Enhancement",
        summary: "Improved the UI and console logging on the import page to be more specific and less ambiguous, clarifying the number of lines vs. conversations being processed."
      },
      {
        category: "Bug Fix",
        summary: "Fixed a critical bug that caused message content to be saved as `[object Object]` during import."
      },
      {
        category: "Bug Fix",
        summary: "Resolved an issue where generated tags were not being correctly saved to the database."
      },
      {
        category: "Bug Fix",
        summary: "Addressed a logical flaw where enriching by `lines` would incorrectly cause the entire conversation to be loaded; the load step now correctly respects the line-based selection."
      },
      {
        category: "Bug Fix",
        summary: "Fixed a crash on the import page (`Cannot read properties of undefined (reading 'insertedCount')`) caused by incorrect parsing of the backend response during the load step."
      },
      {
        category: "Documentation",
        summary: "Overhauled the Data Pipeline documentation to reflect the new UI-driven import and enrichment workflow."
      }
    ]
  },
  {
    version: "v0.14.3",
    date: "2025-08-15",
    changes: [
      {
        category: "Bug Fix",
        summary: "Fixed a critical bug causing the Tag Cloud and Topic Cloud pages to crash due to a missing function after a recent refactor."
      },
      {
        category: "Refactor",
        summary: "Refactored the `TopicCloudPanel` to use the central `useMemoryContext`, improving data consistency and efficiency by removing redundant client-side data fetching."
      },
      {
        category: "Git",
        summary: "Established `v0.9-alpha` as a new development branch and synchronized changes across `main` and `memory-tag-dev`."
      }
    ]
  },
  {
    version: "v0.14.2",
    date: "2025-08-12",
    changes: [
      {
        category: "Chat",
        summary: "Fixed critical bug where recent messages in long conversations would not load. The API now correctly fetches the latest messages first."
      },
      {
        category: "State Management",
        summary: "Performed a major refactor of the frontend chat state for improved stability and simplicity, resolving numerous related bugs."
      },
      {
        category: "Documentation",
        summary: "Conducted a full audit and cleanup of documentation, removing over 40 obsolete markdown files."
      }
    ]
  },
  {
    version: "v0.7.2",
    date: "2025-06-12",
    changes: [
      {
        category: "Semantic Memory",
        summary: "Added memory toggle; integrated memory save & search into chat backend."
      },
      {
        category: "Backend",
        summary: "Fixed critical authentication bug by adding JWT validation middleware."
      }
    ]
  },
  {
    version: "v0.7.1",
    date: "2025-06-10",
    changes: [
      {
        category: "System Overview",
        summary: "Created the initial System Overview page for admin users."
      },
      {
        category: "UI",
        summary: "Converted static system diagrams to interactive ReactFlow components."
      }
    ]
  },
  {
    version: "v0.7.0",
    date: "2025-06-08",
    changes: [
      {
        category: "Database",
        summary: "Enabled Row Level Security (RLS) and created security policies for all tables."
      },
      {
        category: "API",
        summary: "Fixed CORS errors and incorrect environment variable handling in the backend."
      }
    ]
  }
]; 