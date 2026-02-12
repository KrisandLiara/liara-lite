import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import type { TuningCommonProps } from "@/pages/Lite/mapsLab/tuning/types";

export function VoronoiAdvancedTuning({ draft, updateDraft, commitSetting, commitFromDraft }: TuningCommonProps) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/20 p-2 space-y-2">
      <div className="text-xs font-semibold text-slate-200">Voronoi — Advanced</div>

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Max zoom</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={draft.voronoiZoomMax}
          min={2}
          max={30}
          step={1}
          onChange={(e) => updateDraft("voronoiZoomMax", Math.max(2, Math.min(30, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("voronoiZoomMax")}
        />
      </div>
      <Slider
        value={[draft.voronoiZoomMax]}
        min={2}
        max={30}
        step={1}
        onValueChange={(v) => updateDraft("voronoiZoomMax", v[0] as any)}
        onValueCommit={(v) => commitSetting("voronoiZoomMax", v[0] as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Wheel zoom speed</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={Number(draft.voronoiWheelSpeed.toFixed(2))}
          min={0.2}
          max={3}
          step={0.05}
          onChange={(e) => updateDraft("voronoiWheelSpeed", Math.max(0.2, Math.min(3, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("voronoiWheelSpeed")}
        />
      </div>
      <Slider
        value={[Math.round(draft.voronoiWheelSpeed * 100)]}
        min={20}
        max={300}
        step={5}
        onValueChange={(v) => updateDraft("voronoiWheelSpeed", (v[0] / 100) as any)}
        onValueCommit={(v) => commitSetting("voronoiWheelSpeed", (v[0] / 100) as any)}
      />

      <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/10 px-3 py-2">
        <div>
          <div className="text-xs font-semibold text-slate-200">Show zoom controls</div>
          <div className="text-[11px] text-slate-400">(+ / Reset / − buttons)</div>
        </div>
        <Checkbox
          checked={draft.voronoiShowZoomControls}
          onCheckedChange={(v) => {
            updateDraft("voronoiShowZoomControls", Boolean(v) as any);
            commitSetting("voronoiShowZoomControls", Boolean(v) as any);
          }}
          className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">LOD fade start (px)</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={draft.voronoiLodFadeStartPx}
          min={0}
          max={30}
          step={1}
          onChange={(e) =>
            updateDraft("voronoiLodFadeStartPx", Math.max(0, Math.min(30, Number(e.target.value || 0))) as any)
          }
          onBlur={() => commitFromDraft("voronoiLodFadeStartPx")}
        />
      </div>
      <Slider
        value={[draft.voronoiLodFadeStartPx]}
        min={0}
        max={30}
        step={1}
        onValueChange={(v) => updateDraft("voronoiLodFadeStartPx", v[0] as any)}
        onValueCommit={(v) => commitSetting("voronoiLodFadeStartPx", v[0] as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">LOD fade range (px)</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={draft.voronoiLodFadeRangePx}
          min={1}
          max={40}
          step={1}
          onChange={(e) =>
            updateDraft("voronoiLodFadeRangePx", Math.max(1, Math.min(40, Number(e.target.value || 0))) as any)
          }
          onBlur={() => commitFromDraft("voronoiLodFadeRangePx")}
        />
      </div>
      <Slider
        value={[draft.voronoiLodFadeRangePx]}
        min={1}
        max={40}
        step={1}
        onValueChange={(v) => updateDraft("voronoiLodFadeRangePx", v[0] as any)}
        onValueCommit={(v) => commitSetting("voronoiLodFadeRangePx", v[0] as any)}
      />
    </div>
  );
}

