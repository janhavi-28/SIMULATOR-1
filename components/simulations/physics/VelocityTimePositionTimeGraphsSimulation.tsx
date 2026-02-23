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

      <section className="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Velocity–time and position–time graphs
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-400">
            Explore how initial velocity, acceleration, and initial position change the v–t and x–t graphs for uniformly accelerated motion in one dimension.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left column: simulator + bottom controls */}
          <div className="w-full lg:w-[60%]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs text-neutral-400">
                Cyan = velocity v(t), Green = position x(t). Drag time with play or sliders.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  {playing ? "Pause" : "Play"}
                </button>
              </div>
            </div>

            <GraphsCanvas params={params} simTime={simTime} />

            {/* Parameter controls — full width below left panel */}
            <div className="mt-6 rounded-3xl border border-neutral-700 bg-neutral-950/50 p-4 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Parameters</div>
                  <div className="text-xs text-neutral-400">
                    Change u, a, x₀ or time range; graphs update in real time.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
                >
                  Reset
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SliderRow
                  label="Initial velocity, u"
                  value={params.u}
                  min={-50}
                  max={50}
                  step={0.5}
                  unit="m/s"
                  onChange={(u) => setParams((p) => ({ ...p, u }))}
                />
                <SliderRow
                  label="Acceleration, a"
                  value={params.a}
                  min={-15}
                  max={15}
                  step={0.25}
                  unit="m/s²"
                  onChange={(a) => setParams((p) => ({ ...p, a }))}
                />
                <SliderRow
                  label="Initial position, x₀"
                  value={params.x0}
                  min={-50}
                  max={50}
                  step={0.5}
                  unit="m"
                  onChange={(x0) => setParams((p) => ({ ...p, x0 }))}
                />
                <SliderRow
                  label="Time range, t_max"
                  value={params.tMax}
                  min={2}
                  max={30}
                  step={0.5}
                  unit="s"
                  onChange={(tMax) => setParams((p) => ({ ...p, tMax }))}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-400">
                <span>
                  <span className="font-semibold text-neutral-200">At t = {formatNum(simTime, 2)} s:</span>{" "}
                  v = {formatNum(vNow, 2)} m/s, x = {formatNum(xNow, 2)} m
                </span>
              </div>
            </div>
          </div>

          {/* Right panel: information */}
          <aside className="w-full lg:w-[40%]">
            <div className="h-full rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">
                Velocity–time and position–time graphs
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                For motion with constant acceleration a and initial velocity u, velocity increases linearly with time and position follows a parabola. The v–t graph has slope a; the x–t graph has slope v(t).
              </p>

              <div className="mt-6 rounded-2xl border border-neutral-700 bg-neutral-900/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Key formulas
                </div>
                <div className="mt-3 space-y-2 text-sm font-mono text-neutral-200">
                  <div><span className="text-cyan-300">v(t) = u + a t</span></div>
                  <div><span className="text-emerald-300">x(t) = x₀ + u t + ½ a t²</span></div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Variables (SI units)
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">u</dt>
                    <dd className="text-neutral-400">initial velocity (m/s)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">a</dt>
                    <dd className="text-neutral-400">acceleration (m/s²)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">x₀</dt>
                    <dd className="text-neutral-400">initial position (m)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">t</dt>
                    <dd className="text-neutral-400">time (s)</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-700 bg-neutral-900/40 p-4 text-xs text-neutral-400">
                The slope of the v–t graph equals acceleration; the area under v–t between 0 and t gives the displacement. The slope of the x–t graph at any instant is the velocity at that time.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
