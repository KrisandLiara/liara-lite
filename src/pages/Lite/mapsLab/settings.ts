export type ActiveViz = "voronoi" | "pack" | "force" | "pixi" | null;

export type TokenMix = "both" | "tags" | "entities";
export type LabelMode = "off" | "hover" | "important" | "all";
export type ForceRankMode = "mentions" | "convos";

export type MapsLabSettings = {
  maxTokens: number;
  tokenMix: TokenMix;
  sizeScale: number;
  padding: number;
  labelMode: LabelMode;
  topLabels: number;
  minLabelRadius: number;
  showRelatedLines: boolean;
  maxRelated: number;
  motion: number; // 0..1
  calmness: number; // 0..1 (higher = calmer)
  gravity: number; // 0..1
  // Semantic zoom / cognitive layers
  semanticZoomEnabled: boolean;
  focusViz: "force" | "pixi";
  focusAutoPin: boolean;

  // Voronoi-specific
  voronoiZoomMax: number;
  voronoiWheelSpeed: number;
  voronoiShowZoomControls: boolean;
  voronoiLodFadeStartPx: number;
  voronoiLodFadeRangePx: number;

  // Circle pack-specific
  packSizeExponent: number;
  packLabelFontSize: number;
  packHoverStrokeWidth: number;
  packDimOpacity: number;
  packGlossOpacity: number;

  // Force-specific
  forceChargeStrength: number;
  forceCollisionIterations: number;
  forceLinkOpacity: number;
  forceAlphaDecayMult: number;
  forceCenterStrength: number;
  forceShowTooltips: boolean;
  // Force layout knobs (the ones we keep tuning)
  forcePinSelectedToCenter: boolean;
  forceCenterMulSelected: number;
  forceCenterMulNeighbors: number;
  forceCenterMulBackground: number;
  forceChargeCenterMag: number; // magnitude (applied as -mag)
  forceChargeNeighborBaseMag: number; // magnitude base for neighbors
  forceChargeNeighborMotionMag: number; // extra magnitude as motion increases
  forceBackgroundCollideRadius: number; // 0..2 (near-zero disables background collision)
  forceLinkDistScale: number;
  forceLinkDistOffset: number; // world px
  forceLinkStrengthDefining: number;
  forceLinkStrengthContextual: number;
  forceLinkStrengthStructural: number;
  forceRingPadPx: number; // screen px
  forceRingCollidePadPx: number; // world px
  forceRingSafetyMult: number;
  forceRingMinBasePx: number;
  forceRingMinBaseFactor: number;
  forceRingGapDefCtxPx: number; // world px (multiplied by sizeScale)
  forceRingGapCtxStrPx: number; // world px (multiplied by sizeScale)
  forceFitPaddingPx: number; // screen px
  forceFitExtraOuterPx: number; // world px
  forceFitMinK: number;
  forceFitMaxK: number;
  forceFocusAnimMs: number;
  forceFitAnimMsFocus: number;
  forceFitAnimMsReset: number;
  forceNeighborOpacity: number; // 0..1
  forceHideBackgroundWhenFocused: boolean;
  forceEdgeWidthScale: number;
  forceFillOpacityCenter: number;
  forceFillOpacityNeighbor: number;
  forceFillOpacityVisited: number;
  forceFillOpacityBackground: number;
  forceLabelOverflowPx: number;
  forceFocusTotalN: number;
  // Force Type 3 (Infinite Explainer)
  forceOverviewTopN: number;
  forceRankMode: ForceRankMode;
  forceDefiningCount: number;
  forceContextualCount: number;
  forceStructuralPerCatCount: number;
  forceStructuralTagsCount: number;
  forceShowDefining: boolean;
  forceShowContextual: boolean;
  forceShowStructural: boolean;
  forceFadeOpacity: number; // 0..1
  forceVisitedK: number;
  forceVisitedOpacity: number; // 0..1
  forceStructORG: boolean;
  forceStructPERSON: boolean;
  forceStructLOC: boolean;
  forceStructPRODUCT: boolean;
  forceStructDATE: boolean;
  forceHeight: number;

  // Pixi-specific
  pixiBaseAlpha: number;
  pixiHoverAlpha: number;
  pixiDimOtherAlpha: number;
  pixiDriftStrength: number;
  pixiCollisionIterations: number;
};

