"use client";

import React, { useEffect, useRef, useState } from "react";

// ——— Special Relativity: time dilation & length contraction ———
// γ = 1/√(1 − v²/c²), Δt = γ Δτ, L = L₀/γ

type Params = {
  /** Velocity as fraction of c (0 to 0.99) */
  vOverC: number;
  /** Rest length of spaceship (m) */
  restLength: number;
  /** Simulation speed multiplier (lab time per real second) */
  simSpeed: number;
};

const DEFAULT_PARAMS: Params = {
  vOverC: 0.6,
  restLength: 60,
  simSpeed: 1,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatNum(n: number, decimals = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(decimals);
}

/** Lorentz factor γ = 1/√(1 − v²/c²) */
function gamma(vOverC: number): number {
  const v2 = vOverC * vOverC;
  if (v2 >= 1) return 1;
  return 1 / Math.sqrt(1 - v2);
}

// ——— Slider only (no value/unit text) ———
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
    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/70 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-[140px] shrink-0">
        <div className="text-sm font-semibold text-white">{label}</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="physics-range flex-1"
        aria-label={label}
      />
    </div>
  );
}

// ——— Canvas constants ———
const BG = "#0a0e1a";
const GRID = "rgba(56, 189, 248, 0.12)";
const AXIS = "rgba(248, 250, 252, 0.85)";
const TEXT = "rgba(226, 232, 240, 0.95)";
const SUBTEXT = "rgba(148, 163, 184, 0.9)";
const REST_CLOCK = "#4ade80";
const MOVING_CLOCK = "#fbbf24";
const SHIP_BODY = "#38bdf8";
const VELOCITY_COLOR = "#22d3ee";

