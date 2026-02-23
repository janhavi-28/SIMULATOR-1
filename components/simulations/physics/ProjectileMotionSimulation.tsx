"use client";

import React, { useEffect, useRef, useState } from "react";

type ProjectileParams = {
  /** Initial speed (m/s) */
  v0: number;
  /** Launch angle above horizontal (degrees) */
  angleDeg: number;
  /** Initial height above ground (m) */
  h0: number;
  /** Gravitational acceleration (m/s²) */
  g: number;
};

type SimState = {
  t: number; // time (s)
};

const DEFAULT_PARAMS: ProjectileParams = {
  v0: 25,
  angleDeg: 45,
  h0: 0,
  g: 9.81,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function formatNumber(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function computeFlightMetrics(params: ProjectileParams) {
  const { v0, angleDeg, h0, g } = params;
  const theta = toRadians(angleDeg);
  const v0x = v0 * Math.cos(theta);
  const v0y = v0 * Math.sin(theta);

  // Time until projectile returns to y = 0 (solve h0 + v0y t - 1/2 g t² = 0)
  const a = -0.5 * g;
  const b = v0y;
  const c = h0;
  const disc = b * b - 4 * a * c;
  // Solve a t² + b t + c = 0 with a < 0. We want the
  // *later* root (time when projectile hits y = 0 again).
  // For h0 = 0 this should become T = 2 v0y / g > 0.
  let tFlight = 0;
  if (disc > 0) {
    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b + sqrtDisc) / (2 * a);
    const t2 = (-b - sqrtDisc) / (2 * a);
    // pick the larger positive root
    const candidates = [t1, t2].filter((t) => t > 0);
    tFlight = candidates.length ? Math.max(...candidates) : 0;
  }

  const range = v0x * tFlight;
  const tAtApex = v0y / g;
  const hMax = h0 + v0y * tAtApex - 0.5 * g * tAtApex * tAtApex;

  return { tFlight, range, hMax, v0x, v0y };
}

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
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 shadow-sm">
      <div className="min-w-[160px]">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-0.5 text-xs text-neutral-400">
          <span className="tabular-nums text-neutral-200">
            {formatNumber(value, step < 1 ? 2 : 1)}
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
        aria-label="Toggle reflection insight"
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 outline-none
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-sky-400
          [&::-webkit-slider-thumb]:shadow"
      />
      <div className="min-w-[90px] text-right text-xs text-neutral-400">
        <span className="tabular-nums text-neutral-200">
          {formatNumber(value, step < 1 ? 2 : 1)}
        </span>{" "}
        {unit}
      </div>
    </div>
  );
}

