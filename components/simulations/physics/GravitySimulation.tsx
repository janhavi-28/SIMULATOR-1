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
  accentColor: string;
  icon?: string;
  onChange: (next: number) => void;
}) {
  const { label, value, min, max, step, unit, accentColor, icon, onChange } = props;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">{icon} {label}</span>
        <span className="text-sm text-neutral-400 tabular-nums">
          {step < 0.1 ? value.toFixed(2) : Math.round(value)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="physics-range w-full"
        style={{ accentColor: accentColor }}
        aria-label={label}
      />
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
      params.h0 +
      (params.v0 > 0 ? (params.v0 * params.v0) / (2 * params.g) : 0),
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
    const toYpx = (meters: number) => groundY - (meters / visibleTop) * plotH;

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
    const aLen = clamp(-params.g * aScale * 0.02, -plotH * 0.22, plotH * 0.22);

    const drawArrow = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      color: string,
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
    ctx.ellipse(xPx, groundY + 6 * dpr, r * 1.35, r * 0.5, 0, 0, Math.PI * 2);
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
      glowRadius,
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
    ctx.fillText(
      `a = −${formatNumber(params.g, 2)} m/s²`,
      hudX,
      hudY + 3 * line,
    );
    const weight = params.m * params.g;
    ctx.fillStyle = velocityCyan;
    ctx.fillText(`m = ${formatNumber(params.m, 1)} kg`, hudX, hudY + 4 * line);
    ctx.fillText(
      `F = m·g = ${formatNumber(weight, 1)} N`,
      hudX,
      hudY + 5 * line,
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
      badgeY + badgeH,
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
      badgeY + rBadge,
    );
    ctx.lineTo(badgeX + badgeW, badgeY + badgeH - rBadge);
    ctx.quadraticCurveTo(
      badgeX + badgeW,
      badgeY + badgeH,
      badgeX + badgeW - rBadge,
      badgeY + badgeH,
    );
    ctx.lineTo(badgeX + rBadge, badgeY + badgeH);
    ctx.quadraticCurveTo(
      badgeX,
      badgeY + badgeH,
      badgeX,
      badgeY + badgeH - rBadge,
    );
    ctx.lineTo(badgeX, badgeY + rBadge);
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + rBadge, badgeY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#020617";
    ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(planetName, badgeX + badgeW / 2, badgeY + badgeH / 2);
  }, [params, planetName, scaleModel.visibleTop, sim]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-2xl border border-neutral-700 bg-[#0D1117] aspect-video">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full block" />
    </div>
  );
}

