"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface DoubleSlitParams {
  /** Wavelength (nm). Visible light ~400–700 nm. */
  wavelengthNm: number;
  /** Slit separation (μm). Typical 50–300 μm. */
  slitSeparationUm: number;
  /** Screen distance from slits (m). */
  screenDistanceM: number;
  /** Particles emitted per second (approximate). */
  emissionRate: number;
}

const DEFAULT_PARAMS: DoubleSlitParams = {
  wavelengthNm: 550,
  slitSeparationUm: 150,
  screenDistanceM: 1.2,
  emissionRate: 120,
};

/** Hit position on screen in normalized coordinates -1..1 (vertical). */
type Hit = number;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function formatNumber(n: number, digits = 2): string {
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

// ---------------------------------------------------------------------------
// Slider row
// ---------------------------------------------------------------------------

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
  const { label, value, min, max, step, unit, accentClassName, onChange } = props;
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 shadow-sm">
      <div className="min-w-[180px]">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-0.5 text-xs text-neutral-400">
          <span className="tabular-nums text-neutral-200">
            {formatNumber(value, step < 1 ? 2 : 0)}
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
        aria-label={label}
        className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 outline-none ${accentClassName}`}
      />
      <div className="min-w-[100px] text-right text-xs text-neutral-400">
        <span className="tabular-nums text-neutral-200">
          {formatNumber(value, step < 1 ? 2 : 0)}
        </span>{" "}
        {unit}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sample y position from double-slit intensity (cos² pattern)
// Returns y in normalized -1..1 for screen drawing.
// I(y) ∝ cos²(π d y / (λ L)); use rejection sampling or inverse over a range.
// Fringe spacing Δy = λL/d (in real meters). We work in normalized coords.
// ---------------------------------------------------------------------------
function sampleInterference(
  wavelengthNm: number,
  slitSeparationUm: number,
  screenDistanceM: number
): number {
  const λ = wavelengthNm * 1e-9; // m
  const d = slitSeparationUm * 1e-6; // m
  const L = screenDistanceM;
  const k = (Math.PI * d) / (λ * L); // I ∝ cos²(k * y_real), y_real in m
  // Fringe spacing in m: Δy = λ*L/d. Show about ±3 fringes.
  const halfSpan = Math.max(0.01, (3 * λ * L) / d);
  for (let attempt = 0; attempt < 30; attempt++) {
    const yM = (Math.random() * 2 - 1) * halfSpan;
    const intensity = Math.cos(k * yM) ** 2;
    if (Math.random() <= intensity) return clamp(yM / halfSpan, -1, 1);
  }
  return (Math.random() * 2 - 1);
}

// ---------------------------------------------------------------------------
// Canvas: double-slit setup + accumulating dots on screen
// ---------------------------------------------------------------------------

interface CanvasSimulatorProps {
  params: DoubleSlitParams;
  hits: Hit[];
  paused: boolean;
  onTogglePaused: () => void;
  onClear: () => void;
}

const CanvasSimulator: React.FC<CanvasSimulatorProps> = ({
  params,
  hits,
  paused,
  onTogglePaused,
  onClear,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const aspectRatio = 16 / 9;

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

    const bg = "#0c1222";
    const grid = "rgba(100,116,139,0.18)";
    const axis = "#94a3b8";
    const text = "#e2e8f0";
    const slitColor = "#1e293b";
    const barrierColor = "#334155";
    const particleColor = "rgba(34,211,238,0.85)";
    const particleGlow = "rgba(34,211,238,0.25)";
    const accent = "#38bdf8";

    ctx.clearRect(0, 0, w, h);

    const pad = 20 * dpr;
    const leftPad = 50 * dpr;
    const rightPad = 50 * dpr;
    const bottomPad = 36 * dpr;
    const topPad = 28 * dpr;

    const plotX0 = leftPad;
    const plotX1 = w - rightPad;
    const plotY0 = topPad;
    const plotY1 = h - bottomPad;
    const plotW = plotX1 - plotX0;
    const plotH = plotY1 - plotY0;

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, bg);
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1 * dpr;
    for (let i = 0.25; i < 1; i += 0.25) {
      const x = plotX0 + plotW * i;
      ctx.beginPath();
      ctx.moveTo(x, plotY0);
      ctx.lineTo(x, plotY1);
      ctx.stroke();
    }
    for (let i = 0.25; i < 1; i += 0.25) {
      const y = plotY0 + plotH * i;
      ctx.beginPath();
      ctx.moveTo(plotX0, y);
      ctx.lineTo(plotX1, y);
      ctx.stroke();
    }

    // Barrier (vertical strip) with two slits – left third of plot
    const barrierLeft = plotX0 + plotW * 0.28;
    const barrierRight = plotX0 + plotW * 0.35;
    const barrierMidY = plotY0 + plotH / 2;
    const slitHalf = (plotH * 0.12);
    ctx.fillStyle = barrierColor;
    ctx.fillRect(plotX0, plotY0, barrierLeft - plotX0, plotH);
    ctx.fillRect(barrierRight, plotY0, plotX1 - barrierRight, plotH);
    const slitGap = (params.slitSeparationUm / 400) * plotH;
    const slitWidth = Math.max(4 * dpr, plotH * 0.06);
    const topSlitY = barrierMidY - slitGap / 2 - slitWidth / 2;
    const botSlitY = barrierMidY + slitGap / 2 - slitWidth / 2;
    ctx.fillStyle = barrierColor;
    ctx.fillRect(barrierLeft, plotY0, barrierRight - barrierLeft, topSlitY - plotY0);
    ctx.fillRect(barrierLeft, topSlitY + slitWidth, barrierRight - barrierLeft, botSlitY - (topSlitY + slitWidth));
    ctx.fillRect(barrierLeft, botSlitY + slitWidth, barrierRight - barrierLeft, plotY1 - (botSlitY + slitWidth));

    // Screen (right edge) – where dots accumulate
    const screenX = plotX1 - 2 * dpr;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2 * dpr;
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.beginPath();
    ctx.moveTo(screenX, plotY0);
    ctx.lineTo(screenX, plotY1);
    ctx.stroke();
    ctx.setLineDash([]);

    // Normalized hit -1..1 -> screen y
    const toY = (norm: number) => {
      const t = (norm + 1) / 2;
      return plotY0 + (1 - t) * plotH;
    };

    // Draw accumulated hits (particles on screen)
    const dotRadius = Math.max(1.2, 2 * dpr);
    for (let i = 0; i < hits.length; i++) {
      const y = toY(hits[i]);
      ctx.fillStyle = particleGlow;
      ctx.beginPath();
      ctx.arc(screenX - 1, y, dotRadius * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(screenX - 1, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Axis labels
    ctx.fillStyle = axis;
    ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Source", plotX0 + (barrierLeft - plotX0) / 2, plotY1 + 10 * dpr);
    ctx.fillText("Barrier (double slit)", barrierLeft + (barrierRight - barrierLeft) / 2, plotY1 + 10 * dpr);
    ctx.fillText("Screen", plotX1 - 25 * dpr, plotY1 + 10 * dpr);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("y (intensity)", plotX0, plotY0 - 10 * dpr);

    // HUD
    ctx.fillStyle = text;
    ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Particles: ${hits.length}`, plotX0, plotY0 - 2 * dpr);
  }, [params, hits]);

  return (
    <div className="rounded-3xl border border-sky-500/40 bg-neutral-950/60 p-4 shadow-[0_0_40px_rgba(56,189,248,0.1)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">
            Double slit – particles forming interference pattern
          </div>
          <div className="text-xs text-neutral-400">
            Cyan dots = particle hits on screen; pattern emerges over time.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-sky-500/40 bg-neutral-900 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-neutral-800 hover:border-sky-400"
          >
            Clear screen
          </button>
          <button
            type="button"
            onClick={onTogglePaused}
            className="rounded-xl bg-sky-400/90 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-300"
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border border-sky-500/40 bg-[#050816]"
        style={{ aspectRatio: "16/9" }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DoubleSlitSimulation() {
  const [params, setParams] = useState<DoubleSlitParams>(DEFAULT_PARAMS);
  const [hits, setHits] = useState<Hit[]>([]);
  const [paused, setPaused] = useState(false);

  const paramsRef = useLatestRef(params);
  const pausedRef = useLatestRef(paused);
  const lastEmitRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const resetDefaults = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setHits([]);
    setPaused(false);
  }, []);

  const clearScreen = useCallback(() => setHits([]), []);

  // Emission loop: add particles at rate emissionRate per second
  useEffect(() => {
    const step = (ts: number) => {
      rafRef.current = requestAnimationFrame(step);
      if (pausedRef.current) return;

      const p = paramsRef.current;
      const dt = (ts - lastEmitRef.current) / 1000;
      lastEmitRef.current = ts;

      const toEmit = Math.min(50, Math.max(0, Math.floor(p.emissionRate * dt)));
      if (toEmit <= 0) return;

      const newHits: Hit[] = [];
      for (let i = 0; i < toEmit; i++) {
        newHits.push(
          sampleInterference(
            p.wavelengthNm,
            p.slitSeparationUm,
            p.screenDistanceM
          )
        );
      }
      setHits((prev) => [...prev, ...newHits].slice(-12000));
    };

    lastEmitRef.current = performance.now();
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [paramsRef, pausedRef]);

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a]" />

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Double slit experiment
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-400">
            Particles (e.g. electrons or photons) are sent one by one through two slits.
            Each dot is one particle hitting the screen. Over time, an interference pattern
            emerges—wave-like behavior even for single particles.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:w-[60%]">
            <CanvasSimulator
              params={params}
              hits={hits}
              paused={paused}
              onTogglePaused={() => setPaused((p) => !p)}
              onClear={clearScreen}
            />

            <div className="mt-6 rounded-3xl border border-neutral-800 bg-neutral-950/40 p-4 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Parameters
                  </div>
                  <div className="text-xs text-neutral-400">
                    Change wavelength, slit separation, or screen distance to see how the pattern changes.
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
                  label="Wavelength, λ"
                  value={params.wavelengthNm}
                  min={350}
                  max={750}
                  step={10}
                  unit="nm"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(wavelengthNm) => setParams((p) => ({ ...p, wavelengthNm }))}
                />
                <SliderRow
                  label="Slit separation, d"
                  value={params.slitSeparationUm}
                  min={50}
                  max={400}
                  step={10}
                  unit="μm"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(slitSeparationUm) => setParams((p) => ({ ...p, slitSeparationUm }))}
                />
                <SliderRow
                  label="Screen distance, L"
                  value={params.screenDistanceM}
                  min={0.5}
                  max={3}
                  step={0.1}
                  unit="m"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(screenDistanceM) => setParams((p) => ({ ...p, screenDistanceM }))}
                />
                <SliderRow
                  label="Emission rate"
                  value={params.emissionRate}
                  min={20}
                  max={300}
                  step={10}
                  unit="particles/s"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(emissionRate) => setParams((p) => ({ ...p, emissionRate }))}
                />
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[40%]">
            <div className="h-full rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">
                Wave–particle duality &amp; interference
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                Light or matter passing through two narrow slits produces a pattern of bright and dark fringes
                on a screen. The intensity follows a cos² dependence from the path difference. Even when particles
                are sent one at a time, the same pattern builds up—each particle is described by a wave function
                that interferes with itself.
              </p>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Key formula
                </div>
                <div className="mt-3 space-y-2 text-sm text-neutral-200">
                  <div className="font-mono">
                    I(y) ∝ cos²(π d y / (λ L))
                    <span className="ml-2 text-neutral-400">(intensity on screen)</span>
                  </div>
                  <div className="font-mono">
                    Δy = λ L / d
                    <span className="ml-2 text-neutral-400">(fringe spacing, m)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Variables (with units)
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">λ</dt>
                    <dd className="text-neutral-400">wavelength (nm)</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">d</dt>
                    <dd className="text-neutral-400">slit separation (μm)</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">L</dt>
                    <dd className="text-neutral-400">screen distance (m)</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">y</dt>
                    <dd className="text-neutral-400">position on screen (m)</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-400">
                Larger λ or L, or smaller d, gives wider fringe spacing. Pause to inspect the pattern; clear and resume to see it build again.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
