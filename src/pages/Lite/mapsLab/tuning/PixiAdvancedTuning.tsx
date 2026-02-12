import React from "react";
import { Slider } from "@/components/ui/slider";
import type { TuningCommonProps } from "@/pages/Lite/mapsLab/tuning/types";

export function PixiAdvancedTuning({ draft, updateDraft, commitSetting, commitFromDraft }: TuningCommonProps) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/20 p-2 space-y-3">
      <div className="text-xs font-semibold text-slate-200">Pixi — Advanced</div>

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Base alpha</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={Number(draft.pixiBaseAlpha.toFixed(2))}
          min={0.05}
          max={0.6}
          step={0.01}
          onChange={(e) => updateDraft("pixiBaseAlpha", Math.max(0.05, Math.min(0.6, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("pixiBaseAlpha")}
        />
      </div>
      <Slider
        value={[Math.round(draft.pixiBaseAlpha * 100)]}
        min={5}
        max={60}
        step={1}
        onValueChange={(v) => updateDraft("pixiBaseAlpha", (v[0] / 100) as any)}
        onValueCommit={(v) => commitSetting("pixiBaseAlpha", (v[0] / 100) as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Hover alpha</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={Number(draft.pixiHoverAlpha.toFixed(2))}
          min={0.1}
          max={1}
          step={0.02}
          onChange={(e) => updateDraft("pixiHoverAlpha", Math.max(0.1, Math.min(1, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("pixiHoverAlpha")}
        />
      </div>
      <Slider
        value={[Math.round(draft.pixiHoverAlpha * 100)]}
        min={10}
        max={100}
        step={2}
        onValueChange={(v) => updateDraft("pixiHoverAlpha", (v[0] / 100) as any)}
        onValueCommit={(v) => commitSetting("pixiHoverAlpha", (v[0] / 100) as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Dim others alpha</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={Number(draft.pixiDimOtherAlpha.toFixed(2))}
          min={0.05}
          max={0.6}
          step={0.01}
          onChange={(e) =>
            updateDraft("pixiDimOtherAlpha", Math.max(0.05, Math.min(0.6, Number(e.target.value || 0))) as any)
          }
          onBlur={() => commitFromDraft("pixiDimOtherAlpha")}
        />
      </div>
      <Slider
        value={[Math.round(draft.pixiDimOtherAlpha * 100)]}
        min={5}
        max={60}
        step={1}
        onValueChange={(v) => updateDraft("pixiDimOtherAlpha", (v[0] / 100) as any)}
        onValueCommit={(v) => commitSetting("pixiDimOtherAlpha", (v[0] / 100) as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Drift strength</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={Number(draft.pixiDriftStrength.toFixed(2))}
          min={0}
          max={2}
          step={0.05}
          onChange={(e) => updateDraft("pixiDriftStrength", Math.max(0, Math.min(2, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("pixiDriftStrength")}
        />
      </div>
      <Slider
        value={[Math.round(draft.pixiDriftStrength * 100)]}
        min={0}
        max={200}
        step={5}
        onValueChange={(v) => updateDraft("pixiDriftStrength", (v[0] / 100) as any)}
        onValueCommit={(v) => commitSetting("pixiDriftStrength", (v[0] / 100) as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Collision iterations</span>
        <span className="text-slate-400">{draft.pixiCollisionIterations}</span>
      </div>
      <Slider
        value={[draft.pixiCollisionIterations]}
        min={1}
        max={4}
        step={1}
        onValueChange={(v) => updateDraft("pixiCollisionIterations", v[0] as any)}
        onValueCommit={(v) => commitSetting("pixiCollisionIterations", v[0] as any)}
      />
    </div>
  );
}