export default function GravitySimulation({
  embedded,
}: {
  embedded?: boolean;
}) {
  const [params, setParams] = useState<GravityParams>(DEFAULT_PARAMS);
  const paramsRef = useLatestRef(params);

  const [planetId, setPlanetId] = useState<PlanetId>("earth");
  const activePlanet = useMemo(
    () => PLANETS.find((p) => p.id === planetId) ?? PLANETS[1],
    [planetId],
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
    restartOnChange: boolean,
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
    <main className="min-h-screen bg-[#020617] text-neutral-200">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Top Row: Simulation Canvas */}
            <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-4 mb-6">
                <div className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
                  ☄ Gravity & Free-fall
                </div>
                <div className="text-xs text-neutral-400 hidden sm:block">
                  Cyan = velocity, Crimson = acceleration, Gold = axes
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaused(p => !p)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors flex gap-2 items-center ${paused ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {paused ? "▶ Play" : "⏸ Pause"}
                  </button>
                  <button
                    type="button"
                    onClick={restart}
                    className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>

              <CanvasSimulator
                params={params}
                sim={sim}
                paused={paused}
                planetName={activePlanet.name}
                planetColorClass={activePlanet.colorClass}
                onTogglePaused={() => setPaused((p) => !p)}
                onRestart={restart}
              />
            </div>

            {/* Controls Panel */}
            <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
              <div className="flex items-center justify-between mb-2 border-b border-neutral-800 pb-2">
                <h3 className="text-xs font-bold tracking-widest text-neutral-500">🌍 PRESETS</h3>
                <button
                  type="button"
                  onClick={resetDefaults}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
                >
                  Restore Base Values
                </button>
              </div>

              <div className="grid gap-2 grid-cols-2">
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
                      className={`relative overflow-hidden rounded-xl border px-3 py-2 text-left text-sm transition ${active
                        ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-600 hover:bg-neutral-800"
                        }`}
                    >
                      <div className="relative z-10">
                        <div className="font-semibold text-white text-xs">{planet.name}</div>
                        <div className="text-[10px] text-cyan-200 mt-0.5">g = {planet.g.toFixed(1)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <h3 className="mb-4 text-xs font-bold tracking-widest text-neutral-500">⚙ PARAMETERS</h3>
                <div className="grid gap-3">
                  <SliderRow label="Gravitational acceleration, g" value={params.g} min={1} max={25} step={0.01} unit="m/s²" accentColor="#fb7185" icon="⏬" onChange={(g) => setParamAndMaybeRestart({ g }, false)} />
                  <SliderRow label="Mass, m" value={params.m} min={1} max={50} step={1} unit="kg" accentColor="#facc15" icon="⚖️" onChange={(m) => setParamAndMaybeRestart({ m }, false)} />
                  <SliderRow label="Initial height, h₀" value={params.h0} min={0} max={100} step={0.1} unit="m" accentColor="#a78bfa" icon="📏" onChange={(h0) => setParamAndMaybeRestart({ h0 }, true)} />
                  <SliderRow label="Initial velocity, v₀ (+ up)" value={params.v0} min={-30} max={30} step={0.1} unit="m/s" accentColor="#38bdf8" icon="🚀" onChange={(v0) => setParamAndMaybeRestart({ v0 }, true)} />
                  <SliderRow label="Bounce efficiency, e" value={params.e} min={0} max={0.95} step={0.01} unit="" accentColor="#34d399" icon="🏀" onChange={(e) => setParamAndMaybeRestart({ e }, false)} />
                </div>
              </div>

              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <div className="font-bold text-blue-400 mb-2 font-sans">💡 Quick Tip</div>
                <p className="text-xs text-blue-200/80 leading-relaxed font-sans">
                  Set <strong className="text-blue-300">v₀ &gt; 0</strong> to throw upward. Increase <strong className="text-blue-300">g</strong> to make the fall noticeably faster.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {/* Bottom Row: Info Panel */}
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300 flex flex-col md:flex-row gap-6">

          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 tracking-widest uppercase">Concept: Motion Under Gravity</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-sans">
              In vertical motion near Earth (ignoring air resistance), gravity provides a nearly constant downward acceleration. Changing <em>g</em> makes the object speed up more quickly; changing <em>h₀</em> and <em>v₀</em> changes the starting conditions and therefore the entire trajectory. The bounce parameter <em>e</em> shows energy loss at impacts, making each rebound smaller.
            </p>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <h4 className="text-sm font-semibold text-neutral-200 mb-3">Key Formulas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="font-mono text-sm text-neutral-300 bg-black/40 px-3 py-2 rounded border border-neutral-800">a = −g <span className="text-neutral-500 float-right text-xs mt-0.5">(m/s²)</span></div>
                  <div className="font-mono text-sm text-neutral-300 bg-black/40 px-3 py-2 rounded border border-neutral-800">v(t) = v₀ − gt <span className="text-neutral-500 float-right text-xs mt-0.5">(m/s)</span></div>
                </div>
                <div className="space-y-2">
                  <div className="font-mono text-sm text-neutral-300 bg-black/40 px-3 py-2 rounded border border-neutral-800">y(t) = h₀ + v₀t − ½gt² <span className="text-neutral-500 float-right text-xs mt-0.5">(m)</span></div>
                  <div className="font-mono text-sm text-neutral-300 bg-black/40 px-3 py-2 rounded border border-neutral-800">v_post = −e · v_pre <span className="text-neutral-500 float-right text-xs mt-0.5">(bounce)</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-bold text-cyan-400 tracking-widest uppercase">Variables Reference</h3>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
              <table className="w-full text-sm font-sans text-left">
                <thead className="bg-neutral-800/50 text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-2 font-medium">Symbol</th>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  <tr>
                    <td className="px-4 py-3 font-mono text-cyan-400 bg-neutral-950/30">g</td>
                    <td className="px-4 py-3 text-neutral-300">Gravitational acceleration</td>
                    <td className="px-4 py-3 text-neutral-500">m/s²</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-amber-500 bg-neutral-950/30">h₀</td>
                    <td className="px-4 py-3 text-neutral-300">Initial height</td>
                    <td className="px-4 py-3 text-neutral-500">m</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-emerald-400 bg-neutral-950/30">v₀</td>
                    <td className="px-4 py-3 text-neutral-300">Initial vertical velocity</td>
                    <td className="px-4 py-3 text-neutral-500">m/s</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-purple-400 bg-neutral-950/30">e</td>
                    <td className="px-4 py-3 text-neutral-300">Coefficient of restitution</td>
                    <td className="px-4 py-3 text-neutral-500">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
