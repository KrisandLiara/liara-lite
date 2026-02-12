import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSelector } from "@/components/import/preview/shared";
import apiClient from "@/services/api";
import { useTokenIndex, Token } from "@/pages/Lite/hooks/useTokenIndex";
import { SlidersHorizontal } from "lucide-react";

// Prototypes (added in this rollout)
import { VoronoiMap } from "@/pages/Lite/maps/VoronoiMap";
import { CirclePackMap } from "@/pages/Lite/maps/CirclePackMap";
import { ForceGalaxyMap } from "@/pages/Lite/maps/ForceGalaxyMap";
import { CurveballMap } from "@/pages/Lite/maps/CurveballMap";
import { DEFAULT_SETTINGS, type ActiveViz, type MapsLabSettings } from "@/pages/Lite/mapsLab/settings";
import { ForceLayoutHotKnobs } from "@/pages/Lite/mapsLab/tuning/ForceLayoutHotKnobs";
import { ForceType3Tuning } from "@/pages/Lite/mapsLab/tuning/ForceType3Tuning";
import { ForceAdvancedTuning } from "@/pages/Lite/mapsLab/tuning/ForceAdvancedTuning";
import { VoronoiAdvancedTuning } from "@/pages/Lite/mapsLab/tuning/VoronoiAdvancedTuning";
import { PackAdvancedTuning } from "@/pages/Lite/mapsLab/tuning/PackAdvancedTuning";
import { PixiAdvancedTuning } from "@/pages/Lite/mapsLab/tuning/PixiAdvancedTuning";

type SelectedToken = Token | null;

const SETTINGS_KEY = "liaraLite.mapsLab.settings";
const PRESETS_KEY = "liaraLite.mapsLab.presets";

