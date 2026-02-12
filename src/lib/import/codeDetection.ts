interface CodeBlock {
  start: number;
  end: number;
  content: string;
  type: 'block' | 'inline' | 'js-ts';
  contextBefore?: string;
  contextAfter?: string;
  language?: string;
}

/**
 * Finds all code blocks in a text that would be removed by the preprocessor
 */
// Helper to check if this is a duplicate of a previous block
const isDuplicateBlock = (text: string, start: number, end: number, existingBlocks: CodeBlock[]): boolean => {
  const newContent = text.slice(start, end).trim();
  return existingBlocks.some(block => {
    const existingContent = text.slice(block.start, block.end).trim();
    // Check if contents are similar (allowing for some whitespace differences)
    return newContent.replace(/\s+/g, ' ') === existingContent.replace(/\s+/g, ' ');
  });
};

// Helper to check if a block contains an error message
const isErrorBlock = (text: string, start: number, end: number): boolean => {
  const content = text.slice(start, end);
  return /Error:|TypeError:|ReferenceError:|SyntaxError:|AxiosError:/.test(content);
};

// Second param now acts as an external aggressive hint (e.g., conversation-level code-heavy)
export function findCodeBlocks(text: string, isUserMessage: boolean = false): CodeBlock[] {
  if (!text || typeof text !== 'string') return [];
  
  const blocks: CodeBlock[] = [];

  // --- Helper: markdown / prose guards -------------------------------------
  const isMarkdownHeading = (line: string): boolean => /^\s*#{1,6}\s+/.test(line);
  const isMarkdownList = (line: string): boolean => /^\s*(?:[-*]\s+|\d+\.\s+)/.test(line);
  const hasInlineBackticks = (line: string): boolean => /`/.test(line);
  const hasStrongCodeTokens = (line: string): boolean => /[{}\[\]=<>]/.test(line) || /\b\w+\s*\([^)]*\)\s*[{;]?/.test(line);

  const isMarkdownProse = (line: string): boolean => {
    if (hasInlineBackticks(line)) return false;
    if (isMarkdownHeading(line) || isMarkdownList(line)) return true;
    // emphasis-only like *balance* or **your call**
    const emphasisOnly = /(^|\s)[*_]{1,2}[A-Za-z].{0,120}?[*_]{1,2}(?=\s|$)/.test(line);
    return emphasisOnly && !hasStrongCodeTokens(line);
  };

  const looksLikeNaturalSentence = (line: string): boolean => {
    if (hasInlineBackticks(line)) return false;
    const endPunct = /[\.?!]"?'?\s*$/.test(line);
    if (!endPunct) return false;
    const letters = (line.match(/[A-Za-z]/g) || []).length;
    const digits = (line.match(/\d/g) || []).length;
    const symbols = (line.match(/[^A-Za-z0-9\s]/g) || []).length;
    const alphaRatio = letters / Math.max(1, letters + digits + symbols);
    // Lines made of long dashes/underscores are separators, treat as prose
    if (/^[-_\s]{3,}$/.test(line)) return true;
    return alphaRatio >= 0.7 && !hasStrongCodeTokens(line);
  };

  // LaTeX/Math guard – common inline/block math markers should not be treated as code
  const isLatexMath = (line: string): boolean => {
    // Inline/block math markers \( ... \), \[ ... \]
    if (/\\[()\[\]]/.test(line)) return true;
    // Common LaTeX math macros
    if (/\\(frac|sqrt|sum|int|vec|hat|bar|alpha|beta|gamma|delta|mu|nu|lambda|pi|theta|sigma)\b/.test(line)) return true;
    return false;
  };

  // Natural-language "function (chill, focus, social, etc.)" guard
  // Treat as prose when it's just words/commas/ampersands/hyphens/"etc" inside parentheses
  const isNaturalFunctionMention = (text: string): boolean => {
    const m = text.match(/\bfunction\s*\(([^)]*)\)/i);
    if (!m) return false;
    const inner = (m[1] || '').trim();
    if (!inner) return false;
    // Only allow letters, spaces, commas, ampersand, slash, hyphen, periods in "etc." and no digits
    // Allow letters, spaces, commas, ampersand, slash, period, hyphen (hyphen last)
    if (!/^[a-zA-Z\s,&\/\.\-]+$/.test(inner)) return false;
    // Disallow obvious code tokens
    if (/[{}\[\]=<>;:]/.test(inner)) return false;
    // Consider it prose if it resembles "chill, focus, social, etc" structure
    return /(etc\.?|and\s+more)$/i.test(inner) || /,\s*[a-zA-Z]/.test(inner);
  };

  // Helper to determine if a text is code-heavy
  const isCodeHeavyContent = (text: string): boolean => {
    const lines = text.split('\n');
    let codeLikeLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const isStrong = (
        // Obvious JS keywords at start of line
        /^(?:const|let|var|function|class|if|for|while|try|catch|return)\b/.test(trimmed) ||
        // Stack trace lines
        /^\s*at\s+\w+/.test(trimmed) ||
        // HTTP method lines
        /^(?:GET|POST|PUT|DELETE|PATCH)\s+https?:/.test(trimmed) ||
        // JSON/YAML like openings
        /^\s*[\[{].+[:\],}]/.test(trimmed) ||
        // Function call pattern
        /\b\w+\s*\([^)]*\)\s*[{;]?/.test(trimmed) ||
        // Arrow/function assignment
        /=>|=\s*\(/.test(trimmed) ||
        // Multiple operators/braces (avoid counting plain parentheses in prose)
        /[{}\[\]=;<>]/.test(trimmed)
      );

      if (isStrong) codeLikeLines++;
    }

    const nonEmptyLines = lines.filter(l => l.trim()).length;
    // Require at least 2 strong code-like lines, or majority of many-line text
    return codeLikeLines >= 2 || (nonEmptyLines >= 4 && (codeLikeLines / nonEmptyLines) > 0.5);
  };

  // Determine if we should use aggressive detection
  // Aggressive if external hint is true OR the message itself is code-heavy
  const shouldBeAggressive = Boolean(isUserMessage) || isCodeHeavyContent(text);

  // Early exit heuristics for non-aggressive mode to reduce false positives
    if (!shouldBeAggressive) {
    const hasBackticks = /```/.test(text);
    const jsKeywords = (text.match(/\b(const|let|var|function|class|async|await|try|catch|return)\b/g) || []).length;
    const functionCalls = (text.match(/\b\w+\s*\([^\n)]*\)/g) || []).length;
    const hasBraces = /[{}]/.test(text);
    const hasStackTrace = /\bat\s+[^\n]+\((?:.*\.(?:js|ts):\d+:\d+)\)/.test(text);
    const aiImageMeta = /(AI Generated Image|^\s*Prompt:|^\s*Model:|\b\d{3,4}x\d{3,4}\b)/im.test(text);
    const transcriptMeta = /\[Transcript\]|^Transcript\b/i.test(text);

    const hasStrongSignals = hasBackticks || hasBraces || hasStackTrace || jsKeywords >= 2 || functionCalls >= 2;

    // If it's a natural-language function mention, treat as prose
    if (isNaturalFunctionMention(text)) {
      return [];
    }

    // If message looks like media/transcript and lacks strong code signals, do not treat as code
    if ((aiImageMeta || transcriptMeta) && !hasStrongSignals) {
      return [];
    }

    // If there are no strong code signals at all, bail out early
    if (!hasStrongSignals) {
      return [];
    }
  }

  // Additional safety: in non-aggressive mode, if none of the lines contain
  // strong code tokens (braces/operators/function calls/JS keywords), treat as prose
    if (!shouldBeAggressive) {
    const anyStrongLine = text.split('\n').some(l => {
      const line = l.trim();
      if (!line) return false;
      if (isMarkdownProse(line) || looksLikeNaturalSentence(line)) return false;
      if (isLatexMath(line)) return false;
      if (isNaturalFunctionMention(line)) return false;
      return /[{}\[\]=<>]/.test(line) || /\b(?:const|let|var|function|class|import|export|return|try|catch)\b/.test(line) || /\b\w+\s*\([^)]*\)/.test(line);
    });
    if (!anyStrongLine) return [];

    // Super-conservative guard: if the whole message lacks any classic code tokens,
    // treat it as prose. This prevents tagging plain sentences that merely mention
    // the word "code" or technical nouns.
    // Only count "path-like" tokens as strong if they look like real paths/URLs (have a dot or scheme)
    const globalStrongTokens = /[{}\[\]`]|[=/*<>|]|(?:\b\w+\s*\([^)]*\))|(?:https?:\/\/\S+)|(?:\w+\/[\w.-]*\.[A-Za-z0-9]+)|(?:[A-Za-z]:\\[\\\w.\-]+)/;
    if (!globalStrongTokens.test(text)) return [];
  }
  
  // Helper function to find the bounds of a code block
  const findCodeBlockBounds = (text: string, startIndex: number, isUserMessage: boolean = false): { start: number; end: number } | null => {
    // Look backwards for the start of the block
    let blockStart = startIndex;
    const lines = text.split('\n');
    let currentLine = 0;
    let foundStart = false;

    // Find which line contains our startIndex
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1; // +1 for the newline
      if (charCount > startIndex) {
        currentLine = i;
        break;
      }
    }

    // Helper to check if this is a duplicate of a previous block
  const isDuplicateBlock = (text: string, start: number, end: number, existingBlocks: CodeBlock[]): boolean => {
    const newContent = text.slice(start, end).trim();
    return existingBlocks.some(block => {
      const existingContent = text.slice(block.start, block.end).trim();
      // Check if contents are similar (allowing for some whitespace differences)
      return newContent.replace(/\s+/g, ' ') === existingContent.replace(/\s+/g, ' ');
    });
  };

  // Helper to check if lines are part of the same block
  const areLinesRelated = (prevLine: string, currentLine: string): boolean => {
    // Common patterns that indicate lines belong together
    const continuationPatterns = [
      // Function/object continuation
      { prev: /[{([,]$/, current: /^[\s})\].]/ },
      // Stack trace continuation
      { prev: /\bat\s+[\w.]+$/, current: /^[\s@]/ },
      { prev: /Error:.*$/, current: /^\s+at\s+/ },
      { prev: /\s+at\s+.*$/, current: /^\s+(?:at\s+|$)/ },
      // Anonymous function continuation
      { prev: /@\s*[\w/.:-]+$/, current: /^[\s@]/ },
      // Property access
      { prev: /\.$/, current: /^\s*\w/ },
      // Indentation continuation
      { prev: /\S/, current: /^\s{2,}/ },
      // Code block markers
      { prev: /\{$/, current: /^\s*\w/ },
      // Import/require continuation
      { prev: /require\(['"]/, current: /^\s*['")\]}]/ },
      // Function parameters
      { prev: /\($/, current: /^\s*[\w'")}]/ },
      // Template literal continuation
      { prev: /`[^`]*$/, current: /^[^`]*`/ },
      // Comment continuation
      { prev: /\/\/.*$/, current: /^[\s"']*\w/ },
      { prev: /\/\/ .*$/, current: /^[\s"']*\w/ },
      // Error object continuation
      { prev: /Error details:.*$/, current: /^\s*[\{\w]/ },
      { prev: /Error:.*$/, current: /^\s*[\{\w]/ },
      { prev: /error:.*$/, current: /^\s*[\{\w]/ },
      // JSON continuation
      { prev: /[:,]\s*$/, current: /^\s*[\{\[\w"']/ },
      // Partial line continuation
      { prev: /[\w.]\s*$/, current: /^[\w\s.:]/ },
      // Error message continuation
      { prev: /full error code.*$/, current: /^[\s"'\w]/ },
      { prev: /I get this error.*$/, current: /^[\s"'\w]/ },
      { prev: /Error details:.*$/, current: /^[\s"'\w]/ },
      // Code block introductions
      { prev: /this is how I have it in.*$/, current: /^[\s"'\w]/ },
      { prev: /like this\s*\?.*$/, current: /^[\s"'\w]/ },
      { prev: /looks like this.*$/, current: /^[\s"'\w]/ },
      { prev: /this is what I have.*$/, current: /^[\s"'\w]/ },
      // OpenAI API patterns
      { prev: /OpenAI response data:.*$/, current: /^[\s"'\{\[]/ },
      { prev: /"id":.*$/, current: /^[\s"'\{\[]/ },
      { prev: /"object":.*$/, current: /^[\s"'\{\[]/ },
      { prev: /"created":.*$/, current: /^[\s"'\{\[]/ },
      { prev: /"model":.*$/, current: /^[\s"'\{\[]/ },
      { prev: /"choices":.*$/, current: /^[\s"'\{\[]/ },
      { prev: /"index":.*$/, current: /^[\s"'\{\[]/ },
      { prev: /model:.*$/, current: /^[\s"'\w]/ },
      { prev: /messages:.*$/, current: /^\s*\[/ },
      { prev: /\[\s*$/, current: /^\s*{/ },
      { prev: /\{\s*$/, current: /^\s*(?:role:|"|\w)/ },
      { prev: /role:.*$/, current: /^\s*content:/ },
      { prev: /content:.*$/, current: /^\s*}/ },
      { prev: /\}\s*$/, current: /^\s*[\],}]/ },
      { prev: /\]\s*$/, current: /^\s*[,}]/ },
      // Console.log patterns
      { prev: /console\.log\(.*$/, current: /^\s*if\s*\(/ },
      { prev: /if\s*\(.*$/, current: /^\s*console\./ },
      { prev: /else\s*\{\s*$/, current: /^\s*console\./ },
      // Router patterns
      { prev: /router\.post\(.*$/, current: /^\s*try\s*{/ },
      { prev: /try\s*\{\s*$/, current: /^\s*const/ }
    ];

    return continuationPatterns.some(({ prev, current }) => 
      prev.test(prevLine) && current.test(currentLine)
    );
  };

  // Helper to check if a line is likely part of a code block
  const isCodeLike = (line: string, prevLine?: string): boolean => {
    // Skip empty lines
    if (!line.trim()) return false;

    // Markdown prose / natural sentence guards to avoid false positives
    if (isMarkdownProse(line)) return false;
    if (isLatexMath(line)) return false;
    if (!shouldBeAggressive && looksLikeNaturalSentence(line)) return false;

    // If there's a previous line and they're related, inherit the code-like status
    if (prevLine && areLinesRelated(prevLine, line)) {
      return true;
    }

      // Common patterns that always indicate code/errors
      const strongIndicators = [
        /^\s*at\s+\w+/,                 // Stack trace lines
        /^\s*at\s+<anonymous>/,          // anonymous frames
        /^(?:GET|POST|PUT|DELETE|PATCH)\s+https?:/,
        /^(?:const|let|var|function|class|if|for|while)\s/,
        /^(?:Error|TypeError|ReferenceError|SyntaxError):/,
        /^Uncaught\s+(?:TypeError|ReferenceError|SyntaxError)/,
        /^No debugger available/,
        /Cannot read properties of undefined/i,
        /res\.status\(\d+\)/i,          // Express response patterns
        /\.json\(/i,
        /^Process exited with code/,
        /^Module\._load @/,
        /^executeUserEntryPoint @/,
        /\(C:\\[\w\\-]+\.(?:js|ts):\d+:\d+\)/,
        /^\s*[\w.-]+\.(?:js|ts):\d+/,  // file:line
        /^\s*\{[\s\w"']+\}/,
        /^\s*\[[\s\w"']+\]/,
        /^\s*(?:<!--)?\s*\w+:/
      ];

      // If it's a strong indicator, always treat as code
      if (strongIndicators.some(pattern => pattern.test(line))) {
        return true;
      }

      // In aggressive mode (conversation code-heavy), broaden but still require real code signals
      if (isUserMessage) {
        return (
          /[{}\[\]()<>]/.test(line) ||                     // brackets
          /[=><+\-*/%&|^~]/.test(line) ||                   // operators
          /\w+\(.*\)/.test(line) ||                        // function calls
          /(?:\/|\\)\w+(?:\/|\\)\w+/.test(line) ||      // file paths
          /https?:\/\/\S+/.test(line) ||                   // URLs
          /\s{2,}\w/.test(line) ||                          // indentation
          /\.\w+\s*\(.*\)/.test(line)                     // method call like obj.method(...)
        );
      }

      // For non-user messages in code-heavy conversations
      if (/^[-_\s]{3,}$/.test(line)) return false; // separator line
      return (
        /\s{2,}\w/.test(line) ||               // indentation
        /[{}\[\]=<>]/.test(line) ||           // operators/brackets (ignore plain parentheses to reduce prose hits)
        /\w+\(.*\)\s*[{;]?/.test(line) ||     // function calls
        /\.\w+\.\w+/.test(line)              // method chains
      );
    };

    // Look backwards for the start of the block
    let prevLine = '';
    for (let i = currentLine; i >= 0; i--) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Stop if we find a line that's not code-like and not related to previous line
      if (trimmedLine === '' || (!isCodeLike(line, prevLine) && !areLinesRelated(prevLine, line))) {
        // Do NOT include intro lines like "I will post my code here..." in the code block
        // Keep them in contextBefore by starting at the next line boundary
        blockStart = charCount;
        foundStart = true;
        break;
      }
      prevLine = line;
      charCount -= lines[i].length + 1;
    }

    if (!foundStart) {
      blockStart = 0;
    }

    // Look forwards for the end of the block
    let blockEnd = startIndex;
    charCount = 0;
    let emptyLineCount = 0;
    prevLine = lines[currentLine] || '';
    
    for (let i = currentLine + 1; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      charCount += lines[i].length + 1;
      
      if (trimmedLine === '') {
        emptyLineCount++;
        // Allow one empty line in code blocks
        if (emptyLineCount > 1) {
          blockEnd = charCount - (lines[i].length + 1);
          break;
        }
      } else {
        // Check if this line is related to the previous one or is code-like
        if (!isCodeLike(line, prevLine) && !areLinesRelated(prevLine, line)) {
          blockEnd = charCount - (lines[i].length + 1);
          break;
        }
        emptyLineCount = 0;
        prevLine = line;
      }
    }

    // Use the computed end of the block, not the entire text length
    return { start: blockStart, end: blockEnd };
  };

  // First, check for common code patterns without backticks
  const commonPatterns = [
    // Error messages and stack traces (should be checked first)
    {
      // Short error messages with objects
      pattern: /(?:Error details:|arg\d+:)\s*{[^}]*}/,
      type: 'error-trace',
      language: 'plaintext'
    },
    {
      // Debug and error messages
      pattern: /(?:No debugger available|Cannot read properties of undefined|Process exited with code|Full error object:)/,
      type: 'error-trace',
      language: 'plaintext'
    },
    {
      // HTTP method errors
      pattern: /(?:GET|POST|PUT|DELETE)\s+https?:\/\/[^\s]+\s+(?:\d{3}|\(Internal Server Error\))/,
      type: 'error-trace',
      language: 'plaintext'
    },
    {
      // Stack trace with file paths
      pattern: /\bat\s+(?:\w+\s*)?\([^)]*(?:\.js|\.ts):\d+:\d+\)/,
      type: 'error-trace',
      language: 'plaintext'
    },
    {
      // Anonymous function traces
      pattern: /(?:\(anonymous\)|<anonymous>)\s*@\s*[\w/.:-]+/,
      type: 'error-trace',
      language: 'plaintext'
    },
    {
      // General error messages with stack traces
      pattern: /(?:Error|TypeError|ReferenceError|SyntaxError|AxiosError):[^\n]+(?:\n\s+at\s+[^\n]+)+/,
      type: 'error-trace',
      language: 'plaintext'
    },

    // JavaScript/TypeScript code patterns
    {
      pattern: /window\.onload\s*=.*{[\s\S]*}/,
      type: 'js-ts',
      language: 'javascript'
    },
    {
      pattern: /const\s+\w+\s*=\s*document\.getElementById/,
      type: 'js-ts',
      language: 'javascript'
    },
    {
      pattern: /\.addEventListener\('.*',\s*(?:async\s*)?\(\s*\)\s*=>\s*{/,
      type: 'js-ts',
      language: 'javascript'
    },
    {
      pattern: /try\s*{[\s\S]*?}\s*catch\s*\([^)]*\)\s*{/,
      type: 'js-ts',
      language: 'javascript'
    },
    {
      pattern: /(?:const|let|var)\s+\w+\s*=\s*(?:document|window|require|import)/,
      type: 'js-ts',
      language: 'javascript'
    }
    ,
    // OpenAI / Chat configuration patterns (uncaught examples)
    {
      pattern: /openai\.(?:createChatCompletion|chat\s*\.\s*completions?)/,
      type: 'js-ts',
      language: 'javascript'
    },
    {
      pattern: /const\s+response\s*=\s*await\s+openai\./,
      type: 'js-ts',
      language: 'javascript'
    },
    {
      pattern: /\bmodel\s*:\s*['"][\w.-]+['"]/,
      type: 'js-ts',
      language: 'javascript'
    },
    {
      pattern: /\bmessages\s*:\s*\[/,
      type: 'js-ts',
      language: 'javascript'
    },
    {
      pattern: /\b(max_tokens|temperature|stop|n)\s*:/,
      type: 'js-ts',
      language: 'javascript'
    }
  ];

  // Track processed regions to avoid overlapping blocks
  const processedRegions: Array<{ start: number; end: number }> = [];

  const isRegionProcessed = (start: number, end: number): boolean => {
    return processedRegions.some(region => 
      (start >= region.start && start <= region.end) ||
      (end >= region.start && end <= region.end) ||
      (start <= region.start && end >= region.end)
    );
  };

  // Check for these patterns first
  for (const { pattern, type, language } of commonPatterns) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      if (!match.index) continue;
      
      // Find the full block bounds
      const bounds = findCodeBlockBounds(text, match.index, shouldBeAggressive);
      if (!bounds) continue;

      // Skip if this region has already been processed
      if (isRegionProcessed(bounds.start, bounds.end)) continue;

      // For error blocks, check if it's a duplicate
      if (isErrorBlock(text, bounds.start, bounds.end) && isDuplicateBlock(text, bounds.start, bounds.end, blocks)) {
        // debug removed
        continue;
      }
      
      // Debug logging for aggressive detection
      // debug removed
      
      // Get context
      const contextBefore = text.slice(Math.max(0, bounds.start - 100), bounds.start).trim();
      const contextAfter = text.slice(bounds.end, Math.min(text.length, bounds.end + 100)).trim();
      
      // Get the full block content
      const content = text.slice(bounds.start, bounds.end);
      
      // Add to processed regions
      processedRegions.push(bounds);
      
      blocks.push({
        start: bounds.start,
        end: bounds.end,
        content,
        type,
        language,
        contextBefore,
        contextAfter
      });
    }
  }

  // Then check for backtick-wrapped code blocks
  const blockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    // Get context before and after (up to 100 chars)
    const contextBefore = text.slice(Math.max(0, match.index - 100), match.index).trim();
    const afterStart = match.index + match[0].length;
    const contextAfter = text.slice(afterStart, Math.min(text.length, afterStart + 100)).trim();
    
    blocks.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[0],
      type: 'block',
      language: match[1] || 'plaintext',
      contextBefore,
      contextAfter
    });
  }

  // Segment-based detection only in aggressive mode to avoid false positives
  if (shouldBeAggressive) {
    // Split into segments by blank lines and analyze each segment holistically
    const lines = text.split('\n');
    const lineStartIdx: number[] = [];
    {
      let idx = 0;
      for (const line of lines) {
        lineStartIdx.push(idx);
        idx += line.length + 1; // include newline
      }
    }

  const seeds: RegExp[] = [
    /openai\.(?:createChatCompletion|chat\s*\.\s*completions?)/i,
    /const\s+response\s*=\s*await\s+openai\./i,
    /\bmodel\s*:\s*['"][\w.-]+['"]/i,
    /\bmessages\s*:\s*\[/i,
    /\b(max_tokens|temperature|stop|n)\s*:/i,
    /\brouter\.post\(/i,
    /require\(['"]express['"]\)/i,
    /Configuration\(\{\s*apiKey:/i,
    /Request failed with status code \d{3}/i,
    /Error details?:/i,
    /arg\d+:/i,
    /<anonymous>\s*@\s*[\w/.:-]+/i,
    /node_modules[\\/].+\.(?:js|ts):\d+:\d+/i,
    /\bat\s+[^\n]+\((?:.*\.(?:js|ts):\d+:\d+)\)/,
    /\bserver\.js:\d+/, /\bchat\.js:\d+/,
    // HTML / JSX seeds
    /^<!DOCTYPE/i, /<html\b/i, /<head\b/i, /<meta\b/i, /<link\b/i, /<script\b/i, /<body\b/i,
    /<div\b/i, /<footer\b/i, /<header\b/i, /<nav\b/i,
    /className=/i, /<Route\b/i, /<\/Route>/i, /function\s+\w+\s*\(/i, /return\s*\(/i
  ];

  const isIntro = (l: string) => /^(?:I (?:will|have|get|am getting|can)|Here'?s|This is|Getting)\b/i.test(l.trim());

  let segStart = 0;
  const isMediaLine = (l: string) => {
    const t = l.trim();
    return (
      t === '[Image]' ||
      /^\[Image Generated:/.test(t) ||
      t === '[Voice/Audio Content]' ||
      t.includes('[Transcript]') ||
      /^Prompt:/i.test(t) ||
      /^Model:/i.test(t) ||
      /\b\d{3,4}x\d{3,4}\b/i.test(t)
    );
  };

  for (let i = 0; i <= lines.length; i++) {
    const isBreak = i === lines.length || lines[i].trim() === '';
    if (isBreak) {
      const startLine = segStart;
      const endLine = i - 1;
      if (endLine >= startLine) {
        const segment = lines.slice(startLine, endLine + 1);
        const nonEmpty = segment.filter(l => l.trim().length > 0);
        const nonMedia = nonEmpty.filter(l => !isMediaLine(l));
        const strongCount = nonMedia.filter(l => isCodeLike(l)).length;
        const hasSeed = nonMedia.some(l => seeds.some(r => r.test(l)));
        const segmentText = nonMedia.join('\n');
        // Treat semicolons alone as prose; require stronger structural code signals
        let hasStructuralCode = /[{}=]/.test(segmentText) || /<\/?\w+[^>]*>/.test(segmentText) || /=>/.test(segmentText) || /\b(const|let|var|function|class|import|export|return|try|catch)\b/.test(segmentText) || /\w+\(.*\)/.test(segmentText);
        if (hasStructuralCode && isNaturalFunctionMention(segmentText)) {
          hasStructuralCode = false;
        }
        const score = nonMedia.length === 0 ? 0 : strongCount / nonMedia.length;

        // Skip segments that look like pure markdown prose (headings/lists/emphasis) with no strong code tokens
        const segmentLooksLikeMarkdown = segment.some(l => isMarkdownProse(l));
        if ((hasSeed || hasStructuralCode || score >= 0.6) && !segmentLooksLikeMarkdown) {
          // Determine char start/end, excluding obvious intro line at the very start
          let firstLine = startLine;
          if (isIntro(lines[firstLine])) {
            firstLine = Math.min(endLine, firstLine + 1);
          }
          const charStart = lineStartIdx[firstLine];
          const charEnd = lineStartIdx[endLine] + lines[endLine].length; // no trailing newline

          // Skip overlaps
          if (!blocks.some(b => (charStart < b.end && charEnd > b.start))) {
            const contextBefore = text.slice(Math.max(0, charStart - 120), charStart).trim();
            const contextAfter = text.slice(charEnd, Math.min(text.length, charEnd + 120)).trim();
            blocks.push({
              start: charStart,
              end: charEnd,
              content: text.slice(charStart, charEnd),
              type: 'js-ts',
              language: 'javascript',
              contextBefore,
              contextAfter
            });
          }
        }
      }
      segStart = i + 1; // next segment after blank line
    }
  }
  }

  // Find incomplete code blocks (missing closing ```)
  const incompleteRegex = /```[\s\S]*$/g;
  while ((match = incompleteRegex.exec(text)) !== null) {
    // Only add if we haven't already found a complete block here
    if (!blocks.some(block => block.start === match.index)) {
      blocks.push({
        start: match.index,
        end: text.length,
        content: match[0],
        type: 'block'
      });
    }
  }

  // Find inline code with single backticks
  const inlineRegex = /\B`[^`\n]+`\B/g;
  while ((match = inlineRegex.exec(text)) !== null) {
    const content = match[0].slice(1, -1).trim();
    // Only add if it looks like actual code
    // In non-aggressive mode, require strong inline signals (braces/operators or function call)
    const strongInline = /[{}\[\]=<>]/.test(content) || /\b\w+\s*\([^)]*\)\s*[{;]?/.test(content);
    if ((shouldBeAggressive && isCodeLike(content)) || (!shouldBeAggressive && strongInline)) {
      blocks.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[0],
        type: 'inline'
      });
    }
  }

  // --- Merge & Unify phase ---
  if (blocks.length === 0) return blocks;

  // Sort by start
  blocks.sort((a, b) => a.start - b.start);

  // Merge overlapping or near-adjacent blocks (allow small gaps: whitespace or single blank line)
  const merged: CodeBlock[] = [];
  const isSmallGap = (start: number, end: number) => {
    const gap = text.slice(start, end);
    // consider small if whitespace or <= 1 blank line
    if (/^\s*$/.test(gap)) return true;
    const newlines = (gap.match(/\n/g) || []).length;
    return newlines <= 1 && !/\S{40,}/.test(gap); // no long non-space run in gap
  };

  for (const blk of blocks) {
    if (merged.length === 0) {
      merged.push({ ...blk });
      continue;
    }
    const last = merged[merged.length - 1];
    if (blk.start <= last.end || isSmallGap(last.end, blk.start)) {
      // Extend last
      last.end = Math.max(last.end, blk.end);
      last.content = text.slice(last.start, last.end);
      // Merge context
      last.contextBefore = last.contextBefore ?? blk.contextBefore;
      last.contextAfter = blk.contextAfter ?? last.contextAfter;
      last.language = last.language || blk.language;
    } else {
      merged.push({ ...blk });
    }
  }

  let unified = merged;

  // If too many blocks in a single message or coverage is high, unify into one big block
  const totalCovered = merged.reduce((sum, b) => sum + (b.end - b.start), 0);
  const coverage = totalCovered / text.length;
  if (merged.length >= 8 || coverage >= 0.5) {
    const start = merged[0].start;
    const end = merged[merged.length - 1].end;
    const contextBefore = text.slice(0, start).trim();
    const contextAfter = text.slice(end).trim();
    unified = [{
      start,
      end,
      content: text.slice(start, end),
      type: 'js-ts',
      language: 'javascript',
      contextBefore,
      contextAfter
    }];
  }

  return unified;
}

