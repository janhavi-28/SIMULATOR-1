"use client";

import React, { useEffect, useRef, useState } from "react";

// ——— General Relativity: gravity as curvature of spacetime ———
// Rubber-sheet analogy + gravitational lensing (light bending).
// Deflection angle α ≈ 4GM/(c²b). Sheet depth ∝ gravitational potential.

type Params = {
  /** Mass strength (curvature depth), dimensionless scale 0.2–2 */
  massStrength: number;
  /** Impact parameter (closest approach) in grid units */
  impactParam: number;
  /** Animation speed multiplier */
  simSpeed: number;
  /** Number of light rays to show (1–5) */
  numRays: number;
};

const DEFAULT_PARAMS: Params = {
  massStrength: 1,
  impactParam: 1.5,
  simSpeed: 1,
  numRays: 3,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatNum(n: number, decimals = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(decimals);
}

/** Softened potential depth at (x,y); mass at origin. Used for grid and deflection. */
function potential(x: number, y: number, strength: number, soft = 0.4): number {
  const r = Math.sqrt(x * x + y * y) + soft;
  return -strength / r;
}

/** Integrate one light ray (geodesic) from start to end; return points. */
function integrateRay(
  impactParam: number,
  massStrength: number,
  steps = 400,
  stepSize = 0.03
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  let x = -4;
  let y = impactParam;
  let vx = 1;
  let vy = 0;
  const k = massStrength * 0.12; // deflection strength

  for (let i = 0; i < steps; i++) {
    points.push({ x, y });
    const r = Math.sqrt(x * x + y * y) + 0.2;
    if (r < 0.25) break;
    const ax = (-k * x) / (r * r * r);
    const ay = (-k * y) / (r * r * r);
    vx += ax * stepSize;
    vy += ay * stepSize;
    const v = Math.sqrt(vx * vx + vy * vy) || 1;
    vx /= v;
    vy /= v;
    x += vx * stepSize;
    y += vy * stepSize;
    if (x > 4) break;
  }
  return points;
}

// ——— Slider row: label, then value right beside the slider ———
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
    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/70 px-4 py-3 shadow-sm">
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="flex items-center gap-3">
        <span className="min-w-[3.5rem] text-right text-sm tabular-nums text-neutral-300">
          {formatNum(value, 2)}
          {unit ? ` ${unit}` : ""}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="physics-range flex-1 min-w-0"
          aria-label={label}
        />
      </div>
    </div>
  );
}

