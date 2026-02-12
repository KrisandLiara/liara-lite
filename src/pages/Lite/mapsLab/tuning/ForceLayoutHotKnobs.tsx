import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import type { TuningCommonProps } from "@/pages/Lite/mapsLab/tuning/types";

export function ForceLayoutHotKnobs({ draft, inputClassName, sliderProps, updateDraft, commitSetting, commitFromDraft }: TuningCommonProps) {
  return (
    <div className="rounded-md border border-cyan-500/30 bg-cyan-950/10 p-2 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-cyan-200">
          Force — Layout knobs{" "}
          <span className="ml-2 rounded border border-cyan-500/40 bg-cyan-950/30 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-200">
            HOT
          </span>
        </div>
        <label className="inline-flex items-center gap-2 text-[11px] text-cyan-100/90 cursor-pointer select-none">
          <Checkbox
            checked={draft.forcePinSelectedToCenter}
            onCheckedChange={(v) => {
              updateDraft("forcePinSelectedToCenter", Boolean(v) as any);
              commitSetting("forcePinSelectedToCenter", Boolean(v) as any);
            }}
            className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
          />
          Pin center
        </label>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-cyan-200/90">Rings / packing</div>

        <div className="flex items-center justify-between text-xs text-cyan-100/90">
          <span className="font-semibold">Ring padding (screen px)</span>
          <input
            type="number"
            className={inputClassName}
            value={draft.forceRingPadPx}
            min={0}
            max={40}
            step={1}
            onChange={(e) => updateDraft("forceRingPadPx", Math.max(0, Math.min(40, Number(e.target.value || 0))) as any)}
            onBlur={() => commitFromDraft("forceRingPadPx")}
          />
        </div>
        <Slider
          value={[draft.forceRingPadPx]}
          min={0}
          max={40}
          step={1}
          onValueChange={(v) => updateDraft("forceRingPadPx", v[0] as any)}
          onValueCommit={(v) => commitSetting("forceRingPadPx", v[0] as any)}
          {...(sliderProps || {})}
        />

        <div className="flex items-center justify-between text-xs text-cyan-100/90">
          <span className="font-semibold">Ring gap: Def → Ctx</span>
          <input
            type="number"
            className={inputClassName}
            value={Number(draft.forceRingGapDefCtxPx.toFixed(0))}
            min={0}
            max={60}
            step={1}
            onChange={(e) => updateDraft("forceRingGapDefCtxPx", Math.max(0, Math.min(60, Number(e.target.value || 0))) as any)}
            onBlur={() => commitFromDraft("forceRingGapDefCtxPx")}
          />
        </div>
        <Slider
          value={[draft.forceRingGapDefCtxPx]}
          min={0}
          max={60}
          step={1}
          onValueChange={(v) => updateDraft("forceRingGapDefCtxPx", v[0] as any)}
          onValueCommit={(v) => commitSetting("forceRingGapDefCtxPx", v[0] as any)}
          {...(sliderProps || {})}
        />

        <div className="flex items-center justify-between text-xs text-cyan-100/90">
          <span className="font-semibold">Ring gap: Ctx → Str</span>
          <input
            type="number"
            className={inputClassName}
            value={Number(draft.forceRingGapCtxStrPx.toFixed(0))}
            min={0}
            max={80}
            step={1}
            onChange={(e) => updateDraft("forceRingGapCtxStrPx", Math.max(0, Math.min(80, Number(e.target.value || 0))) as any)}
            onBlur={() => commitFromDraft("forceRingGapCtxStrPx")}
          />
        </div>
        <Slider
          value={[draft.forceRingGapCtxStrPx]}
          min={0}
          max={80}
          step={1}
          onValueChange={(v) => updateDraft("forceRingGapCtxStrPx", v[0] as any)}
          onValueCommit={(v) => commitSetting("forceRingGapCtxStrPx", v[0] as any)}
          {...(sliderProps || {})}
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Ring safety</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceRingSafetyMult.toFixed(2))}
                min={1}
                max={1.6}
                step={0.01}
                onChange={(e) => updateDraft("forceRingSafetyMult", Math.max(1, Math.min(1.6, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceRingSafetyMult")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceRingSafetyMult * 100)]}
              min={100}
              max={160}
              step={1}
              onValueChange={(v) => updateDraft("forceRingSafetyMult", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceRingSafetyMult", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Collide pad</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.forceRingCollidePadPx}
                min={0}
                max={30}
                step={1}
                onChange={(e) => updateDraft("forceRingCollidePadPx", Math.max(0, Math.min(30, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceRingCollidePadPx")}
              />
            </div>
            <Slider
              value={[draft.forceRingCollidePadPx]}
              min={0}
              max={30}
              step={1}
              onValueChange={(v) => updateDraft("forceRingCollidePadPx", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceRingCollidePadPx", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Min base (px)</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.forceRingMinBasePx}
                min={40}
                max={220}
                step={1}
                onChange={(e) => updateDraft("forceRingMinBasePx", Math.max(40, Math.min(220, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceRingMinBasePx")}
              />
            </div>
            <Slider
              value={[draft.forceRingMinBasePx]}
              min={40}
              max={220}
              step={1}
              onValueChange={(v) => updateDraft("forceRingMinBasePx", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceRingMinBasePx", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Min base factor</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceRingMinBaseFactor.toFixed(3))}
                min={0.05}
                max={0.35}
                step={0.005}
                onChange={(e) =>
                  updateDraft("forceRingMinBaseFactor", Math.max(0.05, Math.min(0.35, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceRingMinBaseFactor")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceRingMinBaseFactor * 1000)]}
              min={50}
              max={350}
              step={5}
              onValueChange={(v) => updateDraft("forceRingMinBaseFactor", (v[0] / 1000) as any)}
              onValueCommit={(v) => commitSetting("forceRingMinBaseFactor", (v[0] / 1000) as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-cyan-200/90">Centering / arms</div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Mul: center</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceCenterMulSelected.toFixed(2))}
                min={0.5}
                max={8}
                step={0.05}
                onChange={(e) =>
                  updateDraft("forceCenterMulSelected", Math.max(0.5, Math.min(8, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceCenterMulSelected")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceCenterMulSelected * 100)]}
              min={50}
              max={800}
              step={5}
              onValueChange={(v) => updateDraft("forceCenterMulSelected", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceCenterMulSelected", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Mul: neigh</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceCenterMulNeighbors.toFixed(2))}
                min={0.2}
                max={4}
                step={0.05}
                onChange={(e) =>
                  updateDraft("forceCenterMulNeighbors", Math.max(0.2, Math.min(4, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceCenterMulNeighbors")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceCenterMulNeighbors * 100)]}
              min={20}
              max={400}
              step={5}
              onValueChange={(v) => updateDraft("forceCenterMulNeighbors", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceCenterMulNeighbors", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Mul: bg</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceCenterMulBackground.toFixed(2))}
                min={0}
                max={3}
                step={0.05}
                onChange={(e) =>
                  updateDraft("forceCenterMulBackground", Math.max(0, Math.min(3, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceCenterMulBackground")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceCenterMulBackground * 100)]}
              min={0}
              max={300}
              step={5}
              onValueChange={(v) => updateDraft("forceCenterMulBackground", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceCenterMulBackground", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Link dist scale</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceLinkDistScale.toFixed(2))}
                min={0.5}
                max={1.4}
                step={0.02}
                onChange={(e) => updateDraft("forceLinkDistScale", Math.max(0.5, Math.min(1.4, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceLinkDistScale")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceLinkDistScale * 100)]}
              min={50}
              max={140}
              step={2}
              onValueChange={(v) => updateDraft("forceLinkDistScale", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceLinkDistScale", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Link dist offset</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceLinkDistOffset.toFixed(0))}
                min={-120}
                max={120}
                step={2}
                onChange={(e) => updateDraft("forceLinkDistOffset", Math.max(-120, Math.min(120, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceLinkDistOffset")}
              />
            </div>
            <Slider
              value={[draft.forceLinkDistOffset]}
              min={-120}
              max={120}
              step={2}
              onValueChange={(v) => updateDraft("forceLinkDistOffset", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceLinkDistOffset", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-cyan-200/90">Forces / stability</div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Charge center</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.forceChargeCenterMag}
                min={0}
                max={40}
                step={1}
                onChange={(e) => updateDraft("forceChargeCenterMag", Math.max(0, Math.min(40, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceChargeCenterMag")}
              />
            </div>
            <Slider
              value={[draft.forceChargeCenterMag]}
              min={0}
              max={40}
              step={1}
              onValueChange={(v) => updateDraft("forceChargeCenterMag", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceChargeCenterMag", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Neigh charge base</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.forceChargeNeighborBaseMag}
                min={0}
                max={40}
                step={1}
                onChange={(e) =>
                  updateDraft("forceChargeNeighborBaseMag", Math.max(0, Math.min(40, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceChargeNeighborBaseMag")}
              />
            </div>
            <Slider
              value={[draft.forceChargeNeighborBaseMag]}
              min={0}
              max={40}
              step={1}
              onValueChange={(v) => updateDraft("forceChargeNeighborBaseMag", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceChargeNeighborBaseMag", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Neigh +motion</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.forceChargeNeighborMotionMag}
                min={0}
                max={40}
                step={1}
                onChange={(e) =>
                  updateDraft("forceChargeNeighborMotionMag", Math.max(0, Math.min(40, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceChargeNeighborMotionMag")}
              />
            </div>
            <Slider
              value={[draft.forceChargeNeighborMotionMag]}
              min={0}
              max={40}
              step={1}
              onValueChange={(v) => updateDraft("forceChargeNeighborMotionMag", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceChargeNeighborMotionMag", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-cyan-100/90">
          <span className="font-semibold">Background collide radius</span>
          <input
            type="number"
            className={inputClassName}
            value={Number(draft.forceBackgroundCollideRadius.toFixed(2))}
            min={0}
            max={8}
            step={0.1}
            onChange={(e) =>
              updateDraft("forceBackgroundCollideRadius", Math.max(0, Math.min(8, Number(e.target.value || 0))) as any)
            }
            onBlur={() => commitFromDraft("forceBackgroundCollideRadius")}
          />
        </div>
        <Slider
          value={[Math.round(draft.forceBackgroundCollideRadius * 100)]}
          min={0}
          max={800}
          step={10}
          onValueChange={(v) => updateDraft("forceBackgroundCollideRadius", (v[0] / 100) as any)}
          onValueCommit={(v) => commitSetting("forceBackgroundCollideRadius", (v[0] / 100) as any)}
          {...(sliderProps || {})}
        />
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-cyan-200/90">Focus framing</div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Fit padding</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.forceFitPaddingPx}
                min={0}
                max={120}
                step={1}
                onChange={(e) => updateDraft("forceFitPaddingPx", Math.max(0, Math.min(120, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceFitPaddingPx")}
              />
            </div>
            <Slider
              value={[draft.forceFitPaddingPx]}
              min={0}
              max={120}
              step={1}
              onValueChange={(v) => updateDraft("forceFitPaddingPx", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceFitPaddingPx", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Fit extra outer</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.forceFitExtraOuterPx}
                min={0}
                max={120}
                step={1}
                onChange={(e) => updateDraft("forceFitExtraOuterPx", Math.max(0, Math.min(120, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceFitExtraOuterPx")}
              />
            </div>
            <Slider
              value={[draft.forceFitExtraOuterPx]}
              min={0}
              max={120}
              step={1}
              onValueChange={(v) => updateDraft("forceFitExtraOuterPx", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceFitExtraOuterPx", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Fit min K</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceFitMinK.toFixed(2))}
                min={0.1}
                max={2}
                step={0.05}
                onChange={(e) => updateDraft("forceFitMinK", Math.max(0.1, Math.min(2, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceFitMinK")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceFitMinK * 100)]}
              min={10}
              max={200}
              step={5}
              onValueChange={(v) => updateDraft("forceFitMinK", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceFitMinK", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Fit max K</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceFitMaxK.toFixed(2))}
                min={0.6}
                max={6}
                step={0.05}
                onChange={(e) => updateDraft("forceFitMaxK", Math.max(0.6, Math.min(6, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceFitMaxK")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceFitMaxK * 100)]}
              min={60}
              max={600}
              step={5}
              onValueChange={(v) => updateDraft("forceFitMaxK", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceFitMaxK", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Focus ms</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.forceFocusAnimMs}
                min={200}
                max={6000}
                step={50}
                onChange={(e) => updateDraft("forceFocusAnimMs", Math.max(200, Math.min(6000, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceFocusAnimMs")}
              />
            </div>
            <Slider
              value={[draft.forceFocusAnimMs]}
              min={200}
              max={6000}
              step={50}
              onValueChange={(v) => updateDraft("forceFocusAnimMs", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceFocusAnimMs", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Fit focus ms</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.forceFitAnimMsFocus}
                min={100}
                max={4000}
                step={50}
                onChange={(e) =>
                  updateDraft("forceFitAnimMsFocus", Math.max(100, Math.min(4000, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceFitAnimMsFocus")}
              />
            </div>
            <Slider
              value={[draft.forceFitAnimMsFocus]}
              min={100}
              max={4000}
              step={50}
              onValueChange={(v) => updateDraft("forceFitAnimMsFocus", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceFitAnimMsFocus", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Fit reset ms</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.forceFitAnimMsReset}
                min={100}
                max={4000}
                step={50}
                onChange={(e) =>
                  updateDraft("forceFitAnimMsReset", Math.max(100, Math.min(4000, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceFitAnimMsReset")}
              />
            </div>
            <Slider
              value={[draft.forceFitAnimMsReset]}
              min={100}
              max={4000}
              step={50}
              onValueChange={(v) => updateDraft("forceFitAnimMsReset", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceFitAnimMsReset", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold text-cyan-200/90">Visibility</div>
          <label className="inline-flex items-center gap-2 text-[11px] text-cyan-100/90 cursor-pointer select-none">
            <Checkbox
              checked={draft.forceHideBackgroundWhenFocused}
              onCheckedChange={(v) => {
                updateDraft("forceHideBackgroundWhenFocused", Boolean(v) as any);
                commitSetting("forceHideBackgroundWhenFocused", Boolean(v) as any);
              }}
              className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
            />
            Hide background
          </label>
        </div>

        <div className="flex items-center justify-between text-xs text-cyan-100/90">
          <span className="font-semibold">Neighbor opacity</span>
          <input
            type="number"
            className={inputClassName}
            value={Number(draft.forceNeighborOpacity.toFixed(2))}
            min={0.2}
            max={1}
            step={0.01}
            onChange={(e) => updateDraft("forceNeighborOpacity", Math.max(0.2, Math.min(1, Number(e.target.value || 0))) as any)}
            onBlur={() => commitFromDraft("forceNeighborOpacity")}
          />
        </div>
        <Slider
          value={[Math.round(draft.forceNeighborOpacity * 100)]}
          min={20}
          max={100}
          step={1}
          onValueChange={(v) => updateDraft("forceNeighborOpacity", (v[0] / 100) as any)}
          onValueCommit={(v) => commitSetting("forceNeighborOpacity", (v[0] / 100) as any)}
          {...(sliderProps || {})}
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Edge width</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceEdgeWidthScale.toFixed(2))}
                min={0.2}
                max={2.2}
                step={0.05}
                onChange={(e) => updateDraft("forceEdgeWidthScale", Math.max(0.2, Math.min(2.2, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceEdgeWidthScale")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceEdgeWidthScale * 100)]}
              min={20}
              max={220}
              step={5}
              onValueChange={(v) => updateDraft("forceEdgeWidthScale", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceEdgeWidthScale", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Label overflow</span>
              <input
                type="number"
                className={inputClassName}
                value={draft.forceLabelOverflowPx}
                min={0}
                max={80}
                step={1}
                onChange={(e) => updateDraft("forceLabelOverflowPx", Math.max(0, Math.min(80, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceLabelOverflowPx")}
              />
            </div>
            <Slider
              value={[draft.forceLabelOverflowPx]}
              min={0}
              max={80}
              step={1}
              onValueChange={(v) => updateDraft("forceLabelOverflowPx", v[0] as any)}
              onValueCommit={(v) => commitSetting("forceLabelOverflowPx", v[0] as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Fill: center</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceFillOpacityCenter.toFixed(2))}
                min={0.2}
                max={1}
                step={0.01}
                onChange={(e) => updateDraft("forceFillOpacityCenter", Math.max(0.2, Math.min(1, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceFillOpacityCenter")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceFillOpacityCenter * 100)]}
              min={20}
              max={100}
              step={1}
              onValueChange={(v) => updateDraft("forceFillOpacityCenter", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceFillOpacityCenter", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Fill: neigh</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceFillOpacityNeighbor.toFixed(2))}
                min={0.1}
                max={1}
                step={0.01}
                onChange={(e) => updateDraft("forceFillOpacityNeighbor", Math.max(0.1, Math.min(1, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceFillOpacityNeighbor")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceFillOpacityNeighbor * 100)]}
              min={10}
              max={100}
              step={1}
              onValueChange={(v) => updateDraft("forceFillOpacityNeighbor", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceFillOpacityNeighbor", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Fill: visited</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceFillOpacityVisited.toFixed(2))}
                min={0.05}
                max={1}
                step={0.01}
                onChange={(e) => updateDraft("forceFillOpacityVisited", Math.max(0.05, Math.min(1, Number(e.target.value || 0))) as any)}
                onBlur={() => commitFromDraft("forceFillOpacityVisited")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceFillOpacityVisited * 100)]}
              min={5}
              max={100}
              step={1}
              onValueChange={(v) => updateDraft("forceFillOpacityVisited", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceFillOpacityVisited", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Fill: bg</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceFillOpacityBackground.toFixed(2))}
                min={0}
                max={1}
                step={0.01}
                onChange={(e) =>
                  updateDraft("forceFillOpacityBackground", Math.max(0, Math.min(1, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceFillOpacityBackground")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceFillOpacityBackground * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => updateDraft("forceFillOpacityBackground", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceFillOpacityBackground", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-cyan-200/90">Links (by type)</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Def</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceLinkStrengthDefining.toFixed(2))}
                min={0}
                max={1}
                step={0.01}
                onChange={(e) =>
                  updateDraft("forceLinkStrengthDefining", Math.max(0, Math.min(1, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceLinkStrengthDefining")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceLinkStrengthDefining * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => updateDraft("forceLinkStrengthDefining", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceLinkStrengthDefining", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Ctx</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceLinkStrengthContextual.toFixed(2))}
                min={0}
                max={1}
                step={0.01}
                onChange={(e) =>
                  updateDraft("forceLinkStrengthContextual", Math.max(0, Math.min(1, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceLinkStrengthContextual")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceLinkStrengthContextual * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => updateDraft("forceLinkStrengthContextual", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceLinkStrengthContextual", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-100/90">
              <span className="font-semibold">Str</span>
              <input
                type="number"
                className={inputClassName}
                value={Number(draft.forceLinkStrengthStructural.toFixed(2))}
                min={0}
                max={1}
                step={0.01}
                onChange={(e) =>
                  updateDraft("forceLinkStrengthStructural", Math.max(0, Math.min(1, Number(e.target.value || 0))) as any)
                }
                onBlur={() => commitFromDraft("forceLinkStrengthStructural")}
              />
            </div>
            <Slider
              value={[Math.round(draft.forceLinkStrengthStructural * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => updateDraft("forceLinkStrengthStructural", (v[0] / 100) as any)}
              onValueCommit={(v) => commitSetting("forceLinkStrengthStructural", (v[0] / 100) as any)}
              {...(sliderProps || {})}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

