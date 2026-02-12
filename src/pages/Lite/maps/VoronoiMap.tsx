import React, { useMemo } from "react";
import { CountryTagMap } from "@/pages/Lite/components/CountryTagMap";
import type { Token } from "@/pages/Lite/hooks/useTokenIndex";

export function VoronoiMap({
  tokens,
  onSelect,
  height,
  settings,
  selectedId,
}: {
  tokens: Token[];
  onSelect: (tokenId: string) => void;
  height?: number;
  settings?: {
    sizeScale: number;
    labelMode?: "off" | "hover" | "important" | "all";
    topLabels?: number;
    // Voronoi-specific tuning
    voronoiZoomMax?: number;
    voronoiWheelSpeed?: number;
    voronoiShowZoomControls?: boolean;
    voronoiLodFadeStartPx?: number;
    voronoiLodFadeRangePx?: number;
  };
  selectedId?: string | null;
}) {
  const tags = useMemo(() => {
    // Voronoi treemap expects weighted cells. Use mentions as weight.
    return tokens.map((t) => ({
      id: t.id,
      name: t.type === "entity" ? `${t.name}` : t.name,
      // Display value (count)
      value: Math.max(1, t.mentions),
      // Layout weight (can be scaled for "denser / more touching" feel)
      weight: Math.max(1, t.mentions) * Math.max(0.25, (settings?.sizeScale ?? 1) ** 2),
    }));
  }, [tokens, settings?.sizeScale]);

  return (
    <div className="w-full h-full">
      <CountryTagMap
        tags={tags}
        height={Math.max(220, Math.floor(height ?? 360))}
        className="rounded-lg border border-slate-800 bg-slate-950/20"
        onSelect={(tokenId) => onSelect(tokenId)}
        selectedId={selectedId}
        // Default to "all" for the atlas feel, but allow tuning per-viz.
        labelMode={settings?.labelMode ?? "all"}
        topLabels={settings?.topLabels ?? 12}
        enableZoomPan
        showZoomControls={settings?.voronoiShowZoomControls ?? true}
        zoomMax={settings?.voronoiZoomMax ?? 12}
        wheelSpeed={settings?.voronoiWheelSpeed ?? 1}
        lodFadeStartPx={settings?.voronoiLodFadeStartPx ?? 5}
        lodFadeRangePx={settings?.voronoiLodFadeRangePx ?? 10}
      />
    </div>
  );
}

