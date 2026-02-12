import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileSelector, safeRenderContent } from "@/components/import/preview/shared";
import apiClient from "@/services/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/components/import/preview/shared/content/MessageContent";
import { CountryTagMap } from "@/pages/Lite/components/CountryTagMap";
import { useTokenIndex, type Token } from "@/pages/Lite/hooks/useTokenIndex";
import { ForceGalaxyMap } from "@/pages/Lite/maps/ForceGalaxyMap";
import { DEFAULT_SETTINGS, type MapsLabSettings } from "@/pages/Lite/mapsLab/settings";
import { ForceLayoutHotKnobs } from "@/pages/Lite/mapsLab/tuning/ForceLayoutHotKnobs";
import { ForceType3Tuning } from "@/pages/Lite/mapsLab/tuning/ForceType3Tuning";
import { ForceAdvancedTuning } from "@/pages/Lite/mapsLab/tuning/ForceAdvancedTuning";
import { Info } from "lucide-react";

type TagCount = { name: string; count: number };
type EntityCount = { name: string; count: number; category?: string; categoryCounts?: Record<string, number> };
type Selected =
  | { kind: "keyword"; value: string }
  | { kind: "ner"; value: string; category?: string }
  | { kind: "nerCategory"; category: string }
  | null;
type SortMode = "matches" | "newest" | "oldest";
type MatchedConvo = { convo: any; matches: number; literalMatches?: number; semanticMatches?: number };

