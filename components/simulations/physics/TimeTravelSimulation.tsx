"use client";

import React, { useEffect, useRef, useState } from "react";

// â€”â€”â€” Causality-accurate Time Travel (CTC) Simulator â€”â€”â€”
// Light cones, proper time Ï„, causal arrows, Physics (Novikov) vs Sciâ€‘Fi (branching).
// Worldlines from simplified GR metrics; timelike condition g_Î¼Î½ (dx^Î¼/dÏ„)(dx^Î½/dÏ„) < 0.

type SpacetimeModelId = "godel" | "kerr" | "tipler" | "wormhole" | "minkowski";
type CausalMode = "physics" | "scifi";

type Params = {
  ctcStrength: number;
  branchCount: number;
  loopExtent: number;
  simSpeed: number;
  /** Event A position along worldline (0â€“1, proper time fraction) */
  eventAFrac: number;
  /** Event B position along worldline (0â€“1) */
  eventBFrac: number;
  spacetimeModel: SpacetimeModelId;
  causalMode: CausalMode;
};

const DEFAULT_PARAMS: Params = {
  ctcStrength: 0.7,
  branchCount: 0,
  loopExtent: 1.5,
  simSpeed: 1,
  eventAFrac: 0.25,
  eventBFrac: 0.75,
  spacetimeModel: "godel",
  causalMode: "physics",
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatNum(n: number, decimals = 2) {
  if (!Number.isFinite(n)) return "â€”";
  return n.toFixed(decimals);
}

// â€”â€”â€” Metric and light cones (c = 1) â€”â€”â€”
// dsÂ² = g_tt dtÂ² + 2 g_tx dt dx + g_xx dxÂ². Null: g_tt (dt/dx)Â² + 2 g_tx (dt/dx) + g_xx = 0.
// So dt/dx = (-g_tx Â± âˆš(g_txÂ² - g_tt g_xx)) / g_tt.
function lightConeSlopes(
  gtt: number,
  gtx: number,
  gxx: number
): { slope1: number; slope2: number } {
  const disc = gtx * gtx - gtt * gxx;
  if (disc < 0 || Math.abs(gtt) < 1e-10) return { slope1: 1, slope2: -1 };
  const s = Math.sqrt(disc);
  return {
    slope1: (-gtx + s) / gtt,
    slope2: (-gtx - s) / gtt,
  };
}

// Metric components for each model (simplified 2D t,x). Signature (-,+).
type MetricAtPoint = { gtt: number; gtx: number; gxx: number };

function getMetricGodel(t: number, x: number, ctcStrength: number): MetricAtPoint {
  // GÃ¶del: rotation induces dt dx cross term. Simplified: g_tt = -1, g_xx = 1, g_tx = Î© xÂ² type.
  const omega = ctcStrength * 0.8;
  const gtt = -1;
  const gxx = 1;
  const gtx = omega * x * x * 0.5;
  return { gtt, gtx, gxx };
}

function getMetricKerr(t: number, x: number, ctcStrength: number): MetricAtPoint {
  // Kerr interior (r < r_-): simplified. Use r = 1 + x, inside horizon g_tt can flip.
  const r = 1 + 0.5 * (x + 1);
  const rs = 0.8 + 0.4 * ctcStrength;
  const gtt = -(1 - rs / r);
  const gxx = 1 / Math.max(0.01, 1 - rs / r);
  const gtx = ctcStrength * 0.3 * (1 / r);
  return { gtt, gtx, gxx };
}

function getMetricTipler(t: number, x: number, ctcStrength: number): MetricAtPoint {
  // Tipler cylinder: rotation, dt dÏ† cross. 2D slice: tilt increases with |x| (radius).
  const gtt = -1;
  const gxx = 1;
  const gtx = ctcStrength * 0.4 * x;
  return { gtt, gtx, gxx };
}

function getMetricWormhole(t: number, x: number, ctcStrength: number): MetricAtPoint {
  // Traversable wormhole with time shift: throat at xâ‰ˆ0, time jump. Smooth metric.
  const throat = 0.3 * (1 - ctcStrength * 0.5);
  const gtt = -1 - ctcStrength * 0.2 * Math.exp(-x * x / (throat * throat + 0.1));
  const gxx = 1 + ctcStrength * 0.5 / (x * x + 0.2);
  const gtx = ctcStrength * 0.15 * x * Math.exp(-x * x);
  return { gtt, gtx, gxx };
}

function getMetricMinkowski(): MetricAtPoint {
  return { gtt: -1, gtx: 0, gxx: 1 };
}

function getMetric(
  model: SpacetimeModelId,
  t: number,
  x: number,
  ctcStrength: number
): MetricAtPoint {
  switch (model) {
    case "godel":
      return getMetricGodel(t, x, ctcStrength);
    case "kerr":
      return getMetricKerr(t, x, ctcStrength);
    case "tipler":
      return getMetricTipler(t, x, ctcStrength);
    case "wormhole":
      return getMetricWormhole(t, x, ctcStrength);
    default:
      return getMetricMinkowski();
  }
}

// Worldline point with proper time Ï„ (monotonically increasing).
export type WorldlinePoint = { t: number; x: number; tau: number };

function computeWorldline(
  model: SpacetimeModelId,
  params: Params
): WorldlinePoint[] {
  const pts: WorldlinePoint[] = [];
  const steps = 200;
  const k = params.ctcStrength;
  const loopExt = params.loopExtent;

  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    let t: number;
    let x: number;
    if (k < 0.02) {
      t = s * 2;
      x = 0.3 * Math.sin(s * Math.PI * 2);
    } else {
      const tForward = 1.2;
      const tBack = loopExt;
      const sLoop = Math.max(0, (s - 0.35) / 0.65);
      const loopPhase = sLoop * Math.PI;
      t = tForward + k * tBack * (1 - Math.cos(loopPhase));
      x = 0.2 + k * 0.6 * Math.sin(loopPhase) + 0.1 * Math.sin(s * Math.PI * 4);
    }
    pts.push({ t, x, tau: 0 });
  }

  // Compute proper time Ï„ by integrating sqrt(-dsÂ²) along curve. dsÂ² < 0 for timelike.
  let tau = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i]!;
    const p1 = pts[i + 1]!;
    const dt = p1.t - p0.t;
    const dx = p1.x - p0.x;
    const tMid = (p0.t + p1.t) / 2;
    const xMid = (p0.x + p1.x) / 2;
    const g = getMetric(model, tMid, xMid, params.ctcStrength);
    let ds2 = g.gtt * dt * dt + 2 * g.gtx * dt * dx + g.gxx * dx * dx;
    if (ds2 >= 0) ds2 = -1e-6;
    tau += Math.sqrt(-ds2);
    p1.tau = tau;
  }
  return pts;
}

