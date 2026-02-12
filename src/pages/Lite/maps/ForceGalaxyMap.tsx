import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Token } from "@/pages/Lite/hooks/useTokenIndex";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  SimulationNodeDatum,
} from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";

export type ForceEdgeType = "defining" | "contextual" | "structural";
export type ForceEdge = {
  source: string;
  target: string;
  kind: ForceEdgeType;
  // Explanatory power: sharedConvos / log(globalMentions)
  score?: number;
  sharedConvos?: number;
  globalMentions?: number;
  contextTags?: string[];
};

type Node = SimulationNodeDatum & {
  id: string;
  label: string;
  mentions: number;
  uniqueConversations: number;
  type: "tag" | "entity";
  category?: string;
};

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ width: Math.max(0, r.width), height: Math.max(0, r.height) });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setSize({ width: Math.max(0, r.width), height: Math.max(0, r.height) });
    return () => ro.disconnect();
  }, []);
  return { ref, ...size };
}

function hueFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

function accentForCategory(category?: string) {
  const cat = String(category || "").toUpperCase();
  if (cat === "ORG") return "rgba(20,184,166,0.95)"; // teal-500
  if (cat === "PERSON") return "rgba(59,130,246,0.95)"; // blue-500
  if (cat === "LOC") return "rgba(34,197,94,0.95)"; // green-500
  if (cat === "PRODUCT") return "rgba(245,158,11,0.95)"; // amber-500
  if (cat === "DATE") return "rgba(251,113,133,0.95)"; // rose-400
  return "rgba(148,163,184,0.7)"; // slate-400
}

