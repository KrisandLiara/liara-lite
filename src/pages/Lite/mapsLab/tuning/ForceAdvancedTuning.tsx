import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { TuningCommonProps } from "@/pages/Lite/mapsLab/tuning/types";

export function ForceAdvancedTuning({ draft, updateDraft, commitSetting, commitFromDraft }: TuningCommonProps) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/20 p-2 space-y-3">
      <div className="text-xs font-semibold text-slate-200">Force — Advanced</div>

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Charge strength</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={draft.forceChargeStrength}
          min={10}
          max={80}
          step={1}
          onChange={(e) => updateDraft("forceChargeStrength", Math.max(10, Math.min(80, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("forceChargeStrength")}
        />
      </div>
      <Slider
        value={[draft.forceChargeStrength]}
        min={10}
        max={80}
        step={1}
        onValueChange={(v) => updateDraft("forceChargeStrength", v[0] as any)}
        onValueCommit={(v) => commitSetting("forceChargeStrength", v[0] as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Collision iterations</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={draft.forceCollisionIterations}
          min={1}
          max={6}
          step={1}
          onChange={(e) =>
            updateDraft("forceCollisionIterations", Math.max(1, Math.min(6, Number(e.target.value || 0))) as any)
          }
          onBlur={() => commitFromDraft("forceCollisionIterations")}
        />
      </div>
      <Slider
        value={[draft.forceCollisionIterations]}
        min={1}
        max={6}
        step={1}
        onValueChange={(v) => updateDraft("forceCollisionIterations", v[0] as any)}
        onValueCommit={(v) => commitSetting("forceCollisionIterations", v[0] as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Link opacity</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={Number(draft.forceLinkOpacity.toFixed(2))}
          min={0}
          max={0.9}
          step={0.05}
          onChange={(e) => updateDraft("forceLinkOpacity", Math.max(0, Math.min(0.9, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("forceLinkOpacity")}
        />
      </div>
      <Slider
        value={[Math.round(draft.forceLinkOpacity * 100)]}
        min={0}
        max={90}
        step={5}
        onValueChange={(v) => updateDraft("forceLinkOpacity", (v[0] / 100) as any)}
        onValueCommit={(v) => commitSetting("forceLinkOpacity", (v[0] / 100) as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Hover tooltips</span>
        <div className="flex items-center gap-2">
          <Checkbox
            id="forceShowTooltips"
            checked={Boolean(draft.forceShowTooltips)}
            onCheckedChange={(v) => {
              updateDraft("forceShowTooltips", Boolean(v) as any);
              commitSetting("forceShowTooltips", Boolean(v) as any);
            }}
            className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
          />
          <Label htmlFor="forceShowTooltips" className="text-xs text-slate-300 select-none cursor-pointer">
            On
          </Label>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Alpha decay multiplier</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={Number(draft.forceAlphaDecayMult.toFixed(2))}
          min={0.25}
          max={2}
          step={0.05}
          onChange={(e) =>
            updateDraft("forceAlphaDecayMult", Math.max(0.25, Math.min(2, Number(e.target.value || 0))) as any)
          }
          onBlur={() => commitFromDraft("forceAlphaDecayMult")}
        />
      </div>
      <Slider
        value={[Math.round(draft.forceAlphaDecayMult * 100)]}
        min={25}
        max={200}
        step={5}
        onValueChange={(v) => updateDraft("forceAlphaDecayMult", (v[0] / 100) as any)}
        onValueCommit={(v) => commitSetting("forceAlphaDecayMult", (v[0] / 100) as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Center strength</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={Number(draft.forceCenterStrength.toFixed(2))}
          min={0}
          max={2}
          step={0.05}
          onChange={(e) => updateDraft("forceCenterStrength", Math.max(0, Math.min(2, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("forceCenterStrength")}
        />
      </div>
      <Slider
        value={[Math.round(draft.forceCenterStrength * 100)]}
        min={0}
        max={200}
        step={5}
        onValueChange={(v) => updateDraft("forceCenterStrength", (v[0] / 100) as any)}
        onValueCommit={(v) => commitSetting("forceCenterStrength", (v[0] / 100) as any)}
      />
    </div>
  );
}

