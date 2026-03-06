"use client";

import React, { useEffect, useRef, useState } from "react";

// ——— Types ———
type SimParams = {
  /** Initial velocity (m/s) */
  u: number;
  /** Acceleration (m/s²) */
  a: number;
  /** Initial position (m) */
  x0: number;
  /** Time range for simulation (s) */
  tMax: number;
};

const DEFAULT_PARAMS: SimParams = {
  u: 4,
  a: 3,
  x0: 0,
  tMax: 8,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatNum(n: number, decimals = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(decimals);
}

// v = u + a*t
function velocityAtT(u: number, a: number, t: number): number {
  return u + a * t;
}

// x = x0 + u*t + 0.5*a*t^2  (position)
function positionAtT(x0: number, u: number, a: number, t: number): number {
  return x0 + u * t + 0.5 * a * t * t;
}

// Displacement from initial position: s = x - x0 = u*t + 0.5*a*t^2
function displacementAtT(u: number, a: number, t: number): number {
  return u * t + 0.5 * a * t * t;
}

// v² = u² + 2*a*s  =>  s = (v² - u²) / (2*a) when a ≠ 0
function displacementFromV2(u: number, v: number, a: number): number {
  if (Math.abs(a) < 1e-9) return 0;
  return (v * v - u * u) / (2 * a);
}

// ——— Slider ———
type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
};

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: SliderProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-700 bg-neutral-900/70 px-4 py-3 shadow-sm">
      <div className="min-w-[140px]">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-0.5 text-xs text-neutral-400">
          <span className="tabular-nums text-neutral-200">
            {formatNum(value, step < 1 ? 2 : 1)}
          </span>{" "}
          {unit}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        title={label}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-700 outline-none
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-amber-400
          [&::-webkit-slider-thumb]:shadow"
      />
      <div className="min-w-[80px] text-right text-xs text-neutral-400">
        <span className="tabular-nums text-neutral-200">
          {formatNum(value, step < 1 ? 2 : 1)}
        </span>{" "}
        {unit}
      </div>
    </div>
  );
}

// ——— Canvas: v–t and s–t graphs (match reference: change with u, a, s₀) ———
const COLOR_POSITION = "#4ade80";
const COLOR_VELOCITY = "#22d3ee";
const COLOR_AXIS = "rgba(248,250,252,0.9)";
const COLOR_GRID = "rgba(148,163,184,0.2)";
const COLOR_TEXT = "rgba(226,232,240,0.95)";
const COLOR_SUBTEXT = "rgba(148,163,184,0.9)";
const BG_DARK = "#0c1222";

function drawGrid(
  ctx: CanvasRenderingContext2D,
  plotX0: number,
  plotY0: number,
  plotW: number,
  plotH: number,
  dpr: number
) {
  ctx.strokeStyle = COLOR_GRID;
  ctx.lineWidth = 1 * dpr;
  const steps = 5;
  for (let i = 1; i < steps; i++) {
    const x = plotX0 + (i / steps) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, plotY0);
    ctx.lineTo(x, plotY0 + plotH);
    ctx.stroke();
  }
  for (let i = 1; i < steps; i++) {
    const y = plotY0 + (i / steps) * plotH;
    ctx.beginPath();
    ctx.moveTo(plotX0, y);
    ctx.lineTo(plotX0 + plotW, y);
    ctx.stroke();
  }
}

