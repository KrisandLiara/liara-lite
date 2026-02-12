// Minimal debug logging helper to keep browser console clean in production
// Toggle this to true locally when you explicitly need verbose logs
export const DEBUG_IMPORT = false;

export function debugLog(...args: unknown[]): void {
  // Vite exposes import.meta.env.DEV during development builds
  // Only log when both dev mode and our debug flag are true
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV && DEBUG_IMPORT) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}