function hash32(str: string) {
  // FNV-1a-ish (stable, quick)
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ForceGalaxyMap({
  tokens,
  selectedId,
  edges,
  overviewIds,
  neighborIds,
  visitedIds,
  onSelect,
  height = 520,
  settings,
}: {
  tokens: Token[];
  selectedId: string | null;
  edges: ForceEdge[];
  overviewIds: Set<string>;
  neighborIds: Set<string>;
  visitedIds: Set<string>;
  onSelect: (tokenId: string) => void;
  height?: number;
  settings?: {
    sizeScale: number;
    padding: number;
    showRelatedLines: boolean;
    motion: number;
    calmness: number;
    gravity: number;
    labelMode: "off" | "hover" | "important" | "all";
    topLabels: number;
    minLabelRadius: number;
    // Force-specific tuning
    forceChargeStrength?: number; // multiplier for repulsion
    forceCollisionIterations?: number;
    forceLinkOpacity?: number; // 0..1
    forceAlphaDecayMult?: number; // 0.25..2
    forceCenterStrength?: number; // 0..2 (multiplies x/y strength)
    forceShowTooltips?: boolean;
    // Force layout knobs
    forcePinSelectedToCenter?: boolean;
    forceCenterMulSelected?: number;
    forceCenterMulNeighbors?: number;
    forceCenterMulBackground?: number;
    forceChargeCenterMag?: number;
    forceChargeNeighborBaseMag?: number;
    forceChargeNeighborMotionMag?: number;
    forceBackgroundCollideRadius?: number;
    forceLinkDistScale?: number;
    forceLinkDistOffset?: number;
    forceLinkStrengthDefining?: number;
    forceLinkStrengthContextual?: number;
    forceLinkStrengthStructural?: number;
    forceRingPadPx?: number;
    forceRingCollidePadPx?: number;
    forceRingSafetyMult?: number;
    forceRingMinBasePx?: number;
    forceRingMinBaseFactor?: number;
    forceRingGapDefCtxPx?: number;
    forceRingGapCtxStrPx?: number;
    forceFitPaddingPx?: number;
    forceFitExtraOuterPx?: number;
    forceFitMinK?: number;
    forceFitMaxK?: number;
    forceFocusAnimMs?: number;
    forceFitAnimMsFocus?: number;
    forceFitAnimMsReset?: number;
    forceNeighborOpacity?: number;
    forceHideBackgroundWhenFocused?: boolean;
    forceEdgeWidthScale?: number;
    forceFillOpacityCenter?: number;
    forceFillOpacityNeighbor?: number;
    forceFillOpacityVisited?: number;
    forceFillOpacityBackground?: number;
    forceLabelOverflowPx?: number;
    // Type 3 tuning
    forceFadeOpacity?: number; // 0..1
    forceVisitedOpacity?: number; // 0..1
  };
}) {
  const { ref, width } = useElementSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<any>(null);
  const zoomRafRef = useRef<number | null>(null);
  const zoomTRef = useRef<ZoomTransform>(zoomIdentity);
  const [viewT, setViewT] = useState<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1 });
  const [zoomK, setZoomK] = useState(1);
  const zoomKRef = useRef(1);
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const posRef = useRef<Record<string, { x: number; y: number }>>({});
  const anchorsRef = useRef<Record<string, { x: number; y: number }>>({});
  const pendingPosRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  const rafRef = useRef<number | null>(null);
  const nodeCacheRef = useRef<Map<string, Node>>(new Map());
  const dragging = useRef<{
    id: string;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
    didDrag: boolean;
  } | null>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation<Node>> | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [edgeAnimOn, setEdgeAnimOn] = useState(false);
  const focusAnimRef = useRef<{ start: number; dur: number; from: Record<string, { x: number; y: number }> } | null>(null);
  const focusKRef = useRef(1);
  const focusRafRef = useRef<number | null>(null);

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const neighborKindById = useMemo(() => {
    const m = new Map<string, ForceEdgeType>();
    if (!selectedId) return m;
    for (const e of edges) {
      if (e.source !== selectedId) continue;
      m.set(e.target, e.kind);
    }
    return m;
  }, [edges, selectedId]);

  const roleFor = (id: string): { role: string; halo?: string } => {
    if (!selectedId) return { role: "overview" };
    if (id === selectedId) return { role: "center" };
    if (!neighborIds.has(id)) return { role: "background" };

    const kind = neighborKindById.get(id) || "contextual";
    const n = nodeById.get(id);
    const s = selectedNode;
    const sCat = String(s?.category || "").toUpperCase();
    const nCat = String(n?.category || "").toUpperCase();

    // Default role by edge kind (works for tag↔tag and mixed cases).
    let role =
      kind === "defining" ? "defining (what it is)" : kind === "structural" ? "structural (who/where/when)" : "contextual (often with)";
    let halo = kind === "defining" ? "rgba(56,189,248,0.22)" : kind === "structural" ? "rgba(251,191,36,0.18)" : "rgba(148,163,184,0.14)";

    // Role morphing by selection context:
    // PERSON-centered: tags read as skills/interests.
    if (s?.type === "entity" && sCat === "PERSON" && n?.type === "tag") {
      role = "skill / interest";
      halo = "rgba(59,130,246,0.22)";
    }
    // ORG/PRODUCT-centered: tags read as tools/tech.
    if (s?.type === "entity" && (sCat === "ORG" || sCat === "PRODUCT") && n?.type === "tag") {
      role = "tool / technology";
      halo = "rgba(245,158,11,0.20)";
    }
    // Tag-centered: entity neighbors become actor/place/time/etc.
    if (s?.type === "tag" && n?.type === "entity") {
      if (nCat === "PERSON") {
        role = "who (person)";
        halo = "rgba(59,130,246,0.20)";
      } else if (nCat === "ORG" || nCat === "PRODUCT") {
        role = nCat === "ORG" ? "org" : "product / tool";
        halo = nCat === "ORG" ? "rgba(20,184,166,0.18)" : "rgba(245,158,11,0.18)";
      } else if (nCat === "LOC") {
        role = "where (location)";
        halo = "rgba(34,197,94,0.18)";
      } else if (nCat === "DATE") {
        role = "when (date)";
        halo = "rgba(251,113,133,0.18)";
      } else {
        role = "entity";
        halo = "rgba(148,163,184,0.14)";
      }
    }

    return { role, halo };
  };

  const cfg = {
    sizeScale: settings?.sizeScale ?? 1,
    padding: settings?.padding ?? 2,
    showRelatedLines: settings?.showRelatedLines ?? true,
    motion: settings?.motion ?? 0.5,
    calmness: settings?.calmness ?? 0.65,
    gravity: settings?.gravity ?? 0.5,
    labelMode: settings?.labelMode ?? "important",
    topLabels: settings?.topLabels ?? 12,
    minLabelRadius: settings?.minLabelRadius ?? 22,
    forceChargeStrength: settings?.forceChargeStrength ?? 34,
    forceCollisionIterations: settings?.forceCollisionIterations ?? 2,
    forceLinkOpacity: settings?.forceLinkOpacity ?? 0.35,
    forceAlphaDecayMult: settings?.forceAlphaDecayMult ?? 1,
    forceCenterStrength: settings?.forceCenterStrength ?? 1,
    forceShowTooltips: settings?.forceShowTooltips ?? true,
    forcePinSelectedToCenter: settings?.forcePinSelectedToCenter ?? true,
    forceCenterMulSelected: settings?.forceCenterMulSelected ?? 4.2,
    forceCenterMulNeighbors: settings?.forceCenterMulNeighbors ?? 1.6,
    forceCenterMulBackground: settings?.forceCenterMulBackground ?? 1.2,
    forceChargeCenterMag: settings?.forceChargeCenterMag ?? 6,
    forceChargeNeighborBaseMag: settings?.forceChargeNeighborBaseMag ?? 8,
    forceChargeNeighborMotionMag: settings?.forceChargeNeighborMotionMag ?? 10,
    forceBackgroundCollideRadius: settings?.forceBackgroundCollideRadius ?? 0.5,
    forceLinkDistScale: settings?.forceLinkDistScale ?? 1,
    forceLinkDistOffset: settings?.forceLinkDistOffset ?? 0,
    forceLinkStrengthDefining: settings?.forceLinkStrengthDefining ?? 0.26,
    forceLinkStrengthContextual: settings?.forceLinkStrengthContextual ?? 0.14,
    forceLinkStrengthStructural: settings?.forceLinkStrengthStructural ?? 0.18,
    forceRingPadPx: settings?.forceRingPadPx ?? 10,
    forceRingCollidePadPx: settings?.forceRingCollidePadPx ?? 8,
    forceRingSafetyMult: settings?.forceRingSafetyMult ?? 1.12,
    forceRingMinBasePx: settings?.forceRingMinBasePx ?? 104,
    forceRingMinBaseFactor: settings?.forceRingMinBaseFactor ?? 0.125,
    forceRingGapDefCtxPx: settings?.forceRingGapDefCtxPx ?? 14,
    forceRingGapCtxStrPx: settings?.forceRingGapCtxStrPx ?? 16,
    forceFitPaddingPx: settings?.forceFitPaddingPx ?? 42,
    forceFitExtraOuterPx: settings?.forceFitExtraOuterPx ?? 26,
    forceFitMinK: settings?.forceFitMinK ?? 0.5,
    forceFitMaxK: settings?.forceFitMaxK ?? 2.6,
    forceFocusAnimMs: settings?.forceFocusAnimMs ?? 2200,
    forceFitAnimMsFocus: settings?.forceFitAnimMsFocus ?? 1200,
    forceFitAnimMsReset: settings?.forceFitAnimMsReset ?? 600,
    forceNeighborOpacity: settings?.forceNeighborOpacity ?? 0.95,
    forceHideBackgroundWhenFocused: settings?.forceHideBackgroundWhenFocused ?? false,
    forceEdgeWidthScale: settings?.forceEdgeWidthScale ?? 1,
    forceFillOpacityCenter: settings?.forceFillOpacityCenter ?? 0.96,
    forceFillOpacityNeighbor: settings?.forceFillOpacityNeighbor ?? 0.68,
    forceFillOpacityVisited: settings?.forceFillOpacityVisited ?? 0.5,
    forceFillOpacityBackground: settings?.forceFillOpacityBackground ?? 0.38,
    forceLabelOverflowPx: settings?.forceLabelOverflowPx ?? 26,
    forceFadeOpacity: settings?.forceFadeOpacity ?? 0.15,
    forceVisitedOpacity: settings?.forceVisitedOpacity ?? 0.45,
  };

  const visibleNodeIds = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>();
    s.add(selectedId);
    for (const id of neighborIds) s.add(id);
    for (const id of visitedIds) s.add(id);
    return s;
  }, [neighborIds, selectedId, visitedIds]);

  // Pan + zoom (wheel zoom, drag to pan on background).
  // We filter out node interactions so clicks/drags still select/move nodes.
  useEffect(() => {
    const w = Math.floor(width);
    const h = Math.floor(height);
    if (!w || !h) return;
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;

    const s = select(svg);
    const applyT = (t: ZoomTransform) => {
      zoomTRef.current = t;
      zoomKRef.current = t.k;
      if (zoomRafRef.current == null) {
        zoomRafRef.current = requestAnimationFrame(() => {
          zoomRafRef.current = null;
          const tt = zoomTRef.current;
          g.setAttribute("transform", `translate(${tt.x},${tt.y}) scale(${tt.k})`);
          const k = zoomKRef.current;
          // Throttle state updates so zoom doesn't cause heavy React churn.
          setZoomK((prev) => (Math.abs(prev - k) > 0.02 ? k : prev));
          setViewT((prev) => {
            // Update view transform for screen-space label overlay.
            if (Math.abs(prev.x - tt.x) < 0.5 && Math.abs(prev.y - tt.y) < 0.5 && Math.abs(prev.k - tt.k) < 0.002) return prev;
            return { x: tt.x, y: tt.y, k: tt.k };
          });
        });
      }
    };

    // Initialize transform once (keep previous across resizes).
    applyT(zoomTRef.current);

    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3.5])
      .filter((event: any) => {
        // Always allow wheel zoom (even when hovering nodes/edges).
        if (event?.type === "wheel") return true;
        if (dragging.current) return false;
        const tgt = event?.target as Element | null;
        const tag = (tgt?.tagName || "").toLowerCase();
        // Don't start pan/zoom drags when interacting with nodes/labels or edge hover targets.
        if (tag === "circle" || tag === "text" || tag === "line") return false;
        return true;
      })
      .on("zoom", (event: any) => applyT(event.transform as ZoomTransform));

    zoomRef.current = z;
    s.call(z as any);

    return () => {
      s.on(".zoom", null);
      zoomRef.current = null;
      if (zoomRafRef.current != null) cancelAnimationFrame(zoomRafRef.current);
      zoomRafRef.current = null;
    };
  }, [width, height]);

  const centerXY = useMemo(() => {
    const w = Math.floor(width) || 800;
    const h = Math.floor(height) || 520;
    return { w, h, cx: w / 2, cy: h / 2 };
  }, [width, height]);

  const ringLayout = useMemo(() => {
    const { w, h } = centerXY;
    const sizeK = Math.max(0.25, cfg.sizeScale);
    const padWorld = cfg.forceRingPadPx / Math.max(0.7, zoomKRef.current || 1); // screen px -> world
    // Keep ring math aligned with collide() radius so rings don't "inflate" in practice.
    const collidePad = Math.max(0, cfg.forceRingCollidePadPx);
    const effROf = (mentions: number) => (10 + Math.sqrt(mentions) * 1.05) * sizeK + collidePad + Math.max(0, cfg.padding);

    const byKind: Record<ForceEdgeType, Node[]> = { defining: [], contextual: [], structural: [] };
    for (const t of tokens) {
      const k = selectedId ? neighborKindById.get(t.id) : undefined;
      if (!k) continue;
      byKind[k].push({
        id: t.id,
        label: t.type === "entity" ? `${t.name}` : t.name,
        type: t.type,
        category: t.category,
        mentions: t.mentions,
        uniqueConversations: t.uniqueConversations,
      } as any);
    }

    const needR = (arr: Node[], minR: number) => {
      const n = arr.length;
      if (n <= 0) return minR;
      let sumDiam = 0;
      let maxR = 0;
      for (const a of arr) {
        const rr = effROf(a.mentions);
        maxR = Math.max(maxR, rr);
        sumDiam += 2 * rr;
      }
      const circumference = sumDiam + n * padWorld;
      const r = circumference / (2 * Math.PI);
      // Ensure not too tight relative to max bubble size.
      return Math.max(minR, r, maxR * Math.max(1, cfg.forceRingSafetyMult));
    };

    const minBase = Math.max(Math.max(40, cfg.forceRingMinBasePx), Math.min(w, h) * Math.max(0.05, cfg.forceRingMinBaseFactor));
    const defR = needR(byKind.defining, minBase * 0.78);
    // Keep rings closer together; collision handles final spacing.
    const gapDefCtx = Math.max(0, cfg.forceRingGapDefCtxPx) * sizeK;
    const gapCtxStr = Math.max(0, cfg.forceRingGapCtxStrPx) * sizeK;
    const ctxR = needR(byKind.contextual, Math.max(defR + gapDefCtx, minBase * 0.94));
    const strR = needR(byKind.structural, Math.max(ctxR + gapCtxStr, minBase * 1.08));

    return {
      ringR: { defining: defR, contextual: ctxR, structural: strR } as const,
    };
  }, [
    centerXY,
    cfg.forceRingCollidePadPx,
    cfg.forceRingGapCtxStrPx,
    cfg.forceRingGapDefCtxPx,
    cfg.forceRingMinBaseFactor,
    cfg.forceRingMinBasePx,
    cfg.forceRingPadPx,
    cfg.forceRingSafetyMult,
    cfg.padding,
    cfg.sizeScale,
    neighborKindById,
    selectedId,
    tokens,
  ]);

  // Auto "fit to focus": when focused, gently zoom to fill the viewport with the outer ring.
  useEffect(() => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;
    const w = Math.floor(width);
    const h = Math.floor(height);
    if (!w || !h) return;

    const s = select(svg);
    const cx = w / 2;
    const cy = h / 2;
    const rr = ringLayout.ringR;
    const outer = selectedId
      ? Math.max(rr.defining, rr.contextual, rr.structural) + Math.max(0, cfg.forceFitExtraOuterPx)
      : Math.min(w, h) * 0.35;
    const pad = Math.max(0, cfg.forceFitPaddingPx);
    const fitK = selectedId ? Math.min((w - pad * 2) / (outer * 2), (h - pad * 2) / (outer * 2)) : 1;
    const k = Math.max(Math.max(0.05, cfg.forceFitMinK), Math.min(Math.max(cfg.forceFitMinK, cfg.forceFitMaxK), fitK));
    const tx = (1 - k) * cx;
    const ty = (1 - k) * cy;
    const t = zoomIdentity.translate(tx, ty).scale(k);

    s.interrupt();
    s.transition()
      .duration(selectedId ? Math.max(50, cfg.forceFitAnimMsFocus) : Math.max(50, cfg.forceFitAnimMsReset))
      .ease((t: number) => 1 - Math.pow(1 - t, 3))
      .call(z.transform, t as any);
  }, [
    cfg.forceFitAnimMsFocus,
    cfg.forceFitAnimMsReset,
    cfg.forceFitExtraOuterPx,
    cfg.forceFitMaxK,
    cfg.forceFitMinK,
    cfg.forceFitPaddingPx,
    height,
    ringLayout,
    selectedId,
    width,
  ]);

  const nodes = useMemo(() => {
    const w = Math.floor(width) || 800;
    const h = Math.floor(height) || 520;
    const cx = w / 2;
    const cy = h / 2;
    const centerPos = selectedId ? posRef.current[selectedId] : null;
    const cpx = centerPos?.x ?? cx;
    const cpy = centerPos?.y ?? cy;

    const { ringR } = ringLayout;

    const cache = nodeCacheRef.current;
    const nextIds = new Set<string>();
    const out: Node[] = [];

    for (const t of tokens) {
      const id = t.id;
      nextIds.add(id);

      let n = cache.get(id);
      if (!n) {
        const rand = mulberry32(hash32(`${selectedId || "overview"}|${id}`));
        const ang = rand() * Math.PI * 2;
        const kind = selectedId ? neighborKindById.get(id) : undefined;
        const r = kind ? ringR[kind] : 40 + rand() * 90;
        n = {
          id,
          label: t.type === "entity" ? `${t.name}` : t.name,
          type: t.type,
          category: t.category,
          mentions: t.mentions,
          uniqueConversations: t.uniqueConversations,
          // Spawn new nodes near the current center so they don't "fly in" from random space.
          x: cpx + Math.cos(ang) * r,
          y: cpy + Math.sin(ang) * r,
          vx: 0,
          vy: 0,
        } as Node;
        cache.set(id, n);
      } else {
        // Update metadata but keep physics state (x/y/vx/vy) for stability.
        n.label = t.type === "entity" ? `${t.name}` : t.name;
        n.type = t.type;
        n.category = t.category;
        n.mentions = t.mentions;
        n.uniqueConversations = t.uniqueConversations;
      }

      out.push(n);
    }

    // Drop nodes that are no longer present.
    for (const id of cache.keys()) {
      if (!nextIds.has(id)) cache.delete(id);
    }

    return out;
  }, [tokens, width, height, selectedId, neighborKindById, ringLayout]);

  const nodeById = useMemo(() => {
    const m = new Map<string, Node>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const selectedNode = useMemo(() => (selectedId ? nodeById.get(selectedId) || null : null), [nodeById, selectedId]);

  const edgePowerScale = useMemo(() => {
    if (!selectedId) return { min: 0, max: 1 };
    const ps = edges
      .filter((e) => e.source === selectedId)
      .map((e) => (typeof e.score === "number" ? e.score : 0))
      .filter((p) => Number.isFinite(p) && p > 0);
    if (!ps.length) return { min: 0, max: 1 };
    const min = Math.min(...ps);
    const max = Math.max(...ps);
    return max <= min ? { min, max: min + 1 } : { min, max };
  }, [edges, selectedId]);

  const edgeMetaByTarget = useMemo(() => {
    const m = new Map<string, ForceEdge>();
    if (!selectedId) return m;
    for (const e of edges) {
      if (e.source !== selectedId) continue;
      m.set(e.target, e);
    }
    return m;
  }, [edges, selectedId]);

  const edgeTooltipText = useMemo(() => {
    const centerLabel = selectedNode ? selectedNode.label : "center";
    return (e: ForceEdge) => {
      const tgt = nodeById.get(e.target);
      const tgtLabel = tgt ? tgt.label : e.target;
      const shared = e.sharedConvos ?? 0;
      const gm = e.globalMentions ?? (tgt?.mentions ?? 0);
      const power = typeof e.score === "number" ? e.score : 0;
      const ctx = Array.isArray(e.contextTags) ? e.contextTags.filter(Boolean) : [];
      const ctxLine = ctx.length ? `Common co-tags: ${ctx.slice(0, 3).join(", ")}` : "";
      return [
        `${centerLabel} ↔ ${tgtLabel}`,
        `Appears together in ${shared} conversations`,
        `Explanatory power: ${(power || 0).toFixed(2)} = ${shared} / log(1 + ${Math.max(1, gm)})`,
        ctxLine,
      ]
        .filter(Boolean)
        .join("\n");
    };
  }, [nodeById, selectedNode]);

  const edgeKey = useMemo(() => {
    if (!selectedId || edges.length === 0) return "";
    const parts = edges.map((e) => `${e.kind}:${e.source}->${e.target}`).sort();
    return parts.join("|");
  }, [edges, selectedId]);

  // Snapshot current layout as "anchors" when focusing.
  // This helps keep background nodes stable while we pull the selected cluster to center.
  useEffect(() => {
    if (selectedId) {
      anchorsRef.current = posRef.current || {};
    } else {
      anchorsRef.current = {};
    }
  }, [selectedId]);

  // Smooth focus transition (selected moves to center; neighbors settle into rings).
  useEffect(() => {
    if (focusRafRef.current != null) cancelAnimationFrame(focusRafRef.current);
    focusRafRef.current = null;

    if (!selectedId) {
      focusAnimRef.current = null;
      focusKRef.current = 1;
      return;
    }

    const from = posRef.current || {};
    // Give it time to feel like a "settling" rather than a snap.
    focusAnimRef.current = { start: performance.now(), dur: Math.max(150, cfg.forceFocusAnimMs), from };
    focusKRef.current = 0;

    const tick = () => {
      const a = focusAnimRef.current;
      if (!a) return;
      const t = Math.max(0, Math.min(1, (performance.now() - a.start) / Math.max(1, a.dur)));
      focusKRef.current = easeOutCubic(t);
      if (t < 1) focusRafRef.current = requestAnimationFrame(tick);
      else focusRafRef.current = null;
      // Keep the sim slightly warm during the transition so it follows the moving targets.
      if (simRef.current) simRef.current.alpha(Math.max(simRef.current.alpha(), 0.12)).restart();
    };
    focusRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (focusRafRef.current != null) cancelAnimationFrame(focusRafRef.current);
      focusRafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.forceFocusAnimMs, edgeKey, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setEdgeAnimOn(false);
    const id = requestAnimationFrame(() => setEdgeAnimOn(true));
    return () => cancelAnimationFrame(id);
  }, [selectedId, edgeKey]);

  // Stop the simulation on unmount only.
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (focusRafRef.current != null) cancelAnimationFrame(focusRafRef.current);
      focusRafRef.current = null;
      simRef.current?.stop();
      simRef.current = null;
    };
  }, []);

  // Keep a single simulation instance and update forces in-place.
  useEffect(() => {
    const w = Math.floor(width);
    const h = Math.floor(height);
    if (!w || !h || nodes.length === 0) return;

    nodesRef.current = nodes;

    const motionK = Math.max(0, Math.min(1, cfg.motion));
    const calmK = Math.max(0, Math.min(1, cfg.calmness));
    const gravK = Math.max(0, Math.min(1, cfg.gravity));
    const sizeK = Math.max(0.25, cfg.sizeScale);
    const pad = cfg.padding;
    const centerK = Math.max(0, Math.min(2, cfg.forceCenterStrength));

    const baseCenterStrength = (0.01 + gravK * 0.08) * centerK;
    const collidePad = Math.max(0, cfg.forceRingCollidePadPx);

    const links = selectedId
      ? edges
          .filter((e) => e.source === selectedId)
          .map((e) => ({ source: e.source, target: e.target, kind: e.kind }))
      : [];

    const kindByNeighborId = new Map<string, ForceEdgeType>();
    for (const l of links) kindByNeighborId.set(l.target, l.kind as ForceEdgeType);

    const { ringR } = ringLayout;
    const cx = w / 2;
    const cy = h / 2;

    // Evenly distribute each ring (with tiny deterministic jitter) so the ring "fills" nicely.
    const scoreByTarget = new Map<string, number>();
    if (selectedId) {
      for (const e of edges) if (e.source === selectedId) scoreByTarget.set(e.target, typeof e.score === "number" ? e.score : 0);
    }
    const idsByKind: Record<ForceEdgeType, string[]> = { defining: [], contextual: [], structural: [] };
    for (const [id, k] of kindByNeighborId.entries()) idsByKind[k].push(id);
    for (const k of Object.keys(idsByKind) as ForceEdgeType[]) {
      idsByKind[k].sort((a, b) => (scoreByTarget.get(b) || 0) - (scoreByTarget.get(a) || 0));
    }
    const angleMap = new Map<string, number>();
    for (const k of Object.keys(idsByKind) as ForceEdgeType[]) {
      const arr = idsByKind[k];
      const n = Math.max(1, arr.length);
      for (let i = 0; i < arr.length; i++) {
        const id = arr[i];
        const base = (i / n) * Math.PI * 2;
        const jitter = (mulberry32(hash32(`${selectedId || "overview"}|j|${id}`))() - 0.5) * (Math.PI * 2 * 0.04);
        angleMap.set(id, base + jitter);
      }
    }
    const angleFor = (id: string) => angleMap.get(id) ?? mulberry32(hash32(`${selectedId || "overview"}|angle|${id}`))() * Math.PI * 2;

    const ringTargetFor = (d: Node) => {
      const k = kindByNeighborId.get(d.id) || "contextual";
      const ang = angleFor(d.id);
      const rr = ringR[k];
      return { x: cx + Math.cos(ang) * rr, y: cy + Math.sin(ang) * rr };
    };

    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const fromMap = focusAnimRef.current?.from || {};
    const focusK = () => focusKRef.current;

    const targetX = (d: Node) => {
      if (!selectedId) return cx;
      const k = focusK();
      const from = fromMap[d.id] || anchorsRef.current[d.id] || { x: d.x || cx, y: d.y || cy };
      if (d.id === selectedId) return lerp(from.x, cx, k);
      if (neighborIds.has(d.id)) return lerp(from.x, ringTargetFor(d).x, k);
      const a = anchorsRef.current[d.id];
      const dest = a ? a.x : cx;
      return lerp(from.x, dest, k);
    };
    const targetY = (d: Node) => {
      if (!selectedId) return cy;
      const k = focusK();
      const from = fromMap[d.id] || anchorsRef.current[d.id] || { x: d.x || cx, y: d.y || cy };
      if (d.id === selectedId) return lerp(from.y, cy, k);
      if (neighborIds.has(d.id)) return lerp(from.y, ringTargetFor(d).y, k);
      const a = anchorsRef.current[d.id];
      const dest = a ? a.y : cy;
      return lerp(from.y, dest, k);
    };

    // Optionally pin the focused node to true center so "fit to focus" actually centers.
    // (We still allow dragging; on release we re-pin if it's the selected node.)
    if (selectedId && cfg.forcePinSelectedToCenter) {
      const sN = nodes.find((n) => n.id === selectedId);
      if (sN) {
        sN.fx = cx;
        sN.fy = cy;
      }
    }

    const sim = simRef.current || forceSimulation<Node>(nodes);
    simRef.current = sim;
    sim.nodes(nodes);

    sim
      .alphaDecay((0.02 + (1 - motionK) * 0.06) * Math.max(0.25, Math.min(2, cfg.forceAlphaDecayMult)))
      .velocityDecay(0.08 + calmK * 0.55);

    sim.force(
      "charge",
      forceManyBody<Node>().strength((d) => {
        if (!selectedId) return -10 - motionK * cfg.forceChargeStrength;
        if (d.id === selectedId) return -Math.max(0, cfg.forceChargeCenterMag); // keep center steady; links do the explanation
        if (neighborIds.has(d.id))
          return -(Math.max(0, cfg.forceChargeNeighborBaseMag) + motionK * Math.max(0, cfg.forceChargeNeighborMotionMag)); // tighter wreath
        return -10 - motionK * cfg.forceChargeStrength; // background can stay "spaced"
      })
    );
    sim.force(
      "collide",
      forceCollide<Node>()
        // Extra padding improves readability (less label overlap).
        .radius((d) => {
          if (selectedId && d.id !== selectedId && !neighborIds.has(d.id)) return Math.max(0, cfg.forceBackgroundCollideRadius); // background should not inflate focus rings
          return (10 + Math.sqrt(d.mentions) * 1.05) * sizeK + collidePad + pad;
        })
        .iterations(Math.max(1, Math.min(6, Math.round(cfg.forceCollisionIterations))))
    );

    sim.force(
      "x",
      forceX<Node>(targetX).strength((d) => {
        if (!selectedId) return baseCenterStrength;
        if (d.id === selectedId) return baseCenterStrength * Math.max(0, cfg.forceCenterMulSelected);
        if (neighborIds.has(d.id)) return baseCenterStrength * Math.max(0, cfg.forceCenterMulNeighbors);
        return baseCenterStrength * Math.max(0, cfg.forceCenterMulBackground);
      })
    );
    sim.force(
      "y",
      forceY<Node>(targetY).strength((d) => {
        if (!selectedId) return baseCenterStrength;
        if (d.id === selectedId) return baseCenterStrength * Math.max(0, cfg.forceCenterMulSelected);
        if (neighborIds.has(d.id)) return baseCenterStrength * Math.max(0, cfg.forceCenterMulNeighbors);
        return baseCenterStrength * Math.max(0, cfg.forceCenterMulBackground);
      })
    );

    // With explicit ring targets via x/y, we don't need a radial force.
    sim.force("radial", null);

    if (links.length && cfg.showRelatedLines) {
      sim.force(
        "link",
        forceLink<Node, any>(links as any)
          .id((d: any) => d.id)
          .distance((l: any) => {
            const base = l.kind === "defining" ? ringR.defining : l.kind === "structural" ? ringR.structural : ringR.contextual;
            return Math.max(12, base * Math.max(0.25, cfg.forceLinkDistScale) + (cfg.forceLinkDistOffset || 0));
          })
          .strength((l: any) =>
            l.kind === "defining"
              ? Math.max(0, cfg.forceLinkStrengthDefining)
              : l.kind === "structural"
                ? Math.max(0, cfg.forceLinkStrengthStructural)
                : Math.max(0, cfg.forceLinkStrengthContextual)
          )
      );
    } else {
      sim.force("link", null);
    }

    sim.on("tick", () => {
      const next: Record<string, { x: number; y: number }> = {};
      for (const n of nodes) next[n.id] = { x: n.x || 0, y: n.y || 0 };
      posRef.current = next;
      pendingPosRef.current = next;
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          if (pendingPosRef.current) setPos(pendingPosRef.current);
        });
      }
    });

    // Gentle reheat only.
    const reheat = selectedId ? 0.16 : 0.4;
    sim.alpha(Math.max(sim.alpha(), reheat)).restart();
  }, [
    nodes,
    width,
    height,
    edgeKey,
    selectedId,
    neighborIds,
    ringLayout,
    cfg.motion,
    cfg.calmness,
    cfg.gravity,
    cfg.sizeScale,
    cfg.padding,
    cfg.showRelatedLines,
    cfg.forceChargeStrength,
    cfg.forceCollisionIterations,
    cfg.forceAlphaDecayMult,
    cfg.forceCenterStrength,
    edges,
  ]);

  // Note: we already start the sim at a lower alpha on focus changes,
  // so we avoid extra "reheat" restarts that can cause visible jumps.

  const onPointerDown = (e: React.PointerEvent<SVGCircleElement>, id: string) => {
    const p = pos[id];
    if (!p) return;
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = { id, startX: x, startY: y, dx: p.x - x, dy: p.y - y, didDrag: false };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const { id, dx, dy } = dragging.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!dragging.current.didDrag) {
      const dd = Math.hypot(x - dragging.current.startX, y - dragging.current.startY);
      if (dd >= 4) {
        dragging.current.didDrag = true;
        const n0 = nodesRef.current.find((n) => n.id === id);
        if (n0) {
          n0.fx = x + dx;
          n0.fy = y + dy;
        }
        if (simRef.current) simRef.current.alpha(Math.max(simRef.current.alpha(), 0.22)).restart();
      }
    }
    const n = nodesRef.current.find((n) => n.id === id);
    if (n) {
      n.fx = x + dx;
      n.fy = y + dy;
    }
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    const { id, didDrag } = dragging.current;
    dragging.current = null;
    const n = nodesRef.current.find((n) => n.id === id);
    if (n) {
      // Keep the selected node pinned to center; others release normally.
      if (selectedId && id === selectedId && cfg.forcePinSelectedToCenter) {
        const w = Math.floor(width) || 800;
        const h = Math.floor(height) || 520;
        n.fx = w / 2;
        n.fy = h / 2;
      } else {
        n.fx = null;
        n.fy = null;
      }
    }
    // If it wasn't a drag, treat it as a click (no extra reheat on pointerdown).
    if (!didDrag) onSelect(id);
  };

  const opacityFor = (id: string) => {
    if (!selectedId) return 1;
    if (id === selectedId) return 1;
    if (neighborIds.has(id)) return Math.max(0.1, Math.min(1, cfg.forceNeighborOpacity));
    if (visitedIds.has(id)) return Math.max(0, Math.min(1, cfg.forceVisitedOpacity));
    if (overviewIds.has(id)) return Math.max(0, Math.min(1, cfg.forceFadeOpacity));
    // Non-overview nodes (should be rare) fade slightly more.
    return Math.max(0, Math.min(1, cfg.forceFadeOpacity * 0.85));
  };

  const labelScreenStyle = (rScreen: number) => {
    // Allow labels to spill outside the bubble edge a bit.
    // This is in screen pixels (so it feels consistent while zooming).
    const overflowPx = Math.max(0, cfg.forceLabelOverflowPx);
    const maxWidth = Math.max(30, 2 * rScreen + overflowPx * 2 - 10);
    // Keep sizes modest; rely on condensed font for fit/readability.
    const fontSize = Math.max(11, Math.min(16, 8.8 + Math.log2(Math.max(10, rScreen)) * 2.6));
    return { maxWidth, fontSize };
  };

  return (
    <div
      ref={ref}
      className="w-full rounded-lg border border-slate-800 bg-slate-950/20 relative overflow-hidden"
      style={{ height }}
    >
      {width <= 10 ? (
        <div className="text-slate-400 text-sm p-4">Sizing…</div>
      ) : (
        <>
          <svg
            ref={svgRef}
            width={Math.floor(width)}
            height={Math.floor(height)}
            className="block"
            style={{ touchAction: "none" }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <g ref={gRef}>
            {/* Edges: typed "explanation spokes" out of selected */}
            {cfg.showRelatedLines &&
              selectedId &&
              edges
                .filter((e) => e.source === selectedId)
                .map((e) => {
                  const a = pos[e.source];
                  const b = pos[e.target];
                  if (!a || !b) return null;
                  const len = Math.hypot(b.x - a.x, b.y - a.y);
                  const baseOpacity = Math.max(0.05, Math.min(0.95, cfg.forceLinkOpacity));
                  const stroke =
                    e.kind === "defining"
                      ? `rgba(56,189,248,${Math.min(0.85, baseOpacity + 0.18)})`
                      : e.kind === "structural"
                        ? `rgba(251,191,36,${Math.min(0.78, baseOpacity + 0.12)})`
                        : `rgba(148,163,184,${Math.max(0.06, baseOpacity * 0.62)})`;
                  const pwr = typeof e.score === "number" ? e.score : 0;
                  const k = Math.max(0, Math.min(1, (pwr - edgePowerScale.min) / (edgePowerScale.max - edgePowerScale.min)));
                  const baseW = e.kind === "defining" ? 1.35 : e.kind === "structural" ? 1.1 : 0.95;
                  const strokeWidth = baseW * (0.9 + 1.05 * k) * Math.max(0.2, cfg.forceEdgeWidthScale);
                  const dashLen = Math.max(8, Math.ceil(len) + 12);
                  const dash = e.kind === "structural" ? "6 6" : `${dashLen}`;
                  const dashOffset = edgeAnimOn ? 0 : dashLen;
                  const opacity = e.kind === "structural" ? (edgeAnimOn ? 1 : 0) : 1;
                  return (
                    <g key={`edge-${e.kind}-${e.target}`}>
                      {cfg.forceShowTooltips && (
                        <line
                          x1={a.x}
                          y1={a.y}
                          x2={b.x}
                          y2={b.y}
                          stroke="transparent"
                          strokeWidth={Math.max(10, strokeWidth + 8)}
                          strokeLinecap="round"
                          pointerEvents="stroke"
                          style={{ cursor: "help" }}
                        >
                          <title>{edgeTooltipText(e)}</title>
                        </line>
                      )}
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dash}
                        strokeDashoffset={dashOffset as any}
                        strokeLinecap="round"
                        opacity={opacity}
                        pointerEvents="none"
                        style={{ transition: "stroke-dashoffset 420ms ease, opacity 240ms ease" }}
                      />
                    </g>
                  );
                })}

            {nodesRef.current
              .filter((n) => (!visibleNodeIds ? true : visibleNodeIds.has(n.id)))
              .filter((n) => (!selectedId || !cfg.forceHideBackgroundWhenFocused ? true : neighborIds.has(n.id) || n.id === selectedId))
              .map((n) => {
              const p = pos[n.id] || { x: n.x || 0, y: n.y || 0 };
              const rBase = (10 + Math.sqrt(n.mentions) * 1.05) * Math.max(0.25, cfg.sizeScale);
              const isSelected = selectedId === n.id;
              const isNeighbor = selectedId ? neighborIds.has(n.id) : false;
              const isVisited = selectedId ? visitedIds.has(n.id) : false;
              const o = opacityFor(n.id);
              const role = roleFor(n.id);
              const popK = selectedId && isNeighbor ? (edgeAnimOn ? 1 : 0.92) : 1;
              const roleScale = isSelected ? 1.22 : isNeighbor ? 1.1 : 1;
              const r = rBase * popK * roleScale;
              const fill =
                n.type === "tag" ? `hsl(${(268 + (hueFor(n.id) % 18) - 9 + 360) % 360} 80% 55%)` : "hsl(215 20% 55%)";
              const stroke = isSelected
                ? "rgba(56,189,248,0.95)"
                : n.type === "entity"
                  ? accentForCategory(n.category)
                  : "rgba(167,139,250,0.65)";
              const important = rBase >= cfg.minLabelRadius;
              const showLabel =
                cfg.labelMode !== "off" &&
                (!selectedId ||
                  cfg.labelMode === "all" ||
                  (cfg.labelMode === "hover" && hovered === n.id) ||
                  (cfg.labelMode === "important" && (important || isSelected || isNeighbor || isVisited)) ||
                  isSelected ||
                  isNeighbor ||
                  isVisited ||
                  hovered === n.id);
              return (
                <g key={n.id} opacity={o}>
                  {selectedId && isNeighbor && role.halo && <circle cx={p.x} cy={p.y} r={r + 8} fill={role.halo} stroke="none" />}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill={fill}
                    // More solid fills so spokes don't dominate.
                    fillOpacity={
                      isSelected
                        ? Math.max(0, Math.min(1, cfg.forceFillOpacityCenter))
                        : isNeighbor
                          ? Math.max(0, Math.min(1, cfg.forceFillOpacityNeighbor))
                          : isVisited
                            ? Math.max(0, Math.min(1, cfg.forceFillOpacityVisited))
                            : Math.max(0, Math.min(1, cfg.forceFillOpacityBackground))
                    }
                    stroke={stroke}
                    strokeWidth={isSelected ? 3.2 : isNeighbor ? 2.2 : isVisited ? 1.7 : 1.1}
                    className="cursor-pointer transition-[fill-opacity,stroke-width,opacity] duration-150"
                    style={{ transition: "r 220ms ease, fill-opacity 150ms ease, stroke-width 150ms ease, opacity 150ms ease" }}
                    onPointerDown={(e) => onPointerDown(e, n.id)}
                    onPointerEnter={() => setHovered(n.id)}
                    onPointerLeave={() => setHovered((cur) => (cur === n.id ? null : cur))}
                  >
                    {cfg.forceShowTooltips && (
                      <title>
                        {(n.type === "entity" ? `Entity (${n.category})` : "Tag") + `: ${n.label}`}
                        {"\n"}
                        {selectedId ? `Role: ${role.role}` : ""}
                        {"\n"}
                        {selectedId && isNeighbor && edgeMetaByTarget.get(n.id)
                          ? `Appears with center in ${edgeMetaByTarget.get(n.id)!.sharedConvos ?? 0} conversations`
                          : ""}
                        {selectedId && isNeighbor && edgeMetaByTarget.get(n.id)?.contextTags?.length
                          ? `Common co-tags: ${edgeMetaByTarget.get(n.id)!.contextTags!.slice(0, 3).join(", ")}`
                          : ""}
                        {selectedId && isNeighbor && typeof edgeMetaByTarget.get(n.id)?.score === "number"
                          ? `Explanatory power: ${edgeMetaByTarget.get(n.id)!.score!.toFixed(2)}`
                          : ""}
                        {"\n"}
                        {n.mentions} mentions • {n.uniqueConversations} convos
                      </title>
                    )}
                  </circle>
                </g>
              );
            })}
          </g>
          </svg>

          {/* Screen-space label overlay (stable, crisp, reveals full word on zoom) */}
          <div className="absolute inset-0 pointer-events-none">
            {nodesRef.current
              .filter((n) => (!visibleNodeIds ? true : visibleNodeIds.has(n.id)))
              .filter((n) => (!selectedId || !cfg.forceHideBackgroundWhenFocused ? true : neighborIds.has(n.id) || n.id === selectedId))
              .map((n) => {
              const p = pos[n.id] || { x: n.x || 0, y: n.y || 0 };
              const rBase = (10 + Math.sqrt(n.mentions) * 1.05) * Math.max(0.25, cfg.sizeScale);
              const isSelected = selectedId === n.id;
              const isNeighbor = selectedId ? neighborIds.has(n.id) : false;
              const isVisited = selectedId ? visitedIds.has(n.id) : false;
              const important = rBase >= cfg.minLabelRadius;
              const showLabel =
                cfg.labelMode !== "off" &&
                (!selectedId ||
                  cfg.labelMode === "all" ||
                  (cfg.labelMode === "hover" && hovered === n.id) ||
                  (cfg.labelMode === "important" && (important || isSelected || isNeighbor || isVisited)) ||
                  isSelected ||
                  isNeighbor ||
                  isVisited ||
                  hovered === n.id);
              if (!showLabel) return null;

              const popK = selectedId && isNeighbor ? (edgeAnimOn ? 1 : 0.92) : 1;
              const roleScale = isSelected ? 1.22 : isNeighbor ? 1.1 : 1;
              const r = rBase * popK * roleScale;
              const sx = viewT.x + p.x * viewT.k;
              const sy = viewT.y + p.y * viewT.k;
              const rScreen = r * viewT.k;
              const { maxWidth, fontSize } = labelScreenStyle(rScreen);

              return (
                <div
                  key={`lbl-${n.id}`}
                  style={{
                    position: "absolute",
                    left: sx,
                    top: sy,
                    transform: "translate(-50%, -50%)",
                    maxWidth,
                    fontSize,
                    lineHeight: 1,
                    fontWeight: 750,
                    fontFamily:
                      '"Arial Narrow","Roboto Condensed","Segoe UI",ui-sans-serif,system-ui,-apple-system,Roboto,Arial,"Noto Sans","Liberation Sans",sans-serif',
                    fontStretch: "condensed",
                    letterSpacing: "-0.015em",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                    color: "rgba(248,250,252,0.98)",
                    // Avoid heavy strokes (they can overpower thin condensed fonts).
                    WebkitTextStroke: "0.5px rgba(2,6,23,0.92)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textAlign: "center",
                    // Crisp outline + gentle lift.
                    textShadow:
                      "0 0 0 rgba(0,0,0,0)," +
                      " 0 1px 0 rgba(2,6,23,0.95)," +
                      " 0 -1px 0 rgba(2,6,23,0.95)," +
                      " 1px 0 0 rgba(2,6,23,0.95)," +
                      " -1px 0 0 rgba(2,6,23,0.95)," +
                      " 0 2px 10px rgba(2,6,23,0.35)",
                  }}
                >
                  {n.label}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

