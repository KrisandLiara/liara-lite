import React from "react";
import TagCloudLitePage from "@/pages/Lite/TagCloudLitePage";

/**
 * Date Explorer (Test)
 * Exact copy wrapper around the current Data Explorer implementation.
 * We keep it as a separate route so we can iterate on date-focused UX safely.
 */
export default function DateExplorerTestPage() {
  return <TagCloudLitePage mode="test" />;
}

