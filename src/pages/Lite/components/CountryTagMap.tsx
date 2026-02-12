import React, { useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";
import { hierarchy } from "d3-hierarchy";
import { voronoiTreemap } from "d3-voronoi-treemap";
import { cn } from "@/lib/utils";

type TagDatum = {
  id?: string;
  name: string;
  // value is the displayed "count" (e.g. mentions)
  value: number;
  // weight is optional layout weight (can be scaled); if omitted, value is used
  weight?: number;
};

function mulberry32(seed: number) {
  // Deterministic PRNG (0..1)
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeedFromTags(tags: TagDatum[]) {
  // Stable seed from ids+weights so layout stays fixed across rerenders
  let h = 2166136261;
  for (const t of tags) {
    const id = String(t.id ?? t.name);
    const w = String(t.weight ?? t.value ?? 0);
    const s = `${id}:${w};`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}

function hashHue(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 360;
}

function centroid(poly: Array<[number, number]>): [number, number] {
  if (!poly.length) return [0, 0];
  let x = 0;
  let y = 0;
  for (const [px, py] of poly) {
    x += px;
    y += py;
  }
  return [x / poly.length, y / poly.length];
}

function polygonPath(poly: Array<[number, number]>): string {
  if (!poly.length) return "";
  const [x0, y0] = poly[0];
  let d = `M ${x0.toFixed(2)} ${y0.toFixed(2)}`;
  for (let i = 1; i < poly.length; i++) {
    const [x, y] = poly[i];
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d + " Z";
}

function polygonArea(poly: Array<[number, number]>): number {
  // Shoelace formula (absolute area)
  if (!poly || poly.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeClipId(id: string) {
  // SVG ids can't contain certain characters reliably; keep it simple
  return `clip-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

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
    // initial
    const r = el.getBoundingClientRect();
    setSize({ width: Math.max(0, r.width), height: Math.max(0, r.height) });
    return () => ro.disconnect();
  }, []);

  return { ref, ...size };
}

export function CountryTagMap({
  tags,
  height = 320,
  className,
  onSelect,
  selectedId,
  labelMode = "important",
  topLabels = 12,
  enableZoomPan = true,
  showZoomControls = true,
  zoomMax = 12,
  wheelSpeed = 1,
  lodFadeStartPx = 5,
  lodFadeRangePx = 10,
}: {
  tags: TagDatum[];
  height?: number;
  className?: string;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  labelMode?: "off" | "hover" | "important" | "all";
  topLabels?: number;
  enableZoomPan?: boolean;
  showZoomControls?: boolean;
  zoomMax?: number;
  wheelSpeed?: number;
  lodFadeStartPx?: number;
  lodFadeRangePx?: number;
}) {
  const { ref, width } = useElementSize<HTMLDivElement>();
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<ReturnType<typeof zoom> | null>(null);
  const [zt, setZt] = useState<ZoomTransform>(zoomIdentity);

  const layout = useMemo(() => {
    const w = Math.floor(width);
    const h = Math.floor(height);
    if (!w || !h || !tags.length) return [];

    // Clip polygon = rectangle
    const clip: Array<[number, number]> = [
      [0, 0],
      [w, 0],
      [w, h],
      [0, h],
    ];

    const root = hierarchy({ children: tags.map((t) => ({ ...t })) } as any)
      .sum((d: any) => Number(d?.weight ?? d?.value ?? 0))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const vt = voronoiTreemap();
    // Best-effort config: library versions differ; guard all calls.
    try {
      vt.clip?.(clip);
      vt.size?.([w, h]);
      vt.convergenceRatio?.(0.01);
      vt.maxIterationCount?.(80);
      // Make the layout deterministic (prevents "map changes" on rerender)
      const seed = hashSeedFromTags(tags);
      vt.prng?.(mulberry32(seed));
    } catch {
      // ignore
    }

    try {
      vt(root);
    } catch {
      return [];
    }

    const leaves = root.leaves?.() || [];
    const cells = leaves
      .map((leaf: any) => {
        const id = String(leaf?.data?.id || leaf?.data?.name || "");
        const name = String(leaf?.data?.name || "");
        // Displayed count is the raw 'value'; layout uses the weighted sum.
        const value = Number(leaf?.data?.value ?? leaf?.value ?? 0);
        const poly: Array<[number, number]> = (leaf?.polygon || leaf?.data?.polygon || []) as any;
        if (!id || !name || !poly || poly.length < 3) return null;
        const [cx, cy] = centroid(poly);
        const hue = hashHue(id);
        const fill = `hsl(${hue} 70% 45%)`;
        return { id, name, value, poly, d: polygonPath(poly), cx, cy, fill };
      })
      .filter(Boolean) as Array<{
      id: string;
      name: string;
      value: number;
      poly: Array<[number, number]>;
      d: string;
      cx: number;
      cy: number;
      fill: string;
    }>;

    // Mark "top" cells by value so we can show stable labels.
    const sorted = [...cells].sort((a, b) => b.value - a.value);
    const topSet = new Set(sorted.slice(0, Math.max(0, topLabels)).map((c) => c.id));

    const maxArea = Math.max(1, ...cells.map((c) => polygonArea(c.poly)));

    return cells.map((c) => {
      const area = polygonArea(c.poly);
      // Scale font by sqrt(area) so tiny cells still get a small label
      const norm = Math.sqrt(area / maxArea);
      const fontSize = clamp(6 + norm * 12, 6, 18);
      // Heuristic truncation for small cells / long labels
      const maxChars = clamp(Math.floor((norm * 22) + 6), 6, 28);
      const displayName = c.name.length > maxChars ? `${c.name.slice(0, Math.max(3, maxChars - 1))}…` : c.name;

      return {
        ...c,
        isTop: topSet.has(c.id),
        area,
        fontSize,
        displayName,
        clipId: safeClipId(c.id),
      };
    });
  }, [tags, width, height, topLabels]);

  // Attach zoom/pan behavior (wheel/pinch + drag)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (!enableZoomPan) {
      setZt(zoomIdentity);
      return;
    }
    const w = Math.floor(width);
    const h = Math.floor(height);
    if (!w || !h) return;

    const sel = select(svg);
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, Math.max(1.2, Number(zoomMax || 12))])
      .translateExtent([
        [0, 0],
        [w, h],
      ])
      .extent([
        [0, 0],
        [w, h],
      ])
      .wheelDelta((event: any) => {
        // Smaller magnitude = slower zoom; keep direction consistent with d3 default.
        const dy = typeof event?.deltaY === "number" ? event.deltaY : 0;
        const base = -dy;
        const k = Math.max(0.1, Math.min(6, Number(wheelSpeed || 1)));
        return base * k;
      })
      .on("zoom", (event) => {
        setZt(event.transform);
      });

    zoomRef.current = z;
    sel.call(z as any);
    // Start from identity
    sel.call((z as any).transform, zoomIdentity);

    return () => {
      try {
        sel.on(".zoom", null);
      } catch {
        // ignore
      }
    };
  }, [enableZoomPan, width, height, zoomMax, wheelSpeed]);

  const viewBox = useMemo(() => {
    const w = Math.floor(width);
    const h = Math.floor(height);
    if (!w || !h) return null;
    // Convert d3-zoom transform into a viewBox (keeps clipping paths correct).
    const k = zt.k || 1;
    const x = zt.x || 0;
    const y = zt.y || 0;
    const vx = -x / k;
    const vy = -y / k;
    const vw = w / k;
    const vh = h / k;
    return `${vx} ${vy} ${vw} ${vh}`;
  }, [zt, width, height]);

  const zoomBy = (factor: number) => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;
    const sel = select(svg);
    try {
      sel.transition().duration(180).call((z as any).scaleBy, factor);
    } catch {
      // If transitions are not available, fall back.
      sel.call((z as any).scaleBy, factor);
    }
  };

  const zoomReset = () => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;
    const sel = select(svg);
    try {
      sel.transition().duration(220).call((z as any).transform, zoomIdentity);
    } catch {
      sel.call((z as any).transform, zoomIdentity);
    }
  };

  return (
    <div ref={ref} className={cn("w-full relative", className)} style={{ height }}>
      {width <= 10 ? (
        <div className="text-slate-400 text-sm">Sizing…</div>
      ) : layout.length === 0 ? (
        <div className="text-slate-400 text-sm">No tags to visualize.</div>
      ) : (
        <>
          {showZoomControls && enableZoomPan && (
            <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => zoomBy(1 / 1.2)}
                className="px-2 py-1 rounded border bg-slate-950/70 border-slate-700/60 text-slate-200 text-xs hover:bg-slate-900/70"
                title="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                onClick={zoomReset}
                className="px-2 py-1 rounded border bg-slate-950/70 border-slate-700/60 text-slate-200 text-xs hover:bg-slate-900/70"
                title="Reset view"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => zoomBy(1.2)}
                className="px-2 py-1 rounded border bg-slate-950/70 border-slate-700/60 text-slate-200 text-xs hover:bg-slate-900/70"
                title="Zoom in"
              >
                +
              </button>
            </div>
          )}

          <svg
            ref={svgRef}
            width={Math.floor(width)}
            height={Math.floor(height)}
            viewBox={viewBox ?? undefined}
            className="block"
            style={{ touchAction: enableZoomPan ? "none" : "auto" }}
          >
          <defs>
            <filter id="countryGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Clip labels to each polygon so text doesn't spill into neighbors */}
            {layout.map((cell) => (
              <clipPath key={`clip-${cell.id}`} id={cell.clipId}>
                <path d={cell.d} />
              </clipPath>
            ))}
          </defs>

          {layout.map((cell) => {
            const isHovered = hovered === cell.id;
            const isSelected = !!selectedId && selectedId === cell.id;
            const zoomK = zt.k || 1;
            const labelPx = cell.fontSize * zoomK;
            const start = Number.isFinite(lodFadeStartPx) ? (lodFadeStartPx as number) : 5;
            const range = Math.max(1, Number.isFinite(lodFadeRangePx) ? (lodFadeRangePx as number) : 10);
            const baseOpacity = clamp((labelPx - start) / range, 0.12, 1);
            const showLabel =
              labelMode === "all" ||
              (labelMode === "hover" && isHovered) ||
              (labelMode === "important" && (cell.isTop || isSelected)) ||
              isHovered ||
              isSelected;
            return (
              <g key={cell.id}>
                <path
                  d={cell.d}
                  fill={cell.fill}
                  fillOpacity={isHovered || isSelected ? 0.55 : 0.35}
                  stroke={isSelected ? "rgba(56,189,248,0.7)" : "rgba(148,163,184,0.35)"} // sky highlight for selected
                  strokeWidth={isHovered || isSelected ? 2 : 1}
                  filter={isHovered || isSelected ? "url(#countryGlow)" : undefined}
                  className="cursor-pointer transition-[fill-opacity,stroke-width] duration-150"
                  onMouseEnter={() => setHovered(cell.id)}
                  onMouseLeave={() => setHovered((cur) => (cur === cell.id ? null : cur))}
                  onClick={() => onSelect?.(cell.id)}
                >
                      <title>
                        {cell.name} • {Math.round(cell.value)} mentions
                      </title>
                </path>

                {/* Universal label rules: hovered + selected always; top N as "important" */}
                {showLabel && (
                  <text
                    x={cell.cx}
                    y={cell.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="select-none pointer-events-none"
                    clipPath={`url(#${cell.clipId})`}
                    style={{
                      fontSize: cell.fontSize,
                      fill: "rgba(226,232,240,0.9)", // slate-200
                      fontWeight: 700,
                      paintOrder: "stroke",
                      stroke: "rgba(2,6,23,0.65)", // slate-950
                      strokeWidth: 3,
                      opacity: isHovered || isSelected ? 1 : baseOpacity,
                    }}
                  >
                    {cell.displayName}
                  </text>
                )}
              </g>
            );
          })}
          </svg>
        </>
      )}
    </div>
  );
}