function ProjectileCanvas({
  params,
  sim,
}: {
  params: ProjectileParams;
  sim: SimState;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

    const rect = container.getBoundingClientRect();
    const dpr = canvas.width / Math.max(1, rect.width);
    const w = canvas.width;
    const h = canvas.height;

    const { tFlight, range, hMax, v0x, v0y } = computeFlightMetrics(params);

    // World extents: adapt to the current trajectory so the full
    // path is always visible. Use a small margin.
    const padFactor = 1.15;
    const xMax = Math.max(10, range || 10) * padFactor;
    const yMax = Math.max(5, hMax || 5) * padFactor;

    const leftPad = 54 * dpr;
    const bottomPad = 40 * dpr;
    const topPad = 18 * dpr;
    const rightPad = 18 * dpr;

    const plotX0 = leftPad;
    const plotY0 = topPad;
    const plotW = w - leftPad - rightPad;
    const plotH = h - topPad - bottomPad;

    const toPx = (xMeters: number) =>
      plotX0 + (clamp(xMeters, 0, xMax) / xMax) * plotW;
    const toPy = (yMeters: number) =>
      plotY0 + (1 - clamp(yMeters, 0, yMax) / yMax) * plotH;

    // Colors
    const bg0 = "#020617";
    const bg1 = "#0b1120";
    const grid = "rgba(148,163,184,0.16)";
    const axis = "rgba(248,250,252,0.8)";
    const text = "rgba(226,232,240,0.95)";
    const subtext = "rgba(148,163,184,0.9)";
    const traj = "#38bdf8"; // cyan/blue
    const ground = "rgba(252,211,77,0.55)"; // amber line
    const velocityColor = "#0ea5e9";
    const accelColor = "#f97373";

    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, bg0);
    grad.addColorStop(1, bg1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Grid + axis ticks
    const xStep = Math.max(5, Math.round(xMax / 8));
    const yStep = Math.max(2, Math.round(yMax / 6));
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1 * dpr;
    for (let x = 0; x <= xMax; x += xStep) {
      const px = toPx(x);
      ctx.beginPath();
      ctx.moveTo(px, plotY0);
      ctx.lineTo(px, plotY0 + plotH);
      ctx.stroke();
    }
    for (let y = 0; y <= yMax; y += yStep) {
      const py = toPy(y);
      ctx.beginPath();
      ctx.moveTo(plotX0, py);
      ctx.lineTo(plotX0 + plotW, py);
      ctx.stroke();
    }

    // Axes + numeric tick labels
    ctx.strokeStyle = axis;
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(plotX0, plotY0);
    ctx.lineTo(plotX0, plotY0 + plotH);
    ctx.stroke();
    ctx.beginPath();
    const groundY = toPy(0);
    ctx.moveTo(plotX0, groundY);
    ctx.lineTo(plotX0 + plotW, groundY);
    ctx.strokeStyle = ground;
    ctx.stroke();

    // y-axis tick marks & labels
    ctx.fillStyle = subtext;
    ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let y = 0; y <= yMax; y += yStep) {
      const py = toPy(y);
      ctx.strokeStyle = axis;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(plotX0 - 4 * dpr, py);
      ctx.lineTo(plotX0, py);
      ctx.stroke();
      ctx.fillStyle = subtext;
      ctx.fillText(`${y}`, plotX0 - 8 * dpr, py);
    }

    // x-axis tick marks & labels
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let x = 0; x <= xMax; x += xStep) {
      const px = toPx(x);
      ctx.strokeStyle = axis;
      ctx.beginPath();
      ctx.moveTo(px, groundY);
      ctx.lineTo(px, groundY + 4 * dpr);
      ctx.stroke();
      ctx.fillStyle = subtext;
      ctx.fillText(`${x}`, px, groundY + 6 * dpr);
    }

    ctx.fillStyle = subtext;
    ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textAlign = "center";
    ctx.fillText("x (m)", plotX0 + plotW / 2, plotY0 + plotH + 26 * dpr);
    ctx.save();
    ctx.translate(plotX0 - 34 * dpr, plotY0 + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("y (m)", 0, 0);
    ctx.restore();

    // Trajectory path up to current time (so you see the motion)
    if (tFlight > 0) {
      ctx.strokeStyle = traj;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      const steps = 80;
      const tEnd = clamp(sim.t || 0, 0, tFlight);
      const maxT = tEnd > 0 ? tEnd : tFlight;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * maxT;
        const x = v0x * t;
        const y = params.h0 + v0y * t - 0.5 * params.g * t * t;
        const px = toPx(x);
        const py = toPy(y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Current projectile position at sim.t
    const t = clamp(sim.t, 0, tFlight || 0);
    const x = v0x * t;
    const y = params.h0 + v0y * t - 0.5 * params.g * t * t;
    const px = toPx(x);
    const py = toPy(y);

    // Velocity vector at current time
    const vx = v0x;
    const vy = v0y - params.g * t;
    const vMag = Math.hypot(vx, vy) || 1;
    const vScale = (plotH / yMax) * 0.18;
    const vLen = clamp(vMag * vScale, 12 * dpr, 60 * dpr);
    const vxUnit = (vx / vMag) || 1;
    const vyUnit = (vy / vMag) || 0;

    const drawArrow = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      color: string
    ) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.max(1e-6, Math.hypot(dx, dy));
      const ux = dx / len;
      const uy = dy / len;
      const head = 8 * dpr;
      const wing = 5 * dpr;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - ux * head + -uy * wing, y1 - uy * head + ux * wing);
      ctx.lineTo(x1 - ux * head + uy * wing, y1 - uy * head + -ux * wing);
      ctx.closePath();
      ctx.fill();
    };

    // Velocity arrow (blue)
    drawArrow(
      px,
      py,
      px + vxUnit * vLen,
      py - vyUnit * vLen,
      velocityColor
    );

    // Acceleration arrow (downward, red)
    const aScale = (plotH / yMax) * 0.18;
    const aLen = clamp(params.g * aScale, 14 * dpr, 50 * dpr);
    drawArrow(px, py, px, py + aLen, accelColor);

    // Projectile marker
    const r = 6 * dpr;
    ctx.beginPath();
    ctx.fillStyle = "#e5f2ff";
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // HUD
    const T = tFlight;
    const R = range;
    ctx.fillStyle = text;
    ctx.font = `${13 * dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textAlign = "left";
    const hudX = plotX0 + 10 * dpr;
    const hudY = plotY0 + 10 * dpr;
    const line = 18 * dpr;
    ctx.fillText(`t = ${formatNumber(sim.t, 2)} s`, hudX, hudY);
    ctx.fillText(`x = ${formatNumber(x, 1)} m`, hudX, hudY + line);
    ctx.fillText(`y = ${formatNumber(y, 1)} m`, hudX, hudY + 2 * line);
    ctx.fillText(`v = ${formatNumber(Math.hypot(vx, vy), 1)} m/s`, hudX, hudY + 3 * line);
    ctx.fillText(`T ≈ ${formatNumber(T, 2)} s`, hudX, hudY + 4 * line);
    ctx.fillText(`R ≈ ${formatNumber(R, 1)} m`, hudX, hudY + 5 * line);
    ctx.fillText(`h_max ≈ ${formatNumber(hMax, 1)} m`, hudX, hudY + 6 * line);
  }, [params, sim]);

  return (
    <div className="rounded-3xl border border-cyan-500/40 bg-neutral-950/60 p-4 shadow-[0_0_40px_rgba(56,189,248,0.18)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">
            Projectile motion in 2D
          </div>
          <div className="text-xs text-neutral-400">
            Cyan = velocity, Red = acceleration (gravity)
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#050816]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}

export default function ProjectileMotionSimulationPage() {
  const [params, setParams] = useState<ProjectileParams>(DEFAULT_PARAMS);
  const [sim, setSim] = useState<SimState>({ t: 0 });
  const rafRef = useRef<number | null>(null);
  const [paused, setPaused] = useState(true);

  // Animation loop
  useEffect(() => {
    const step = (ts: number) => {
      rafRef.current = window.requestAnimationFrame(step);
      const { tFlight } = computeFlightMetrics(params);
      if (!tFlight || tFlight <= 0) return;

       if (paused) return;
      const dt = 1 / 60; // ~60 fps

      setSim((prev) => {
        let nextT = prev.t + dt;
        if (nextT > tFlight) nextT = 0;
        return { t: nextT };
      });
    };

    rafRef.current = window.requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [params, paused]);

  // When any parameter changes, restart from t = 0 so the new
  // conditions immediately affect the trajectory. Keep the existing
  // paused/running state.
  useEffect(() => {
    setSim({ t: 0 });
  }, [params.v0, params.angleDeg, params.h0, params.g]);

  const { tFlight, range, hMax } = computeFlightMetrics(params);

  const resetDefaults = () => {
    setParams(DEFAULT_PARAMS);
    setSim({ t: 0 });
    setPaused(true);
  };

  const launch = () => {
    setSim({ t: 0 });
    setPaused(false);
  };

  const togglePause = () => {
    setPaused((p) => !p);
  };

  return (
    <main className="min-h-screen bg-[#020617]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#020617] to-[#0b1120]" />

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Projectile motion simulator
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-400">
            Launch a projectile with adjustable speed, angle, and height. See
            how the trajectory, range and time of flight change in real time.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left column: visual + bottom controls */}
          <div className="w-full lg:w-[60%]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={launch}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  Launch
                </button>
                <button
                  type="button"
                  onClick={togglePause}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-200"
                >
                  {paused ? "Play" : "Pause"}
                </button>
              </div>
            </div>

            <ProjectileCanvas params={params} sim={sim} />

            <div className="mt-6 rounded-3xl border border-neutral-800 bg-neutral-950/40 p-4 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Parameters
                  </div>
                  <div className="text-xs text-neutral-400">
                    Adjust speed, launch angle, height and gravity. The motion
                    updates instantly.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetDefaults}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
                >
                  Reset defaults
                </button>
              </div>

              <div className="grid gap-3">
                <SliderRow
                  label="Initial speed, v₀"
                  value={params.v0}
                  min={5}
                  max={60}
                  step={0.5}
                  unit="m/s"
                  onChange={(v0) =>
                    setParams((prev) => ({
                      ...prev,
                      v0,
                    }))
                  }
                />
                <SliderRow
                  label="Launch angle, θ"
                  value={params.angleDeg}
                  min={10}
                  max={80}
                  step={1}
                  unit="°"
                  onChange={(angleDeg) =>
                    setParams((prev) => ({
                      ...prev,
                      angleDeg,
                    }))
                  }
                />
                <SliderRow
                  label="Initial height, h₀"
                  value={params.h0}
                  min={0}
                  max={15}
                  step={0.5}
                  unit="m"
                  onChange={(h0) =>
                    setParams((prev) => ({
                      ...prev,
                      h0,
                    }))
                  }
                />
                <SliderRow
                  label="Gravitational acceleration, g"
                  value={params.g}
                  min={5}
                  max={20}
                  step={0.1}
                  unit="m/s²"
                  onChange={(g) =>
                    setParams((prev) => ({
                      ...prev,
                      g,
                    }))
                  }
                />
              </div>

              <div className="mt-4 grid gap-3 text-xs text-neutral-400 sm:grid-cols-3">
                <div>
                  <div className="font-semibold text-neutral-200">
                    Time of flight
                  </div>
                  <div className="mt-1 tabular-nums text-neutral-100">
                    {formatNumber(tFlight, 2)} s
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-neutral-200">Range</div>
                  <div className="mt-1 tabular-nums text-neutral-100">
                    {formatNumber(range, 1)} m
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-neutral-200">
                    Maximum height
                  </div>
                  <div className="mt-1 tabular-nums text-neutral-100">
                    {formatNumber(hMax, 1)} m
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: information */}
          <aside className="w-full lg:w-[40%]">
            <div className="h-full rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">
                Concept: projectile motion
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                A projectile launched with initial speed v₀ at angle θ follows a
                curved path under constant downward acceleration g. The
                horizontal motion has constant velocity, while the vertical
                motion is uniformly accelerated.
              </p>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Key formulas
                </div>
                <div className="mt-3 space-y-2 text-sm text-neutral-200 font-mono">
                  <div>
                    x(t) = v₀ cosθ · t
                    <span className="ml-2 text-neutral-400">(horizontal)</span>
                  </div>
                  <div>
                    y(t) = h₀ + v₀ sinθ · t − ½ g t²
                    <span className="ml-2 text-neutral-400">(vertical)</span>
                  </div>
                  <div>
                    T ≈{" "}
                    <span className="text-neutral-100">
                      (v₀ sinθ + √(v₀² sin²θ + 2 g h₀)) / g
                    </span>
                  </div>
                  <div>
                    R ≈ v₀ cosθ · T
                    <span className="ml-2 text-neutral-400">(range)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Variables (with units)
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-neutral-200">v₀</dt>
                    <dd className="text-neutral-400">
                      initial speed (m/s)
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-neutral-200">θ</dt>
                    <dd className="text-neutral-400">
                      launch angle above horizontal (degrees)
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-neutral-200">h₀</dt>
                    <dd className="text-neutral-400">initial height (m)</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-neutral-200">g</dt>
                    <dd className="text-neutral-400">
                      gravitational acceleration (m/s²)
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-400">
                Tip: try θ ≈ 45° at fixed v₀ to see near‑maximum range, then
                change θ while keeping v₀ constant to see how the trajectory
                reshapes.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
