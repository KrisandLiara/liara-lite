import { useMemo } from "react";

export type TokenType = "tag" | "entity";

export type Token = {
  id: string;
  name: string;
  type: TokenType;
  category?: string; // for entities
  mentions: number; // total mentions across messages
  uniqueConversations: number; // number of conversations where token appears at least once
};

export type RelatedToken = { id: string; score: number };

function normCat(cat?: string) {
  if (!cat) return "MISC";
  if (cat === "GPE") return "LOC";
  return cat;
}

function tagId(name: string) {
  return `tag::${name}`;
}

function entId(category: string, name: string) {
  return `entity::${category}::${name}`;
}

function normTagName(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
}

function isJunkTag(name: string) {
  const n = normTagName(name);
  if (!n) return true;
  // Common LLM placeholder strings when no tags were extracted.
  if (n === "no relevant keywords or tags available") return true;
  if (n === "no relevant keywords or tags") return true;
  if (n === "no relevant tags available") return true;
  if (n === "no tags available") return true;
  if (n === "none") return true;
  if (n === "n/a" || n === "na") return true;
  return false;
}

export function useTokenIndex(enriched: any[] | null) {
  return useMemo(() => {
    const tokenById = new Map<string, Token>();
    const convosByToken = new Map<string, Set<string>>();
    const coocByToken = new Map<string, Map<string, number>>(); // token -> other -> sharedConvoCount

    const addToken = (t: Omit<Token, "mentions" | "uniqueConversations">) => {
      const existing = tokenById.get(t.id);
      if (existing) return existing;
      const created: Token = { ...t, mentions: 0, uniqueConversations: 0 };
      tokenById.set(t.id, created);
      return created;
    };

    const addMention = (id: string, convoId: string) => {
      const tok = tokenById.get(id);
      if (!tok) return;
      tok.mentions += 1;
      const s = convosByToken.get(id) || new Set<string>();
      s.add(convoId);
      convosByToken.set(id, s);
    };

    const enrichedArr = Array.isArray(enriched) ? enriched : [];
    for (const convo of enrichedArr) {
      const convoId = String(convo?.id ?? convo?.title ?? "");
      if (!convoId) continue;

      // Build a per-conversation set for co-occurrence.
      const convoTokens = new Set<string>();

      for (const msg of convo?.messages || []) {
        // Tags
        const tags: string[] = Array.isArray(msg?.tags) ? msg.tags : [];
        for (const raw of tags) {
          const name = String(raw || "").trim();
          if (!name) continue;
          if (isJunkTag(name)) continue;
          const id = tagId(name);
          addToken({ id, name, type: "tag" });
          addMention(id, convoId);
          convoTokens.add(id);
        }

        // Entities
        const ne = msg?.named_entities;
        if (ne && typeof ne === "object") {
          for (const [catRaw, items] of Object.entries(ne as Record<string, unknown>)) {
            if (!Array.isArray(items)) continue;
            const category = normCat(String(catRaw || "MISC"));
            for (const v of items) {
              const name = String(v || "").trim();
              if (!name) continue;
              const id = entId(category, name);
              addToken({ id, name, type: "entity", category });
              addMention(id, convoId);
              convoTokens.add(id);
            }
          }
        }
      }

      // Update co-occurrence counts by shared conversations.
      const ids = [...convoTokens];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i];
          const b = ids[j];
          const mapA = coocByToken.get(a) || new Map<string, number>();
          mapA.set(b, (mapA.get(b) || 0) + 1);
          coocByToken.set(a, mapA);
          const mapB = coocByToken.get(b) || new Map<string, number>();
          mapB.set(a, (mapB.get(a) || 0) + 1);
          coocByToken.set(b, mapB);
        }
      }
    }

    // Finalize unique convo counts
    for (const [id, s] of convosByToken.entries()) {
      const tok = tokenById.get(id);
      if (tok) tok.uniqueConversations = s.size;
    }

    const tokens = [...tokenById.values()].sort((a, b) => b.mentions - a.mentions);

    const getTopRelated = (tokenId: string, limit = 12): RelatedToken[] => {
      const m = coocByToken.get(tokenId);
      if (!m) return [];
      return [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, score]) => ({ id, score }));
    };

    return {
      tokens,
      tokenById,
      getTopRelated,
      coocByToken,
      convosByToken,
    };
  }, [enriched]);
}