function getBranchPoints(worldline: WorldlinePoint[], branchCount: number): WorldlinePoint[][] {
  if (branchCount < 1) return [];
  const branches: WorldlinePoint[][] = [];
  const branchStart = Math.floor(worldline.length * 0.5);
  const start = worldline[branchStart];
  if (!start) return [];
  for (let b = 0; b < branchCount; b++) {
    const angle = ((b + 1) / (branchCount + 1)) * 0.8 - 0.4;
    branches.push([
      start,
      { t: start.t + 0.25, x: start.x + angle, tau: start.tau + 0.2 },
      { t: start.t + 0.5, x: start.x + angle * 1.2, tau: start.tau + 0.4 },
    ]);
  }
  return branches;
}

/** Compute plot bounds from worldline and branches so the full curve fits (with padding). */
function computePlotBounds(
  worldline: WorldlinePoint[],
  branches: WorldlinePoint[][],
  padding = 0.4
): { tMin: number; tMax: number; xMin: number; xMax: number } {
  let tMin = Infinity;
  let tMax = -Infinity;
  let xMin = Infinity;
  let xMax = -Infinity;
  for (const p of worldline) {
    tMin = Math.min(tMin, p.t);
    tMax = Math.max(tMax, p.t);
    xMin = Math.min(xMin, p.x);
    xMax = Math.max(xMax, p.x);
  }
  for (const branch of branches) {
    for (const p of branch) {
      tMin = Math.min(tMin, p.t);
      tMax = Math.max(tMax, p.t);
      xMin = Math.min(xMin, p.x);
      xMax = Math.max(xMax, p.x);
    }
  }
  const tRange = Math.max(tMax - tMin, 2);
  const xRange = Math.max(xMax - xMin, 1.2);
  return {
    tMin: tMin - padding,
    tMax: tMax + padding,
    xMin: xMin - padding,
    xMax: xMax + padding,
  };
}