export default function MapsLabPage() {
  const [selectedEnrichedFile, setSelectedEnrichedFile] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<SelectedToken>(null);
  const [activeViz, setActiveViz] = useState<ActiveViz>(null);
  const [pinned, setPinned] = useState(false);
  const [forcePath, setForcePath] = useState<string[]>([]);
  const [settings, setSettings] = useState<MapsLabSettings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<MapsLabSettings>(DEFAULT_SETTINGS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const LITE_LAST_ENRICHED_FILE_KEY = "liaraLite.selectedEnrichedFile";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rightColRef = useRef<HTMLDivElement | null>(null);
  const vizSlotRef = useRef<HTMLDivElement | null>(null);
  const [vizSlotH, setVizSlotH] = useState(0);

  const isInViewport = useCallback((el: HTMLElement, marginPx = 24) => {
    const r = el.getBoundingClientRect();
    return r.top >= marginPx && r.bottom <= window.innerHeight - marginPx;
  }, []);

  useEffect(() => {
    // When pinned, prevent page scroll so zoom/drag interactions don't fight the page.
    const prevOverflow = document.body.style.overflow;
    if (pinned) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [pinned]);

  useEffect(() => {
    const el = vizSlotRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setVizSlotH(Math.max(0, Math.floor(r.height)));
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Restore lab settings + presets list
  const presets = useMemo<Record<string, MapsLabSettings>>(() => {
    try {
      const raw = window.localStorage.getItem(PRESETS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? (parsed as Record<string, MapsLabSettings>) : {};
    } catch {
      return {};
    }
  }, [selectedPreset]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...(parsed || {}) });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Keep draft in sync with applied settings (presets/reset/etc). Dragging updates draft only;
  // we commit to `settings` on slider release / input blur to avoid laggy re-layouts.
  useEffect(() => {
    setDraft(settings);
  }, [settings]);

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

  const loadEnriched = async (fileName: string) => {
    setIsLoading(true);
    setSelected(null);
    setActiveViz(null);
    setPinned(false);
    try {
      const { data } = await apiClient.get("/lite/file-content", { params: { fileName, from: "enriched" } });
      setEnriched(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  };

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

  const { tokens, tokenById, getTopRelated, coocByToken } = useTokenIndex(enriched);
  const filteredTokens = useMemo(() => {
    if (settings.tokenMix === "tags") return tokens.filter((t) => t.type === "tag");
    if (settings.tokenMix === "entities") return tokens.filter((t) => t.type === "entity");
    return tokens;
  }, [tokens, settings.tokenMix]);

  const rankByMentions = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < filteredTokens.length; i++) m.set(filteredTokens[i].id, i + 1);
    return m;
  }, [filteredTokens]);

  const rankByConvos = useMemo(() => {
    const sorted = [...filteredTokens].sort((a, b) => b.uniqueConversations - a.uniqueConversations);
    const m = new Map<string, number>();
    for (let i = 0; i < sorted.length; i++) m.set(sorted[i].id, i + 1);
    return m;
  }, [filteredTokens]);

  const baseTokens = useMemo(() => {
    const max = Math.max(50, Math.min(2000, settings.maxTokens || 400));
    return filteredTokens.slice(0, max);
  }, [filteredTokens, settings.maxTokens]);

  const related = useMemo(
    () => (selected ? getTopRelated(selected.id, Math.min(40, Math.max(3, settings.maxRelated || 12))) : []),
    [getTopRelated, selected, settings.maxRelated]
  );

  const relatedIds = useMemo(() => new Set(related.map((r) => r.id)), [related]);

  const focusTokens = useMemo(() => {
    if (!settings.semanticZoomEnabled || !selected) return null;
    const ids = [selected.id, ...related.map((r) => r.id)];
    const out: Token[] = [];
    for (const id of ids) {
      const t = tokenById.get(id);
      if (t) out.push(t);
    }
    return out;
  }, [settings.semanticZoomEnabled, selected, related, tokenById]);

  const clampNum = useCallback((v: number, min: number, max: number) => Math.max(min, Math.min(max, v)), []);

  // --- Force Type 3 (Infinite Explainer) model ---
  const forceRankedTokens = useMemo(() => {
    if (settings.forceRankMode === "convos") {
      return [...filteredTokens].sort((a, b) => b.uniqueConversations - a.uniqueConversations);
    }
    // `tokens` is already mentions-sorted in the index.
    return filteredTokens;
  }, [filteredTokens, settings.forceRankMode]);

  const forceOverviewTokens = useMemo(() => {
    const n = clampNum(settings.forceOverviewTopN || 100, 20, 800);
    return forceRankedTokens.slice(0, n);
  }, [clampNum, forceRankedTokens, settings.forceOverviewTopN]);

  // When switching into Force, initialize the breadcrumb path from current selection (if any).
  useEffect(() => {
    if (activeViz !== "force") return;
    if (selected?.id) setForcePath([selected.id]);
    else setForcePath([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeViz]);

  const onSelectForceTokenId = useCallback(
    (id: string) => {
      const t = tokenById.get(id) || null;
      setSelected(t);
      if (t) {
        setForcePath((path) => {
          if (path.length === 0) return [t.id];
          const cur = path[path.length - 1];
          if (cur === t.id) return path;
          const existingIdx = path.indexOf(t.id);
          if (existingIdx >= 0) return path.slice(0, existingIdx + 1);
          return [...path, t.id];
        });
      }
    },
    [isInViewport, tokenById]
  );

  const onForceBack = useCallback(() => {
    setForcePath((path) => {
      if (path.length <= 1) return path;
      const next = path.slice(0, -1);
      const id = next[next.length - 1];
      setSelected(tokenById.get(id) || null);
      return next;
    });
  }, [tokenById]);

  const onForceClear = useCallback(() => {
    setForcePath([]);
    setSelected(null);
  }, []);

  const forceVisitedIds = useMemo(() => {
    const k = clampNum(settings.forceVisitedK || 10, 0, 50);
    const ids = forcePath.slice(0, -1);
    return ids.slice(Math.max(0, ids.length - k));
  }, [clampNum, forcePath, settings.forceVisitedK]);

  const forceModel = useMemo(() => {
    const centerId = activeViz === "force" ? (selected?.id || null) : null;
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
          // Explanatory power (sharedConvos / log(globalMentions))
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
    const powerFor = (sharedConvos: number, globalMentions: number) =>
      sharedConvos / Math.log(1 + Math.max(1, globalMentions || 1));

    const topContextTagsFor = (targetId: string, limit = 3) => {
      const a = coocByToken.get(centerId) || new Map<string, number>();
      const b = coocByToken.get(targetId) || new Map<string, number>();
      const scored: Array<{ id: string; s: number }> = [];
      for (const [otherId, c1] of a.entries()) {
        if (otherId === centerId) continue;
        if (otherId === targetId) continue;
        const c2 = b.get(otherId);
        if (!c2) continue;
        // "Shared context strength": how strongly both co-occur with the same third token.
        scored.push({ id: otherId, s: Math.min(c1, c2) });
      }
      scored.sort((x, y) => y.s - x.s);
      const names: string[] = [];
      for (const it of scored) {
        const t = tokenById.get(it.id);
        if (!t) continue;
        names.push(t.type === "entity" ? t.name : t.name);
        if (names.length >= limit) break;
      }
      return names;
    };
    const candidates: Array<{ id: string; tok: Token; cooc: number }> = [];
    for (const [id, c] of cooc.entries()) {
      const tok = tokenById.get(id);
      if (!tok) continue;
      // Respect token mix for neighbor selection (but keep center/visited regardless elsewhere).
      if (settings.tokenMix === "tags" && tok.type !== "tag") continue;
      if (settings.tokenMix === "entities" && tok.type !== "entity") continue;
      candidates.push({ id, tok, cooc: c });
    }

    const takeTop = (arr: Array<{ id: string; score: number }>, limit: number) =>
      arr.sort((a, b) => b.score - a.score).slice(0, Math.max(0, limit));

    // Defining
    const definingLimit = clampNum(settings.forceDefiningCount || 0, 0, 80);
    const defining = settings.forceShowDefining
      ? takeTop(
          candidates.map((c) => ({
            id: c.id,
            score: c.cooc / Math.log(1 + Math.max(1, c.tok.mentions)),
          })),
          definingLimit
        )
      : [];

    // Contextual
    const contextualLimit = clampNum(settings.forceContextualCount || 0, 0, 120);
    const contextual = settings.forceShowContextual
      ? takeTop(
          candidates.map((c) => ({
            id: c.id,
            score: c.cooc,
          })),
          contextualLimit
        )
      : [];

    // Structural: per-category + tags
    const perCat = clampNum(settings.forceStructuralPerCatCount || 0, 0, 30);
    const tagsN = clampNum(settings.forceStructuralTagsCount || 0, 0, 80);
    const cats: Array<{ key: string; enabled: boolean }> = [
      { key: "ORG", enabled: Boolean(settings.forceStructORG) },
      { key: "PERSON", enabled: Boolean(settings.forceStructPERSON) },
      { key: "LOC", enabled: Boolean(settings.forceStructLOC) },
      { key: "PRODUCT", enabled: Boolean(settings.forceStructPRODUCT) },
      { key: "DATE", enabled: Boolean(settings.forceStructDATE) },
    ];
    const structural: Array<{ id: string; score: number }> = [];
    if (settings.forceShowStructural) {
      for (const { key, enabled } of cats) {
        if (!enabled) continue;
        const items = takeTop(
          candidates
            .filter((c) => c.tok.type === "entity" && String(c.tok.category || "") === key)
            .map((c) => ({ id: c.id, score: c.cooc })),
          perCat
        );
        structural.push(...items);
      }
      const tagItems = takeTop(
        candidates.filter((c) => c.tok.type === "tag").map((c) => ({ id: c.id, score: c.cooc })),
        tagsN
      );
      structural.push(...tagItems);
    }

    // Combine neighbor kinds with priority (defining > structural > contextual)
    const kindById = new Map<string, { kind: "defining" | "contextual" | "structural"; score: number }>();
    for (const d of contextual) kindById.set(d.id, { kind: "contextual", score: d.score });
    for (const s of structural) kindById.set(s.id, { kind: "structural", score: s.score });
    for (const d of defining) kindById.set(d.id, { kind: "defining", score: d.score });

    // Enforce a stable "ring fill" size for readability.
    // If we have fewer than N neighbors, fill with extra contextual candidates.
    const focusN = clampNum(settings.forceFocusTotalN || 72, 12, 220);
    if (kindById.size < focusN) {
      const extras = takeTop(
        candidates
          .map((c) => ({
            id: c.id,
            // Prefer "still relevant but less globally common" to fill the ring neatly.
            score: c.cooc / Math.log(2 + Math.max(1, c.tok.mentions) * 0.35),
          }))
          .filter((x) => !kindById.has(x.id) && x.id !== centerId),
        focusN - kindById.size
      );
      for (const x of extras) kindById.set(x.id, { kind: "contextual", score: x.score });
    }
    // If we have too many, trim contextual first (keep defining + structural).
    if (kindById.size > focusN) {
      const keep = new Map<string, { kind: "defining" | "contextual" | "structural"; score: number }>();
      // Always keep defining + structural
      for (const [id, v] of kindById.entries()) {
        if (v.kind !== "contextual") keep.set(id, v);
      }
      const remaining = focusN - keep.size;
      if (remaining > 0) {
        const ctx = [...kindById.entries()]
          .filter(([, v]) => v.kind === "contextual")
          .map(([id, v]) => ({ id, score: v.score }))
          .sort((a, b) => b.score - a.score)
          .slice(0, remaining);
        for (const x of ctx) keep.set(x.id, { kind: "contextual", score: x.score });
      }
      // Replace
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

    return {
      nodes: [...nodesById.values()],
      edges,
      overviewIds,
      neighborIds,
      visitedIds,
    };
  }, [
    activeViz,
    clampNum,
    coocByToken,
    forceOverviewTokens,
    forcePath,
    forceVisitedIds,
    selected?.id,
    settings.forceContextualCount,
    settings.forceDefiningCount,
    settings.forceShowContextual,
    settings.forceShowDefining,
    settings.forceShowStructural,
    settings.forceStructuralPerCatCount,
    settings.forceStructuralTagsCount,
    settings.forceStructDATE,
    settings.forceStructLOC,
    settings.forceStructORG,
    settings.forceStructPERSON,
    settings.forceStructPRODUCT,
    tokenById,
  ]);

  const forceNeighborCounts = useMemo(() => {
    if (activeViz !== "force" || !selected?.id) return null;
    const out = { defining: 0, contextual: 0, structural: 0 };
    for (const e of forceModel.edges) {
      if (e.source !== selected.id) continue;
      if (e.kind === "defining") out.defining += 1;
      else if (e.kind === "structural") out.structural += 1;
      else out.contextual += 1;
    }
    return out;
  }, [activeViz, forceModel.edges, selected?.id]);

  const onSelectTokenId = useCallback((id: string) => {
    const t = tokenById.get(id) || null;
    setSelected(t);
    // Semantic zoom: from World (Voronoi) → Focus (Force/Pixi)
    if (t && settings.semanticZoomEnabled && activeViz === "voronoi") {
      setActiveViz(settings.focusViz);
      if (settings.focusAutoPin) setPinned(true);
    }
  }, [activeViz, isInViewport, settings.focusAutoPin, settings.focusViz, settings.semanticZoomEnabled, tokenById]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "p") {
        setPinned((v) => !v);
      }
      if (e.key === "Escape") {
        setPinned(false);
        setActiveViz(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Note: this page is a fixed-height lab (`h-screen`) with internal panes,
  // so we avoid auto-scrolling the document on viz activation (it can clip the top header/legend).

  // Keep token arrays stable across re-renders (especially selection changes),
  // otherwise Voronoi (which uses PRNG initialization) will reshuffle on every click.
  const voronoiTokens = useMemo(() => baseTokens.slice(0, 600), [baseTokens]);
  const packTokens = useMemo(() => baseTokens.slice(0, 900), [baseTokens]);
  const pixiTokens = useMemo(() => baseTokens.slice(0, 260), [baseTokens]);

  // Memoize the active viz node so slider dragging (draft updates) doesn't rerender the maps.
  // We measure only the *viz slot* (the grid row), which is fixed by layout (no feedback loop).
  const RIGHT_LEGEND_PX = 104;
  const RIGHT_SELECTED_PX = 220;

  const computedVizH = useMemo(() => {
    // The viz row itself is fixed by layout; fill it exactly to avoid internal blank bands.
    const h = Math.max(0, Math.floor(vizSlotH));
    return Math.max(220, Math.min(1600, h || 520));
  }, [vizSlotH]);

  const activeVizNode = useMemo(() => {
    if (!activeViz) return null;
    // Fill the allocated viz row height (prevents blank band above Selected).
    const labH = Math.max(220, Math.min(1600, computedVizH));

    if (activeViz === "voronoi")
      return (
        <VoronoiMap
          tokens={voronoiTokens}
          onSelect={onSelectTokenId}
          height={labH}
          settings={settings}
          selectedId={selected?.id || null}
        />
      );
    if (activeViz === "pack")
      return (
        <CirclePackMap
          tokens={packTokens}
          onSelect={onSelectTokenId}
          height={labH}
          settings={settings}
          selectedId={selected?.id || null}
          relatedIds={relatedIds}
        />
      );
    if (activeViz === "force")
      return (
        <ForceGalaxyMap
          tokens={forceModel.nodes}
          selectedId={selected?.id || null}
          edges={forceModel.edges}
          overviewIds={forceModel.overviewIds}
          neighborIds={forceModel.neighborIds}
          visitedIds={forceModel.visitedIds}
          onSelect={onSelectForceTokenId}
          height={labH}
          settings={settings}
        />
      );
    if (activeViz === "pixi")
      return (
        <CurveballMap
          tokens={settings.semanticZoomEnabled && focusTokens ? focusTokens : pixiTokens}
          onSelect={onSelectTokenId}
          height={labH}
          settings={settings}
          selectedId={selected?.id || null}
          relatedIds={relatedIds}
        />
      );

    return null;
  }, [
    activeViz,
    computedVizH,
    focusTokens,
    forceModel,
    onSelectTokenId,
    onSelectForceTokenId,
    packTokens,
    pixiTokens,
    relatedIds,
    selected?.id,
    settings,
    voronoiTokens,
  ]);

  const activeTitle =
    activeViz === "voronoi"
      ? "Voronoi Treemap (Countries)"
      : activeViz === "pack"
        ? "Circle Packing “Blob Pack”"
        : activeViz === "force"
          ? "Force “Galaxy” Focus"
          : activeViz === "pixi"
            ? "Curveball: Pixi Bubble Field"
            : null;

  const setActiveFromCheckbox = useCallback((key: Exclude<ActiveViz, null>, checked: boolean) => {
    if (checked) {
      setActiveViz(key);
      return;
    }
    setActiveViz((prev) => (prev === key ? null : prev));
    setPinned(false);
  }, []);

  const savePreset = useCallback(() => {
    const name = presetName.trim();
    if (!name) return;
    try {
      const next = { ...presets, [name]: settings };
      window.localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
      setSelectedPreset(name);
      setPresetName("");
    } catch {
      // ignore
    }
  }, [presetName, presets, settings]);

  const loadPreset = useCallback((name: string) => {
    const p = presets[name];
    if (!p) return;
    setSettings({ ...DEFAULT_SETTINGS, ...p });
    setSelectedPreset(name);
  }, [presets]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setSelectedPreset("");
  }, []);

  const updateDraft = useCallback(<K extends keyof MapsLabSettings>(key: K, value: MapsLabSettings[K]) => {
    setDraft((s) => ({ ...s, [key]: value }));
  }, []);

  const commitSetting = useCallback(<K extends keyof MapsLabSettings>(key: K, value: MapsLabSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  const commitFromDraft = useCallback(
    <K extends keyof MapsLabSettings>(key: K) => {
      setSettings((s) => ({ ...s, [key]: draft[key] }));
    },
    [draft]
  );

  const TUNING_INPUT_CLASS =
    "h-6 w-[84px] rounded border bg-slate-900/30 border-slate-700/60 text-slate-100 text-xs px-2";
  const TUNING_SLIDER_PROPS = {
    trackClassName: "h-1.5",
    thumbClassName: "h-4 w-4",
  } as const;

  const activeVizLabel =
    activeViz === "voronoi"
      ? "Voronoi (Countries)"
      : activeViz === "pack"
        ? "Circle Packing"
        : activeViz === "force"
          ? "Force (Galaxy)"
          : activeViz === "pixi"
            ? "Pixi (Bubble Field)"
            : "None selected";

  const showPadding = activeViz === "pack" || activeViz === "force" || activeViz === "pixi";
  const showLabelMode = activeViz === "voronoi" || activeViz === "pack" || activeViz === "force";
  const showMinLabelRadius = activeViz === "pack" || activeViz === "force";
  const showMotion = activeViz === "force" || activeViz === "pixi";
  const showGravity = activeViz === "force";
  const showRelated = activeViz === "force";
  const showSemanticZoom = activeViz === "voronoi";

  const TuningPanelBody = (
    <div className="space-y-1 text-[11px]">
      <div className="rounded-md border border-slate-800 bg-slate-950/20 p-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold text-slate-200">Presets</div>
          <Button variant="outline" size="sm" onClick={resetSettings} className="h-7 px-2 text-[11px]">
            Reset
          </Button>
        </div>
        <Select value={selectedPreset} onValueChange={(v) => loadPreset(v)}>
          <SelectTrigger className="h-7 bg-slate-900/30 border-slate-700/60 text-slate-100 text-[11px]">
            <SelectValue placeholder="Load preset..." />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(presets).length === 0 ? (
              <SelectItem value="__none" disabled>
                No presets yet
              </SelectItem>
            ) : (
              Object.keys(presets)
                .sort()
                .map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder='Preset name (e.g., "Calm Liara")'
            className="h-7 bg-slate-900/30 border-slate-700/60 text-slate-100 placeholder:text-slate-500 text-[11px]"
          />
          <Button onClick={savePreset} disabled={!presetName.trim()} className="h-7 px-2 text-[11px]">
            Save
          </Button>
        </div>
        <div className="text-[10px] text-slate-500">For: {activeVizLabel} • GLOBAL = affects all maps</div>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-950/20 p-1">
        <div className="text-[11px] font-semibold text-slate-200 mb-1">
          Global tuning{" "}
          <span className="ml-2 rounded border border-slate-700/70 bg-slate-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200">
            GLOBAL
          </span>
        </div>
        <div className="space-y-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">
              Max tokens{" "}
              <span className="ml-2 rounded border border-slate-700/70 bg-slate-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200">
                GLOBAL
              </span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className={TUNING_INPUT_CLASS}
                value={draft.maxTokens}
                min={50}
                max={2000}
                step={10}
                onChange={(e) => updateDraft("maxTokens", Math.max(50, Math.min(2000, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("maxTokens")}
              />
              <span className="text-slate-500">tokens</span>
            </div>
          </div>
          <Slider
            value={[draft.maxTokens]}
            min={50}
            max={2000}
            step={10}
            onValueChange={(v) => updateDraft("maxTokens", v[0] as any)}
            onValueCommit={(v) => commitSetting("maxTokens", v[0] as any)}
            {...TUNING_SLIDER_PROPS}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">
              Token mix{" "}
              <span className="ml-2 rounded border border-slate-700/70 bg-slate-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200">
                GLOBAL
              </span>
            </span>
            <span className="text-slate-400">{draft.tokenMix}</span>
          </div>
          <Select
            value={draft.tokenMix}
            onValueChange={(v) => {
              updateDraft("tokenMix", v as any);
              commitSetting("tokenMix", v as any);
            }}
          >
          <SelectTrigger className="h-7 bg-slate-900/30 border-slate-700/60 text-slate-100 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Both</SelectItem>
              <SelectItem value="tags">Tags only</SelectItem>
              <SelectItem value="entities">Entities only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">
              Size scale{" "}
              <span className="ml-2 rounded border border-slate-700/70 bg-slate-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200">
                GLOBAL
              </span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className={TUNING_INPUT_CLASS}
                value={Number(draft.sizeScale.toFixed(2))}
                min={0.5}
                max={2.5}
                step={0.05}
                onChange={(e) => updateDraft("sizeScale", Math.max(0.5, Math.min(2.5, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("sizeScale")}
              />
              <span className="text-slate-500">x</span>
            </div>
          </div>
          <Slider
            value={[Math.round(draft.sizeScale * 100)]}
            min={50}
            max={250}
            step={5}
            onValueChange={(v) => updateDraft("sizeScale", (v[0] / 100) as any)}
            onValueCommit={(v) => commitSetting("sizeScale", (v[0] / 100) as any)}
            {...TUNING_SLIDER_PROPS}
          />
        </div>

        {showPadding && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Density / padding</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                className={TUNING_INPUT_CLASS}
                  value={draft.padding}
                  min={-2}
                  max={10}
                  step={1}
                  onChange={(e) => updateDraft("padding", Math.max(-2, Math.min(10, Number(e.target.value || 0))) as any)}
                  onBlur={() => commitFromDraft("padding")}
                />
                <span className="text-slate-500">px</span>
              </div>
            </div>
            <Slider
              value={[draft.padding]}
              min={-2}
              max={10}
              step={1}
              onValueChange={(v) => updateDraft("padding", v[0] as any)}
              onValueCommit={(v) => commitSetting("padding", v[0] as any)}
              {...TUNING_SLIDER_PROPS}
            />
          </div>
        )}

        {showLabelMode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Labels</span>
              <span className="text-slate-400">{draft.labelMode}</span>
            </div>
            <Select
              value={draft.labelMode}
              onValueChange={(v) => {
                updateDraft("labelMode", v as any);
                commitSetting("labelMode", v as any);
              }}
            >
            <SelectTrigger className="h-8 bg-slate-900/30 border-slate-700/60 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="hover">Hover only</SelectItem>
                <SelectItem value="important">Important only</SelectItem>
                <SelectItem value="all">All (debug)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Top N labels</span>
            <input
              type="number"
              className={TUNING_INPUT_CLASS}
              value={draft.topLabels}
              min={0}
              max={40}
              step={1}
              onChange={(e) => updateDraft("topLabels", Math.max(0, Math.min(40, Number(e.target.value || 0))) as any)}
              onBlur={() => commitFromDraft("topLabels")}
            />
          </div>
          <Slider
            value={[draft.topLabels]}
            min={0}
            max={40}
            step={1}
            onValueChange={(v) => updateDraft("topLabels", v[0] as any)}
            onValueCommit={(v) => commitSetting("topLabels", v[0] as any)}
            {...TUNING_SLIDER_PROPS}
          />
        </div>

        {showMinLabelRadius && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Min label radius</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className={TUNING_INPUT_CLASS}
                  value={draft.minLabelRadius}
                  min={10}
                  max={44}
                  step={1}
                  onChange={(e) => updateDraft("minLabelRadius", Math.max(10, Math.min(44, Number(e.target.value || 0))) as any)}
                  onBlur={() => commitFromDraft("minLabelRadius")}
                />
                <span className="text-slate-500">px</span>
              </div>
            </div>
            <Slider
              value={[draft.minLabelRadius]}
              min={10}
              max={44}
              step={1}
              onValueChange={(v) => updateDraft("minLabelRadius", v[0] as any)}
              onValueCommit={(v) => commitSetting("minLabelRadius", v[0] as any)}
              {...TUNING_SLIDER_PROPS}
            />
          </div>
        )}

        {showMotion && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Motion</span>
              <span className="text-slate-400">{Math.round(draft.motion * 100)}%</span>
            </div>
            <Slider
              value={[Math.round(draft.motion * 100)]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => updateDraft("motion", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("motion", (v[0] / 100) as any)}
            {...TUNING_SLIDER_PROPS}
            />
          </div>
        )}

        {showMotion && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Calmness</span>
              <span className="text-slate-400">{Math.round(draft.calmness * 100)}%</span>
            </div>
            <Slider
              value={[Math.round(draft.calmness * 100)]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => updateDraft("calmness", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("calmness", (v[0] / 100) as any)}
            {...TUNING_SLIDER_PROPS}
            />
          </div>
        )}

        {showGravity && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Gravity</span>
              <span className="text-slate-400">{Math.round(draft.gravity * 100)}%</span>
            </div>
            <Slider
              value={[Math.round(draft.gravity * 100)]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => updateDraft("gravity", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("gravity", (v[0] / 100) as any)}
            {...TUNING_SLIDER_PROPS}
            />
          </div>
        )}

        {showRelated && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Related neighbors</span>
              <span className="text-slate-400">{draft.maxRelated}</span>
            </div>
            <Slider
              value={[draft.maxRelated]}
              min={3}
              max={20}
              step={1}
              onValueChange={(v) => updateDraft("maxRelated", v[0] as any)}
              onValueCommit={(v) => commitSetting("maxRelated", v[0] as any)}
            {...TUNING_SLIDER_PROPS}
            />
          </div>
        )}

        {showRelated && (
          <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/20 px-3 py-2">
            <div>
              <div className="text-xs font-semibold text-slate-200">Relationship lines</div>
              <div className="text-[10px] text-slate-400">Show edges</div>
            </div>
            <Checkbox
              checked={draft.showRelatedLines}
              onCheckedChange={(v) => {
                updateDraft("showRelatedLines", Boolean(v) as any);
                commitSetting("showRelatedLines", Boolean(v) as any);
              }}
              className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
            />
          </div>
        )}
        </div>
      </div>

      {showSemanticZoom && (
        <div className="rounded-md border border-slate-800 bg-slate-950/20 p-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-semibold text-slate-200">Semantic zoom</div>
            <Checkbox
              checked={draft.semanticZoomEnabled}
              onCheckedChange={(v) => {
                updateDraft("semanticZoomEnabled", Boolean(v) as any);
                commitSetting("semanticZoomEnabled", Boolean(v) as any);
              }}
              className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
            />
          </div>
          <div className="space-y-1">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-semibold">Focus viz</div>
              <Select
                value={draft.focusViz}
                onValueChange={(v) => {
                  updateDraft("focusViz", v as any);
                  commitSetting("focusViz", v as any);
                }}
              >
                <SelectTrigger className="h-7 bg-slate-900/30 border-slate-700/60 text-slate-100 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="force">Force</SelectItem>
                  <SelectItem value="pixi">Pixi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/10 px-2 py-2">
              <div className="text-[11px] text-slate-300 font-semibold">Auto-pin</div>
              <Checkbox
                checked={draft.focusAutoPin}
                onCheckedChange={(v) => {
                  updateDraft("focusAutoPin", Boolean(v) as any);
                  commitSetting("focusAutoPin", Boolean(v) as any);
                }}
                className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Per-viz: 5 extra adjustments each */}
      {activeViz === "voronoi" && (
        <VoronoiAdvancedTuning
          draft={draft}
          inputClassName={TUNING_INPUT_CLASS}
          sliderProps={TUNING_SLIDER_PROPS}
          updateDraft={updateDraft}
          commitSetting={commitSetting}
          commitFromDraft={commitFromDraft}
        />
      )}

      {activeViz === "pack" && (
        <PackAdvancedTuning
          draft={draft}
          inputClassName={TUNING_INPUT_CLASS}
          sliderProps={TUNING_SLIDER_PROPS}
          updateDraft={updateDraft}
          commitSetting={commitSetting}
          commitFromDraft={commitFromDraft}
        />
      )}

      {activeViz === "force" && (
        <>
          <ForceLayoutHotKnobs
            draft={draft}
            inputClassName={TUNING_INPUT_CLASS}
            sliderProps={TUNING_SLIDER_PROPS}
            updateDraft={updateDraft}
            commitSetting={commitSetting}
            commitFromDraft={commitFromDraft}
          />

          <ForceType3Tuning
            draft={draft}
            inputClassName={TUNING_INPUT_CLASS}
            sliderProps={TUNING_SLIDER_PROPS}
            updateDraft={updateDraft}
            commitSetting={commitSetting}
            commitFromDraft={commitFromDraft}
          />

          <ForceAdvancedTuning
            draft={draft}
            inputClassName={TUNING_INPUT_CLASS}
            sliderProps={TUNING_SLIDER_PROPS}
            updateDraft={updateDraft}
            commitSetting={commitSetting}
            commitFromDraft={commitFromDraft}
          />
        </>
      )}

      {activeViz === "pixi" && (
        <PixiAdvancedTuning
          draft={draft}
          inputClassName={TUNING_INPUT_CLASS}
          sliderProps={TUNING_SLIDER_PROPS}
          updateDraft={updateDraft}
          commitSetting={commitSetting}
          commitFromDraft={commitFromDraft}
        />
      )}
    </div>
  );

  // Memoize the two big cards so slider draft changes don't cause extra reconciliation work.
  // (Draft updates still rerender the tuning panel, but these cards stay stable unless their deps change.)
  const controlsCardNode = useMemo(() => {
    return (
      <Card className="border-slate-800 bg-slate-900/40 h-full overflow-hidden flex flex-col">
        <CardHeader className="py-2 px-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-slate-100 text-base">Controls</CardTitle>
              <CardDescription className="text-xs leading-tight">Choose a prototype. Tune below. Click the viz to select.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 overflow-y-auto flex-1">
          <div className="text-xs font-semibold text-slate-100 mb-2">Choose prototype</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="rounded-md border border-slate-800 bg-slate-950/20 p-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100">1) Voronoi</div>
                  <div className="text-[11px] text-slate-500 leading-tight">Touching territories; zoomable.</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Checkbox
                    id="vizPickVoronoi"
                    checked={activeViz === "voronoi"}
                    onCheckedChange={(v) => setActiveFromCheckbox("voronoi", Boolean(v))}
                    className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                  />
                  <Label htmlFor="vizPickVoronoi" className="text-xs text-slate-300 select-none cursor-pointer">
                    On
                  </Label>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950/20 p-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100">2) Pack</div>
                  <div className="text-[11px] text-slate-500 leading-tight">Dense bubble packing.</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Checkbox
                    id="vizPickPack"
                    checked={activeViz === "pack"}
                    onCheckedChange={(v) => setActiveFromCheckbox("pack", Boolean(v))}
                    className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                  />
                  <Label htmlFor="vizPickPack" className="text-xs text-slate-300 select-none cursor-pointer">
                    On
                  </Label>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950/20 p-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100">3) Force (Type 3)</div>
                  <div className="text-[11px] text-slate-500 leading-tight">Semantic drilldown + spokes.</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Checkbox
                    id="vizPickForce"
                    checked={activeViz === "force"}
                    onCheckedChange={(v) => setActiveFromCheckbox("force", Boolean(v))}
                    className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                  />
                  <Label htmlFor="vizPickForce" className="text-xs text-slate-300 select-none cursor-pointer">
                    On
                  </Label>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950/20 p-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-100">4) Pixi</div>
                  <div className="text-[11px] text-slate-500 leading-tight">WebGL blob field.</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Checkbox
                    id="vizPickPixi"
                    checked={activeViz === "pixi"}
                    onCheckedChange={(v) => setActiveFromCheckbox("pixi", Boolean(v))}
                    className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                  />
                  <Label htmlFor="vizPickPixi" className="text-xs text-slate-300 select-none cursor-pointer">
                    On
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [
    activeViz,
    setActiveFromCheckbox,
  ]);

  const legendNode = useMemo(() => {
    return (
      <Card className="border-slate-800 border-b-0 bg-slate-900/40 overflow-hidden h-full rounded-b-none shadow-none">
        <CardHeader className="py-0.5 px-2 pb-0">
          <div className="flex items-center justify-end gap-2">
            <div className="text-[12px] leading-none text-slate-500 shrink-0">co-occurrence graph</div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-1 pt-1 flex-1 flex flex-col justify-end">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[12px] leading-tight">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-200 text-[13px] leading-none">Nodes</div>
              <div className="text-slate-400">Fill: tag vs entity</div>
              <div className="flex flex-wrap items-center gap-3 text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full border"
                    style={{ background: "hsl(268 80% 55%)", borderColor: "rgba(167,139,250,0.65)" }}
                    title="Tag fill"
                  />
                  Tag
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full border"
                    style={{ background: "hsl(215 20% 55%)", borderColor: "rgba(148,163,184,0.7)" }}
                    title="Entity fill"
                  />
                  Entity
                </span>
              </div>
              <div className="text-slate-400">Outline: entity category</div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full border" style={{ borderColor: "rgba(20,184,166,0.95)" }} /> ORG
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full border" style={{ borderColor: "rgba(59,130,246,0.95)" }} /> PERSON
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full border" style={{ borderColor: "rgba(34,197,94,0.95)" }} /> LOC
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full border" style={{ borderColor: "rgba(245,158,11,0.95)" }} /> PRODUCT
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full border" style={{ borderColor: "rgba(251,113,133,0.95)" }} /> DATE
                </span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-200 text-[13px] leading-none">Edges</div>
              <div className="flex items-center gap-2 text-slate-400">
                <svg width="52" height="10" className="shrink-0">
                  <line x1="2" y1="5" x2="62" y2="5" stroke="rgba(56,189,248,0.95)" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Defining (explains)
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <svg width="52" height="10" className="shrink-0">
                  <line x1="2" y1="5" x2="62" y2="5" stroke="rgba(148,163,184,0.55)" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Contextual (often with)
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <svg width="52" height="10" className="shrink-0">
                  <line
                    x1="2"
                    y1="5"
                    x2="62"
                    y2="5"
                    stroke="rgba(251,191,36,0.9)"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                  />
                </svg>
                Structural (entity/category)
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-200 text-[13px] leading-none">Sizing & opacity</div>
              <div className="text-slate-400">Size ≈ mentions.</div>
              <div className="grid grid-rows-2 grid-flow-col gap-x-4 gap-y-1 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200/90" /> selected
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200/70" /> neighbor
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200/45" /> visited
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200/15" /> background
                </span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-200 text-[13px] leading-none">How to use</div>
              <div className="text-slate-400">Click a node to focus. Click a neighbor to drill down.</div>
              <div className="text-slate-400">Visited centers stay faintly visible for backtracking.</div>
              <div className="text-slate-400">Drag nodes (Force) to nudge.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, []);

  const selectedInfoNode = useMemo(() => {
    const mentionsRank = selected?.id ? rankByMentions.get(selected.id) : undefined;
    const convosRank = selected?.id ? rankByConvos.get(selected.id) : undefined;
    const showForce = activeViz === "force";
    const edgeCounts = showForce ? forceNeighborCounts : null;

    return (
      <Card className="border-slate-800 border-t-0 bg-slate-900/40 overflow-hidden flex flex-col h-full rounded-t-none shadow-none">
        <CardHeader className="py-1 px-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-slate-100 text-sm">Selected</CardTitle>
              {!selected && <CardDescription className="text-xs leading-tight">Click a blob/cell in the visualization.</CardDescription>}
            </div>
            {activeViz === "force" && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onForceBack}
                  disabled={forcePath.length <= 1}
                  className="h-7 px-2 text-xs"
                  title="Step back one level"
                >
                  Back
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onForceClear}
                  disabled={forcePath.length === 0}
                  className="h-7 px-2 text-xs"
                  title="Clear selection and path"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent id="maps-selected-summary" className="p-2 pt-0 overflow-hidden">
          {!selected ? (
            <div className="text-slate-400 text-sm py-2">No selection yet.</div>
          ) : (
            <div className="space-y-1.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="md:col-span-1">
                  <div className="text-slate-100 font-semibold text-sm leading-tight">
                    {selected.type === "entity" ? `Entity (${selected.category}): ${selected.name}` : `Tag: ${selected.name}`}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                    <span className="rounded border border-slate-700/70 bg-slate-900/30 px-1.5 py-0.5 text-slate-200">
                      {selected.type === "entity" ? "Entity" : "Tag"}
                    </span>
                    {selected.type === "entity" && (
                      <span className="rounded border border-slate-700/70 bg-slate-900/30 px-1.5 py-0.5 text-slate-200">
                        {selected.category || "MISC"}
                      </span>
                    )}
                    <span className="rounded border border-slate-800 bg-slate-950/20 px-1.5 py-0.5 text-slate-400 truncate max-w-[220px]" title={selected.id}>
                      {selected.id}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-slate-800 bg-slate-950/20 px-2 py-1">
                    <div className="text-[11px] text-slate-400">Mentions</div>
                    <div className="text-sm font-semibold text-slate-100 leading-tight">
                      {selected.mentions}
                      {mentionsRank ? <span className="ml-2 text-xs text-slate-400">rank #{mentionsRank}</span> : null}
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/20 px-2 py-1">
                    <div className="text-[11px] text-slate-400">Conversations</div>
                    <div className="text-sm font-semibold text-slate-100 leading-tight">
                      {selected.uniqueConversations}
                      {convosRank ? <span className="ml-2 text-xs text-slate-400">rank #{convosRank}</span> : null}
                    </div>
                  </div>
                </div>
              </div>

              {edgeCounts && (
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-slate-400">Neighbors:</span>
                  <span className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-950/20 px-2 py-0.5">
                    <span className="inline-block w-3 h-[2px] bg-sky-400" />
                    <span className="text-slate-200">Def</span> <span className="text-slate-400">{edgeCounts.defining}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-950/20 px-2 py-0.5">
                    <span className="inline-block w-3 h-[2px] bg-slate-400" />
                    <span className="text-slate-200">Ctx</span> <span className="text-slate-400">{edgeCounts.contextual}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-950/20 px-2 py-0.5">
                    <span className="inline-block w-3 h-[2px] border-t-2 border-dashed border-amber-300" />
                    <span className="text-slate-200">Str</span> <span className="text-slate-400">{edgeCounts.structural}</span>
                  </span>
                  <span className="ml-auto text-slate-500">
                    Top N {settings.forceOverviewTopN} • visited K {settings.forceVisitedK}
                  </span>
                </div>
              )}

              {related.length > 0 && (
                <div
                  className="text-xs text-slate-300 max-h-[3.6em] overflow-hidden"
                  title={related
                    .map((r) => tokenById.get(r.id))
                    .filter(Boolean)
                    .slice(0, 24)
                    .map((t: any) => t.name)
                    .join(", ")}
                >
                  <span className="text-slate-400 font-semibold">Top related:</span>{" "}
                  {related
                    .map((r) => tokenById.get(r.id))
                    .filter(Boolean)
                    .slice(0, 18)
                    .map((t: any) => t.name)
                    .join(", ")}
                </div>
              )}

              {showForce && forcePath.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-200">Breadcrumb</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {forcePath.slice(-7).map((id) => {
                      const t = tokenById.get(id);
                      const label = t ? (t.type === "entity" ? `${t.name}` : t.name) : id;
                      const isActive = selected?.id === id;
                      return (
                        <button
                          key={id}
                          onClick={() => onSelectForceTokenId(id)}
                          className={
                            "max-w-full rounded border px-2 py-0.5 text-[11px] transition-colors " +
                            (isActive
                              ? "border-rose-600/70 bg-rose-600/15 text-slate-100"
                              : "border-slate-700/60 bg-slate-900/20 text-slate-300 hover:bg-slate-900/35")
                          }
                          title="Jump to this center"
                        >
                          <span className="truncate block max-w-[340px]">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [
    activeViz,
    forceNeighborCounts,
    forcePath,
    onForceBack,
    onForceClear,
    onSelectForceTokenId,
    rankByConvos,
    rankByMentions,
    related,
    selected,
    settings.forceOverviewTopN,
    settings.forceVisitedK,
    tokenById,
  ]);

  const vizCardNode = useMemo(() => {
    const rounding = activeViz ? "rounded-none border-t-0 border-b-0" : "rounded-t-none border-t-0";
    return (
      <Card id="active-viz-card" className={"border-slate-800 bg-slate-900/40 overflow-hidden flex flex-col shadow-none " + rounding}>
        <CardContent className="p-0 overflow-hidden flex-1 min-h-0">
          {activeViz ? (
            activeVizNode
          ) : (
            <div className="h-full min-h-[220px] rounded-md border border-slate-800 bg-slate-950/20 flex items-center justify-center text-slate-400 text-sm m-2">
              No visualization selected
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [activeViz, activeVizNode]);

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
      <div ref={containerRef} className="mx-auto w-full max-w-[1600px] px-1 md:px-2 py-1 flex flex-col flex-1 min-h-0">
        <header className="flex items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base md:text-lg font-bold truncate">Maps Lab</h1>
            <span className="rounded border border-rose-500/40 bg-rose-950/30 px-2 py-0.5 text-[10px] font-semibold text-rose-200 shrink-0">
              experimental
            </span>
            <span className="text-[11px] text-slate-500 hidden md:inline truncate">
              4 prototypes • tags + NER + co-occurrence • in-memory
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="h-8 px-2 text-xs">
              <Link to="/">Import</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 px-2 text-xs">
              <Link to={selectedEnrichedFile ? `/data-explorer?file=${encodeURIComponent(selectedEnrichedFile)}` : "/data-explorer"}>
                Explorer
              </Link>
            </Button>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[380px_1fr] gap-1 overflow-hidden min-h-0">
          <div className="flex flex-col gap-1 overflow-hidden min-h-0">
            <div className="rounded-md border border-slate-800 bg-slate-900/30 p-1">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-slate-300 mb-1">Enriched file</div>
                  <FileSelector
                    selectedFile={selectedEnrichedFile}
                    onFileSelect={(filename, type) => {
                      if (type !== "enriched") return;
                      setSelectedEnrichedFile(filename);
                    }}
                    disabled={isLoading}
                    placeholder="Select enriched file…"
                    showNewOption={false}
                    compact={true}
                    showStorageHint={false}
                    allowedTypes={["enriched"]}
                  />
                </div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap">
                  {isLoading ? "Loading…" : enriched ? `${tokens.length} tokens` : "—"}
                </div>
              </div>
            </div>

            <div className="shrink-0 overflow-hidden">{controlsCardNode}</div>

            <div className="flex-1 rounded-md border border-slate-800 bg-slate-900/30 overflow-hidden flex flex-col min-h-0">
              <button
                type="button"
                onClick={() => setPanelOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-2 py-1 text-left"
                title={panelOpen ? "Hide tuning" : "Show tuning"}
              >
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-100">
                  <SlidersHorizontal className="h-4 w-4 text-slate-300" />
                  Tuning
                </span>
                <span className="text-[11px] text-slate-400">{panelOpen ? "Hide" : "Show"}</span>
              </button>
              {panelOpen && (
                <div className="border-t border-slate-800 p-2 flex-1 overflow-y-auto min-h-0">
                  <div className="pr-1">{TuningPanelBody}</div>
                </div>
              )}
            </div>
          </div>

          <div ref={rightColRef} className="overflow-hidden flex flex-col min-h-0">
            <div className="shrink-0 overflow-hidden" style={{ height: RIGHT_LEGEND_PX }}>
              {legendNode}
            </div>
            <div ref={vizSlotRef} className="flex-1 overflow-hidden min-h-0">
              {vizCardNode}
            </div>
            {activeViz && (
              <div className="shrink-0 overflow-hidden" style={{ height: RIGHT_SELECTED_PX }}>
                {selectedInfoNode}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