// -------------------- Shared renderability helpers --------------------

/** Returns true if a string contains LaTeX/math markers that we should not treat as code UI */
export function isLatexMathString(source: string): boolean {
  return /\\[()\[\]]/.test(source) || /\\(frac|sqrt|sum|int|vec|hat|bar|alpha|beta|gamma|delta|mu|nu|lambda|pi|theta|sigma)\b/.test(source);
}

/** Returns true if the string is pure prose-like (letters/spaces/commas/quotes/dashes/periods) */
export function isPureProseString(source: string): boolean {
  return /^[A-Za-z0-9\s,.'’“”\-–—!?:;]+$/.test(source);
}

/** Returns true if the string has strong signals to render as code in UI */
export function hasStrongCodeSignals(source: string): boolean {
  const fnCall = /\b\w+\s*\(([^)]*)\)\s*[{;]?/;
  const m = source.match(fnCall);
  const isProseParen = (inner: string) => /^[A-Za-z\s,'’“”\-–—.]+$/.test(inner.trim());
  const hasFnCall = m ? !isProseParen(m[1] || '') : false;
  // Do NOT treat single < or > or = as code. So skip generic operator class here.
  return /```/.test(source)
    || /[{}\[\]]/.test(source) // braces only
    || /\bat\s+[^\n]+\((?:.*\.(?:js|ts):\d+:\d+)\)/.test(source) // stack traces
    || /https?:\/\/\S+/.test(source) // urls
    || hasFnCall // real function-like
    // explicit JS/TS signals that are safe to keep here
    || /(\bconst\b|\blet\b|\bvar\b|\bfunction\b|\bclass\b|\bimport\b|\bexport\b|=>)/.test(source)
    || /\bmodule\.exports\s*=/.test(source);
}

/** Filters blocks to those that would actually be rendered as code in the UI */
export function filterRenderableBlocks(text: string, blocks: CodeBlock[]): CodeBlock[] {
  const isJsonDataDump = (source: string): boolean => {
    if (/```/.test(source)) return false; // fenced → treat as code
    const pairCount = (source.match(/"[^"\n]+"\s*:/g) || []).length;
    const braceCount = (source.match(/[{}\[\]]/g) || []).length;
    const hasJSKeywords = /(\bconst\b|\blet\b|\bfunction\b|\bclass\b|\bimport\b|\bexport\b|\breturn\b|\btry\b|\bcatch\b)/.test(source);
    const hasSemicolons = /;/.test(source);
    const isOneLine = !/\n/.test(source);
    // Heuristic: many JSON key:value pairs and braces, no JS keywords/semicolons → data dump, not code
    return pairCount >= 3 && braceCount >= 4 && !hasJSKeywords && !hasSemicolons && isOneLine;
  };

  const isPrivateDelimitedList = (source: string): boolean => {
    if (/```/.test(source)) return false;
    // Private Use Area separators often appear as \\uE000-\\uF8FF; represent as literal chars
    const hasPUA = /[\uE000-\uF8FF]/.test(source);
    const nameItems = (source.match(/\"name\"\s*:\s*\"/g) || []).length;
    const hasJSKeywords = /(\bconst\b|\blet\b|\bfunction\b|\bclass\b|\bimport\b|\bexport\b|\breturn\b|\btry\b|\bcatch\b)/.test(source);
    const hasSemicolons = /;/.test(source);
    return hasPUA && nameItems >= 3 && !hasJSKeywords && !hasSemicolons;
  };

  return blocks.filter((b) => {
    const t = (b.content || '').toString();
    if (!t) return false;
    if (isLatexMathString(t)) return false;
    if (isPureProseString(t)) return false;
    if (isJsonDataDump(t)) return false;
    if (isPrivateDelimitedList(t)) return false;
    return hasStrongCodeSignals(t);
  });
}

/**
 * Checks if text looks like code
 */
function isCodeLike(text: string): boolean {
  // Common code patterns
  const codePatterns = [
    // Basic JavaScript/TypeScript patterns
    /^(const|let|var|function|class|async|await)\s/,  // Declarations
    /^import\s.*from/,                                // Imports
    /^export\s/,                                      // Exports
    /^\s*[a-zA-Z_$][\w$]*\.(then|catch|finally)\(/,  // Promise chains
    /^\s*[a-zA-Z_$][\w$]*\s*=\s*await\s/,           // Await expressions
    /^\s*\/\//,                                      // Comments
    /^\s*if\s*\(/,                                   // If statements
    /^\s*for\s*\(/,                                  // For loops
    /^\s*while\s*\(/,                                // While loops
    /^\s*try\s*{/,                                   // Try blocks
    /^\s*catch\s*\(/,                                // Catch blocks
    /^\s*}\s*else\s*{/,                              // Else blocks
    /^\s*return\s/,                                  // Return statements
    /^\s*\[.*\]\s*=\s*/,                            // Array destructuring
    /^\s*\{.*\}\s*=\s*/,                            // Object destructuring
    /=>\s*{/,                                        // Arrow functions
    /^\s*\}/,                                        // Closing braces
    
    // Error stack traces
    /^\s*at\s+[\w.<>]+\s+\([^)]+\)/,                // Stack trace lines
    /^\s*at\s+[^(]+\([^)]+\)$/,                     // Stack trace with function
    /Error:\s.*\bat\b.*\b\(\w:.*\)/,                // Windows-style error paths
    
    // API Configuration patterns
    /^\s*model:\s*["'][\w-]+["']/,                  // AI model specifications
    /^\s*max_tokens:\s*\d+/,                        // Token limits
    /^\s*temperature:\s*[0-9.]+/,                   // Temperature settings
    /^\s*messages:\s*\[/,                           // Message arrays
    /^\s*\{\s*role:\s*['"]system['"].*\}/,         // System messages
    /^\s*\{\s*role:\s*['"]user['"].*\}/,           // User messages
    
    // Error handling patterns
    /console\.(log|error|warn|info)\(/,             // Console methods
    /^\s*res\.status\(\d+\)/,                      // Response status
    /^\s*throw\s+new\s+\w+/,                       // Error throwing
    
    // File paths and stack traces
    /at\s+.*\(.*:\d+:\d+\)/,                       // Stack trace with line numbers
    /^\s*at\s+.*\s+\(internal\/.*\)/,              // Node.js internal paths
    /Error:\s+.*\n\s+at\s+/                        // Multi-line error messages
  ];

  return codePatterns.some(pattern => pattern.test(text));
}

/**
 * Checks if text contains any code blocks that would be removed
 */
export function hasCode(text: string): boolean {
  return findCodeBlocks(text).length > 0;
}

/**
 * Removes all code blocks from text
 */
export function removeCode(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // Use aggressive detection; renderability filter prevents false positives
  const blocks = findCodeBlocks(text, true);
  const renderable = filterRenderableBlocks(text, blocks);
  if (renderable.length === 0) return text;

  // Sort blocks in reverse order so we can replace from end to start
  // without affecting other block positions
  renderable.sort((a, b) => b.start - a.start);

  let result = text;
  for (const block of renderable) {
    const placeholder = block.type === 'block' 
      ? `[${block.language?.toUpperCase() || 'Code'} Block]`
      : '[Inline Code]';
    
    result = 
      result.slice(0, block.start) +
      placeholder +
      result.slice(block.end);
  }

  // Post-process: if a placeholder is followed by trailing code/log characters on the same line,
  // trim the remainder to keep only the placeholder (context line stays clean).
  // This helps stubborn cases like "[Inline Code]Full error object... res.status(500).json(...)".
  result = result.replace(/(\[(?:Inline Code|[A-Z]+\s+Block|Code Block)\])[^\n]*/gi, '$1');

  return result;
}