// Light cone at (t,x): return two null directions as (dt, dx) normalized so we draw short segments.
function getLightConeDirections(
  model: SpacetimeModelId,
  t: number,
  x: number,
  ctcStrength: number,
  length: number
): [{ dt: number; dx: number }, { dt: number; dx: number }] {
  const g = getMetric(model, t, x, ctcStrength);
  const { slope1, slope2 } = lightConeSlopes(g.gtt, g.gtx, g.gxx);
  const dx1 = length;
  const dt1 = slope1 * dx1;
  const dx2 = length;
  const dt2 = slope2 * dx2;
  const n1 = Math.hypot(dt1, dx1) || 1;
  const n2 = Math.hypot(dt2, dx2) || 1;
  return [
    { dt: (dt1 / n1) * length, dx: (dx1 / n1) * length },
    { dt: (dt2 / n2) * length, dx: (dx2 / n2) * length },
  ];
}

// â€”â€”â€” Slider row â€”â€”â€”
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/70 px-4 py-3 shadow-md">
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="flex items-center gap-3">
        <span className="min-w-[3.5rem] text-right text-sm tabular-nums text-neutral-300">
          {typeof value === "number" && value === Math.round(value) ? value : formatNum(value, 2)}
          {unit ? ` ${unit}` : ""}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="physics-range flex-1 min-w-0 accent-sky-500"
          aria-label={label}
        />
      </div>
    </div>
  );
}

// â€”â€”â€” Canvas colors (dark theme) â€”â€”â€”
const BG = "#050810";
const GRID = "rgba(100, 116, 139, 0.12)";
const AXIS = "rgba(248, 250, 252, 0.85)";
const TEXT = "rgba(226, 232, 240, 0.95)";
const SUBTEXT = "rgba(148, 163, 184, 0.85)";
const CTC_COLOR = "#38bdf8";
const CTC_HIGHLIGHT = "#7dd3fc";
const BRANCH_COLOR = "#fb923c";
const TRAVELER_COLOR = "#22c55e";
const LIGHT_CONE_COLOR = "rgba(251, 191, 36, 0.9)";
const CAUSAL_ARROW = "#f87171";
const CAUSAL_LOOP_FILL = "rgba(239, 68, 68, 0.25)";
const EVENT_COLOR_A = "#a78bfa";
const EVENT_COLOR_B = "#34d399";

const SPACETIME_MODELS: {
  id: SpacetimeModelId;
  name: string;
  description: string;
  exoticMatter: string;
  plausibility: string;
}[] = [
    {
      id: "godel",
      name: "Godel Universe",
      description: "Rotating dust; global CTCs. Exact GR solution.",
      exoticMatter: "No",
      plausibility: "Theoretically consistent; not our universe.",
    },
    {
      id: "kerr",
      name: "Kerr Black Hole Interior",
      description: "Inside inner horizon (r < r-) causal structure allows CTCs.",
      exoticMatter: "No",
      plausibility: "Solution exists; interior may be unstable.",
    },
    {
      id: "tipler",
      name: "Tipler Cylinder",
      description: "Infinitely long rotating cylinder; CTCs around it.",
      exoticMatter: "Yes (infinite density)",
      plausibility: "Requires infinite length; not realistic.",
    },
    {
      id: "wormhole",
      name: "Traversable Wormhole (time shift)",
      description: "Two mouths with time shift; path through throat can go to past.",
      exoticMatter: "Yes (negative energy)",
      plausibility: "Speculative; needs exotic matter.",
    },
    {
      id: "minkowski",
      name: "Minkowski (no CTC)",
      description: "Flat spacetime; no CTCs. Reference.",
      exoticMatter: "No",
      plausibility: "Standard.",
    },
  ];