function GraphsCanvas({
  params,
  simTime,
}: {
  params: SimParams;
  simTime: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = canvas.width / Math.max(1, container.getBoundingClientRect().width);
    const w = canvas.width;
    const h = canvas.height;

    const tMax = Math.max(0.5, params.tMax);
    const tMin = 0;
    const tc = clamp(simTime, 0, tMax);

    const leftPad = 52 * dpr;
    const rightPad = 16 * dpr;
    const topPad = 20 * dpr;
    const bottomPad = 36 * dpr;
    const gap = 8 * dpr;
    const halfH = h / 2;
    const plotW = w - leftPad - rightPad;
    const plotH1 = halfH - topPad - gap / 2;
    const plotH2 = halfH - gap / 2 - bottomPad;

    const font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;

    // —— v–t: v = u + at (horizontal line if a=0, line through origin if u=0, intercept u if u≠0) ——
    const vAt0 = velocityAtT(params.u, params.a, 0);
    const vAtTMax = velocityAtT(params.u, params.a, tMax);
    const vMin = Math.min(vAt0, vAtTMax) - 1;
    const vMax = Math.max(vAt0, vAtTMax) + 1;
    const vRange = Math.max(vMax - vMin, 2);

    const toPxT = (t: number) => leftPad + ((t - tMin) / (tMax - tMin)) * plotW;
    const toPyV = (v: number) => topPad + (1 - (v - vMin) / vRange) * plotH1;

    // —— s–t: s = x₀ + ut + ½at² (straight line if a=0, parabola from origin zero slope if u=0 & x₀=0, parabola from x₀ with slope u if u≠0 or x₀≠0) ——
    const sAt0 = positionAtT(params.x0, params.u, params.a, 0);
    const sAtTMax = positionAtT(params.x0, params.u, params.a, tMax);
    const sVals = [sAt0, sAtTMax];
    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * tMax;
      sVals.push(positionAtT(params.x0, params.u, params.a, t));
    }
    const sMin = Math.min(...sVals) - 2;
    const sMax = Math.max(...sVals) + 2;
    const sRange = Math.max(sMax - sMin, 2);

    const plotY2 = halfH + gap / 2;
    const toPyS = (s: number) => plotY2 + (1 - (s - sMin) / sRange) * plotH2;

    ctx.fillStyle = BG_DARK;
    ctx.fillRect(0, 0, w, h);

    // ——— v–t graph ———
    drawGrid(ctx, leftPad, topPad, plotW, plotH1, dpr);
    ctx.strokeStyle = COLOR_AXIS;
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(leftPad, topPad);
    ctx.lineTo(leftPad, topPad + plotH1);
    ctx.lineTo(leftPad + plotW, topPad + plotH1);
    ctx.stroke();

    ctx.fillStyle = COLOR_SUBTEXT;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("t (s)", leftPad + plotW / 2, topPad + plotH1 + 8 * dpr);
    ctx.save();
    ctx.translate(leftPad - 24 * dpr, topPad + plotH1 / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("v (m/s)", 0, 0);
    ctx.restore();

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const v = vMin + (i / 4) * vRange;
      const py = toPyV(v);
      ctx.beginPath();
      ctx.moveTo(leftPad - 4 * dpr, py);
      ctx.lineTo(leftPad, py);
      ctx.strokeStyle = COLOR_AXIS;
      ctx.stroke();
      ctx.fillStyle = COLOR_SUBTEXT;
      ctx.fillText(formatNum(v, 1), leftPad - 8 * dpr, py);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 4; i++) {
      const t = tMin + (i / 4) * (tMax - tMin);
      const px = toPxT(t);
      ctx.beginPath();
      ctx.moveTo(px, topPad + plotH1);
      ctx.lineTo(px, topPad + plotH1 + 4 * dpr);
      ctx.strokeStyle = COLOR_AXIS;
      ctx.stroke();
      ctx.fillStyle = COLOR_SUBTEXT;
      ctx.fillText(formatNum(t, 1), px, topPad + plotH1 + 6 * dpr);
    }

    // v(t) = u + at
    ctx.strokeStyle = COLOR_VELOCITY;
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * tMax;
      const v = velocityAtT(params.u, params.a, t);
      const px = toPxT(t);
      const py = toPyV(v);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Time cursor on v–t
    const vc = velocityAtT(params.u, params.a, tc);
    const pxc = toPxT(tc);
    const pyc = toPyV(vc);
    ctx.fillStyle = COLOR_VELOCITY;
    ctx.beginPath();
    ctx.arc(pxc, pyc, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pxc, pyc);
    ctx.lineTo(pxc, topPad + plotH1);
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.strokeStyle = "rgba(34,211,238,0.6)";
    ctx.stroke();
    ctx.setLineDash([]);

    // ——— s–t graph (s = x = x₀ + ut + ½at²) ———
    drawGrid(ctx, leftPad, plotY2, plotW, plotH2, dpr);
    ctx.strokeStyle = COLOR_AXIS;
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(leftPad, plotY2);
    ctx.lineTo(leftPad, plotY2 + plotH2);
    ctx.lineTo(leftPad + plotW, plotY2 + plotH2);
    ctx.stroke();

    ctx.fillStyle = COLOR_SUBTEXT;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("t (s)", leftPad + plotW / 2, plotY2 + plotH2 + 8 * dpr);
    ctx.save();
    ctx.translate(leftPad - 24 * dpr, plotY2 + plotH2 / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("s (m)", 0, 0);
    ctx.restore();

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const s = sMin + (i / 4) * sRange;
      const py = toPyS(s);
      ctx.beginPath();
      ctx.moveTo(leftPad - 4 * dpr, py);
      ctx.lineTo(leftPad, py);
      ctx.strokeStyle = COLOR_AXIS;
      ctx.stroke();
      ctx.fillStyle = COLOR_SUBTEXT;
      ctx.fillText(formatNum(s, 1), leftPad - 8 * dpr, py);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 4; i++) {
      const t = tMin + (i / 4) * (tMax - tMin);
      const px = toPxT(t);
      ctx.beginPath();
      ctx.moveTo(px, plotY2 + plotH2);
      ctx.lineTo(px, plotY2 + plotH2 + 4 * dpr);
      ctx.strokeStyle = COLOR_AXIS;
      ctx.stroke();
      ctx.fillStyle = COLOR_SUBTEXT;
      ctx.fillText(formatNum(t, 1), px, plotY2 + plotH2 + 6 * dpr);
    }

    // s(t) = x₀ + ut + ½at²
    ctx.strokeStyle = COLOR_POSITION;
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * tMax;
      const s = positionAtT(params.x0, params.u, params.a, t);
      const px = toPxT(t);
      const py = toPyS(s);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Time cursor on s–t
    const sc = positionAtT(params.x0, params.u, params.a, tc);
    const pys = toPyS(sc);
    ctx.fillStyle = COLOR_POSITION;
    ctx.beginPath();
    ctx.arc(pxc, pys, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pxc, pys);
    ctx.lineTo(pxc, plotY2 + plotH2);
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.strokeStyle = "rgba(74,222,128,0.6)";
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = `${12 * dpr}px ${font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLOR_VELOCITY;
    ctx.fillText("v(t) = u + at", leftPad + plotW - 100 * dpr, topPad + 14 * dpr);
    ctx.fillStyle = COLOR_POSITION;
    ctx.fillText("s(t) = s₀ + ut + ½at²", leftPad + plotW - 120 * dpr, plotY2 + 14 * dpr);
  }, [params, simTime]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-[#0c1222] shadow-[0_0_30px_rgba(251,191,36,0.12)]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

// ——— Main component ———
export default function RelationsUniformlyAcceleratedMotionSimulation() {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [simTime, setSimTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const step = () => {
      rafRef.current = requestAnimationFrame(step);
      if (!playing) return;
      const tMax = Math.max(0.5, params.tMax);
      setSimTime((t) => {
        let next = t + 1 / 60;
        if (next >= tMax) next = 0;
        return next;
      });
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, params.tMax]);

  useEffect(() => {
    setSimTime(0);
  }, [params.u, params.a, params.x0, params.tMax]);

  const reset = () => {
    setParams(DEFAULT_PARAMS);
    setSimTime(0);
    setPlaying(false);
  };

  const t = clamp(simTime, 0, Math.max(0.5, params.tMax));
  const v = velocityAtT(params.u, params.a, t);
  const s = displacementAtT(params.u, params.a, t);
  const sFromV2 = displacementFromV2(params.u, v, params.a);
  const v2CheckOk = Math.abs(s - sFromV2) < 0.05;
  const lhsV = v;
  const rhsV = params.u + params.a * t;
  const lhsS = s;
  const rhsS = params.u * t + 0.5 * params.a * t * t;
  const lhsV2 = v * v;
  const rhsV2 = params.u * params.u + 2 * params.a * s;

  return (
    <main className="min-h-screen bg-[#020617]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
            <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
              <div className="mb-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/50 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-white">SUVAT Relations Lab</div>
                  <div className="text-xs text-neutral-400">Verify all three uniformly accelerated motion relations at the current time cursor.</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:border-amber-400 hover:bg-amber-500/20"
                  >
                    {playing ? "\u23F8 Pause" : "\u25B6 Play"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimTime((cur) => clamp(cur + 0.1, 0, Math.max(0.5, params.tMax)))}
                    className="rounded-xl border border-neutral-600 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
                  >
                    Step +0.1s
                  </button>
                </div>
              </div>

              <GraphsCanvas params={params} simTime={simTime} />
            </div>

            <aside className="col-span-1 h-[580px] overflow-y-auto">
              <div className="h-full rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">SUVAT Controls</h3>
                    <div className="text-xs text-neutral-400">Tune initial conditions and watch all relations stay consistent.</div>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl border border-neutral-600 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
                  >
                    {"\u21BA Reset"}
                  </button>
                </div>

                <div className="grid gap-3">
                  <SliderRow label="Initial velocity u" value={params.u} min={-40} max={40} step={0.5} unit="m/s" onChange={(u) => setParams((p) => ({ ...p, u }))} />
                  <SliderRow label="Acceleration a" value={params.a} min={-12} max={12} step={0.25} unit="m/s^2" onChange={(a) => setParams((p) => ({ ...p, a }))} />
                  <SliderRow label="Initial position x0" value={params.x0} min={-40} max={40} step={0.5} unit="m" onChange={(x0) => setParams((p) => ({ ...p, x0 }))} />
                  <SliderRow label="Time range tMax" value={params.tMax} min={2} max={20} step={0.5} unit="s" onChange={(tMax) => setParams((p) => ({ ...p, tMax }))} />
                </div>

                <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-amber-300">Equation Check at t = {formatNum(t, 2)} s</div>
                  <div className="mt-2 space-y-2 text-xs text-neutral-200">
                    <div className="flex items-center justify-between gap-3">
                      <span>v = u + at</span>
                      <span className="font-mono">{formatNum(lhsV, 2)} = {formatNum(rhsV, 2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>s = ut + 0.5at^2</span>
                      <span className="font-mono">{formatNum(lhsS, 2)} = {formatNum(rhsS, 2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>v^2 = u^2 + 2as</span>
                      <span className="font-mono">{formatNum(lhsV2, 2)} = {formatNum(rhsV2, 2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Concept</div>
              <p className="mt-3 text-sm">This simulator is relation-first: it verifies all three equations simultaneously for the same motion state.</p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Key formulas</div>
              <div className="mt-3 space-y-2 text-sm font-mono text-neutral-200">
                <div>v = u + a t</div>
                <div>s = u t + 0.5 a t^2</div>
                <div>v^2 = u^2 + 2 a s</div>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Live values</div>
              <div className="mt-3 text-sm">At t = {formatNum(t, 2)} s: v = {formatNum(v, 2)} m/s, s = {formatNum(s, 2)} m</div>
              <div className="mt-2 text-sm">Consistency check v^2 = u^2 + 2as: <span className={v2CheckOk ? "text-emerald-400" : "text-amber-400"}>{v2CheckOk ? "OK" : "Check"}</span></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
