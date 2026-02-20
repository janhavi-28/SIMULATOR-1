"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type PlanetId = "moon" | "earth" | "mars" | "jupiter";

type PlanetOption = {
  id: PlanetId;
  name: string;
  g: number;
  subtitle: string;
  colorClass: string;
};

const PLANETS: PlanetOption[] = [
  {
    id: "moon",
    name: "Moon",
    g: 1.62,
    subtitle: "Low gravity playground",
    colorClass: "from-cyan-400 to-sky-500",
  },
  {
    id: "earth",
    name: "Earth",
    g: 9.81,
    subtitle: "Our home planet",
    colorClass: "from-emerald-400 to-lime-400",
  },
  {
    id: "mars",
    name: "Mars",
    g: 3.71,
    subtitle: "Red planet hops",
    colorClass: "from-orange-400 to-amber-300",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    g: 24.79,
    subtitle: "Extreme gravity giant",
    colorClass: "from-fuchsia-400 to-rose-400",
  },
];

type GravityParams = {
  /** Gravitational acceleration (m/s^2) */
  g: number;
  /** Initial height above ground (m) */
  h0: number;
  /** Initial vertical velocity (m/s), +upwards */
  v0: number;
  /** Coefficient of restitution for bounce (unitless, 0–1) */
  e: number;
  /** Mass of the object (kg) */
  m: number;
};

type SimState = {
  /** Height above ground (m) */
  y: number;
  /** Vertical velocity (m/s), +upwards */
  v: number;
  /** Elapsed simulation time (s) */
  t: number;
};

const DEFAULT_PARAMS: GravityParams = {
  g: 9.81,
  h0: 30,
  v0: 0,
  e: 0.55,
  m: 10,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatNumber(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

function SliderRow(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  accentClassName: string;
  onChange: (next: number) => void;
}) {
  const { label, value, min, max, step, unit, accentClassName, onChange } =
    props;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 shadow-sm">
      <div className="min-w-[180px]">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-0.5 text-xs text-neutral-400">
          <span className="tabular-nums text-neutral-200">
            {formatNumber(value, step < 1 ? 2 : 1)}
          </span>{" "}
          {unit}
        </div>
      </div>

      <input
        className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 outline-none ${accentClassName}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />

      <div className="min-w-[120px] text-right text-xs text-neutral-400">
        <span className="tabular-nums text-neutral-200">
          {formatNumber(value, step < 1 ? 2 : 1)}
        </span>{" "}
        {unit}
      </div>
    </div>
  );
}