function SimulatorCanvas({
  params,
  time,
  playing,
}: {
  params: Params;
  time: number;
  playing: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const worldline = computeWorldline(params.spacetimeModel, params);
  const branches = getBranchPoints(
    worldline,
    params.causalMode === "scifi" ? params.branchCount : 0
  );
  const bounds = computePlotBounds(worldline, branches);

  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const resize = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = canvas.width / Math.max(1, el.getBoundingClientRect().width);
    const w = canvas.width;
    const h = canvas.height;
    const leftPad = 52 * dpr;
    const rightPad = 20 * dpr;
    const topPad = 40 * dpr;
    const bottomPad = 52 * dpr;
    const plotW = w - leftPad - rightPad;
    const plotH = h - topPad - bottomPad;
    const tMin = bounds.tMin;
    const tMax = bounds.tMax;
    const xMin = bounds.xMin;
    const xMax = bounds.xMax;
    const dataW = xMax - xMin;
    const dataH = tMax - tMin;
    const scale = Math.min(plotW / dataW, plotH / dataH);
    const scaleX = scale;
    const scaleY = scale;
    const offsetX = (plotW - dataW * scale) / 2;
    const offsetY = (plotH - dataH * scale) / 2;
    const toScreen = (t: number, x: number) => ({
      x: leftPad + offsetX + (x - xMin) * scaleX,
      y: topPad + offsetY + (tMax - t) * scaleY,
    });

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1 * dpr;
    for (let ti = 0; ti <= 10; ti++) {
      const t = tMin + (ti / 10) * (tMax - tMin);
      const { y: sy } = toScreen(t, xMin);
      ctx.beginPath();
      ctx.moveTo(leftPad, sy);
      ctx.lineTo(leftPad + plotW, sy);
      ctx.stroke();
    }
    for (let xi = 0; xi <= 7; xi++) {
      const x = xMin + (xi / 7) * (xMax - xMin);
      const { x: sx } = toScreen(tMin, x);
      ctx.beginPath();
      ctx.moveTo(sx, topPad + plotH);
      ctx.lineTo(sx, topPad);
      ctx.stroke();
    }

    // Light cones at sample points along worldline (c = 1; tilt from metric)
    const coneStep = Math.max(1, Math.floor(worldline.length / 12));
    const coneLength = 0.12;
    for (let i = 0; i < worldline.length; i += coneStep) {
      const p = worldline[i]!;
      const [dir1, dir2] = getLightConeDirections(
        params.spacetimeModel,
        p.t,
        p.x,
        params.ctcStrength,
        coneLength
      );
      const { x: sx, y: sy } = toScreen(p.t, p.x);
      ctx.strokeStyle = LIGHT_CONE_COLOR;
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(
        sx + dir1.dx * scaleX,
        sy - dir1.dt * scaleY
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(
        sx + dir2.dx * scaleX,
        sy - dir2.dt * scaleY
      );
      ctx.stroke();
    }

    // Causal loop region (if A and B form a loop) and causal arrows
    const idxA = Math.floor(params.eventAFrac * (worldline.length - 1));
    const idxB = Math.floor(params.eventBFrac * (worldline.length - 1));
    const pA = worldline[Math.min(idxA, worldline.length - 1)];
    const pB = worldline[Math.min(idxB, worldline.length - 1)];
    const tauA = pA?.tau ?? 0;
    const tauB = pB?.tau ?? 0;
    const hasLoop = params.ctcStrength > 0.1 && Math.abs(tauB - tauA) > 0.01;

    if (hasLoop && pA && pB) {
      ctx.fillStyle = CAUSAL_LOOP_FILL;
      ctx.beginPath();
      const iStart = Math.min(idxA, idxB);
      const iEnd = Math.max(idxA, idxB);
      const first = worldline[iStart]!;
      ctx.moveTo(toScreen(first.t, first.x).x, toScreen(first.t, first.x).y);
      for (let i = iStart + 1; i <= iEnd; i++) {
        const pt = worldline[i]!;
        ctx.lineTo(toScreen(pt.t, pt.x).x, toScreen(pt.t, pt.x).y);
      }
      for (let i = iEnd; i < worldline.length; i++) {
        const pt = worldline[i]!;
        ctx.lineTo(toScreen(pt.t, pt.x).x, toScreen(pt.t, pt.x).y);
      }
      for (let i = 0; i <= iStart; i++) {
        const pt = worldline[i]!;
        ctx.lineTo(toScreen(pt.t, pt.x).x, toScreen(pt.t, pt.x).y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = CAUSAL_ARROW;
      ctx.lineWidth = 2 * dpr;
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Causal arrows Aâ†’B and Bâ†’A (along worldline)
    function drawArrow(
      context: CanvasRenderingContext2D,
      from: WorldlinePoint,
      to: WorldlinePoint,
      color: string
    ) {
      const s1 = toScreen(from.t, from.x);
      const s2 = toScreen(to.t, to.x);
      const dx = s2.x - s1.x;
      const dy = s2.y - s1.y;
      const len = Math.hypot(dx, dy);
      if (len < 2) return;
      const ux = dx / len;
      const uy = dy / len;
      const ax = 10 * dpr;
      const tipX = s2.x - ux * ax;
      const tipY = s2.y - uy * ax;
      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineWidth = 2.5 * dpr;
      context.beginPath();
      context.moveTo(s1.x, s1.y);
      context.lineTo(tipX, tipY);
      context.stroke();
      context.beginPath();
      context.moveTo(s2.x, s2.y);
      context.lineTo(tipX - uy * 6 * dpr, tipY + ux * 6 * dpr);
      context.lineTo(tipX + uy * 6 * dpr, tipY - ux * 6 * dpr);
      context.closePath();
      context.fill();
    }
    if (pA && pB && hasLoop) {
      drawArrow(ctx, pA, pB, CAUSAL_ARROW);
      drawArrow(ctx, pB, pA, CAUSAL_ARROW);
    }

    // Sci-Fi: alternate timeline branches (divergence point)
    if (params.causalMode === "scifi" && params.branchCount > 0) {
      const branches = getBranchPoints(worldline, params.branchCount);
      branches.forEach((branchPts) => {
        ctx.strokeStyle = BRANCH_COLOR;
        ctx.lineWidth = 1.5 * dpr;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath();
        branchPts.forEach((p, i) => {
          const { x: sx, y: sy } = toScreen(p.t, p.x);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Main worldline with proper-time arrows (small ticks in direction of increasing Ï„)
    ctx.strokeStyle = CTC_COLOR;
    ctx.lineWidth = 2.5 * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    worldline.forEach((p, i) => {
      const { x: sx, y: sy } = toScreen(p.t, p.x);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();

    const arrowStep = Math.max(1, Math.floor(worldline.length / 20));
    for (let i = arrowStep; i < worldline.length - 1; i += arrowStep) {
      const p0 = worldline[i]!;
      const p1 = worldline[i + 1]!;
      const sx0 = toScreen(p0.t, p0.x).x;
      const sy0 = toScreen(p0.t, p0.x).y;
      const sx1 = toScreen(p1.t, p1.x).x;
      const sy1 = toScreen(p1.t, p1.x).y;
      const dx = sx1 - sx0;
      const dy = sy1 - sy0;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const cx = sx0 + ux * 4 * dpr;
      const cy = sy0 + uy * 4 * dpr;
      ctx.fillStyle = CTC_HIGHLIGHT;
      ctx.beginPath();
      ctx.moveTo(cx + ux * 8 * dpr, cy + uy * 8 * dpr);
      ctx.lineTo(cx - ux * 5 * dpr - uy * 5 * dpr, cy - uy * 5 * dpr + ux * 5 * dpr);
      ctx.lineTo(cx - ux * 5 * dpr + uy * 5 * dpr, cy - uy * 5 * dpr - ux * 5 * dpr);
      ctx.closePath();
      ctx.fill();
    }

    // Events A and B
    if (pA) {
      const { x: sx, y: sy } = toScreen(pA.t, pA.x);
      ctx.fillStyle = EVENT_COLOR_A;
      ctx.strokeStyle = "#5b21b6";
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(sx, sy, 10 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = TEXT;
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("A", sx, sy - 14 * dpr);
      ctx.fillText(`Ï„=${formatNum(pA.tau, 2)}`, sx, sy + 20 * dpr);
    }
    if (pB) {
      const { x: sx, y: sy } = toScreen(pB.t, pB.x);
      ctx.fillStyle = EVENT_COLOR_B;
      ctx.strokeStyle = "#047857";
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(sx, sy, 10 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = TEXT;
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("B", sx, sy - 14 * dpr);
      ctx.fillText(`Ï„=${formatNum(pB.tau, 2)}`, sx, sy + 20 * dpr);
    }

    // Traveler dot (proper time direction)
    const pathLen = worldline.length - 1;
    const seg = (time * params.simSpeed * 1.2) % Math.max(1, pathLen);
    const i0 = Math.floor(seg) % Math.max(1, worldline.length);
    const i1 = Math.min(i0 + 1, worldline.length - 1);
    const t = seg - Math.floor(seg);
    const p0 = worldline[i0];
    const p1 = worldline[i1];
    if (p0 && p1) {
      const tp = p0.t + (p1.t - p0.t) * t;
      const xp = p0.x + (p1.x - p0.x) * t;
      const tauP = p0.tau + (p1.tau - p0.tau) * t;
      const { x: sx, y: sy } = toScreen(tp, xp);
      ctx.fillStyle = TRAVELER_COLOR;
      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(sx, sy, 8 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = TEXT;
      ctx.font = `${9 * dpr}px sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`Ï„=${formatNum(tauP, 2)}`, sx + 12 * dpr, sy);
    }

    // Axis labels: coordinate time t vs space x
    ctx.fillStyle = SUBTEXT;
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("space (x)", leftPad + plotW / 2, topPad + plotH + 10 * dpr);
    ctx.save();
    ctx.translate(leftPad - 10 * dpr, topPad + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("coord. time (t)", 0, 0);
    ctx.restore();

    // Legend and HUD
    const hudX = leftPad + 8 * dpr;
    let hudY = topPad + 8 * dpr;
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = CTC_HIGHLIGHT;
    ctx.fillText(
      params.ctcStrength > 0.05 ? "Closed timelike curve (CTC)" : "Timelike worldline",
      hudX,
      hudY
    );
    hudY += 14 * dpr;
    ctx.fillStyle = SUBTEXT;
    ctx.fillText("Yellow: light cones (c=1). Arrows: increasing proper time Ï„.", hudX, hudY);
    hudY += 14 * dpr;
    ctx.fillText("t = coordinate time. Ï„ = proper time (always increases).", hudX, hudY);
  }, [params, time, bounds]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-h-[50vh] overflow-hidden rounded-2xl border border-indigo-500/40 bg-[#050810] shadow-lg"
      style={{ aspectRatio: "16/9" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

export default function TimeTravelSimulation() {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setTime((t) => t + dt);
      requestAnimationFrame(tick);
    };
    lastTickRef.current = performance.now();
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing]);

  const reset = () => {
    setParams(DEFAULT_PARAMS);
    setTime(0);
    setPlaying(true);
  };

  const currentModel = SPACETIME_MODELS.find((m) => m.id === params.spacetimeModel);

  return (
    <main className="min-h-screen bg-[#020617]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />
      {/* Warning banner */}
      <div className="mx-4 mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm font-medium text-amber-200">
        CTCs are mathematical solutions of GR, not experimentally realized.
      </div>

      <section className="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="col-span-1 flex flex-col gap-4 lg:col-span-2">
                <div className="mb-1 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-xs text-neutral-400">
                    Spacetime diagram: t (vertical), x (horizontal). Tau = proper time. Light cones show local causal structure (c=1).
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPlaying((p) => !p)}
                      className="rounded-xl border border-emerald-500/70 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(16,185,129,0.15)] hover:bg-emerald-500"
                    >
                      {playing ? "\u23F8 Pause" : "\u25B6 Play"}
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-700"
                    >
                      {"\u21BA Reset"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-700 bg-neutral-900/30">
                  <SimulatorCanvas params={params} time={time} playing={playing} />
                </div>

                <div className="rounded-xl border border-neutral-700 bg-neutral-900/50 px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-neutral-300">Mode:</span>
                  {params.causalMode === "physics" ? (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-300">
                      Physics (Novikov) - self-consistent solution enforced.
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-semibold text-amber-300">
                      Sci-Fi (branching) - speculative, non-GR.
                    </span>
                  )}
                </div>
              </div>

              <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700">
                <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-5 shadow-xl">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Parameters</h3>
                      <div className="text-xs text-neutral-400">Model, CTC strength, events A/B.</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs font-semibold text-neutral-400 mb-1">Causal mode</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setParams((p) => ({ ...p, causalMode: "physics" as CausalMode, branchCount: 0 }))}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold ${params.causalMode === "physics"
                            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                            : "border-neutral-600 bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                          }`}
                      >
                        Physics
                      </button>
                      <button
                        type="button"
                        onClick={() => setParams((p) => ({ ...p, causalMode: "scifi" as CausalMode }))}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold ${params.causalMode === "scifi"
                            ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                            : "border-neutral-600 bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                          }`}
                      >
                        Sci-Fi
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs font-semibold text-neutral-400 mb-1">Spacetime model</div>
                    <select
                      value={params.spacetimeModel}
                      onChange={(e) =>
                        setParams((p) => ({
                          ...p,
                          spacetimeModel: e.target.value as SpacetimeModelId,
                        }))
                      }
                      className="w-full rounded-xl border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white"
                    >
                      {SPACETIME_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <SliderRow
                      label="CTC strength"
                      value={params.ctcStrength}
                      min={0}
                      max={1}
                      step={0.05}
                      unit=""
                      onChange={(v) => setParams((p) => ({ ...p, ctcStrength: clamp(v, 0, 1) }))}
                    />
                    {params.causalMode === "scifi" && (
                      <SliderRow
                        label="Timeline branches"
                        value={params.branchCount}
                        min={0}
                        max={4}
                        step={1}
                        unit=""
                        onChange={(v) =>
                          setParams((p) => ({
                            ...p,
                            branchCount: Math.round(clamp(v, 0, 4)),
                          }))
                        }
                      />
                    )}
                    <SliderRow
                      label="Loop extent"
                      value={params.loopExtent}
                      min={0.5}
                      max={2.5}
                      step={0.1}
                      unit=""
                      onChange={(v) =>
                        setParams((p) => ({ ...p, loopExtent: clamp(v, 0.5, 2.5) }))
                      }
                    />
                    <SliderRow
                      label="Event A (tau fraction)"
                      value={params.eventAFrac}
                      min={0}
                      max={1}
                      step={0.05}
                      unit=""
                      onChange={(v) =>
                        setParams((p) => ({ ...p, eventAFrac: clamp(v, 0, 1) }))
                      }
                    />
                    <SliderRow
                      label="Event B (tau fraction)"
                      value={params.eventBFrac}
                      min={0}
                      max={1}
                      step={0.05}
                      unit=""
                      onChange={(v) =>
                        setParams((p) => ({ ...p, eventBFrac: clamp(v, 0, 1) }))
                      }
                    />
                    <SliderRow
                      label="Sim speed"
                      value={params.simSpeed}
                      min={0.5}
                      max={2}
                      step={0.25}
                      unit="x"
                      onChange={(v) => setParams((p) => ({ ...p, simSpeed: v }))}
                    />
                  </div>
                </div>
              </aside>
            </div>

            <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">
                Time Travel - Causality &amp; GR
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                A <em>closed timelike curve (CTC)</em> is a worldline that returns to the same spacetime event. The worldline stays inside the local light cone (timelike: g_mu_nu dx^mu dx^nu &lt; 0). Proper time tau always increases along the curve, even when coordinate time t decreases. Events A and B can form a causal loop (A-&gt;B-&gt;A); in Physics mode Novikov self-consistency is enforced, while in Sci-Fi mode branching timelines are speculative.
              </p>
              <div className="mt-4 rounded-2xl border border-neutral-700 bg-neutral-900/60 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">t vs tau</div>
                <div className="mt-2 space-y-1 text-sm text-neutral-300">
                  <div><strong className="text-neutral-200">Coordinate time t</strong>: axis on diagram; can decrease along a CTC.</div>
                  <div><strong className="text-neutral-200">Proper time tau</strong>: clock time; always increases. Arrows on worldline show tau direction.</div>
                </div>
              </div>
              {currentModel && (
                <div className="mt-4 rounded-2xl border border-neutral-700 bg-neutral-900/60 p-3 text-sm text-neutral-300">
                  <div className="font-semibold text-white">{currentModel.name}</div>
                  <p className="mt-1">{currentModel.description}</p>
                  <div className="mt-2 flex gap-4 text-xs text-neutral-400">
                    <span>Exotic matter: {currentModel.exoticMatter}</span>
                    <span>Plausibility: {currentModel.plausibility}</span>
                  </div>
                </div>
              )}
              <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-neutral-300">
                <span className="font-semibold text-amber-400">Timelike condition:</span> g_mu_nu (dx^mu/dtau)(dx^nu/dtau) &lt; 0. Worldlines are integrated from the metric; light cone slope = c = 1 in chosen units.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
