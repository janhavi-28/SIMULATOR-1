"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface DoubleSlitParams {
  /** Wavelength (nm). Visible light ~400-700 nm. */
  wavelengthNm: number;
  /** Slit separation (um). Typical 50-300 um. */
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

function sinc(x: number): number {
  if (Math.abs(x) < 1e-8) return 1;
  return Math.sin(x) / x;
}

function getHalfSpanMeters(wavelengthNm: number, slitSeparationUm: number, screenDistanceM: number): number {
  const lambda = wavelengthNm * 1e-9;
  const d = slitSeparationUm * 1e-6;
  const L = screenDistanceM;
  // Cover about +/- 4 fringe spacings for clearer pattern shape.
  return Math.max(0.01, (4 * lambda * L) / d);
}

function doubleSlitIntensity(
  yMeters: number,
  wavelengthNm: number,
  slitSeparationUm: number,
  screenDistanceM: number
): number {
  const lambda = wavelengthNm * 1e-9; // m
  const d = slitSeparationUm * 1e-6; // m
  const L = screenDistanceM;
  // Finite slit width envelope so outer fringes fade realistically.
  const slitWidth = d * 0.32;
  const alpha = (Math.PI * d * yMeters) / (lambda * L);
  const beta = (Math.PI * slitWidth * yMeters) / (lambda * L);
  const interference = Math.cos(alpha) ** 2;
  const envelope = sinc(beta) ** 2;
  return clamp(interference * envelope, 0, 1);
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

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  color = "#38bdf8",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-200">{label}</span>
        <span className="tabular-nums text-sm text-neutral-400">
          {value.toFixed(step < 1 ? 2 : 1)}
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
        style={{ accentColor: color }}
        aria-label={label}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sample y position from double-slit intensity (cos^2 pattern)
// Returns y in normalized -1..1 for screen drawing.
// I(y) ~ cos^2(pi d y / (lambda L)); use rejection sampling or inverse over a range.
// Fringe spacing delta y = lambdaL/d (in real meters). We work in normalized coords.
// ---------------------------------------------------------------------------
function sampleInterference(
  wavelengthNm: number,
  slitSeparationUm: number,
  screenDistanceM: number
): number {
  const halfSpan = getHalfSpanMeters(wavelengthNm, slitSeparationUm, screenDistanceM);
  for (let attempt = 0; attempt < 30; attempt++) {
    const yM = (Math.random() * 2 - 1) * halfSpan;
    const intensity = doubleSlitIntensity(yM, wavelengthNm, slitSeparationUm, screenDistanceM);
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
}

const CanvasSimulator: React.FC<CanvasSimulatorProps> = ({
  params,
  hits,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
    const barrierColor = "#334155";
    const particleColor = "rgba(34,211,238,0.85)";
    const particleGlow = "rgba(34,211,238,0.25)";
    const accent = "#38bdf8";
    const theoryColor = "rgba(251,191,36,0.95)";
    const observedColor = "rgba(16,185,129,0.95)";

    ctx.clearRect(0, 0, w, h);

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

    // Barrier (vertical strip) with two slits - left third of plot
    const barrierLeft = plotX0 + plotW * 0.28;
    const barrierRight = plotX0 + plotW * 0.35;
    const barrierMidY = plotY0 + plotH / 2;
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

    // Screen (right edge) - where dots accumulate
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

    // Observed distribution from hits: horizontal bars extending left from screen.
    const bins = 90;
    const counts = new Array<number>(bins).fill(0);
    for (const hit of hits) {
      const idx = clamp(Math.floor(((hit + 1) / 2) * bins), 0, bins - 1);
      counts[idx] += 1;
    }
    const maxCount = Math.max(1, ...counts);
    const histMaxW = plotW * 0.28;
    for (let i = 0; i < bins; i++) {
      const yNorm = ((i + 0.5) / bins) * 2 - 1;
      const y = toY(yNorm);
      const barW = (counts[i] / maxCount) * histMaxW;
      if (barW <= 0.5) continue;
      ctx.strokeStyle = "rgba(16,185,129,0.35)";
      ctx.lineWidth = 1.25 * dpr;
      ctx.beginPath();
      ctx.moveTo(screenX - 3 * dpr, y);
      ctx.lineTo(screenX - 3 * dpr - barW, y);
      ctx.stroke();
    }

    // Theoretical intensity profile curve for current parameters.
    const halfSpan = getHalfSpanMeters(params.wavelengthNm, params.slitSeparationUm, params.screenDistanceM);
    const theoryMaxW = plotW * 0.28;
    ctx.strokeStyle = theoryColor;
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) {
      const yNorm = (i / 240) * 2 - 1;
      const yM = yNorm * halfSpan;
      const intensity = doubleSlitIntensity(yM, params.wavelengthNm, params.slitSeparationUm, params.screenDistanceM);
      const x = screenX - 3 * dpr - intensity * theoryMaxW;
      const y = toY(yNorm);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

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
    ctx.fillStyle = observedColor;
    ctx.fillText("Observed", plotX1 - plotW * 0.24, plotY0 - 2 * dpr);
    ctx.fillStyle = theoryColor;
    ctx.fillText("Theory", plotX1 - plotW * 0.14, plotY0 - 2 * dpr);
  }, [params, hits]);

  return (
    <div className="rounded-3xl border border-sky-500/40 bg-neutral-950/60 p-4 shadow-[0_0_40px_rgba(56,189,248,0.1)]">
      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-sky-500/40 bg-[#050816]"
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
  const [playing, setPlaying] = useState(true);

  const paramsRef = useLatestRef(params);
  const playingRef = useLatestRef(playing);
  const lastEmitRef = useRef<number>(0);
  const emitCarryRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const resetDefaults = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setHits([]);
    setPlaying(true);
  }, []);

  const clearScreen = useCallback(() => setHits([]), []);

  // Emission loop: add particles at rate emissionRate per second
  useEffect(() => {
    const step = (ts: number) => {
      rafRef.current = requestAnimationFrame(step);
      if (!playingRef.current) return;

      const p = paramsRef.current;
      const dt = (ts - lastEmitRef.current) / 1000;
      lastEmitRef.current = ts;

      emitCarryRef.current += p.emissionRate * dt;
      const toEmit = Math.min(80, Math.max(0, Math.floor(emitCarryRef.current)));
      emitCarryRef.current -= toEmit;
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
  }, [paramsRef, playingRef]);

  return (
    <main className="min-h-screen bg-[#020617] text-neutral-200">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">

            <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
              <div className="mb-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/50 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-white">Double slit - particles forming interference pattern</div>
                  <div className="text-xs text-neutral-400">Cyan dots are impacts; green bars are observed counts; yellow curve is theory.</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    className={`min-w-[110px] rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors ${playing ? "bg-emerald-700 hover:bg-emerald-800" : "bg-emerald-600 hover:bg-emerald-700"}`}
                  >
                    {playing ? "⏸ Pause" : "▶ Play"}
                  </button>
                  <button
                    type="button"
                    onClick={clearScreen}
                    className="min-w-[110px] rounded-xl border border-neutral-600 bg-neutral-800 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                  >
                    Clear screen
                  </button>
                </div>
              </div>

              <CanvasSimulator
                params={params}
                hits={hits}
              />
            </div>

            <aside className="col-span-1 h-[580px] overflow-y-auto pr-1">
              <div className="h-full rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Parameters</h3>
                    <div className="text-xs text-neutral-400">Tune wavelength, slit spacing, distance, and emission rate.</div>
                  </div>
                  <button
                    type="button"
                    onClick={resetDefaults}
                    className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-100 transition-colors hover:bg-neutral-700"
                  >
                    Reset defaults
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <SliderRow
                    label="Wavelength, lambda"
                    value={params.wavelengthNm}
                    min={350}
                    max={750}
                    step={10}
                    unit="nm"
                    color="#a78bfa" // violet-400
                    onChange={(wavelengthNm) => setParams((p) => ({ ...p, wavelengthNm }))}
                  />
                  <SliderRow
                    label="Slit separation, d"
                    value={params.slitSeparationUm}
                    min={50}
                    max={400}
                    step={10}
                    unit="um"
                    color="#fbbf24" // amber-400
                    onChange={(slitSeparationUm) => setParams((p) => ({ ...p, slitSeparationUm }))}
                  />
                  <SliderRow
                    label="Screen distance, L"
                    value={params.screenDistanceM}
                    min={0.5}
                    max={3}
                    step={0.1}
                    unit="m"
                    color="#34d399" // emerald-400
                    onChange={(screenDistanceM) => setParams((p) => ({ ...p, screenDistanceM }))}
                  />
                  <SliderRow
                    label="Emission rate"
                    value={params.emissionRate}
                    min={20}
                    max={300}
                    step={10}
                    unit="particles/s"
                    color="#38bdf8" // sky-400
                    onChange={(emissionRate) => setParams((p) => ({ ...p, emissionRate }))}
                  />
                </div>

                <div className="mt-6 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm text-sky-200">
                  <div className="font-bold text-sky-400 mb-2">Note</div>
                  <p className="text-xs text-sky-100/80 leading-relaxed">
                    Larger lambda or L, or smaller d, gives wider fringe spacing.
                    Green bars show observed counts, and the yellow curve shows theory.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Bottom Row: Info Panel */}
        <div className="mt-6 rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

              <div className="col-span-1 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                <h4 className="mb-3 text-sm font-bold text-cyan-400">The Concept</h4>
                <p className="text-sm mb-3">
                  Light or matter passing through two narrow slits produces a pattern of bright and dark fringes
                  on a screen. The intensity follows a cos^2 dependence from the path difference.
                </p>
                <p className="text-sm">
                  Even when particles are sent one at a time, the same pattern builds up - each particle is described
                  by a wave function that interferes with itself. This demonstrates wave-particle duality.
                </p>
              </div>

              <div className="col-span-1 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                <h4 className="mb-3 text-sm font-bold text-cyan-400">Key Formula</h4>
                <div className="space-y-4">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                    <div className="mb-1 text-xs font-bold text-yellow-400">Intensity Distribution</div>
                    <div className="text-sm font-mono text-neutral-200">I(y) = cos^2(pi d y / (lambda L))</div>
                    <div className="mt-2 text-xs text-neutral-400">Where y is the vertical position on screen.</div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                    <div className="mb-1 text-xs font-bold text-yellow-400">Fringe Spacing</div>
                    <div className="text-sm font-mono text-neutral-200">delta y = lambda L / d</div>
                  </div>
                </div>
              </div>

              <div className="col-span-1 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                <h4 className="mb-3 text-sm font-bold text-cyan-400">Variables</h4>
                <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm">
                  <div className="flex items-end justify-between border-b border-neutral-800 pb-2">
                    <span className="font-bold text-yellow-400">lambda</span>
                    <span className="text-xs text-neutral-400">wavelength (nm)</span>
                  </div>
                  <div className="flex items-end justify-between border-b border-neutral-800 pb-2">
                    <span className="font-bold text-yellow-400">d</span>
                    <span className="text-xs text-neutral-400">slit separation (um)</span>
                  </div>
                  <div className="flex items-end justify-between border-b border-neutral-800 pb-2">
                    <span className="font-bold text-yellow-400">L</span>
                    <span className="text-xs text-neutral-400">screen distance (m)</span>
                  </div>
                  <div className="flex items-end justify-between pb-1">
                    <span className="font-bold text-yellow-400">y</span>
                    <span className="text-xs text-neutral-400">position on screen (m)</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
      </section>
    </main>
  );
}

