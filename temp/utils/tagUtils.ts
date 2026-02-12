export const getTopTags = (messages: any[], limit: number = 5): string[] => {
  if (!messages || messages.length === 0) return [];
  
  // Count occurrences of each tag
  const tagCounts = new Map<string, number>();
  messages.forEach(msg => {
    if (msg.tags) {
      msg.tags.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    }
  });
  
  // Sort by count and return top N tags
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
};

export const processTagsForHighlighting = (tags: string[]): { tag: string; count: number }[] => {
  if (!tags || tags.length === 0) return [];
  
  // Count occurrences of each tag
  const tagCounts = new Map<string, number>();
  tags.forEach(tag => {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  });
  
  // Convert to array of objects with tag and count
  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
};

export const countTags = (messages: any[]): number => {
  if (!messages || messages.length === 0) return 0;
  
  const uniqueTags = new Set<string>();
  messages.forEach(msg => {
    if (msg.tags) {
      msg.tags.forEach((tag: string) => uniqueTags.add(tag));
    }
  });
  
  return uniqueTags.size;
};

export const getAllTags = (messages: any[]): string[] => {
  if (!messages || messages.length === 0) return [];
  
  const uniqueTags = new Set<string>();
  messages.forEach(msg => {
    if (msg.tags) {
      msg.tags.forEach((tag: string) => uniqueTags.add(tag));
    }
  });
  
  return Array.from(uniqueTags);
};

export const hasTag = (message: any, tag: string): boolean => {
  if (!message || !message.tags) return false;
  return message.tags.includes(tag);
};

export const filterMessagesByTag = (messages: any[], tag: string): any[] => {
  if (!messages || messages.length === 0) return [];
  return messages.filter(msg => hasTag(msg, tag));
};

export const formatTags = (tags: string[]): string[] => {
  if (!tags || tags.length === 0) return [];
  return tags.map(tag => tag.trim().toLowerCase());
}; 