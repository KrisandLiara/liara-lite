import React, { useEffect, useMemo, useRef, useState } from "react";
import { hierarchy, pack } from "d3-hierarchy";
import type { Token } from "@/pages/Lite/hooks/useTokenIndex";
import { cn } from "@/lib/utils";

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

export function CirclePackMap({
  tokens,
  onSelect,
  height = 320,
  settings,
  selectedId,
  relatedIds,
}: {
  tokens: Token[];
  onSelect: (tokenId: string) => void;
  height?: number;
  settings?: {
    sizeScale: number;
    padding: number;
    labelMode: "off" | "hover" | "important" | "all";
    topLabels: number;
    minLabelRadius: number;
    // Pack-specific tuning
    packSizeExponent?: number; // exponent applied to sizeScale in weight computation
    packLabelFontSize?: number;
    packHoverStrokeWidth?: number;
    packDimOpacity?: number; // 0..1
    packGlossOpacity?: number; // 0..1
  };
  selectedId?: string | null;
  relatedIds?: Set<string>;
}) {
  const { ref, width } = useElementSize<HTMLDivElement>();
  const [hovered, setHovered] = useState<string | null>(null);

  const cfg = {
    sizeScale: settings?.sizeScale ?? 1,
    padding: settings?.padding ?? 2,
    labelMode: settings?.labelMode ?? "important",
    topLabels: settings?.topLabels ?? 12,
    minLabelRadius: settings?.minLabelRadius ?? 22,
    packSizeExponent: settings?.packSizeExponent ?? 2,
    packLabelFontSize: settings?.packLabelFontSize ?? 12,
    packHoverStrokeWidth: settings?.packHoverStrokeWidth ?? 2,
    packDimOpacity: settings?.packDimOpacity ?? 0.12,
    packGlossOpacity: settings?.packGlossOpacity ?? 1,
  };

  const circles = useMemo(() => {
    const w = Math.floor(width);
    const h = Math.floor(height);
    if (!w || !h || tokens.length === 0) return [];

    const root = hierarchy({ children: tokens.map((t) => ({ ...t })) } as any)
      .sum(
        (d: any) =>
          Math.max(1, Number(d?.mentions || 1)) *
          Math.max(0.25, Math.pow(cfg.sizeScale, Math.max(0.5, cfg.packSizeExponent)))
      )
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const layout = pack().size([w, h]).padding(cfg.padding);
    const out = layout(root).leaves().map((leaf: any) => {
      const t: Token = leaf.data;
      const id = String(t.id);
      const hue = hueFor(id);
      return {
        id,
        name: t.type === "entity" ? `${t.name}` : t.name,
        category: t.category,
        type: t.type,
        mentions: t.mentions,
        convos: t.uniqueConversations,
        x: leaf.x,
        y: leaf.y,
        r: leaf.r,
        fill: `hsl(${hue} 70% 50%)`,
      };
    });

    // Determine "important" labels by top N radius
    const sortedByR = [...out].sort((a, b) => b.r - a.r);
    const topSet = new Set(sortedByR.slice(0, Math.max(0, cfg.topLabels)).map((c) => c.id));

    return out.map((c) => ({
      ...c,
      showLabel:
        cfg.labelMode === "all" ||
        (cfg.labelMode === "hover" && hovered === c.id) ||
        (cfg.labelMode === "important" && (topSet.has(c.id) || c.r >= cfg.minLabelRadius)) ||
        c.id === hovered,
    }));
  }, [tokens, width, height, cfg.sizeScale, cfg.padding, cfg.labelMode, cfg.topLabels, cfg.minLabelRadius, hovered]);

  return (
    <div ref={ref} className="w-full" style={{ height }}>
      {width <= 10 ? (
        <div className="text-slate-400 text-sm">Sizing…</div>
      ) : circles.length === 0 ? (
        <div className="text-slate-400 text-sm">No tokens to visualize.</div>
      ) : (
        <svg width={Math.floor(width)} height={Math.floor(height)} className="block">
          <defs>
            <radialGradient id="bubbleGrad" cx="35%" cy="30%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="65%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
            </radialGradient>
          </defs>

          {circles.map((c) => {
            const isHovered = hovered === c.id;
            const isSelected = !!selectedId && selectedId === c.id;
            const isRelated = !!selectedId && !isSelected && !!relatedIds?.has(c.id);
            const dimOthers = !!selectedId && !isSelected && !isRelated;
            return (
              <g key={c.id}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={c.r}
                  fill={c.fill}
                  fillOpacity={
                    isHovered || isSelected ? 0.6 : isRelated ? 0.42 : dimOthers ? cfg.packDimOpacity : 0.32
                  }
                  stroke={isSelected ? "rgba(56,189,248,0.85)" : "rgba(148,163,184,0.35)"}
                  strokeWidth={isHovered || isSelected ? cfg.packHoverStrokeWidth : 1}
                  className={cn("cursor-pointer transition-all duration-150")}
                  onMouseEnter={() => setHovered(c.id)}
                  onMouseLeave={() => setHovered((cur) => (cur === c.id ? null : cur))}
                  onClick={() => onSelect(c.id)}
                >
                  <title>
                    {c.type === "entity" ? `Entity (${c.category})` : "Tag"}: {c.name} • {c.mentions} mentions •{" "}
                    {c.convos} convos
                  </title>
                </circle>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={c.r}
                  fill="url(#bubbleGrad)"
                  pointerEvents="none"
                  opacity={(dimOthers ? 0.3 : 1) * cfg.packGlossOpacity}
                />

                {c.showLabel && (
                  <text
                    x={c.x}
                    y={c.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="select-none pointer-events-none"
                    style={{
                      fontSize: cfg.packLabelFontSize,
                      fill: "rgba(226,232,240,0.9)",
                      fontWeight: 700,
                      paintOrder: "stroke",
                      stroke: "rgba(2,6,23,0.65)",
                      strokeWidth: 3,
                    }}
                  >
                    {c.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

