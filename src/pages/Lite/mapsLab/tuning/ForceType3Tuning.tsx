import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TuningCommonProps } from "@/pages/Lite/mapsLab/tuning/types";

export function ForceType3Tuning({ draft, updateDraft, commitSetting, commitFromDraft }: TuningCommonProps) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/20 p-2 space-y-3">
      <div className="text-xs font-semibold text-slate-200">Force — Type 3 (Infinite Explainer)</div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Overview: Top N</span>
            <input
              type="number"
              className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
              value={draft.forceOverviewTopN}
              min={20}
              max={800}
              step={5}
              onChange={(e) => updateDraft("forceOverviewTopN", Math.max(20, Math.min(800, Number(e.target.value || 0))) as any)}
              onBlur={() => commitFromDraft("forceOverviewTopN")}
            />
          </div>
          <Slider
            value={[draft.forceOverviewTopN]}
            min={20}
            max={400}
            step={5}
            onValueChange={(v) => updateDraft("forceOverviewTopN", v[0] as any)}
            onValueCommit={(v) => commitSetting("forceOverviewTopN", v[0] as any)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Overview ranking</span>
            <Select
              value={draft.forceRankMode}
              onValueChange={(v) => {
                updateDraft("forceRankMode", v as any);
                commitSetting("forceRankMode", v as any);
              }}
            >
              <SelectTrigger className="h-7 w-[170px] border-slate-700/60 bg-slate-900/40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mentions">Mentions</SelectItem>
                <SelectItem value="convos">Unique conversations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Focus total neighbors</span>
            <input
              type="number"
              className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
              value={draft.forceFocusTotalN}
              min={12}
              max={220}
              step={1}
              onChange={(e) => updateDraft("forceFocusTotalN", Math.max(12, Math.min(220, Number(e.target.value || 0))) as any)}
              onBlur={() => commitFromDraft("forceFocusTotalN")}
            />
          </div>
          <Slider
            value={[draft.forceFocusTotalN]}
            min={12}
            max={220}
            step={1}
            onValueChange={(v) => updateDraft("forceFocusTotalN", v[0] as any)}
            onValueCommit={(v) => commitSetting("forceFocusTotalN", v[0] as any)}
          />

          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Height</span>
            <input
              type="number"
              className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
              value={draft.forceHeight}
              min={360}
              max={760}
              step={10}
              onChange={(e) => updateDraft("forceHeight", Math.max(360, Math.min(760, Number(e.target.value || 0))) as any)}
              onBlur={() => commitFromDraft("forceHeight")}
            />
          </div>
          <Slider
            value={[draft.forceHeight]}
            min={360}
            max={760}
            step={10}
            onValueChange={(v) => updateDraft("forceHeight", v[0] as any)}
            onValueCommit={(v) => commitSetting("forceHeight", v[0] as any)}
          />
        </div>
      </div>

      <div className="rounded border border-slate-800/60 bg-slate-900/20 p-3 space-y-3">
        <div className="text-xs font-semibold text-slate-200">Neighbor types</div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={draft.forceShowDefining}
              onCheckedChange={(v) => {
                updateDraft("forceShowDefining", Boolean(v) as any);
                commitSetting("forceShowDefining", Boolean(v) as any);
              }}
              className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
            />
            Defining
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={draft.forceShowContextual}
              onCheckedChange={(v) => {
                updateDraft("forceShowContextual", Boolean(v) as any);
                commitSetting("forceShowContextual", Boolean(v) as any);
              }}
              className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
            />
            Contextual
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={draft.forceShowStructural}
              onCheckedChange={(v) => {
                updateDraft("forceShowStructural", Boolean(v) as any);
                commitSetting("forceShowStructural", Boolean(v) as any);
              }}
              className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
            />
            Structural
          </label>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Defining count</span>
              <input
                type="number"
                className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
                value={draft.forceDefiningCount}
                min={0}
                max={80}
                step={1}
                onChange={(e) =>
                  updateDraft("forceDefiningCount", Math.max(0, Math.min(80, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceDefiningCount")}
              />
            </div>
            <Slider
              value={[draft.forceDefiningCount]}
              min={0}
              max={40}
              step={1}
              onValueChange={(v) => updateDraft("forceDefiningCount", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceDefiningCount", v[0] as any)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Contextual count</span>
              <input
                type="number"
                className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
                value={draft.forceContextualCount}
                min={0}
                max={120}
                step={1}
                onChange={(e) =>
                  updateDraft("forceContextualCount", Math.max(0, Math.min(120, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceContextualCount")}
              />
            </div>
            <Slider
              value={[draft.forceContextualCount]}
              min={0}
              max={60}
              step={1}
              onValueChange={(v) => updateDraft("forceContextualCount", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceContextualCount", v[0] as any)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Structural per-category</span>
              <input
                type="number"
                className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
                value={draft.forceStructuralPerCatCount}
                min={0}
                max={30}
                step={1}
                onChange={(e) =>
                  updateDraft("forceStructuralPerCatCount", Math.max(0, Math.min(30, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceStructuralPerCatCount")}
              />
            </div>
            <Slider
              value={[draft.forceStructuralPerCatCount]}
              min={0}
              max={12}
              step={1}
              onValueChange={(v) => updateDraft("forceStructuralPerCatCount", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceStructuralPerCatCount", v[0] as any)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Structural tags</span>
              <input
                type="number"
                className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
                value={draft.forceStructuralTagsCount}
                min={0}
                max={80}
                step={1}
                onChange={(e) =>
                  updateDraft("forceStructuralTagsCount", Math.max(0, Math.min(80, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceStructuralTagsCount")}
              />
            </div>
            <Slider
              value={[draft.forceStructuralTagsCount]}
              min={0}
              max={40}
              step={1}
              onValueChange={(v) => updateDraft("forceStructuralTagsCount", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceStructuralTagsCount", v[0] as any)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={draft.forceStructORG}
              onCheckedChange={(v) => {
                updateDraft("forceStructORG", Boolean(v) as any);
                commitSetting("forceStructORG", Boolean(v) as any);
              }}
            />
            ORG
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={draft.forceStructPERSON}
              onCheckedChange={(v) => {
                updateDraft("forceStructPERSON", Boolean(v) as any);
                commitSetting("forceStructPERSON", Boolean(v) as any);
              }}
            />
            PERSON
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={draft.forceStructLOC}
              onCheckedChange={(v) => {
                updateDraft("forceStructLOC", Boolean(v) as any);
                commitSetting("forceStructLOC", Boolean(v) as any);
              }}
            />
            LOC
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={draft.forceStructPRODUCT}
              onCheckedChange={(v) => {
                updateDraft("forceStructPRODUCT", Boolean(v) as any);
                commitSetting("forceStructPRODUCT", Boolean(v) as any);
              }}
            />
            PRODUCT
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={draft.forceStructDATE}
              onCheckedChange={(v) => {
                updateDraft("forceStructDATE", Boolean(v) as any);
                commitSetting("forceStructDATE", Boolean(v) as any);
              }}
            />
            DATE
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Fade opacity</span>
            <input
              type="number"
              className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
              value={Number(draft.forceFadeOpacity.toFixed(2))}
              min={0.04}
              max={0.6}
              step={0.01}
              onChange={(e) =>
                updateDraft("forceFadeOpacity", Math.max(0.04, Math.min(0.6, Number(e.target.value || 0))) as any)
              }
              onBlur={() => commitFromDraft("forceFadeOpacity")}
            />
          </div>
          <Slider
            value={[Math.round(draft.forceFadeOpacity * 100)]}
            min={4}
            max={60}
            step={1}
            onValueChange={(v) => updateDraft("forceFadeOpacity", (v[0] / 100) as any)}
            onValueCommit={(v) => commitSetting("forceFadeOpacity", (v[0] / 100) as any)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Visited trail (K)</span>
            <input
              type="number"
              className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
              value={draft.forceVisitedK}
              min={0}
              max={50}
              step={1}
              onChange={(e) => updateDraft("forceVisitedK", Math.max(0, Math.min(50, Number(e.target.value || 0))) as any)}
              onBlur={() => commitFromDraft("forceVisitedK")}
            />
          </div>
          <Slider
            value={[draft.forceVisitedK]}
            min={0}
            max={30}
            step={1}
            onValueChange={(v) => updateDraft("forceVisitedK", v[0] as any)}
            onValueCommit={(v) => commitSetting("forceVisitedK", v[0] as any)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold">Visited opacity</span>
          <input
            type="number"
            className="h-7 w-[90px] rounded border bg-slate-900/40 border-slate-700/60 text-slate-100 text-xs px-2"
            value={Number(draft.forceVisitedOpacity.toFixed(2))}
            min={0.1}
            max={1}
            step={0.01}
            onChange={(e) =>
              updateDraft("forceVisitedOpacity", Math.max(0.1, Math.min(1, Number(e.target.value || 0))) as any)
            }
            onBlur={() => commitFromDraft("forceVisitedOpacity")}
          />
        </div>
        <Slider
          value={[Math.round(draft.forceVisitedOpacity * 100)]}
          min={10}
          max={100}
          step={1}
          onValueChange={(v) => updateDraft("forceVisitedOpacity", (v[0] / 100) as any)}
          onValueCommit={(v) => commitSetting("forceVisitedOpacity", (v[0] / 100) as any)}
        />
      </div>
    </div>
  );
}