function CanvasSimulator(props: {
  params: GravityParams;
  sim: SimState;
  paused: boolean;
  planetName: string;
  planetColorClass: string;
  onTogglePaused: () => void;
  onRestart: () => void;
}) {
  const {
    params,
    sim,
    paused,
    planetName,
    planetColorClass,
    onTogglePaused,
    onRestart,
  } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scaleModel = useMemo(() => {
    // Provide stable, readable scaling that adapts to chosen h0, but keeps grid nice.
    const peakEstimate = Math.max(
      2,
      params.h0 + (params.v0 > 0 ? (params.v0 * params.v0) / (2 * params.g) : 0)
    );
    const visibleTop = Math.max(10, Math.ceil((peakEstimate * 1.15) / 5) * 5);
    return { visibleTop };
  }, [params.g, params.h0, params.v0]);

  // Resize canvas to match CSS size (incl. device pixel ratio) for crisp lines.
  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    const resize = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      const nextW = Math.max(1, Math.floor(rect.width * dpr));
      const nextH = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw whenever sim/params change (animation loop is managed by parent state).
  useEffect(() => {
    const canvas = canvasRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = el.getBoundingClientRect();
    const dpr = canvas.width / Math.max(1, rect.width);
    const w = canvas.width;
    const h = canvas.height;

    // Palette
    const bg = "#0a1128"; // deep navy
    const panel = "#020617"; // very dark blue/black
    const grid = "rgba(56,189,248,0.16)"; // cyan grid
    const axis = "#d4af37"; // gold axis
    const text = "rgba(226,232,240,0.96)";
    const subtext = "rgba(148,163,184,0.95)";
    const ground = "rgba(212,175,55,0.35)"; // gold-ish
    const velocityCyan = "#00ffff"; // cyan
    const accelCrimson = "#dc143c"; // crimson
    const object = "#e2e8f0";
    const objectShadow = "rgba(0,0,0,0.45)";
    const accent = "#d4af37"; // gold

    // Layout inside canvas (in device pixels)
    const pad = 18 * dpr;
    const leftPad = 52 * dpr; // room for y-axis labels
    const bottomPad = 38 * dpr; // room for ground label
    const topPad = 14 * dpr;

    const plotX0 = leftPad;
    const plotY0 = topPad;
    const plotW = w - leftPad - pad;
    const plotH = h - topPad - bottomPad;
    const groundY = plotY0 + plotH;

    ctx.clearRect(0, 0, w, h);

    // Background (subtle gradient)
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, bg);
    grad.addColorStop(1, panel);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Gridlines & y-axis ticks
    const visibleTop = scaleModel.visibleTop;
    const metersPerMajor = visibleTop >= 50 ? 10 : 5;
    const toYpx = (meters: number) =>
      groundY - (meters / visibleTop) * plotH;

    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = grid;
    for (let m = 0; m <= visibleTop; m += metersPerMajor) {
      const y = toYpx(m);
      ctx.beginPath();
      ctx.moveTo(plotX0, y);
      ctx.lineTo(plotX0 + plotW, y);
      ctx.stroke();
    }

    // Axis
    ctx.strokeStyle = axis;
    ctx.lineWidth = 1.25 * dpr;
    // y-axis
    ctx.beginPath();
    ctx.moveTo(plotX0, plotY0);
    ctx.lineTo(plotX0, groundY);
    ctx.stroke();
    // ground line
    ctx.strokeStyle = ground;
    ctx.beginPath();
    ctx.moveTo(plotX0, groundY);
    ctx.lineTo(plotX0 + plotW, groundY);
    ctx.stroke();

    // Labels
    ctx.fillStyle = subtext;
    ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    for (let m = 0; m <= visibleTop; m += metersPerMajor) {
      const y = toYpx(m);
      ctx.fillText(`${m}`, plotX0 - 8 * dpr, y);
      // tick mark
      ctx.strokeStyle = axis;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(plotX0 - 4 * dpr, y);
      ctx.lineTo(plotX0, y);
      ctx.stroke();
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = subtext;
    ctx.fillText("Height (m)", plotX0, plotY0 - 6 * dpr);
    ctx.fillText("Ground (y = 0 m)", plotX0, groundY + 24 * dpr);

    // Object position (meters -> px)
    const yMeters = clamp(sim.y, 0, visibleTop);
    const yPx = toYpx(yMeters);
    const xPx = plotX0 + plotW * 0.6;
    const r = 10 * dpr;

    // Velocity and acceleration arrows
    // Scale arrow lengths to remain readable at different parameter values.
    const vScale = (plotH / visibleTop) * 0.9; // px per (m/s) approximation
    const aScale = (plotH / visibleTop) * 6.0; // px per (m/s^2) (clamped)
    const vLen = clamp(sim.v * vScale * 0.12, -plotH * 0.28, plotH * 0.28);
    const aLen = clamp((-params.g) * aScale * 0.02, -plotH * 0.22, plotH * 0.22);

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

    // Acceleration: constant downward arrow (crimson)
    drawArrow(xPx - 52 * dpr, yPx, xPx - 52 * dpr, yPx - aLen, accelCrimson);
    // Velocity: dynamic (cyan)
    drawArrow(xPx + 52 * dpr, yPx, xPx + 52 * dpr, yPx - vLen, velocityCyan);

    // Object shadow on ground for depth
    const shadowStrength = clamp(1 - yMeters / visibleTop, 0.15, 0.95);
    ctx.fillStyle = objectShadow;
    ctx.globalAlpha = 0.65 * shadowStrength;
    ctx.beginPath();
    ctx.ellipse(
      xPx,
      groundY + 6 * dpr,
      r * 1.35,
      r * 0.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.globalAlpha = 1;

    // Glowing halo around object (fun visual)
    const glowRadius = r * 2.2;
    const glowGrad = ctx.createRadialGradient(
      xPx,
      yPx,
      r * 0.4,
      xPx,
      yPx,
      glowRadius
    );
    glowGrad.addColorStop(0, "rgba(0,255,255,0.75)");
    glowGrad.addColorStop(0.4, "rgba(0,255,255,0.35)");
    glowGrad.addColorStop(1, "rgba(0,255,255,0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(xPx, yPx, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Object
    ctx.fillStyle = object;
    ctx.beginPath();
    ctx.arc(xPx, yPx, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // Heads-up metrics
    ctx.fillStyle = text;
    ctx.font = `${13 * dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hudX = plotX0 + 12 * dpr;
    const hudY = plotY0 + 10 * dpr;
    const line = 18 * dpr;
    ctx.fillText(`t = ${formatNumber(sim.t, 2)} s`, hudX, hudY);
    ctx.fillText(`y = ${formatNumber(sim.y, 2)} m`, hudX, hudY + line);
    ctx.fillText(`v = ${formatNumber(sim.v, 2)} m/s`, hudX, hudY + 2 * line);
    ctx.fillStyle = accelCrimson;
    ctx.fillText(`a = −${formatNumber(params.g, 2)} m/s²`, hudX, hudY + 3 * line);
    const weight = params.m * params.g;
    ctx.fillStyle = velocityCyan;
    ctx.fillText(
      `m = ${formatNumber(params.m, 1)} kg`,
      hudX,
      hudY + 4 * line
    );
    ctx.fillText(
      `F = m·g = ${formatNumber(weight, 1)} N`,
      hudX,
      hudY + 5 * line
    );

    // Legend
    const legendY = plotY0 + plotH - 18 * dpr;
    ctx.textBaseline = "middle";
    ctx.fillStyle = subtext;
    ctx.fillText("Legend:", hudX, legendY);
    ctx.fillStyle = velocityCyan;
    ctx.fillText("velocity", hudX + 60 * dpr, legendY);
    ctx.fillStyle = accelCrimson;
    ctx.fillText("acceleration", hudX + 130 * dpr, legendY);

    // Planet label badge in top-right
    const badgeW = 130 * dpr;
    const badgeH = 28 * dpr;
    const badgeX = plotX0 + plotW - badgeW - 8 * dpr;
    const badgeY = plotY0 + 8 * dpr;
    const planetGrad = ctx.createLinearGradient(
      badgeX,
      badgeY,
      badgeX + badgeW,
      badgeY + badgeH
    );
    // Rough approximation: cyan → gold mix to echo Tailwind classes
    planetGrad.addColorStop(0, "rgba(56,189,248,0.9)");
    planetGrad.addColorStop(1, "rgba(212,175,55,0.95)");
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    const rBadge = 12 * dpr;
    ctx.moveTo(badgeX + rBadge, badgeY);
    ctx.lineTo(badgeX + badgeW - rBadge, badgeY);
    ctx.quadraticCurveTo(
      badgeX + badgeW,
      badgeY,
      badgeX + badgeW,
      badgeY + rBadge
    );
    ctx.lineTo(badgeX + badgeW, badgeY + badgeH - rBadge);
    ctx.quadraticCurveTo(
      badgeX + badgeW,
      badgeY + badgeH,
      badgeX + badgeW - rBadge,
      badgeY + badgeH
    );
    ctx.lineTo(badgeX + rBadge, badgeY + badgeH);
    ctx.quadraticCurveTo(
      badgeX,
      badgeY + badgeH,
      badgeX,
      badgeY + badgeH - rBadge
    );
    ctx.lineTo(badgeX, badgeY + rBadge);
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + rBadge, badgeY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#020617";
    ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      planetName,
      badgeX + badgeW / 2,
      badgeY + badgeH / 2
    );
  }, [params, planetName, scaleModel.visibleTop, sim]);

  return (
    <div className="rounded-3xl border border-cyan-500/40 bg-neutral-950/60 p-4 shadow-[0_0_40px_rgba(0,255,255,0.12)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">
            Free-fall with bounces
          </div>
          <div className="text-xs text-neutral-400">
            Cyan = velocity, Crimson = acceleration, Gold = axes
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-xl border border-cyan-500/40 bg-neutral-900 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-neutral-800 hover:border-cyan-400"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={onTogglePaused}
            className="rounded-xl bg-cyan-400/90 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
          >
            {paused ? "Play" : "Pause"}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#050816]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}

export default function GravitySimulation({ embedded }: { embedded?: boolean }) {
  const [params, setParams] = useState<GravityParams>(DEFAULT_PARAMS);
  const paramsRef = useLatestRef(params);

  const [planetId, setPlanetId] = useState<PlanetId>("earth");
  const activePlanet = useMemo(
    () => PLANETS.find((p) => p.id === planetId) ?? PLANETS[1],
    [planetId]
  );

  const [paused, setPaused] = useState(false);
  const pausedRef = useLatestRef(paused);

  const [sim, setSim] = useState<SimState>(() => ({
    y: DEFAULT_PARAMS.h0,
    v: DEFAULT_PARAMS.v0,
    t: 0,
  }));

  // Keep sim in refs for tight rAF loop without re-subscribing.
  const simRef = useLatestRef(sim);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const restart = () => {
    const p = paramsRef.current;
    setSim({ y: p.h0, v: p.v0, t: 0 });
    lastTsRef.current = null;
  };

  const resetDefaults = () => {
    setPlanetId("earth");
    setParams(DEFAULT_PARAMS);
    setSim({ y: DEFAULT_PARAMS.h0, v: DEFAULT_PARAMS.v0, t: 0 });
    setPaused(false);
    lastTsRef.current = null;
  };

  // 60fps animation loop (requestAnimationFrame).
  useEffect(() => {
    const step = (ts: number) => {
      rafRef.current = window.requestAnimationFrame(step);
      if (pausedRef.current) return;

      const lastTs = lastTsRef.current;
      lastTsRef.current = ts;
      if (lastTs == null) return;

      // Clamp dt for stability (avoid huge jumps on tab-switch).
      const dt = clamp((ts - lastTs) / 1000, 0, 1 / 30); // max ~33ms
      const p = paramsRef.current;
      const s = simRef.current;

      // Semi-implicit Euler integration:
      // v(t+dt) = v(t) - g*dt
      // y(t+dt) = y(t) + v(t+dt)*dt
      let v = s.v - p.g * dt;
      let y = s.y + v * dt;
      let t = s.t + dt;

      // Ground collision + coefficient of restitution bounce.
      if (y <= 0) {
        y = 0;
        // Bounce only if we're moving down noticeably.
        if (v < -0.05) {
          v = -p.e * v;
        } else {
          // Settle to rest to avoid micro-jitter at ground.
          v = 0;
        }
      }

      // Auto-restart if settled (keeps it demonstrative).
      if (y === 0 && Math.abs(v) < 0.01 && t > 0.35) {
        y = p.h0;
        v = p.v0;
        t = 0;
      }

      setSim({ y, v, t });
    };

    rafRef.current = window.requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [paramsRef, pausedRef, simRef]);

  // Immediate, intuitive cause-effect: changing initial conditions restarts.
  const setParamAndMaybeRestart = (
    patch: Partial<GravityParams>,
    restartOnChange: boolean
  ) => {
    setParams((prev) => ({ ...prev, ...patch }));
    if (restartOnChange) {
      // Use patched values deterministically.
      const next = { ...paramsRef.current, ...patch };
      setSim({ y: next.h0, v: next.v0, t: 0 });
      lastTsRef.current = null;
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a]" />

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Gravity playground
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-400">
            Drop the same object on the Moon, Earth, Mars or Jupiter. Change the
            mass, height and throw speed and watch how the motion and weight react
            to different worlds.
          </p>
        </div>

        {/* Fixed 3-panel layout (60% / 40%), with bottom controls below left panel */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left column: visual + bottom controls */}
          <div className="w-full lg:w-[60%]">
            <CanvasSimulator
              params={params}
              sim={sim}
              paused={paused}
              planetName={activePlanet.name}
              planetColorClass={activePlanet.colorClass}
              onTogglePaused={() => setPaused((p) => !p)}
              onRestart={restart}
            />

            {/* Bottom panel: planets + sliders */}
            <div className="mt-6 rounded-3xl border border-neutral-800 bg-neutral-950/40 p-4 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Choose a world & tweak parameters
                  </div>
                  <div className="text-xs text-neutral-400">
                    Planets set a realistic \(g\). You can still fine‑tune and adjust
                    mass, height and launch speed.
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

              {/* Planet selector */}
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                {PLANETS.map((planet) => {
                  const active = planet.id === planetId;
                  return (
                    <button
                      key={planet.id}
                      type="button"
                      onClick={() => {
                        setPlanetId(planet.id);
                        setParamAndMaybeRestart({ g: planet.g }, false);
                      }}
                      className={`relative overflow-hidden rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        active
                          ? "border-cyan-400/80 bg-cyan-500/10 shadow-[0_0_25px_rgba(34,211,238,0.35)]"
                          : "border-neutral-800 bg-neutral-900/60 hover:border-cyan-500/60 hover:bg-neutral-900"
                      }`}
                    >
                      <div
                        className={`pointer-events-none absolute inset-0 opacity-60 bg-gradient-to-r ${planet.colorClass}`}
                      />
                      <div className="relative">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-white">
                            {planet.name}
                          </span>
                          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-cyan-200">
                            g = {planet.g.toFixed(2)} m/s²
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-200">
                          {planet.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3">
                <SliderRow
                  label="Gravitational acceleration, g"
                  value={params.g}
                  min={1}
                  max={25}
                  step={0.01}
                  unit="m/s²"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(g) => setParamAndMaybeRestart({ g }, false)}
                />
                <SliderRow
                  label="Mass, m"
                  value={params.m}
                  min={1}
                  max={50}
                  step={1}
                  unit="kg"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(m) => setParamAndMaybeRestart({ m }, false)}
                />
                <SliderRow
                  label="Initial height, h₀"
                  value={params.h0}
                  min={0}
                  max={100}
                  step={0.1}
                  unit="m"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(h0) => setParamAndMaybeRestart({ h0 }, true)}
                />
                <SliderRow
                  label="Initial velocity, v₀ (upwards +)"
                  value={params.v0}
                  min={-30}
                  max={30}
                  step={0.1}
                  unit="m/s"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(v0) => setParamAndMaybeRestart({ v0 }, true)}
                />
                <SliderRow
                  label="Bounce efficiency, e"
                  value={params.e}
                  min={0}
                  max={0.95}
                  step={0.01}
                  unit="(unitless)"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(e) => setParamAndMaybeRestart({ e }, false)}
                />
              </div>
            </div>
          </div>

          {/* Right panel: information (spans full height) */}
          <aside className="w-full lg:w-[40%]">
            <div className="h-full rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">
                Concept: motion under gravity
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                In vertical motion near Earth (ignoring air resistance), gravity
                provides a nearly constant downward acceleration. Changing \(g\)
                makes the object speed up more quickly; changing \(h_0\) and \(v_0\)
                changes the starting conditions and therefore the entire trajectory.
                The bounce parameter \(e\) shows energy loss at impacts, making each
                rebound smaller.
              </p>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Key formulas
                </div>
                <div className="mt-3 space-y-2 text-sm text-neutral-200">
                  <div className="font-mono">
                    a = −g
                    <span className="ml-2 text-neutral-400">(m/s²)</span>
                  </div>
                  <div className="font-mono">
                    v(t) = v₀ − g t
                    <span className="ml-2 text-neutral-400">(m/s)</span>
                  </div>
                  <div className="font-mono">
                    y(t) = h₀ + v₀ t − ½ g t²
                    <span className="ml-2 text-neutral-400">(m)</span>
                  </div>
                  <div className="font-mono">
                    v_after = −e · v_before
                    <span className="ml-2 text-neutral-400">(bounce)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Variables (with units)
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-neutral-200">\(g\)</dt>
                    <dd className="text-neutral-400">gravitational acceleration (m/s²)</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-neutral-200">\(h_0\)</dt>
                    <dd className="text-neutral-400">initial height (m)</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-neutral-200">\(v_0\)</dt>
                    <dd className="text-neutral-400">initial vertical velocity (m/s)</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-neutral-200">\(e\)</dt>
                    <dd className="text-neutral-400">coefficient of restitution (unitless)</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-400">
                Tip: set \(v_0 &gt; 0\) to throw upward; increase \(g\) to make the
                fall noticeably faster.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}