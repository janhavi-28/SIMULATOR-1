"use client";

import React, { useEffect, useRef, useState } from "react";

// ——— Types ———
type GraphParams = {
  /** Initial velocity (m/s) */
  u: number;
  /** Acceleration (m/s²) */
  a: number;
  /** Initial position (m) */
  x0: number;
  /** Time range for graphs (s) */
  tMax: number;
};

const DEFAULT_PARAMS: GraphParams = {
  u: 5,
  a: 2,
  x0: 0,
  tMax: 10,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatNum(n: number, decimals = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(decimals);
}

// v(t) = u + a*t
function velocityAtT(u: number, a: number, t: number) {
  return u + a * t;
}

// x(t) = x0 + u*t + 0.5*a*t^2
function positionAtT(x0: number, u: number, a: number, t: number) {
  return x0 + u * t + 0.5 * a * t * t;
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

function SliderRow({ label, value, min, max, step, unit, onChange }: SliderProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-700 bg-neutral-900/70 px-4 py-3 shadow-sm">
      <div className="min-w-[140px]">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-0.5 text-xs text-neutral-400">
          <span className="tabular-nums text-neutral-200">{formatNum(value, step < 1 ? 2 : 1)}</span> {unit}
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
        aria-label={label}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-700 outline-none
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-cyan-400
          [&::-webkit-slider-thumb]:shadow"
      />
      <div className="min-w-[80px] text-right text-xs text-neutral-400">
        <span className="tabular-nums text-neutral-200">{formatNum(value, step < 1 ? 2 : 1)}</span> {unit}
      </div>
    </div>
  );
}

// ——— Canvas: v–t and x–t graphs ———
const COLOR_VELOCITY = "#22d3ee";   // bright cyan
const COLOR_POSITION = "#4ade80";   // bright green
const COLOR_AXIS = "rgba(248,250,252,0.9)";
const COLOR_GRID = "rgba(148,163,184,0.2)";
const COLOR_TEXT = "rgba(226,232,240,0.95)";
const COLOR_SUBTEXT = "rgba(148,163,184,0.9)";
const BG_DARK = "#0c1222";

function GraphsCanvas({ params, simTime }: { params: GraphParams; simTime: number }) {
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

    // Vertical split: top half v–t, bottom half x–t
    const halfH = h / 2;
    const leftPad = 52 * dpr;
    const rightPad = 16 * dpr;
    const topPad = 20 * dpr;
    const bottomPad = 36 * dpr;
    const gap = 8 * dpr;

    const plotW = w - leftPad - rightPad;
    const plotH1 = halfH - topPad - gap / 2;
    const plotH2 = halfH - gap / 2 - bottomPad;

    // —— v–t plot bounds ——
    const vAt0 = velocityAtT(params.u, params.a, 0);
    const vAtTMax = velocityAtT(params.u, params.a, tMax);
    const vMin = Math.min(vAt0, vAtTMax) - 1;
    const vMax = Math.max(vAt0, vAtTMax) + 1;
    const vRange = Math.max(vMax - vMin, 2);

    const toPxT = (t: number) => leftPad + ((t - tMin) / (tMax - tMin)) * plotW;
    const toPyV = (v: number) => topPad + (1 - (v - vMin) / vRange) * plotH1;

    // —— x–t plot bounds ——
    const xAt0 = positionAtT(params.x0, params.u, params.a, 0);
    const xAtTMax = positionAtT(params.x0, params.u, params.a, tMax);
    const xVals = [xAt0, xAtTMax];
    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * tMax;
      xVals.push(positionAtT(params.x0, params.u, params.a, t));
    }
    const xMin = Math.min(...xVals) - 2;
    const xMax = Math.max(...xVals) + 2;
    const xRange = Math.max(xMax - xMin, 2);

    const plotY2 = halfH + gap / 2;
    const toPyX = (x: number) => plotY2 + (1 - (x - xMin) / xRange) * plotH2;

    ctx.fillStyle = BG_DARK;
    ctx.fillRect(0, 0, w, h);

    const drawGrid = (plotX0: number, plotY0: number, plotW: number, plotH: number) => {
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
    };

    const font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;

    // ——— v–t graph ———
    drawGrid(leftPad, topPad, plotW, plotH1);
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

    // v–t tick labels
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

    // v(t) = u + a*t line
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
    const tc = clamp(simTime, 0, tMax);
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

    // ——— x–t graph ———
    drawGrid(leftPad, plotY2, plotW, plotH2);
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
    ctx.fillText("x (m)", 0, 0);
    ctx.restore();

    // x–t tick labels
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const x = xMin + (i / 4) * xRange;
      const py = toPyX(x);
      ctx.beginPath();
      ctx.moveTo(leftPad - 4 * dpr, py);
      ctx.lineTo(leftPad, py);
      ctx.strokeStyle = COLOR_AXIS;
      ctx.stroke();
      ctx.fillStyle = COLOR_SUBTEXT;
      ctx.fillText(formatNum(x, 1), leftPad - 8 * dpr, py);
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

    // x(t) parabola
    ctx.strokeStyle = COLOR_POSITION;
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * tMax;
      const x = positionAtT(params.x0, params.u, params.a, t);
      const px = toPxT(t);
      const py = toPyX(x);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Time cursor on x–t
    const xc = positionAtT(params.x0, params.u, params.a, tc);
    const pyx = toPyX(xc);
    ctx.fillStyle = COLOR_POSITION;
    ctx.beginPath();
    ctx.arc(pxc, pyx, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pxc, pyx);
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
    ctx.fillText("v(t)", leftPad + plotW - 42 * dpr, topPad + 14 * dpr);
    ctx.fillStyle = COLOR_POSITION;
    ctx.fillText("x(t)", leftPad + plotW - 42 * dpr, plotY2 + 14 * dpr);
  }, [params, simTime]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-cyan-500/50 bg-[#0c1222] shadow-[0_0_30px_rgba(34,211,238,0.15)]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

// ——— Main component ———
export default function VelocityTimePositionTimeGraphsSimulation() {
  const [params, setParams] = useState<GraphParams>(DEFAULT_PARAMS);
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

  const vNow = velocityAtT(params.u, params.a, simTime);
  const xNow = positionAtT(params.x0, params.u, params.a, simTime);

  return (
    <main className="min-h-screen bg-[#020617]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
            <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
              <div className="mb-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/50 px-4 py-3">
                <div className="text-xs text-neutral-400">Cyan = velocity v(t), Green = position x(t).</div>
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  {playing ? "\u23F8 Pause" : "\u25B6 Play"}
                </button>
              </div>

              <GraphsCanvas params={params} simTime={simTime} />
            </div>

            <aside className="col-span-1 h-[580px] overflow-y-auto">
              <div className="h-full rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">Parameters</div>
                    <div className="text-xs text-neutral-400">Change u, a, x0 and time range.</div>
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
                  <SliderRow label="Initial velocity u" value={params.u} min={-50} max={50} step={0.5} unit="m/s" onChange={(u) => setParams((p) => ({ ...p, u }))} />
                  <SliderRow label="Acceleration a" value={params.a} min={-15} max={15} step={0.25} unit="m/s^2" onChange={(a) => setParams((p) => ({ ...p, a }))} />
                  <SliderRow label="Initial position x0" value={params.x0} min={-50} max={50} step={0.5} unit="m" onChange={(x0) => setParams((p) => ({ ...p, x0 }))} />
                  <SliderRow label="Time range tMax" value={params.tMax} min={2} max={30} step={0.5} unit="s" onChange={(tMax) => setParams((p) => ({ ...p, tMax }))} />
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 text-neutral-300">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Concept</div>
              <p className="mt-3 text-sm">With constant acceleration, velocity changes linearly with time and position follows a parabola.</p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Key formulas</div>
              <div className="mt-3 space-y-2 text-sm font-mono text-neutral-200">
                <div>v(t) = u + a t</div>
                <div>x(t) = x0 + u t + 0.5 a t^2</div>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Live values</div>
              <div className="mt-3 text-sm">At t = {formatNum(simTime, 2)} s: v = {formatNum(vNow, 2)} m/s, x = {formatNum(xNow, 2)} m</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