// ——— Canvas constants ———
const BG = "#0a0e14";
const GRID = "rgba(94, 234, 212, 0.14)";
const AXIS = "rgba(248, 250, 252, 0.8)";
const TEXT = "rgba(226, 232, 240, 0.95)";
const SUBTEXT = "rgba(148, 163, 184, 0.9)";
const MASS_COLOR = "#f472b6";
const RAY_COLOR = "#a78bfa";
const RAY_HIGHLIGHT = "#c4b5fd";
const WELL_GRADIENT = "rgba(244, 114, 182, 0.35)";

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
  const rafRef = useRef<number | null>(null);

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

    const leftPad = 48 * dpr;
    const rightPad = 16 * dpr;
    const topPad = 24 * dpr;
    const bottomPad = 36 * dpr;
    const plotW = w - leftPad - rightPad;
    const plotH = h - topPad - bottomPad;

    const worldToScreen = (wx: number, wy: number) => {
      const scale = Math.min(plotW, plotH) / 8;
      const cx = leftPad + plotW / 2;
      const cy = topPad + plotH / 2;
      return {
        x: cx + wx * scale,
        y: cy - wy * scale,
      };
    };

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    const scale = Math.min(plotW, plotH) / 8;
    const cx = leftPad + plotW / 2;
    const cy = topPad + plotH / 2;

    // Rubber sheet: grid with depth shading (concentric circles get darker toward center)
    const gridExtent = 4;
    for (let i = -gridExtent; i <= gridExtent; i++) {
      for (let j = -gridExtent; j <= gridExtent; j++) {
        const wx = i * 0.5;
        const wy = j * 0.5;
        const z = potential(wx, wy, params.massStrength);
        const t = Math.max(0, Math.min(1, -z / 3));
        ctx.fillStyle = `rgba(244, 114, 182, ${0.08 + t * 0.2})`;
        const { x, y } = worldToScreen(wx, wy);
        ctx.fillRect(x - (scale * 0.25) / 2, y - (scale * 0.25) / 2, scale * 0.25, scale * 0.25);
      }
    }

    // Grid lines (curved toward well)
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1 * dpr;
    const gridStep = 0.5;
    for (let g = -gridExtent; g <= gridExtent; g += gridStep) {
      ctx.beginPath();
      for (let t = -gridExtent; t <= gridExtent; t += 0.1) {
        const wx = g;
        const wy = t;
        const { x, y } = worldToScreen(wx, wy);
        if (t === -gridExtent) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let t = -gridExtent; t <= gridExtent; t += 0.1) {
        const wx = t;
        const wy = g;
        const { x, y } = worldToScreen(wx, wy);
        if (t === -gridExtent) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Central mass (well)
    ctx.fillStyle = MASS_COLOR;
    ctx.strokeStyle = "rgba(244, 114, 182, 0.6)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, 14 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = BG;
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("M", cx, cy);

    // Light rays (geodesics)
    const rays = [
      params.impactParam,
      params.impactParam - 0.6,
      params.impactParam + 0.6,
      params.impactParam - 1.2,
      params.impactParam + 1.2,
    ].filter((b) => Math.abs(b) < 3.5);

    const numToShow = Math.min(params.numRays, rays.length);
    const allPoints = rays.slice(0, numToShow).map((b) => integrateRay(b, params.massStrength));

    allPoints.forEach((points, idx) => {
      const isMain = idx === 0;
      ctx.strokeStyle = isMain ? RAY_HIGHLIGHT : RAY_COLOR;
      ctx.lineWidth = (isMain ? 2.5 : 1.5) * dpr;
      ctx.beginPath();
      points.forEach((p, i) => {
        const { x, y } = worldToScreen(p.x, p.y);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // Moving photon on main ray
    const mainPoints = allPoints[0] ?? [];
    const len = mainPoints.length;
    const seg = (time * 0.5) % (len - 1);
    const i0 = Math.floor(seg);
    const i1 = Math.min(i0 + 1, len - 1);
    const t = seg - i0;
    const p0 = mainPoints[i0];
    const p1 = mainPoints[i1];
    if (p0 && p1) {
      const px = p0.x + (p1.x - p0.x) * t;
      const py = p0.y + (p1.y - p0.y) * t;
      const { x, y } = worldToScreen(px, py);
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(x, y, 5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(253, 224, 71, 0.8)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = SUBTEXT;
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("x (grid units)", leftPad + plotW / 2, topPad + plotH + 8 * dpr);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("y", leftPad - 6 * dpr, topPad + plotH / 2);

    // HUD
    ctx.fillStyle = TEXT;
    ctx.font = `${11 * dpr}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hudX = leftPad + 8 * dpr;
    const hudY = topPad + 8 * dpr;
    const lineH = 16 * dpr;
    ctx.fillText("Spacetime curvature ∝ M", hudX, hudY);
    ctx.fillStyle = RAY_COLOR;
    ctx.fillText("Light rays (geodesics)", hudX, hudY + lineH);
  }, [params, time]);

  // Animation loop
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      last = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-violet-500/40 bg-[#0a0e14]"
      style={{ aspectRatio: "16/9" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ aspectRatio: "16/9" }}
      />
    </div>
  );
}

export default function GeneralRelativitySimulation() {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const lastTickRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setTime((t) => t + dt * params.simSpeed);
      rafRef.current = requestAnimationFrame(tick);
    };
    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, params.simSpeed]);

  const reset = () => {
    setParams(DEFAULT_PARAMS);
    setTime(0);
    setPlaying(true);
  };

  return (
    <main className="min-h-screen bg-[#020617]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="relative w-full shrink-0 lg:w-[60%]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs text-neutral-400">
                Rubber-sheet spacetime: mass curves the grid; light rays follow geodesics and bend (gravitational lensing).
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 hover:border-violet-400 hover:bg-violet-500/20"
                >
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  onClick={() => setTime(0)}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
                >
                  Reset time
                </button>
              </div>
            </div>

            <SimulatorCanvas params={params} time={time} playing={playing} />

            <div className="relative z-10 mt-6 rounded-3xl border border-neutral-700 bg-neutral-950/50 p-4 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Parameters</div>
                  <div className="text-xs text-neutral-400">
                    Mass strength sets curvature; impact parameter sets closest approach of the main ray.
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

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SliderRow
                  label="Mass strength, M"
                  value={params.massStrength}
                  min={0.2}
                  max={2}
                  step={0.1}
                  unit=""
                  onChange={(massStrength) =>
                    setParams((p) => ({ ...p, massStrength: clamp(massStrength, 0.2, 2) }))
                  }
                />
                <SliderRow
                  label="Impact param., b"
                  value={params.impactParam}
                  min={0.5}
                  max={3}
                  step={0.1}
                  unit=""
                  onChange={(impactParam) =>
                    setParams((p) => ({ ...p, impactParam: clamp(impactParam, 0.5, 3) }))
                  }
                />
                <SliderRow
                  label="Sim speed"
                  value={params.simSpeed}
                  min={0.5}
                  max={2}
                  step={0.25}
                  unit="×"
                  onChange={(simSpeed) =>
                    setParams((p) => ({ ...p, simSpeed }))
                  }
                />
                <SliderRow
                  label="Number of rays"
                  value={params.numRays}
                  min={1}
                  max={5}
                  step={1}
                  unit=""
                  onChange={(numRays) =>
                    setParams((p) => ({ ...p, numRays: Math.round(clamp(numRays, 1, 5)) }))
                  }
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-400">
                <span>
                  <span className="font-semibold text-neutral-200">Deflection</span> increases with M and decreases with b.
                </span>
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[40%]">
            <div className="h-full rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">
                General Relativity — Spacetime Curvature & Light Bending
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                In general relativity, gravity is the curvature of spacetime. Mass and energy bend the fabric of spacetime; the rubber-sheet analogy shows this as a depression. Light (and matter) follow geodesics—the straightest paths in curved space—so light bends around a massive object (gravitational lensing).
              </p>

              <div className="mt-6 rounded-2xl border border-neutral-700 bg-neutral-900/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Key formula
                </div>
                <div className="mt-3 space-y-2 text-sm font-mono text-neutral-200">
                  <div>
                    <span className="text-violet-300">α ≈ 4GM / (c²b)</span>
                  </div>
                  <div className="text-neutral-400 font-sans font-normal">
                    Deflection angle α (radians) for light grazing a mass M at impact parameter b.
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Variables
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">G</dt>
                    <dd className="text-neutral-400">gravitational constant (m³/(kg·s²))</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">M</dt>
                    <dd className="text-neutral-400">mass (kg)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">c</dt>
                    <dd className="text-neutral-400">speed of light (m/s)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">b</dt>
                    <dd className="text-neutral-400">impact parameter (m)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">α</dt>
                    <dd className="text-neutral-400">deflection angle (rad)</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-700 bg-neutral-900/40 p-4 text-xs text-neutral-400">
                Near a black hole, curvature is so strong that light can orbit (photon sphere) or fall in. This simulator uses a weak-field style deflection so you can see bending clearly.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