function buildTagCounts(enriched: any[] | null): TagCount[] {
  if (!Array.isArray(enriched)) return [];
  const counts = new Map<string, number>();
  for (const convo of enriched) {
    for (const msg of convo?.messages || []) {
      const tags: string[] = Array.isArray(msg?.tags) ? msg.tags : [];
      for (const t of tags) {
        const tag = String(t || "").trim();
        if (!tag) continue;
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function buildEntityCounts(enriched: any[] | null): EntityCount[] {
  if (!Array.isArray(enriched)) return [];
  const counts = new Map<string, number>();
  const byCat = new Map<string, Record<string, number>>();

  for (const convo of enriched) {
    for (const msg of convo?.messages || []) {
      const ne = msg?.named_entities;
      if (!ne || typeof ne !== "object") continue;
      for (const [cat, items] of Object.entries(ne as Record<string, unknown>)) {
        if (!Array.isArray(items)) continue;
        for (const raw of items) {
          const ent = String(raw || "").trim();
          if (!ent) continue;
          counts.set(ent, (counts.get(ent) || 0) + 1);
          const rec = byCat.get(ent) || {};
          rec[String(cat)] = (rec[String(cat)] || 0) + 1;
          byCat.set(ent, rec);
        }
      }
    }
  }

  const out: EntityCount[] = [];
  for (const [name, count] of counts.entries()) {
    const rec = byCat.get(name) || {};
    const topCat = Object.entries(rec).sort((a, b) => b[1] - a[1])[0]?.[0];
    out.push({ name, count, category: topCat, categoryCounts: rec });
  }
  return out.sort((a, b) => b.count - a.count);
}

// Match the main app's tag-cloud scaling (see FacetTagCloudPanel), but smaller so we can fit more.
function scaleFont(freq: number, min = 10, max = 26) {
  const f = Math.log(1 + Math.max(0, freq));
  const norm = Math.min(1, f / Math.log(1 + 100));
  return Math.round(min + (max - min) * norm);
}

function normalizeTimestampMs(ts: any): number | null {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1_000_000_000_000) return Math.round(n * 1000);
  return Math.round(n);
}

function formatTs(ts: any): string | null {
  const ms = normalizeTimestampMs(ts);
  if (!ms) return null;
  try {
    return new Date(ms).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  } catch {
    return null;
  }
}

function getMonthKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isLiteralHit(content: any, term: string): boolean {
  if (!term) return false;
  const raw = safeRenderContent(content);
  if (typeof raw !== "string") return false;
  const normalized = raw.normalize("NFKD");
  return new RegExp(`(^|[^A-Za-z0-9_])${escapeRegExp(term)}(?=$|[^A-Za-z0-9_])`, "i").test(normalized);
}

function underlineDecorClasses(color?: string): string {
  switch (color) {
    case "emerald":
      return "decoration-emerald-400/80";
    case "sky":
      return "decoration-sky-400/80";
    case "violet":
      return "decoration-violet-400/80";
    case "amber":
      return "decoration-amber-400/80";
    case "indigo":
      return "decoration-indigo-400/80";
    case "rose":
      return "decoration-rose-400/80";
    case "lime":
      return "decoration-lime-400/80";
    case "cyan":
      return "decoration-cyan-400/80";
    case "fuchsia":
      return "decoration-fuchsia-400/80";
    case "yellow":
      return "decoration-yellow-400/80";
    default:
      return "decoration-slate-400/60";
  }
}

function nerTone(category?: string): string {
  switch (category) {
    case "PERSON":
      return "violet";
    case "ORG":
      return "emerald";
    case "GPE":
      return "sky";
    case "DATE":
      return "cyan";
    case "PRODUCT":
      return "indigo";
    case "EVENT":
      return "amber";
    case "MISC":
    default:
      return "slate";
  }
}

function entityChipClasses(category?: string): string {
  switch (category) {
    case "PERSON":
      return "bg-violet-900/30 border-violet-600/60 text-violet-200 hover:bg-violet-900/50";
    case "ORG":
      return "bg-emerald-900/30 border-emerald-600/60 text-emerald-200 hover:bg-emerald-900/50";
    case "GPE":
      return "bg-sky-900/30 border-sky-600/60 text-sky-200 hover:bg-sky-900/50";
    case "DATE":
      return "bg-cyan-900/30 border-cyan-600/60 text-cyan-200 hover:bg-cyan-900/50";
    case "PRODUCT":
      return "bg-indigo-900/30 border-indigo-600/60 text-indigo-200 hover:bg-indigo-900/50";
    case "EVENT":
      return "bg-amber-900/30 border-amber-600/60 text-amber-200 hover:bg-amber-900/50";
    default:
      return "bg-slate-800/40 border-slate-600/60 text-slate-200 hover:bg-slate-800/60";
  }
}

function buildTagColorMap(tags: string[]) {
  const palette = ["rose", "lime", "yellow", "fuchsia", "emerald", "indigo", "sky", "amber", "cyan", "violet"];
  const tagColorMap: Record<string, string> = {};
  for (const t of tags) {
    let hash = 0;
    for (let i = 0; i < t.length; i++) hash = (hash * 31 + t.charCodeAt(i)) >>> 0;
    tagColorMap[t] = palette[(hash + 3) % palette.length];
  }
  return tagColorMap;
}

type ExplorerMode = "normal" | "test";

export default function TagCloudLitePage({ mode = "normal" }: { mode?: ExplorerMode }) {
  const navigate = useNavigate();
  const [selectedEnrichedFile, setSelectedEnrichedFile] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Selected>(null);
  const [openAccordion, setOpenAccordion] = useState<string>("");
  const [matchCursorByConvo, setMatchCursorByConvo] = useState<Record<string, number>>({});
  const [flash, setFlash] = useState<{ convoId: string; msgIndex: number; nonce: number } | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("matches");
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [literalOnly, setLiteralOnly] = useState(false);
  const [nerCategoryFilter, setNerCategoryFilter] = useState<string | null>(null);
  // Maps Lab settings (shared): drive Force Type 3 in Data Explorer too.
  const MAPS_SETTINGS_KEY = "liaraLite.mapsLab.settings";
  const [mapsSettings, setMapsSettings] = useState<MapsLabSettings>(DEFAULT_SETTINGS);
  const [mapsDraft, setMapsDraft] = useState<MapsLabSettings>(DEFAULT_SETTINGS);
  const [mapsTuningOpen, setMapsTuningOpen] = useState(false);
  const LITE_LAST_ENRICHED_FILE_KEY = "liaraLite.selectedEnrichedFile";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get("file");
    if (f) {
      setSelectedEnrichedFile(f);
      return;
    }
    try {
      const saved = window.localStorage.getItem(LITE_LAST_ENRICHED_FILE_KEY);
      if (saved) setSelectedEnrichedFile(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MAPS_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setMapsSettings({ ...DEFAULT_SETTINGS, ...(parsed || {}) });
      } else {
        setMapsSettings(DEFAULT_SETTINGS);
      }
    } catch {
      setMapsSettings(DEFAULT_SETTINGS);
    }
  }, []);

  useEffect(() => {
    setMapsDraft(mapsSettings);
  }, [mapsSettings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MAPS_SETTINGS_KEY, JSON.stringify(mapsSettings));
    } catch {
      // ignore
    }
  }, [mapsSettings]);

  const updateMapsDraft = <K extends keyof MapsLabSettings>(key: K, value: MapsLabSettings[K]) => {
    setMapsDraft((s) => ({ ...s, [key]: value }));
  };
  const commitMapsSetting = <K extends keyof MapsLabSettings>(key: K, value: MapsLabSettings[K]) => {
    setMapsSettings((s) => ({ ...s, [key]: value }));
  };
  const commitMapsFromDraft = <K extends keyof MapsLabSettings>(key: K) => {
    setMapsSettings((s) => ({ ...s, [key]: mapsDraft[key] }));
  };

  const tagCounts = useMemo(() => buildTagCounts(enriched), [enriched]);
  const entityCounts = useMemo(() => buildEntityCounts(enriched), [enriched]);
  const { tokens: indexTokens, tokenById, coocByToken } = useTokenIndex(enriched);

  const clampNum = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const rankByMentions = useMemo(() => {
    const arr = [...indexTokens].sort((a, b) => b.mentions - a.mentions);
    const m = new Map<string, number>();
    for (let i = 0; i < arr.length; i++) m.set(arr[i].id, i + 1);
    return m;
  }, [indexTokens]);

  const rankByConvos = useMemo(() => {
    const arr = [...indexTokens].sort((a, b) => b.uniqueConversations - a.uniqueConversations);
    const m = new Map<string, number>();
    for (let i = 0; i < arr.length; i++) m.set(arr[i].id, i + 1);
    return m;
  }, [indexTokens]);

  const selectedTokenId = useMemo(() => {
    if (!selected) return null;
    if (selected.kind === "keyword") return `tag::${selected.value}`;
    if (selected.kind === "ner") {
      const catRaw = String(selected.category || "MISC");
      const cat = catRaw === "GPE" ? "LOC" : catRaw;
      return `entity::${cat}::${selected.value}`;
    }
    return null;
  }, [selected]);

  const selectedToken = useMemo(() => (selectedTokenId ? tokenById.get(selectedTokenId) || null : null), [selectedTokenId, tokenById]);

  const [forcePath, setForcePath] = useState<string[]>([]);
  useEffect(() => {
    // Keep breadcrumb path aligned to selection changes coming from outside the map (cloud clicks).
    if (!selectedTokenId) return;
    setForcePath((path) => {
      if (path.length === 0) return [selectedTokenId];
      const cur = path[path.length - 1];
      if (cur === selectedTokenId) return path;
      const existingIdx = path.indexOf(selectedTokenId);
      if (existingIdx >= 0) return path.slice(0, existingIdx + 1);
      return [...path, selectedTokenId];
    });
  }, [selectedTokenId]);

  const forceVisitedIds = useMemo(() => {
    const k = clampNum(mapsSettings.forceVisitedK || 10, 0, 50);
    const ids = forcePath.slice(0, -1);
    return ids.slice(Math.max(0, ids.length - k));
  }, [forcePath, mapsSettings.forceVisitedK]);

  const forceRankedTokens = useMemo(() => {
    // Data Explorer: allow ranking by mentions or convos, same as Maps Lab.
    if (mapsSettings.forceRankMode === "convos") return [...indexTokens].sort((a, b) => b.uniqueConversations - a.uniqueConversations);
    return indexTokens;
  }, [indexTokens, mapsSettings.forceRankMode]);

  const forceOverviewTokens = useMemo(() => {
    const n = clampNum(mapsSettings.forceOverviewTopN || 100, 20, 800);
    // Respect tokenMix for the overview too (keeps the map consistent with current "lens").
    const mix = mapsSettings.tokenMix;
    const filtered =
      mix === "tags" ? forceRankedTokens.filter((t) => t.type === "tag") : mix === "entities" ? forceRankedTokens.filter((t) => t.type === "entity") : forceRankedTokens;
    return filtered.slice(0, n);
  }, [forceRankedTokens, mapsSettings.forceOverviewTopN, mapsSettings.tokenMix]);

  const forceModel = useMemo(() => {
    const centerId = selectedTokenId;
    const overview = forceOverviewTokens;
    const overviewIds = new Set<string>(overview.map((t) => t.id));
    const visitedIds = new Set<string>(forceVisitedIds);

    if (!centerId) {
      return {
        nodes: overview,
        edges: [] as Array<{
          source: string;
          target: string;
          kind: "defining" | "contextual" | "structural";
          score: number;
          sharedConvos: number;
          globalMentions: number;
          contextTags: string[];
        }>,
        overviewIds,
        neighborIds: new Set<string>(),
        visitedIds,
      };
    }

    const cooc = coocByToken.get(centerId) || new Map<string, number>();
    const powerFor = (sharedConvos: number, globalMentions: number) => sharedConvos / Math.log(1 + Math.max(1, globalMentions || 1));

    const topContextTagsFor = (targetId: string, limit = 3) => {
      const a = coocByToken.get(centerId) || new Map<string, number>();
      const b = coocByToken.get(targetId) || new Map<string, number>();
      const scored: Array<{ id: string; s: number }> = [];
      for (const [otherId, c1] of a.entries()) {
        if (otherId === centerId) continue;
        if (otherId === targetId) continue;
        const c2 = b.get(otherId);
        if (!c2) continue;
        scored.push({ id: otherId, s: Math.min(c1, c2) });
      }
      scored.sort((x, y) => y.s - x.s);
      const names: string[] = [];
      for (const it of scored) {
        const t = tokenById.get(it.id);
        if (!t) continue;
        names.push(t.name);
        if (names.length >= limit) break;
      }
      return names;
    };

    const candidates: Array<{ id: string; tok: Token; cooc: number }> = [];
    for (const [id, c] of cooc.entries()) {
      const tok = tokenById.get(id);
      if (!tok) continue;
      if (mapsSettings.tokenMix === "tags" && tok.type !== "tag") continue;
      if (mapsSettings.tokenMix === "entities" && tok.type !== "entity") continue;
      candidates.push({ id, tok, cooc: c });
    }

    const takeTop = (arr: Array<{ id: string; score: number }>, limit: number) =>
      arr.sort((a, b) => b.score - a.score).slice(0, Math.max(0, limit));

    const definingLimit = clampNum(mapsSettings.forceDefiningCount || 0, 0, 80);
    const defining = mapsSettings.forceShowDefining
      ? takeTop(
          candidates.map((c) => ({ id: c.id, score: c.cooc / Math.log(1 + Math.max(1, c.tok.mentions)) })),
          definingLimit
        )
      : [];

    const contextualLimit = clampNum(mapsSettings.forceContextualCount || 0, 0, 120);
    const contextual = mapsSettings.forceShowContextual
      ? takeTop(
          candidates.map((c) => ({ id: c.id, score: c.cooc })),
          contextualLimit
        )
      : [];

    const perCat = clampNum(mapsSettings.forceStructuralPerCatCount || 0, 0, 30);
    const tagsN = clampNum(mapsSettings.forceStructuralTagsCount || 0, 0, 80);
    const cats: Array<{ key: string; enabled: boolean }> = [
      { key: "ORG", enabled: Boolean(mapsSettings.forceStructORG) },
      { key: "PERSON", enabled: Boolean(mapsSettings.forceStructPERSON) },
      { key: "LOC", enabled: Boolean(mapsSettings.forceStructLOC) },
      { key: "PRODUCT", enabled: Boolean(mapsSettings.forceStructPRODUCT) },
      { key: "DATE", enabled: Boolean(mapsSettings.forceStructDATE) },
    ];
    const structural: Array<{ id: string; score: number }> = [];
    if (mapsSettings.forceShowStructural) {
      for (const { key, enabled } of cats) {
        if (!enabled) continue;
        const items = takeTop(
          candidates.filter((c) => c.tok.type === "entity" && String(c.tok.category || "") === key).map((c) => ({ id: c.id, score: c.cooc })),
          perCat
        );
        structural.push(...items);
      }
      structural.push(
        ...takeTop(
          candidates.filter((c) => c.tok.type === "tag").map((c) => ({ id: c.id, score: c.cooc })),
          tagsN
        )
      );
    }

    const kindById = new Map<string, { kind: "defining" | "contextual" | "structural"; score: number }>();
    for (const d of contextual) kindById.set(d.id, { kind: "contextual", score: d.score });
    for (const s of structural) kindById.set(s.id, { kind: "structural", score: s.score });
    for (const d of defining) kindById.set(d.id, { kind: "defining", score: d.score });

    const focusN = clampNum(mapsSettings.forceFocusTotalN || 72, 12, 220);
    if (kindById.size < focusN) {
      const extras = takeTop(
        candidates
          .map((c) => ({ id: c.id, score: c.cooc / Math.log(2 + Math.max(1, c.tok.mentions) * 0.35) }))
          .filter((x) => !kindById.has(x.id) && x.id !== centerId),
        focusN - kindById.size
      );
      for (const x of extras) kindById.set(x.id, { kind: "contextual", score: x.score });
    }
    if (kindById.size > focusN) {
      const keep = new Map<string, { kind: "defining" | "contextual" | "structural"; score: number }>();
      for (const [id, v] of kindById.entries()) if (v.kind !== "contextual") keep.set(id, v);
      const remaining = focusN - keep.size;
      if (remaining > 0) {
        const ctx = [...kindById.entries()]
          .filter(([, v]) => v.kind === "contextual")
          .map(([id, v]) => ({ id, score: v.score }))
          .sort((a, b) => b.score - a.score)
          .slice(0, remaining);
        for (const x of ctx) keep.set(x.id, { kind: "contextual", score: x.score });
      }
      kindById.clear();
      for (const [id, v] of keep.entries()) kindById.set(id, v);
    }

    const neighborIds = new Set<string>([...kindById.keys()]);
    neighborIds.delete(centerId);

    const edges = [...kindById.entries()]
      .filter(([id]) => id !== centerId)
      .map(([id, v]) => {
        const tok = tokenById.get(id);
        const sharedConvos = cooc.get(id) || 0;
        const globalMentions = tok?.mentions || 0;
        return {
          source: centerId,
          target: id,
          kind: v.kind,
          score: powerFor(sharedConvos, globalMentions),
          sharedConvos,
          globalMentions,
          contextTags: topContextTagsFor(id, 3),
        };
      });

    const nodesById = new Map<string, Token>();
    for (const t of overview) nodesById.set(t.id, t);
    const centerTok = tokenById.get(centerId);
    if (centerTok) nodesById.set(centerTok.id, centerTok);
    for (const id of neighborIds) {
      const t = tokenById.get(id);
      if (t) nodesById.set(id, t);
    }
    for (const id of visitedIds) {
      const t = tokenById.get(id);
      if (t) nodesById.set(id, t);
    }

    return { nodes: [...nodesById.values()], edges, overviewIds, neighborIds, visitedIds };
  }, [
    coocByToken,
    forceOverviewTokens,
    forceVisitedIds,
    mapsSettings.forceContextualCount,
    mapsSettings.forceDefiningCount,
    mapsSettings.forceFocusTotalN,
    mapsSettings.forceOverviewTopN,
    mapsSettings.forceRankMode,
    mapsSettings.forceShowContextual,
    mapsSettings.forceShowDefining,
    mapsSettings.forceShowStructural,
    mapsSettings.forceStructDATE,
    mapsSettings.forceStructLOC,
    mapsSettings.forceStructORG,
    mapsSettings.forceStructPERSON,
    mapsSettings.forceStructPRODUCT,
    mapsSettings.forceStructuralPerCatCount,
    mapsSettings.forceStructuralTagsCount,
    mapsSettings.forceStructDATE,
    mapsSettings.forceVisitedK,
    mapsSettings.tokenMix,
    selectedTokenId,
    tokenById,
  ]);

  const forceNeighborCounts = useMemo(() => {
    const out = { defining: 0, contextual: 0, structural: 0 };
    if (!selectedTokenId) return out;
    for (const e of forceModel.edges as any[]) {
      if (e.source !== selectedTokenId) continue;
      if (e.kind === "defining") out.defining += 1;
      else if (e.kind === "structural") out.structural += 1;
      else out.contextual += 1;
    }
    return out;
  }, [forceModel.edges, selectedTokenId]);

  const topRelatedNames = useMemo(() => {
    if (!selectedTokenId) return [];
    const m = coocByToken.get(selectedTokenId);
    if (!m) return [];
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([id]) => tokenById.get(id)?.name)
      .filter(Boolean) as string[];
  }, [coocByToken, selectedTokenId, tokenById]);

  const onSelectForceTokenId = (id: string) => {
    const t = tokenById.get(id) || null;
    if (!t) return;
    if (t.type === "tag") setSelected({ kind: "keyword", value: t.name });
    else setSelected({ kind: "ner", value: t.name, category: t.category });
  };

  const nerCategoryStats = useMemo(() => {
    if (!Array.isArray(enriched)) return [];
    const mentionCounts = new Map<string, number>();
    const entitiesByCat = new Map<string, Set<string>>();
    for (const convo of enriched) {
      for (const msg of convo?.messages || []) {
        const ne = msg?.named_entities;
        if (!ne || typeof ne !== "object") continue;
        for (const [cat, items] of Object.entries(ne as Record<string, unknown>)) {
          if (!Array.isArray(items) || items.length === 0) continue;
          const c = String(cat || "MISC");
          mentionCounts.set(c, (mentionCounts.get(c) || 0) + items.length);
          const s = entitiesByCat.get(c) || new Set<string>();
          for (const raw of items) {
            const ent = String(raw || "").trim();
            if (!ent) continue;
            s.add(ent);
          }
          entitiesByCat.set(c, s);
        }
      }
    }
    const out = [...mentionCounts.entries()].map(([category, mentions]) => ({
      category,
      mentions,
      entities: entitiesByCat.get(category)?.size || 0,
    }));
    out.sort((a, b) => b.mentions - a.mentions);
    return out;
  }, [enriched]);

  const loadEnriched = async (fileName: string) => {
    setIsLoading(true);
    setSelected(null);
    setOpenAccordion("");
    setMatchCursorByConvo({});
    setMonthFilter(null);
    setTimelineOpen(false);
    setLiteralOnly(false);
    setNerCategoryFilter(null);
    try {
      const { data } = await apiClient.get("/lite/file-content", {
        params: { fileName, from: "enriched" },
      });
      setEnriched(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load whenever selection changes, and persist selection so it "sticks" across pages.
  useEffect(() => {
    if (!selectedEnrichedFile) return;
    try {
      window.localStorage.setItem(LITE_LAST_ENRICHED_FILE_KEY, selectedEnrichedFile);
    } catch {
      // ignore
    }
    loadEnriched(selectedEnrichedFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnrichedFile]);

  const openInPreview = () => {
    if (!selectedEnrichedFile) return;
    navigate(`/?open=enriched&file=${encodeURIComponent(selectedEnrichedFile)}`);
  };

  const messageRefs = React.useRef<Record<string, Record<number, HTMLDivElement | null>>>({});
  // Transient "semantic" hint timers (mirrors useTagHighlight behavior)
  const semanticTimers = React.useRef<WeakMap<HTMLElement, { fade: number; remove: number }>>(new WeakMap());

  const getMatchMessageIndices = (convo: any): number[] => {
    if (!selected) return [];
    const out: number[] = [];
    const msgs = convo?.messages || [];
    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i];
      if (selected.kind === "keyword") {
        const tags: string[] = Array.isArray(msg?.tags) ? msg.tags : [];
        if (!tags.includes(selected.value)) continue;
        if (literalOnly && !isLiteralHit(msg?.content, selected.value)) continue;
        out.push(i);
      } else if (selected.kind === "ner") {
        const ne = msg?.named_entities;
        if (!ne || typeof ne !== "object") continue;
        const cat = selected.category;
        if (cat) {
          const items = (ne as any)?.[cat] as unknown;
          if (Array.isArray(items) && items.map((v) => String(v)).includes(selected.value)) out.push(i);
        } else {
          for (const arr of Object.values(ne as Record<string, unknown>)) {
            if (!Array.isArray(arr)) continue;
            if (arr.map((v) => String(v)).includes(selected.value)) {
              out.push(i);
              break;
            }
          }
        }
      } else if (selected.kind === "nerCategory") {
        const ne = msg?.named_entities;
        if (!ne || typeof ne !== "object") continue;
        const items = (ne as any)?.[selected.category] as unknown;
        if (Array.isArray(items) && items.length > 0) out.push(i);
      }
    }
    return out;
  };

  const scrollToMessageWithRetry = (convoId: string, msgIndex: number, tries = 0) => {
    const el = messageRefs.current?.[convoId]?.[msgIndex];
    if (el) {
      const container = el.closest(".messages-scroll-container") as HTMLElement | null;
      if (container) {
        const cRect = container.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();
        const absoluteTop = (eRect.top - cRect.top) + container.scrollTop;
        const targetTop = Math.max(0, absoluteTop - container.clientHeight / 2);
        container.scrollTo({ top: targetTop, behavior: "smooth" });
      } else {
        // Fallback: should be rare, but keeps behavior reasonable
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (tries >= 6) return;
    setTimeout(() => scrollToMessageWithRetry(convoId, msgIndex, tries + 1), 80);
  };

  const triggerFlash = (convoId: string, msgIndex: number) => {
    const nonce = Date.now();
    setFlash({ convoId, msgIndex, nonce });
    setTimeout(() => {
      setFlash((prev) => (prev?.nonce === nonce ? null : prev));
    }, 5000);
  };

  const maybeShowSemanticHint = (messageEl: HTMLElement, msg: any) => {
    if (!selected) return;
    try {
      const raw = safeRenderContent(msg?.content);
      const normalized = typeof raw === "string" ? raw.normalize("NFKD") : "";
      const term = selected.value;
      const isLiteral =
        typeof raw === "string" &&
        new RegExp(`(^|[^A-Za-z0-9_])${escapeRegExp(term)}(?=$|[^A-Za-z0-9_])`, "i").test(normalized);

      // If an inline highlight exists already, don't show the fallback badge.
      const lower = String(term || "").toLowerCase();
      const hasInlineHighlight = !!Array.from(messageEl.querySelectorAll("span")).find(
        (el: Element) => el.textContent?.toLowerCase() === lower && el.className.includes("relative group")
      );
      if (hasInlineHighlight || isLiteral) return;

      const headerLabel = messageEl.querySelector("div.mb-2 p");
      const attachTarget = (headerLabel?.parentElement as HTMLElement | null) || messageEl;
      let hint = attachTarget.querySelector(".liara-semantic-hint") as HTMLElement | null;
      if (!hint) {
        hint = document.createElement("span");
        hint.textContent = selected.kind === "ner" ? "close match" : "semantic";
        hint.className =
          "liara-semantic-hint ml-2 align-middle inline-block text-[11px] px-2 py-0.5 rounded border bg-yellow-900/30 border-yellow-600/40 text-yellow-200 opacity-0 transition-opacity duration-300";
        attachTarget.appendChild(hint);
      }

      const timers = semanticTimers.current.get(attachTarget);
      if (timers) {
        clearTimeout(timers.fade);
        clearTimeout(timers.remove);
      }
      requestAnimationFrame(() => {
        if (hint) hint.style.opacity = "1";
      });
      const fade = window.setTimeout(() => {
        if (hint) hint.style.opacity = "0";
      }, 1800);
      const remove = window.setTimeout(() => {
        if (hint && hint.parentElement) hint.parentElement.removeChild(hint);
      }, 2200);
      semanticTimers.current.set(attachTarget, { fade, remove });
    } catch {
      // ignore
    }
  };

  const jumpBy = (convoId: string, matchIndices: number[], delta: number) => {
    if (matchIndices.length === 0) return;
    setMatchCursorByConvo((prev) => {
      const current = prev[convoId] ?? -1;
      const next = ((current + delta) % matchIndices.length + matchIndices.length) % matchIndices.length;
      const msgIndex = matchIndices[next];
      triggerFlash(convoId, msgIndex);
      setTimeout(() => {
        scrollToMessageWithRetry(convoId, msgIndex);
        const el = messageRefs.current?.[convoId]?.[msgIndex] as unknown as HTMLElement | null;
        const convo = Array.isArray(enriched) ? enriched.find((c: any) => String(c?.id) === String(convoId)) : null;
        const msg = convo?.messages?.[msgIndex];
        if (el && msg) maybeShowSemanticHint(el, msg);
      }, 0);
      return { ...prev, [convoId]: next };
    });
  };

  const jumpToNextMatchInConversation = (convoId: string, matchIndices: number[]) => jumpBy(convoId, matchIndices, 1);
  const jumpToPrevMatchInConversation = (convoId: string, matchIndices: number[]) => jumpBy(convoId, matchIndices, -1);

  const matchedConversations = useMemo(() => {
    if (!selected || !Array.isArray(enriched)) return [];
    const out: MatchedConvo[] = [];
    for (const convo of enriched) {
      let matches = 0;
      let literalMatches = 0;
      for (const msg of convo?.messages || []) {
        if (selected.kind === "keyword") {
          const tags: string[] = Array.isArray(msg?.tags) ? msg.tags : [];
          if (!tags.includes(selected.value)) continue;
          const isLit = isLiteralHit(msg?.content, selected.value);
          if (literalOnly && !isLit) continue;
          matches += 1;
          if (isLit) literalMatches += 1;
        } else if (selected.kind === "ner") {
          const ne = msg?.named_entities;
          if (!ne || typeof ne !== "object") continue;
          const items = (ne as any)?.[selected.category || ""] as unknown;
          if (Array.isArray(items) && items.map((v) => String(v)).includes(selected.value)) matches += 1;
          if (!selected.category) {
            for (const arr of Object.values(ne as Record<string, unknown>)) {
              if (!Array.isArray(arr)) continue;
              if (arr.map((v) => String(v)).includes(selected.value)) {
                matches += 1;
                break;
              }
            }
          }
        } else if (selected.kind === "nerCategory") {
          const ne = msg?.named_entities;
          if (!ne || typeof ne !== "object") continue;
          const items = (ne as any)?.[selected.category] as unknown;
          if (Array.isArray(items) && items.length > 0) matches += 1;
        }
      }
      if (matches > 0) {
        if (selected.kind === "keyword") {
          out.push({ convo, matches, literalMatches, semanticMatches: matches - literalMatches });
        } else {
          out.push({ convo, matches });
        }
      }
    }

    const filtered = monthFilter
      ? out.filter(({ convo }) => {
          const ms = normalizeTimestampMs(convo?.update_time ?? convo?.create_time);
          if (!ms) return false;
          return getMonthKey(ms) === monthFilter;
        })
      : out;

    const sorted = [...filtered];
    if (sortMode === "matches") {
      sorted.sort((a, b) => b.matches - a.matches);
    } else {
      sorted.sort((a, b) => {
        const ams = normalizeTimestampMs(a.convo?.update_time ?? a.convo?.create_time) || 0;
        const bms = normalizeTimestampMs(b.convo?.update_time ?? b.convo?.create_time) || 0;
        return sortMode === "newest" ? bms - ams : ams - bms;
      });
    }

    return sorted;
  }, [enriched, selected, monthFilter, sortMode]);

  useEffect(() => {
    // Literal-only is only meaningful for keyword tags.
    if (selected?.kind !== "keyword") setLiteralOnly(false);
  }, [selected]);

  useEffect(() => {
    // If the user filters by a month, ensure the timeline is visible so it's clear what's happening.
    if (monthFilter) setTimelineOpen(true);
  }, [monthFilter]);

  const matchTimeline = useMemo(() => {
    if (!selected || matchedConversations.length === 0) return [];
    const byMonth = new Map<string, { month: string; convos: number; matches: number }>();
    for (const { convo, matches } of matchedConversations) {
      const ms = normalizeTimestampMs(convo?.update_time ?? convo?.create_time);
      if (!ms) continue;
      const key = getMonthKey(ms);
      const rec = byMonth.get(key) || { month: key, convos: 0, matches: 0 };
      rec.convos += 1;
      rec.matches += matches;
      byMonth.set(key, rec);
    }
    return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [matchedConversations, selected]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 space-y-4">
        {mode === "test" && (
          <div className="rounded-lg border border-rose-600/50 bg-rose-950/30 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-rose-200">TEST PAGE — EXPERIMENTAL</div>
                <div className="text-xs text-rose-200/80 mt-1">
                  This is a sandbox for trying date-focused UX. Changes here may be unstable or incomplete.
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === "test" && tagCounts.length > 0 && (
          <Card className="border-slate-800 bg-slate-900/40 w-full">
            <CardHeader>
              <CardTitle className="text-slate-100">Country Tag Map (TEST)</CardTitle>
              <CardDescription>
                Experimental “countries” layout. Each cell is a tag; cell area scales with hit count. Click a cell to browse matching conversations below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CountryTagMap
                tags={tagCounts.slice(0, 70).map((t) => ({ name: t.name, value: t.count }))}
                height={360}
                className="rounded-lg border border-slate-800 bg-slate-950/20"
                onSelect={(name) => {
                  setSelected({ kind: "keyword", value: name });
                  setNerCategoryFilter(null);
                  setMonthFilter(null);
                  setOpenAccordion("");
                  setMatchCursorByConvo({});
                  // Nudge user to results after selection
                  setTimeout(() => {
                    document.getElementById("matching-conversations")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 0);
                }}
              />
            </CardContent>
          </Card>
        )}
        <header className="rounded-lg border border-slate-800 bg-slate-900/35 px-3 py-2">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <h1 className="text-lg md:text-xl font-bold leading-none">
                Data Explorer{mode === "test" ? " (TEST)" : ""}
              </h1>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-slate-100">
                    <Info className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[360px] bg-slate-950/95 border-slate-800 text-slate-200">
                  <div className="text-sm font-semibold">What this is</div>
                  <div className="mt-2 text-xs text-slate-300 space-y-2">
                    <div>
                      Pick an <span className="font-mono text-slate-100">enriched-data-*.json</span> (or import a JSON source), then click a tag/entity to browse matching conversations.
                    </div>
                    <div>
                      The map is a “Type 3” explainer: center = selected token; rings show defining/contextual/structural neighbors. Tuning here is shared with Maps Lab.
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 min-w-0">
              <FileSelector
                selectedFile={selectedEnrichedFile}
                onFileSelect={(filename, type) => {
                  if (type === "source") {
                    // Unified selector can pick a local JSON file; route user to Import to process it.
                    navigate("/");
                    return;
                  }
                  if (type !== "enriched") return;
                  setSelectedEnrichedFile(filename);
                }}
                disabled={isLoading}
                placeholder="Select enriched file…"
                showNewOption={true}
                compact={true}
                showStorageHint={false}
                allowedTypes={["enriched"]}
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
              <Button disabled={!selectedEnrichedFile || isLoading} className="h-8">
                {isLoading ? "Loading..." : "Loaded"}
              </Button>
              <Button onClick={openInPreview} disabled={!selectedEnrichedFile} variant="outline" className="h-8">
                Open in Preview
              </Button>

              <span className="hidden lg:inline-block w-px h-6 bg-slate-800 mx-1" />

              <Button asChild variant="outline" size="sm">
                <Link to="/">Import</Link>
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">About</Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-slate-950 text-slate-100 border-slate-800 w-[520px] sm:max-w-[520px]">
                  <SheetHeader>
                    <SheetTitle className="text-slate-100">About Data Explorer</SheetTitle>
                    <SheetDescription className="text-slate-400">
                      How the pipeline works and what this page reads.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 space-y-4 text-sm overflow-y-auto max-h-[calc(100vh-140px)] pr-2">
                    <div>
                      <div className="font-semibold text-slate-200">What happens to a conversation file</div>
                      <ul className="mt-2 text-slate-300 text-sm list-disc pl-5 space-y-1">
                        <li><span className="font-semibold text-slate-200">Source JSON</span>: your raw conversation export.</li>
                        <li><span className="font-semibold text-slate-200">Preprocessed</span>: normalized structure (messages, timestamps, speakers, etc.).</li>
                        <li><span className="font-semibold text-slate-200">Enriched</span>: adds analysis fields per message (tags + named entities).</li>
                      </ul>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-200">What Data Explorer reads</div>
                      <div className="mt-2 text-slate-300 space-y-2">
                        <div>
                          When you select an <span className="font-mono text-slate-100">enriched-data-*.json</span>, we fetch the file content and read:
                        </div>
                        <ul className="list-disc pl-5 space-y-1">
                          <li><span className="font-mono text-slate-100">messages[].content</span> (for display/search + literal highlighting)</li>
                          <li><span className="font-mono text-slate-100">messages[].tags</span> (AI tags; can be literal or semantic)</li>
                          <li><span className="font-mono text-slate-100">messages[].named_entities</span> (NER grouped by category: PERSON/ORG/LOC/DATE/etc.)</li>
                        </ul>
                        <div className="text-xs text-slate-500">
                          Note: “Literal only” filters tag hits to only those where the word actually appears in message text.
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-200">How matching works</div>
                      <div className="mt-2 text-slate-300">
                        Selecting a tag/entity filters conversations by scanning their messages for the selected token (and optionally literal-only for tags). The
                        “Prev/Next” controls jump between matched messages inside a conversation without scrolling the whole page.
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-200">How the map works</div>
                      <div className="mt-2 text-slate-300 space-y-2">
                        <div>
                          The Entity Explorer map builds a token index in the browser from the currently loaded enriched file. It computes co-occurrence links and
                          shows a focused “Type 3” explainer around the selected center token.
                        </div>
                        <ul className="list-disc pl-5 space-y-1">
                          <li><span className="font-semibold text-slate-200">Defining</span>: strongest “what this is” neighbors</li>
                          <li><span className="font-semibold text-slate-200">Contextual</span>: “often involved with” neighbors</li>
                          <li><span className="font-semibold text-slate-200">Structural</span>: entities/time/place and other structural context</li>
                        </ul>
                        <div className="text-xs text-slate-500">
                          Tuning is shared with Maps Lab and saved locally (so your knobs persist).
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Button asChild variant="outline" size="sm">
                <Link to={selectedEnrichedFile ? `/maps-lab?file=${encodeURIComponent(selectedEnrichedFile)}` : "/maps-lab"}>
                  Maps Lab
                </Link>
              </Button>
              {mode !== "test" ? (
                <Button asChild variant="outline" size="sm">
                  <Link to={selectedEnrichedFile ? `/date-explorer-test?file=${encodeURIComponent(selectedEnrichedFile)}` : "/date-explorer-test"}>
                    Date Explorer (TEST)
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link to={selectedEnrichedFile ? `/data-explorer?file=${encodeURIComponent(selectedEnrichedFile)}` : "/data-explorer"}>
                    Data Explorer
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        <Card className="border-slate-800 bg-slate-900/40 overflow-hidden">
          <CardHeader className="py-2 px-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-slate-100 text-base">Entity Explorer (Type 3)</CardTitle>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-slate-400 font-semibold">Nodes</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "hsl(268 80% 55%)" }} />
                      <span className="text-slate-300">Tag</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "hsl(215 20% 55%)" }} />
                      <span className="text-slate-300">Entity</span>
                    </span>
                    <span className="text-slate-500">• outline = entity category</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <span className="text-slate-400 font-semibold">Edges</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-[2px] w-5 rounded" style={{ background: "rgba(56,189,248,0.9)" }} />
                      <span className="text-slate-300">Defining</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-[2px] w-5 rounded" style={{ background: "rgba(148,163,184,0.7)" }} />
                      <span className="text-slate-300">Contextual</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-[2px] w-5 rounded"
                        style={{ background: "linear-gradient(90deg, rgba(251,191,36,0.9) 0 50%, transparent 50% 100%)", backgroundSize: "8px 2px" }}
                      />
                      <span className="text-slate-300">Structural</span>
                    </span>
                    <span className="text-slate-500">• size ≈ mentions</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setMapsTuningOpen((v) => !v)}>
                  {mapsTuningOpen ? "Hide tuning" : "Tuning"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0 overflow-hidden">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-3 min-w-0">
              <div className="min-h-0 min-w-0 overflow-hidden">
                <ForceGalaxyMap
                  tokens={forceModel.nodes}
                  selectedId={selectedTokenId}
                  edges={forceModel.edges}
                  overviewIds={forceModel.overviewIds}
                  neighborIds={forceModel.neighborIds}
                  visitedIds={forceModel.visitedIds}
                  onSelect={onSelectForceTokenId}
                  // Data Explorer: keep the viz a bit thinner than Maps Lab to reclaim vertical space.
                  height={clampNum(Math.round((mapsSettings.forceHeight || 320) * 0.78), 200, 460)}
                  settings={mapsSettings}
                />
              </div>

              <div className="relative min-h-0 min-w-0">
                <Card
                  className={[
                    "border-slate-800 bg-slate-950/20 h-full overflow-hidden flex flex-col transition-opacity",
                    mapsTuningOpen ? "opacity-40 pointer-events-none select-none" : "",
                  ].join(" ")}
                >
                  <CardHeader className="py-2 px-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-slate-100 text-sm">Selected</CardTitle>
                        <CardDescription className="text-xs">
                          {selectedToken ? (
                            <span className="text-slate-300">
                              {selectedToken.type === "entity" ? `Entity (${selectedToken.category || "MISC"})` : "Tag"}:{" "}
                              <span className="font-semibold text-slate-100">{selectedToken.name}</span>
                            </span>
                          ) : (
                            "No center selected (overview)."
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={forcePath.length <= 1}
                          onClick={() => {
                            setForcePath((path) => {
                              if (path.length <= 1) return path;
                              const next = path.slice(0, -1);
                              const id = next[next.length - 1];
                              const t = tokenById.get(id) || null;
                              if (t) {
                                if (t.type === "tag") setSelected({ kind: "keyword", value: t.name });
                                else setSelected({ kind: "ner", value: t.name, category: t.category });
                              }
                              return next;
                            });
                          }}
                        >
                          Back
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setForcePath([]);
                            setSelected(null);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-3 pb-3 pt-0 flex-1 overflow-y-auto min-h-0">
                    {selectedToken ? (
                      <div className="text-xs text-slate-300 space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={
                              selectedToken.type === "tag"
                                ? "inline-flex items-center rounded px-2 py-0.5 text-[11px] border bg-purple-900/30 border-purple-600/40 text-purple-100"
                                : "inline-flex items-center rounded px-2 py-0.5 text-[11px] border bg-slate-900/40 border-slate-700/60 text-slate-200"
                            }
                          >
                            {selectedToken.type === "tag" ? "Tag" : "Entity"}
                          </span>
                          {selectedToken.type === "entity" && (
                            <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] border bg-sky-900/25 border-sky-600/40 text-sky-200">
                              {selectedToken.category || "MISC"}
                            </span>
                          )}
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] border bg-slate-900/25 border-slate-700/60 text-slate-200 font-mono">
                            {selectedToken.id}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          Neighbors:
                          <span className="ml-2 inline-flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center rounded px-2 py-0.5 border bg-sky-950/30 border-sky-700/50 text-sky-200 font-mono">
                              Def {forceNeighborCounts.defining}
                            </span>
                            <span className="inline-flex items-center rounded px-2 py-0.5 border bg-slate-900/40 border-slate-700/60 text-slate-200 font-mono">
                              Ctx {forceNeighborCounts.contextual}
                            </span>
                            <span className="inline-flex items-center rounded px-2 py-0.5 border bg-amber-950/25 border-amber-700/45 text-amber-200 font-mono">
                              Str {forceNeighborCounts.structural}
                            </span>
                          </span>
                          <div className="mt-1 text-slate-500">
                            Top N {clampNum(mapsSettings.forceOverviewTopN || 100, 20, 800)} • visited K{" "}
                            {clampNum(mapsSettings.forceVisitedK || 10, 0, 50)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded border border-slate-800 bg-slate-900/20 px-2 py-1">
                            <div className="text-slate-400">Mentions</div>
                            <div className="text-slate-100 font-semibold">
                              {selectedToken.mentions}{" "}
                              <span className="text-slate-500 font-mono">rank #{rankByMentions.get(selectedToken.id) || "—"}</span>
                            </div>
                          </div>
                          <div className="rounded border border-slate-800 bg-slate-900/20 px-2 py-1">
                            <div className="text-slate-400">Conversations</div>
                            <div className="text-slate-100 font-semibold">
                              {selectedToken.uniqueConversations}{" "}
                              <span className="text-slate-500 font-mono">rank #{rankByConvos.get(selectedToken.id) || "—"}</span>
                            </div>
                          </div>
                          <div className="col-span-2 rounded border border-slate-800 bg-slate-900/20 px-2 py-1">
                            <div className="text-slate-400">Top related</div>
                            <div className="text-slate-200 truncate" title={topRelatedNames.join(", ")}>
                              {topRelatedNames.length ? topRelatedNames.join(", ") : "—"}
                            </div>
                          </div>
                        </div>

                        {forcePath.length > 0 && (
                          <div className="text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-300 mr-2">Breadcrumb</span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {forcePath.slice(-12).map((id) => {
                                const t = tokenById.get(id);
                                const label = t ? t.name : id;
                                const isCurrent = id === selectedTokenId;
                                return (
                                  <button
                                    key={id}
                                    type="button"
                                    onClick={() => onSelectForceTokenId(id)}
                                    className={
                                      isCurrent
                                        ? "px-2 py-0.5 rounded border bg-rose-950/30 border-rose-600/50 text-rose-200 hover:bg-rose-900/25"
                                        : "px-2 py-0.5 rounded border bg-slate-900/30 border-slate-700/60 text-slate-200 hover:bg-slate-800/40"
                                    }
                                    title={id}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">
                        Tip: click a tag/entity in the clouds or click a bubble in the map.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {mapsTuningOpen && (
                  <div className="absolute inset-0 z-20">
                    <Card className="border-slate-700/70 bg-slate-950/70 backdrop-blur h-full overflow-hidden flex flex-col">
                      <CardHeader className="py-2 px-3 border-b border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-slate-100 text-sm">Tuning</CardTitle>
                            <CardDescription className="text-xs">
                              Force settings (shared with Maps Lab). Scroll to see all knobs.
                            </CardDescription>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setMapsTuningOpen(false)}>
                            Close
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-3 flex-1 overflow-y-auto min-h-0">
                        <div className="space-y-3">
                          <ForceLayoutHotKnobs
                            draft={mapsDraft}
                            inputClassName="h-6 w-[84px] rounded border bg-slate-900/30 border-slate-700/60 text-slate-100 text-xs px-2"
                            sliderProps={{ trackClassName: "h-1.5", thumbClassName: "h-4 w-4" }}
                            updateDraft={updateMapsDraft}
                            commitSetting={commitMapsSetting}
                            commitFromDraft={commitMapsFromDraft}
                          />
                          <ForceType3Tuning
                            draft={mapsDraft}
                            inputClassName="h-6 w-[84px] rounded border bg-slate-900/30 border-slate-700/60 text-slate-100 text-xs px-2"
                            sliderProps={{ trackClassName: "h-1.5", thumbClassName: "h-4 w-4" }}
                            updateDraft={updateMapsDraft}
                            commitSetting={commitMapsSetting}
                            commitFromDraft={commitMapsFromDraft}
                          />
                          <ForceAdvancedTuning
                            draft={mapsDraft}
                            inputClassName="h-6 w-[84px] rounded border bg-slate-900/30 border-slate-700/60 text-slate-100 text-xs px-2"
                            sliderProps={{ trackClassName: "h-1.5", thumbClassName: "h-4 w-4" }}
                            updateDraft={updateMapsDraft}
                            commitSetting={commitMapsSetting}
                            commitFromDraft={commitMapsFromDraft}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use page space: left = clouds, right = conversations */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
          <div className="order-2 lg:order-2">
            <Card id="matching-conversations" className="border-slate-800 bg-slate-900/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-slate-100">Matching Conversations</CardTitle>
                    <CardDescription>
                      {selected ? (
                        <>
                          Showing conversations for{" "}
                          {selected.kind === "keyword" ? (
                            <span className="font-medium text-sky-300">tag: {selected.value}</span>
                          ) : selected.kind === "ner" ? (
                            <span className="font-medium text-sky-300">
                              entity{selected.category ? ` (${selected.category === "GPE" ? "LOC" : selected.category})` : ""}: {selected.value}
                            </span>
                          ) : (
                            <span className="font-medium text-sky-300">
                              NER category ({selected.category === "GPE" ? "LOC" : selected.category})
                            </span>
                          )}
                        </>
                      ) : (
                        "Click a tag/entity on the right to populate this list."
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                      <SelectTrigger className="h-8 w-[130px] bg-slate-900/40 border-slate-700/60 text-slate-100">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matches">Matches</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                      </SelectContent>
                    </Select>

                    {selected?.kind === "keyword" && (
                      <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/30 px-2 py-1">
                        <Checkbox
                          id="literalOnly"
                          checked={literalOnly}
                          onCheckedChange={(v) => setLiteralOnly(Boolean(v))}
                          className="data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                        />
                        <Label htmlFor="literalOnly" className="text-xs text-slate-300 select-none cursor-pointer">
                          Literal only
                        </Label>
                      </div>
                    )}

                    {selected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelected(null);
                          setOpenAccordion("");
                          setMatchCursorByConvo({});
                          setMonthFilter(null);
                          setLiteralOnly(false);
                          setNerCategoryFilter(null);
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!selected ? (
                  <div className="text-slate-400 text-sm">
                    Tip: click a keyword in the top cloud, or an entity in the NER cloud below it. The conversation viewer will highlight the selected term.
                  </div>
                ) : matchedConversations.length === 0 ? (
                  <div className="text-slate-400 text-sm">No matches found.</div>
                ) : (
                  <div className="space-y-4">
                    {matchTimeline.length > 1 && (
                      <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="text-left text-xs text-slate-300 hover:text-slate-100 transition-colors"
                              >
                                Timeline (by month)
                                <span className="text-slate-500"> • click to filter</span>
                                {monthFilter ? <span className="ml-2 text-slate-200">({monthFilter})</span> : null}
                                <span className="ml-2 text-slate-500">{timelineOpen ? "▲" : "▼"}</span>
                              </button>
                            </CollapsibleTrigger>
                            {monthFilter && (
                              <Button variant="ghost" size="sm" className="h-7" onClick={() => setMonthFilter(null)}>
                                Clear month
                              </Button>
                            )}
                          </div>

                          <CollapsibleContent className="mt-2">
                            {(() => {
                              const maxMatches = Math.max(...matchTimeline.map((b) => b.matches), 1);
                              const items = matchTimeline.slice(-12);
                              return (
                                <div className="grid grid-cols-1 gap-2">
                                  {items.map((b) => {
                                    const pct = Math.max(2, Math.round((b.matches / maxMatches) * 100));
                                    const isActive = monthFilter === b.month;
                                    return (
                                      <button
                                        key={b.month}
                                        type="button"
                                        onClick={() => setMonthFilter((cur) => (cur === b.month ? null : b.month))}
                                        className={cn(
                                          "w-full text-left rounded-md border px-2 py-1.5 transition-colors",
                                          isActive
                                            ? "bg-slate-800/60 border-slate-600/70"
                                            : "bg-slate-900/30 border-slate-800 hover:bg-slate-800/40"
                                        )}
                                        title={`${b.month} • ${b.convos} convos • ${b.matches} matches`}
                                      >
                                        <div className="flex items-center justify-between gap-3 text-xs">
                                          <span className="text-slate-200 font-mono">{b.month}</span>
                                          <span className="text-slate-400">
                                            {b.convos} convos • {b.matches} matches
                                          </span>
                                        </div>
                                        <div className="mt-1 h-1.5 w-full rounded bg-slate-800 overflow-hidden">
                                          <div className="h-full rounded bg-sky-500/70" style={{ width: `${pct}%` }} />
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )}

                    <Accordion
                      type="single"
                      collapsible
                      value={openAccordion}
                      onValueChange={setOpenAccordion}
                      className="space-y-3"
                    >
                      {matchedConversations.slice(0, 80).map(({ convo, matches, literalMatches, semanticMatches }, idx) => {
                      const convoId = String(convo.id || idx);
                      const tagsForConvo: string[] = Array.from(
                        new Set((convo.messages || []).flatMap((m: any) => m?.tags || []).filter(Boolean))
                      );
                      const tagColorMap = buildTagColorMap(tagsForConvo);
                      const selectedTagColor =
                        selected.kind === "keyword" ? tagColorMap[selected.value] : nerTone(selected.category);
                      const matchIndices = getMatchMessageIndices(convo);
                      const tsMs = normalizeTimestampMs(convo.create_time);
                      const updatedMs = normalizeTimestampMs(convo.update_time);
                      const displayTs = formatTs(updatedMs ?? tsMs);

                      return (
                        <AccordionItem
                          key={convoId}
                          value={convoId}
                          className="border border-slate-700/50 rounded-lg overflow-hidden"
                        >
                          <AccordionTrigger className="px-4 md:px-6 hover:no-underline hover:bg-slate-800/50 [&[data-state=open]]:bg-slate-800/50">
                            <div className="flex items-center justify-between w-full min-w-0 gap-3">
                              <div className="min-w-0 text-left">
                                <div className="truncate text-slate-100 font-semibold">
                                  {convo.title || `Conversation ${idx + 1}`}
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                                  <span>{convo.messages?.length || 0} msgs</span>
                                  <span>matches: {matches}</span>
                                  {selected.kind === "keyword" && typeof literalMatches === "number" && typeof semanticMatches === "number" && (
                                    <span className="text-slate-500">
                                      literal {literalMatches} • semantic {semanticMatches}
                                    </span>
                                  )}
                                  {displayTs && <span>{displayTs}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {selected.kind === "keyword" ? (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenAccordion(convoId);
                                      jumpToNextMatchInConversation(convoId, matchIndices);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenAccordion(convoId);
                                        jumpToNextMatchInConversation(convoId, matchIndices);
                                      }
                                    }}
                                    className={cn(
                                      "cursor-pointer select-none text-[12px] px-2.5 py-1 rounded border font-medium transition-colors bg-slate-800/40 border-slate-600/60 text-slate-200 underline underline-offset-4",
                                      underlineDecorClasses(selectedTagColor)
                                    )}
                                    title={matchIndices.length ? `Jump through ${matchIndices.length} matches` : "No matches in this conversation"}
                                  >
                                    {selected.value}
                                    {matchIndices.length > 0 && (
                                      <span className="ml-2 text-[11px] opacity-75">
                                        {(matchCursorByConvo[convoId] ?? -1) + 1}/{matchIndices.length}
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenAccordion(convoId);
                                      jumpToNextMatchInConversation(convoId, matchIndices);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenAccordion(convoId);
                                        jumpToNextMatchInConversation(convoId, matchIndices);
                                      }
                                    }}
                                    className={cn(
                                      "cursor-pointer select-none text-[12px] px-2.5 py-1 rounded border font-medium transition-colors",
                                      selected.kind === "ner"
                                        ? entityChipClasses(selected.category)
                                        : entityChipClasses((selected as any).category)
                                    )}
                                    title={matchIndices.length ? `Jump through ${matchIndices.length} matches` : "No matches in this conversation"}
                                  >
                                    {selected.kind === "ner" ? selected.value : (selected as any).category}
                                    {matchIndices.length > 0 && (
                                      <span className="ml-2 text-[11px] opacity-75">
                                        {(matchCursorByConvo[convoId] ?? -1) + 1}/{matchIndices.length}
                                      </span>
                                    )}
                                  </span>
                                )}
                                {matchIndices.length > 1 && (
                                  <div className="flex items-center gap-1">
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenAccordion(convoId);
                                        jumpToPrevMatchInConversation(convoId, matchIndices);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setOpenAccordion(convoId);
                                          jumpToPrevMatchInConversation(convoId, matchIndices);
                                        }
                                      }}
                                      className="select-none cursor-pointer text-[12px] px-2 py-1 rounded border bg-slate-900/30 border-slate-700/60 text-slate-200 hover:bg-slate-800/40"
                                      title="Previous match"
                                    >
                                      Prev
                                    </span>
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenAccordion(convoId);
                                        jumpToNextMatchInConversation(convoId, matchIndices);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setOpenAccordion(convoId);
                                          jumpToNextMatchInConversation(convoId, matchIndices);
                                        }
                                      }}
                                      className="select-none cursor-pointer text-[12px] px-2 py-1 rounded border bg-slate-900/30 border-slate-700/60 text-slate-200 hover:bg-slate-800/40"
                                      title="Next match"
                                    >
                                      Next
                                    </span>
                                  </div>
                                )}
                                <Badge variant="outline" className="border-slate-700 text-slate-200">
                                  {matches}
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="px-4 md:px-6 pb-5">
                            <div className="messages-scroll-container relative max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                              <div className="space-y-3">
                                {convo.messages?.map((msg: any, msgIndex: number) => {
                                  const isUser = msg.author === "user" || msg.role === "user";
                                  const msgTs = formatTs(msg?.timestamp ?? msg?.create_time ?? msg?.update_time);
                                  const highlightEntities =
                                    selected.kind === "ner"
                                      ? { [selected.category || "MISC"]: [selected.value] }
                                      : selected.kind === "nerCategory"
                                        ? {
                                            [selected.category]: Array.isArray(msg?.named_entities?.[selected.category])
                                              ? (msg.named_entities[selected.category] as unknown[]).map((v: unknown) => String(v))
                                              : [],
                                          }
                                        : undefined;
                                  const isFlash = flash?.convoId === convoId && flash?.msgIndex === msgIndex;
                                  const flashTag = isFlash && selected.kind === "keyword" ? selected.value : undefined;
                                  const flashEntity =
                                    isFlash && selected.kind === "ner"
                                      ? { category: selected.category || "MISC", value: selected.value }
                                      : undefined;

                                  return (
                                    <div
                                      key={msg.id || msgIndex}
                                      ref={(el) => {
                                        if (!messageRefs.current[convoId]) messageRefs.current[convoId] = {};
                                        messageRefs.current[convoId][msgIndex] = el;
                                      }}
                                      className={cn(
                                        "p-4 my-2 rounded-lg relative border",
                                        isFlash && "liara-flash-target",
                                        isUser ? "bg-blue-950/60 border-blue-800/60" : "bg-cyan-950/60 border-cyan-700/60"
                                      )}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <p className={cn("font-semibold capitalize text-sm", isUser ? "text-blue-300" : "text-cyan-300")}>
                                          {msg.author || msg.role}
                                        </p>
                                      </div>

                                      <div className="absolute top-2 right-2 z-10">
                                        <span className="text-xs font-mono px-2 py-1 rounded border shadow-sm bg-slate-800/60 border-slate-600/70 text-slate-300">
                                          {msg.id || msgIndex}
                                          {msgTs && <span className="ml-2 opacity-70">{msgTs}</span>}
                                        </span>
                                      </div>

                                      <MessageContent
                                        content={msg.content}
                                        highlightTags={tagsForConvo}
                                        tagColorMap={tagColorMap}
                                        highlightEntities={highlightEntities}
                                        entityColorMap={{
                                          PERSON: "violet",
                                          ORG: "emerald",
                                          GPE: "sky",
                                          DATE: "cyan",
                                          PRODUCT: "indigo",
                                          EVENT: "amber",
                                          MISC: "slate",
                                        }}
                                        flashTag={flashTag}
                                        flashEntity={flashEntity}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                      })}
                    </Accordion>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 order-1 lg:order-1">
            {/* TOP RIGHT: Tag cloud */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sky-300">Tag Cloud</CardTitle>
                <CardDescription>{enriched ? `${tagCounts.length} tags` : "Load an enriched file to see tags."}</CardDescription>
              </CardHeader>
              <CardContent className="h-[240px] p-4 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="text-slate-400 text-sm">Loading…</div>
                ) : tagCounts.length === 0 ? (
                  <div className="text-slate-400 text-sm">No tags yet</div>
                ) : (
                  <div className="flex flex-wrap items-start justify-start gap-x-4 gap-y-3">
                    {tagCounts.slice(0, 140).map(({ name, count }) => {
                      const tagColor = buildTagColorMap([name])[name];
                      const isActive = selected?.kind === "keyword" && selected.value === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setSelected({ kind: "keyword", value: name })}
                          className={cn(
                            "text-left font-semibold text-slate-300 hover:text-sky-300 transition-colors underline underline-offset-4",
                            underlineDecorClasses(tagColor),
                            isActive && "text-sky-200"
                          )}
                          style={{ fontSize: `${scaleFont(count, 9, 22)}px` }}
                          title={`${count} matching messages`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* BELOW: NER cloud */}
            {nerCategoryStats.length > 0 && (
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-sky-300">NER Categories</CardTitle>
                  <CardDescription>
                    Click a category to browse all conversations containing entities of that type.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {nerCategoryStats.slice(0, 12).map((c) => {
                      const displayCat = c.category === "GPE" ? "LOC" : c.category;
                      const active = nerCategoryFilter === c.category;
                      return (
                        <button
                          key={c.category}
                          type="button"
                          onClick={() => {
                            setNerCategoryFilter((prev) => (prev === c.category ? null : c.category));
                            setSelected((prev) => (prev && prev.kind === "nerCategory" && prev.category === c.category ? null : { kind: "nerCategory", category: c.category }));
                            setOpenAccordion("");
                            setMatchCursorByConvo({});
                          }}
                          className={cn(
                            "text-left text-xs px-2.5 py-1.5 rounded border font-semibold transition-colors",
                            entityChipClasses(c.category),
                            active && "ring-1 ring-sky-400/50"
                          )}
                          title={`${displayCat} • ${c.entities} entities • ${c.mentions} mentions`}
                        >
                          <span className="mr-2">{displayCat}</span>
                          <span className="opacity-80">
                            {c.entities}e • {c.mentions}m
                          </span>
                        </button>
                      );
                    })}
                    {nerCategoryFilter && (
                      <button
                        type="button"
                        className="text-left text-xs px-2.5 py-1.5 rounded border font-semibold transition-colors bg-slate-900/30 border-slate-700/60 text-slate-200 hover:bg-slate-800/40"
                        onClick={() => {
                          setNerCategoryFilter(null);
                          setSelected(null);
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-sky-300">NER Cloud</CardTitle>
                <CardDescription>
                  {enriched ? `${entityCounts.length} entities` : "Load an enriched file to see named entities."}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[240px] p-4 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="text-slate-400 text-sm">Loading…</div>
                ) : entityCounts.length === 0 ? (
                  <div className="text-slate-400 text-sm">No entities yet</div>
                ) : (
                  <div className="flex flex-wrap items-start justify-start gap-x-3 gap-y-3">
                    {entityCounts
                      .filter((e) => (nerCategoryFilter ? Boolean(e.categoryCounts?.[nerCategoryFilter]) : true))
                      .slice(0, 160)
                      .map(({ name, count, category }) => {
                      const isActive = selected?.kind === "ner" && selected.value === name;
                      const tone = nerTone(category);
                      const displayCat = (category || "MISC") === "GPE" ? "LOC" : (category || "MISC");
                      return (
                        <button
                          key={`${category || "MISC"}:${name}`}
                          type="button"
                          onClick={() => {
                            setSelected({ kind: "ner", value: name, category: nerCategoryFilter || category });
                            setOpenAccordion("");
                            setMatchCursorByConvo({});
                          }}
                          className={cn(
                            "text-left font-semibold text-slate-200 hover:text-sky-300 transition-colors",
                            isActive && "text-sky-200"
                          )}
                          style={{ fontSize: `${scaleFont(count, 9, 22)}px` }}
                          title={`${(nerCategoryFilter || category || "MISC")} • ${count} matching messages`}
                        >
                          <span className={cn("underline underline-offset-4", underlineDecorClasses(tone))}>{name}</span>
                          <span
                            className={cn(
                              "ml-1.5 align-top inline-flex items-center px-1.5 py-[1px] rounded border text-[10px] leading-none font-semibold opacity-90",
                              entityChipClasses(category)
                            )}
                            title={`NER: ${displayCat}`}
                          >
                            {displayCat}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