function SimulatorCanvas({
  params,
  labTime,
  playing,
  onScrubTime,
  onScrubStart,
}: {
  params: Params;
  labTime: number;
  playing: boolean;
  onScrubTime: (t: number) => void;
  onScrubStart?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  // Resize canvas to container (fixed aspect ratio 16:9)
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

  // Draw frame
  useEffect(() => {
    const canvas = canvasRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = canvas.width / Math.max(1, el.getBoundingClientRect().width);
    const w = canvas.width;
    const h = canvas.height;

    const γ = gamma(params.vOverC);
    const v = params.vOverC;
    const properTime = labTime / γ;
    const contractedLength = params.restLength / γ;
    const shipCenterXWorld = v * labTime; // in light-seconds (c·s)

    // Layout: left/bottom padding for axes and labels
    const leftPad = 56 * dpr;
    const rightPad = 16 * dpr;
    const topPad = 24 * dpr;
    const bottomPad = 44 * dpr;
    const plotW = w - leftPad - rightPad;
    const plotH = h - topPad - bottomPad;

    // World scale: x in light-seconds (c·s), 0 to xMax
    const xMax = Math.max(2.5, shipCenterXWorld + 0.3);
    const xMin = -0.1;
    const xRange = xMax - xMin;
    const toX = (x: number) => leftPad + ((x - xMin) / xRange) * plotW;
    const centerY = topPad + plotH / 2;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1 * dpr;
    for (let i = 1; i <= 4; i++) {
      const x = leftPad + (i / 4) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, topPad);
      ctx.lineTo(x, topPad + plotH);
      ctx.stroke();
    }
    for (let i = 1; i <= 3; i++) {
      const y = topPad + (i / 3) * plotH;
      ctx.beginPath();
      ctx.moveTo(leftPad, y);
      ctx.lineTo(leftPad + plotW, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = AXIS;
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(leftPad, topPad);
    ctx.lineTo(leftPad, topPad + plotH);
    ctx.lineTo(leftPad + plotW, topPad + plotH);
    ctx.stroke();

    const font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.font = font;
    ctx.fillStyle = SUBTEXT;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("x (c·s)", leftPad + plotW / 2, topPad + plotH + 10 * dpr);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("0", leftPad - 6 * dpr, topPad + plotH);

    // Rest clock at x = 0 (lab frame)
    const restClockX = toX(0);
    ctx.fillStyle = REST_CLOCK;
    ctx.strokeStyle = "rgba(74, 222, 128, 0.6)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(restClockX, centerY, 28 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0a0e1a";
    ctx.font = `${10 * dpr}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`t = ${formatNum(labTime, 2)}`, restClockX, centerY);
    ctx.fillStyle = SUBTEXT;
    ctx.font = `${9 * dpr}px sans-serif`;
    ctx.fillText("Lab clock", restClockX, centerY + 20 * dpr);

    // Moving spaceship: length in pixels contracts by 1/γ (visual length contraction)
    const shipCenterPx = toX(shipCenterXWorld);
    const shipW = Math.max(24 * dpr, (120 * dpr) / γ);
    const shipLeft = shipCenterPx - shipW / 2;
    const shipRight = shipCenterPx + shipW / 2;
    const shipH = 32 * dpr;
    const shipY = centerY - shipH / 2;

    ctx.fillStyle = SHIP_BODY;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.rect(shipLeft, shipY, shipW, shipH);
    ctx.fill();
    ctx.stroke();

    // Velocity arrow on ship
    ctx.fillStyle = VELOCITY_COLOR;
    ctx.font = `${9 * dpr}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`v = ${formatNum(params.vOverC * 100, 0)}% c`, (shipLeft + shipRight) / 2, shipY - 10 * dpr);

    // Moving clock on ship (shows proper time τ)
    const movingClockX = (shipLeft + shipRight) / 2;
    const movingClockY = centerY;
    ctx.fillStyle = MOVING_CLOCK;
    ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
    ctx.beginPath();
    ctx.arc(movingClockX, movingClockY, 22 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0a0e1a";
    ctx.font = `${9 * dpr}px monospace`;
    ctx.fillText(`τ = ${formatNum(properTime, 2)}`, movingClockX, movingClockY);
    ctx.fillStyle = SUBTEXT;
    ctx.font = `${8 * dpr}px sans-serif`;
    ctx.fillText("Moving clock", movingClockX, movingClockY + 16 * dpr);

    // HUD: γ, L/L₀
    ctx.fillStyle = TEXT;
    ctx.font = `${11 * dpr}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hudX = leftPad + 8 * dpr;
    const hudY = topPad + 8 * dpr;
    const lineH = 16 * dpr;
    ctx.fillText(`γ = ${formatNum(γ, 2)}`, hudX, hudY);
    ctx.fillText(`L/L₀ = 1/γ = ${formatNum(1 / γ, 3)}`, hudX, hudY + lineH);
    ctx.fillStyle = MOVING_CLOCK;
    ctx.fillText(`Time dilation: τ = t/γ`, hudX, hudY + 2 * lineH);
  }, [params, labTime]);

  // Animation loop: advance lab time when playing
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
    };
  }, [playing]);

  // Convert client X to lab time when dragging (same layout as draw: leftPad 56px, rightPad 16px)
  const handlePointerDown = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const leftPadCss = 56;
    const rightPadCss = 16;
    const plotWCss = rect.width - leftPadCss - rightPadCss;
    if (plotWCss <= 0) return;
    const plotXCss = e.clientX - rect.left - leftPadCss;
    if (plotXCss < 0 || plotXCss > plotWCss) return;
    const shipCenterXWorld = params.vOverC * labTime;
    const xMax = Math.max(2.5, shipCenterXWorld + 0.3);
    const xMin = -0.1;
    const xRange = xMax - xMin;
    const worldX = xMin + (plotXCss / plotWCss) * xRange;
    isDraggingRef.current = true;
    onScrubStart?.();
    if (params.vOverC > 0.01) {
      const t = Math.max(0, worldX / params.vOverC);
      onScrubTime(t);
    } else {
      const tMax = 10;
      const t = (plotXCss / plotWCss) * tMax;
      onScrubTime(t);
    }
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const leftPadCss = 56;
    const rightPadCss = 16;
    const plotWCss = rect.width - leftPadCss - rightPadCss;
    if (plotWCss <= 0) return;
    const plotXCss = Math.max(0, Math.min(plotWCss, e.clientX - rect.left - leftPadCss));
    const shipCenterXWorld = params.vOverC * labTime;
    const xMax = Math.max(2.5, shipCenterXWorld + 0.3);
    const xMin = -0.1;
    const xRange = xMax - xMin;
    const worldX = xMin + (plotXCss / plotWCss) * xRange;
    if (params.vOverC > 0.01) {
      const t = Math.max(0, worldX / params.vOverC);
      onScrubTime(t);
    } else {
      const tMax = 10;
      const t = (plotXCss / plotWCss) * tMax;
      onScrubTime(t);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#0a0e1a] cursor-grab active:cursor-grabbing"
      style={{ aspectRatio: "16/9" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
        style={{ aspectRatio: "16/9" }}
      />
    </div>
  );
}

export default function SpecialRelativitySimulation() {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [labTime, setLabTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lastTickRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // Animation: advance lab time when playing
  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setLabTime((t) => t + dt * params.simSpeed);
      rafRef.current = requestAnimationFrame(tick);
    };
    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, params.simSpeed]);

  const γ = gamma(params.vOverC);
  const properTime = labTime / γ;
  const contractedLength = params.restLength / γ;

  const reset = () => {
    setParams(DEFAULT_PARAMS);
    setLabTime(0);
    setPlaying(false);
  };

  return (
    <main className="min-h-screen bg-[#020617]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Top Row: Simulation Canvas */}
            <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-4 mb-6">
                <div className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                  🚀 Special Relativity
                </div>
                <div className="text-xs text-neutral-400 hidden sm:block">
                  Green = lab clock (t), Amber = moving clock (τ). Drag horizontally to scrub time.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors flex gap-2 items-center ${playing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {playing ? "⏸ Pause" : "▶ Play"}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>

              <SimulatorCanvas
                params={params}
                labTime={labTime}
                playing={playing}
                onScrubTime={setLabTime}
                onScrubStart={() => setPlaying(false)}
              />
            </div>

            {/* Controls Panel */}
            <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
              <div className="pt-2">
                <h3 className="mb-4 text-xs font-bold tracking-widest text-neutral-500">⚙ PARAMETERS</h3>
                <div className="grid gap-3">
                  <SliderRow
                    label="Velocity, v/c"
                    value={params.vOverC}
                    min={0}
                    max={0.95}
                    step={0.01}
                    unit=""
                    onChange={(vOverC) =>
                      setParams((p) => ({ ...p, vOverC: clamp(vOverC, 0, 0.99) }))
                    }
                  />
                  <SliderRow
                    label="Rest length, L₀"
                    value={params.restLength}
                    min={20}
                    max={120}
                    step={5}
                    unit="m"
                    onChange={(restLength) =>
                      setParams((p) => ({ ...p, restLength }))
                    }
                  />
                  <SliderRow
                    label="Sim speed"
                    value={params.simSpeed}
                    min={0.25}
                    max={3}
                    step={0.25}
                    unit="×"
                    onChange={(simSpeed) =>
                      setParams((p) => ({ ...p, simSpeed }))
                    }
                  />
                </div>
              </div>

              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                <div className="font-bold text-cyan-400 mb-2 font-sans">Live Status</div>
                <div className="flex flex-col gap-2 text-xs text-neutral-300">
                  <div>
                    <span className="font-semibold text-neutral-200">
                      Lab time t = {formatNum(labTime, 2)} s
                    </span>{" "}
                    → proper time τ = {formatNum(properTime, 2)} s (γ ={" "}
                    {formatNum(γ, 2)})
                  </div>
                  <div>
                    Contracted L = {formatNum(contractedLength, 1)} m
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Bottom Row: Info Panel */}
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300 flex flex-col md:flex-row gap-6">

          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-bold text-cyan-400 tracking-widest uppercase">Special Relativity — Time Dilation & Length Contraction</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-sans">
              In special relativity, moving clocks run slower (time dilation)
              and moving lengths contract along the direction of motion. The
              Lorentz factor γ depends only on v/c. As v → c, γ → ∞ so time
              on the moving clock nearly stops and length contracts to zero.
            </p>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 mt-6">
              <h4 className="text-sm font-semibold text-neutral-200 mb-3">Key Formulas</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="font-mono text-sm text-neutral-300 bg-black/40 px-3 py-2 rounded border border-neutral-800"><span className="text-cyan-300">γ = 1/√(1 − v²/c²)</span></div>
                  <div className="font-mono text-sm text-neutral-300 bg-black/40 px-3 py-2 rounded border border-neutral-800"><span className="text-emerald-300">Δt = γ Δτ</span> <span className="text-neutral-500 float-right text-xs mt-0.5">(time dilation: lab time vs proper time)</span></div>
                  <div className="font-mono text-sm text-neutral-300 bg-black/40 px-3 py-2 rounded border border-neutral-800"><span className="text-amber-300">L = L₀/γ</span> <span className="text-neutral-500 float-right text-xs mt-0.5">(length contraction)</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 tracking-widest uppercase">Variables Reference</h3>

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
                    <td className="px-4 py-3 font-mono text-cyan-400 bg-neutral-950/30">v, c</td>
                    <td className="px-4 py-3 text-neutral-300">speed, speed of light</td>
                    <td className="px-4 py-3 text-neutral-500">m/s</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-amber-500 bg-neutral-950/30">γ</td>
                    <td className="px-4 py-3 text-neutral-300">Lorentz factor</td>
                    <td className="px-4 py-3 text-neutral-500">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-emerald-400 bg-neutral-950/30">Δt, Δτ</td>
                    <td className="px-4 py-3 text-neutral-300">lab time, proper time</td>
                    <td className="px-4 py-3 text-neutral-500">s</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-purple-400 bg-neutral-950/30">L₀, L</td>
                    <td className="px-4 py-3 text-neutral-300">rest length, contracted length</td>
                    <td className="px-4 py-3 text-neutral-500">m</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-700 bg-neutral-900/40 p-4 text-sm text-neutral-400">
              <strong className="text-neutral-300">The twin paradox:</strong> a traveling twin ages less because they
              experience less proper time. Here we show one frame: the lab
              clock ticks <span className="text-neutral-300">t</span> while the moving ship&apos;s clock ticks <span className="text-neutral-300">τ = t/γ</span> (slower).
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