export const DEFAULT_SETTINGS: MapsLabSettings = {
  maxTokens: 600,
  tokenMix: "both",
  // Denser + more "soft matter" by default
  sizeScale: 1.6,
  padding: 0,
  labelMode: "important",
  topLabels: 16,
  minLabelRadius: 20,
  showRelatedLines: true,
  maxRelated: 12,
  // Calm mind defaults (motion exists but is subtle)
  motion: 0.25,
  calmness: 0.82,
  gravity: 0.7,
  semanticZoomEnabled: false,
  focusViz: "force",
  focusAutoPin: true,

  // Voronoi
  voronoiZoomMax: 12,
  voronoiWheelSpeed: 1,
  voronoiShowZoomControls: true,
  voronoiLodFadeStartPx: 5,
  voronoiLodFadeRangePx: 10,

  // Circle pack
  packSizeExponent: 2,
  packLabelFontSize: 12,
  packHoverStrokeWidth: 2,
  packDimOpacity: 0.12,
  packGlossOpacity: 1,

  // Force
  forceChargeStrength: 34,
  forceCollisionIterations: 2,
  forceLinkOpacity: 0.35,
  forceAlphaDecayMult: 1,
  forceCenterStrength: 1,
  forceShowTooltips: true,
  forcePinSelectedToCenter: true,
  forceCenterMulSelected: 4.2,
  forceCenterMulNeighbors: 1.6,
  forceCenterMulBackground: 1.2,
  forceChargeCenterMag: 6,
  forceChargeNeighborBaseMag: 8,
  forceChargeNeighborMotionMag: 10,
  forceBackgroundCollideRadius: 0.5,
  forceLinkDistScale: 1,
  forceLinkDistOffset: 0,
  forceLinkStrengthDefining: 0.26,
  forceLinkStrengthContextual: 0.14,
  forceLinkStrengthStructural: 0.18,
  forceRingPadPx: 10,
  forceRingCollidePadPx: 8,
  forceRingSafetyMult: 1.12,
  forceRingMinBasePx: 104,
  forceRingMinBaseFactor: 0.125,
  forceRingGapDefCtxPx: 14,
  forceRingGapCtxStrPx: 16,
  forceFitPaddingPx: 42,
  forceFitExtraOuterPx: 26,
  forceFitMinK: 0.5,
  forceFitMaxK: 2.6,
  forceFocusAnimMs: 2200,
  forceFitAnimMsFocus: 1200,
  forceFitAnimMsReset: 600,
  forceNeighborOpacity: 1,
  forceHideBackgroundWhenFocused: false,
  forceEdgeWidthScale: 1,
  // Make bubbles read as "solid" by default (lines become secondary).
  forceFillOpacityCenter: 1,
  forceFillOpacityNeighbor: 1,
  forceFillOpacityVisited: 1,
  forceFillOpacityBackground: 1,
  forceLabelOverflowPx: 26,
  forceFocusTotalN: 72,
  forceOverviewTopN: 100,
  forceRankMode: "mentions",
  forceDefiningCount: 10,
  forceContextualCount: 14,
  forceStructuralPerCatCount: 4,
  forceStructuralTagsCount: 8,
  forceShowDefining: true,
  forceShowContextual: true,
  forceShowStructural: true,
  forceFadeOpacity: 1,
  forceVisitedK: 10,
  forceVisitedOpacity: 1,
  forceStructORG: true,
  forceStructPERSON: true,
  forceStructLOC: true,
  forceStructPRODUCT: true,
  forceStructDATE: true,
  forceHeight: 520,

  // Pixi
  pixiBaseAlpha: 0.28,
  pixiHoverAlpha: 0.5,
  pixiDimOtherAlpha: 0.25,
  pixiDriftStrength: 1,
  pixiCollisionIterations: 1,
};

