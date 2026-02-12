import React, { useEffect, useMemo, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import type { Token } from "@/pages/Lite/hooks/useTokenIndex";

function hueFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

function hslToHexNumber(h: number, sPct: number, lPct: number): number {
  const s = Math.max(0, Math.min(1, sPct / 100));
  const l = Math.max(0, Math.min(1, lPct / 100));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0,
    g = 0,
    b = 0;
  if (hh >= 0 && hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const rr = Math.round((r + m) * 255);
  const gg = Math.round((g + m) * 255);
  const bb = Math.round((b + m) * 255);
  return (rr << 16) + (gg << 8) + bb;
}

type Node = {
  id: string;
  label: string;
  mentions: number;
  convos: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: number;
  g: PIXI.Graphics;
};

export function CurveballMap({
  tokens,
  onSelect,
  height = 300,
  settings,
  selectedId,
  relatedIds,
}: {
  tokens: Token[];
  onSelect: (tokenId: string) => void;
  height?: number;
  settings?: {
    sizeScale: number;
    motion: number;
    calmness: number;
    padding: number;
    labelMode: "off" | "hover" | "important" | "all";
    // Pixi-specific tuning
    pixiBaseAlpha?: number; // 0..1
    pixiHoverAlpha?: number; // 0..1
    pixiDimOtherAlpha?: number; // 0..1
    pixiDriftStrength?: number; // 0..2
    pixiCollisionIterations?: number; // 1..4
  };
  selectedId?: string | null;
  relatedIds?: Set<string>;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const initNonceRef = useRef(0);
  const selectedRef = useRef<string | null>(null);
  const relatedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    selectedRef.current = selectedId ?? null;
    relatedRef.current = relatedIds ?? new Set();
  }, [selectedId, relatedIds]);

  const nodesSeed = useMemo(() => {
    const top = tokens.slice(0, 220);
    return top.map((t) => {
      const hue = hueFor(t.id);
      // Pixi expects 0xRRGGBB; avoid PIXI.utils (v8 API changes)
      const color = hslToHexNumber(hue, 70, 55);
      const sizeK = Math.max(0.25, settings?.sizeScale ?? 1);
      const r = (6 + Math.sqrt(t.mentions) * 0.9) * sizeK;
      return {
        id: t.id,
        label: t.type === "entity" ? `${t.name}` : t.name,
        mentions: t.mentions,
        convos: t.uniqueConversations,
        r,
        color,
      };
    });
  }, [tokens, settings?.sizeScale]);

  useEffect(() => {
    if (!hostRef.current) return;
    const host = hostRef.current;

    // Create app
    const app = new PIXI.Application();
    let destroyed = false;
    const localNonce = ++initNonceRef.current;

    const ensureSize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, height ?? host.clientHeight);
      try {
        // In Pixi v8, renderer exists after init.
        (app.renderer as any)?.resize?.(w, h);
      } catch {
        // ignore
      }
    };

    const init = async () => {
      // Avoid resizeTo plugin (can crash during init/strict-mode remount).
      await app.init({
        width: Math.max(1, host.clientWidth),
        height: Math.max(1, height),
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.max(1, window.devicePixelRatio || 1),
        // Important: don't start the render loop until the stage is fully constructed.
        // This avoids rare dev/StrictMode init-time renderer crashes (updateLocalTransform on null).
        autoStart: false,
      });
      if (destroyed || initNonceRef.current !== localNonce) return;
      host.appendChild(app.canvas);

      const nodes: Node[] = [];
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, height);

      // Container so we can pan later.
      const container = new PIXI.Container();
      app.stage.addChild(container);

      for (const seed of nodesSeed) {
        const g = new PIXI.Graphics();
        const baseAlpha = Math.max(0.05, Math.min(1, settings?.pixiBaseAlpha ?? 0.28));
        const hoverAlpha = Math.max(0.1, Math.min(1, settings?.pixiHoverAlpha ?? 0.5));
        g.circle(0, 0, seed.r).fill({ color: seed.color, alpha: baseAlpha });
        g.circle(0, 0, seed.r).stroke({ color: 0x94a3b8, alpha: 0.28, width: 1 });
        g.x = Math.random() * w;
        g.y = Math.random() * h;
        g.eventMode = "static";
        g.cursor = "pointer";
        const node: Node = {
          ...seed,
          x: g.x,
          y: g.y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          g,
        };

        g.on("pointerover", () => {
          g.clear();
          g.circle(0, 0, seed.r).fill({ color: seed.color, alpha: hoverAlpha });
          g.circle(0, 0, seed.r).stroke({ color: 0x38bdf8, alpha: 0.8, width: 2 });
        });
        g.on("pointerout", () => {
          g.clear();
          g.circle(0, 0, seed.r).fill({ color: seed.color, alpha: baseAlpha });
          g.circle(0, 0, seed.r).stroke({ color: 0x94a3b8, alpha: 0.28, width: 1 });
          setHover(null);
        });
        g.on("pointermove", (ev: any) => {
          const global = ev.global;
          setHover({
            x: global.x,
            y: global.y,
            text: `${seed.label} • ${seed.mentions} mentions • ${seed.convos} convos`,
          });
        });
        g.on("pointertap", () => onSelect(node.id));

        container.addChild(g);
        nodes.push(node);
      }

      const tick = () => {
        if (destroyed) return;
        const ww = Math.max(1, host.clientWidth);
        const hh = Math.max(1, height);
        const motion = Math.max(0, Math.min(1, settings?.motion ?? 0.5));
        const calm = Math.max(0, Math.min(1, settings?.calmness ?? 0.65));
        const pad = settings?.padding ?? 2;
        const driftK = Math.max(0, Math.min(2, settings?.pixiDriftStrength ?? 1));
        const collideIters = Math.max(1, Math.min(4, Math.round(settings?.pixiCollisionIterations ?? 1)));
        const sel = selectedRef.current;
        const rel = relatedRef.current;
        const dimOtherAlpha = Math.max(0.05, Math.min(1, settings?.pixiDimOtherAlpha ?? 0.25));

        // Simple “alive drift” + soft bounds + light collision.
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          a.vx += (Math.random() - 0.5) * (0.02 * motion) * driftK;
          a.vy += (Math.random() - 0.5) * (0.02 * motion) * driftK;
          const damp = 0.92 + calm * 0.07;
          a.vx *= damp;
          a.vy *= damp;

          a.x += a.vx;
          a.y += a.vy;
          if (a.x < a.r) {
            a.x = a.r;
            a.vx = Math.abs(a.vx);
          }
          if (a.y < a.r) {
            a.y = a.r;
            a.vy = Math.abs(a.vy);
          }
          if (a.x > ww - a.r) {
            a.x = ww - a.r;
            a.vx = -Math.abs(a.vx);
          }
          if (a.y > hh - a.r) {
            a.y = hh - a.r;
            a.vy = -Math.abs(a.vy);
          }
        }

        // Very light collision resolution (O(n^2), OK for ~200)
        for (let iter = 0; iter < collideIters; iter++) {
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const a = nodes[i];
              const b = nodes[j];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const min = a.r + b.r + Math.max(0, 1 + pad);
              if (dist < min) {
                const push = (min - dist) * 0.35;
                const nx = dx / dist;
                const ny = dy / dist;
                a.x -= nx * push;
                a.y -= ny * push;
                b.x += nx * push;
                b.y += ny * push;
              }
            }
          }
        }

        for (const n of nodes) {
          n.g.x = n.x;
          n.g.y = n.y;
          if (!sel) {
            n.g.alpha = 1;
          } else if (n.id === sel) {
            n.g.alpha = 1;
          } else if (rel.has(n.id)) {
            n.g.alpha = 0.75;
          } else {
            n.g.alpha = dimOtherAlpha;
          }
        }
      };

      app.ticker.add(tick);
      // Start rendering only after we have a stage + ticker callback.
      try {
        (app as any).start?.();
      } catch {
        // ignore
      }
      try {
        app.ticker.start();
      } catch {
        // ignore
      }

      // Manual resize observer (safe in dev + strict mode)
      const ro = new ResizeObserver(() => ensureSize());
      ro.observe(host);
      ensureSize();

      // Cleanup observer on destroy
      (app as any).__liaraResizeObserver = ro;
    };

    init();

    return () => {
      destroyed = true;
      try {
        const ro = (app as any).__liaraResizeObserver as ResizeObserver | undefined;
        ro?.disconnect();
        // Stop render loop before destroy to avoid render-on-destroyed-stage crashes.
        try {
          app.ticker.stop();
        } catch {}
        try {
          (app as any).stop?.();
        } catch {}
        app.destroy(true, { children: true, texture: true });
      } catch {
        // ignore
      }
      try {
        host.querySelector("canvas")?.remove();
      } catch {
        // ignore
      }
    };
  }, [
    height,
    nodesSeed,
    onSelect,
    settings?.motion,
    settings?.calmness,
    settings?.padding,
    settings?.pixiBaseAlpha,
    settings?.pixiHoverAlpha,
    settings?.pixiDimOtherAlpha,
    settings?.pixiDriftStrength,
    settings?.pixiCollisionIterations,
  ]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div
        ref={hostRef}
        className="w-full h-full rounded-lg border border-slate-800 bg-slate-950/20 overflow-hidden"
      />
      {hover && (
        <div
          className="pointer-events-none absolute z-20 px-2 py-1 rounded border bg-slate-950/80 border-slate-700 text-slate-200 text-xs"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          {hover.text}
        </div>
      )}
    </div>
  );
}

