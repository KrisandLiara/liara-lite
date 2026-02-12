import React from "react";
import { Slider } from "@/components/ui/slider";
import type { TuningCommonProps } from "@/pages/Lite/mapsLab/tuning/types";

export function PackAdvancedTuning({ draft, updateDraft, commitSetting, commitFromDraft }: TuningCommonProps) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/20 p-2 space-y-3">
      <div className="text-xs font-semibold text-slate-200">Circle Pack — Advanced</div>

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Size exponent</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={Number(draft.packSizeExponent.toFixed(2))}
          min={0.5}
          max={3}
          step={0.1}
          onChange={(e) => updateDraft("packSizeExponent", Math.max(0.5, Math.min(3, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("packSizeExponent")}
        />
      </div>
      <Slider
        value={[Math.round(draft.packSizeExponent * 100)]}
        min={50}
        max={300}
        step={10}
        onValueChange={(v) => updateDraft("packSizeExponent", (v[0] / 100) as any)}
        onValueCommit={(v) => commitSetting("packSizeExponent", (v[0] / 100) as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Label font size</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={draft.packLabelFontSize}
          min={8}
          max={18}
          step={1}
          onChange={(e) => updateDraft("packLabelFontSize", Math.max(8, Math.min(18, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("packLabelFontSize")}
        />
      </div>
      <Slider
        value={[draft.packLabelFontSize]}
        min={8}
        max={18}
        step={1}
        onValueChange={(v) => updateDraft("packLabelFontSize", v[0] as any)}
        onValueCommit={(v) => commitSetting("packLabelFontSize", v[0] as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Hover stroke width</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={draft.packHoverStrokeWidth}
          min={1}
          max={5}
          step={1}
          onChange={(e) => updateDraft("packHoverStrokeWidth", Math.max(1, Math.min(5, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("packHoverStrokeWidth")}
        />
      </div>
      <Slider
        value={[draft.packHoverStrokeWidth]}
        min={1}
        max={5}
        step={1}
        onValueChange={(v) => updateDraft("packHoverStrokeWidth", v[0] as any)}
        onValueCommit={(v) => commitSetting("packHoverStrokeWidth", v[0] as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Dim others opacity</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={Number(draft.packDimOpacity.toFixed(2))}
          min={0.05}
          max={0.5}
          step={0.01}
          onChange={(e) => updateDraft("packDimOpacity", Math.max(0.05, Math.min(0.5, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("packDimOpacity")}
        />
      </div>
      <Slider
        value={[Math.round(draft.packDimOpacity * 100)]}
        min={5}
        max={50}
        step={1}
        onValueChange={(v) => updateDraft("packDimOpacity", (v[0] / 100) as any)}
        onValueCommit={(v) => commitSetting("packDimOpacity", (v[0] / 100) as any)}
      />

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Gloss overlay opacity</span>
        <input
          type="number"
          className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
          value={Number(draft.packGlossOpacity.toFixed(2))}
          min={0}
          max={1}
          step={0.05}
          onChange={(e) => updateDraft("packGlossOpacity", Math.max(0, Math.min(1, Number(e.target.value || 0))) as any)}
          onBlur={() => commitFromDraft("packGlossOpacity")}
        />
      </div>
      <Slider
        value={[Math.round(draft.packGlossOpacity * 100)]}
        min={0}
        max={100}
        step={5}
        onValueChange={(v) => updateDraft("packGlossOpacity", (v[0] / 100) as any)}
        onValueCommit={(v) => commitSetting("packGlossOpacity", (v[0] / 100) as any)}
      />
    </div>
  );
}

