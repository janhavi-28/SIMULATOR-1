"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface WaveFunctionCollapseParams {
  /** Probability of outcome A (position left). 0–1; P(B) = 1 − P(A). */
  probA: number;
  /** Spread (uncertainty) of superposition σ before collapse (arb. units). */
  spreadSigma: number;
  /** Separation between the two possible outcome peaks (arb. units). */
  peakSeparation: number;
  /** Collapse animation duration in seconds. */
  collapseDuration: number;
}

const DEFAULT_PARAMS: WaveFunctionCollapseParams = {
  probA: 0.5,
  spreadSigma: 0.5,
  peakSeparation: 2,
  collapseDuration: 0.4,
};

type SimPhase = "superposition" | "collapsing" | "collapsed";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function formatNumber(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
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
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 shadow-sm">
      <div className="mb-2">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-0.5 text-xs text-neutral-400">
          <span className="tabular-nums text-neutral-200">{formatNumber(value, step < 1 ? 2 : 0)}</span> {unit}
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
        disabled={false}
        className={`physics-range h-3 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 outline-none disabled:opacity-50 ${accentClassName}`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Probability density: |ψ(x)|² before collapse (two-peak superposition)
// After collapse: narrow spike at measured position.
// ---------------------------------------------------------------------------

function gaussian(x: number, center: number, sigma: number): number {
  if (sigma <= 0) return x === center ? 1 : 0;
  const z = (x - center) / sigma;
  return Math.exp(-0.5 * z * z);
}

function getSuperpositionDensity(
  x: number,
  probA: number,
  spreadSigma: number,
  peakSeparation: number
): number {
  const alpha = Math.sqrt(probA);
  const beta = Math.sqrt(1 - probA);
  const xA = -peakSeparation / 2;
  const xB = peakSeparation / 2;
  const psiA = gaussian(x, xA, spreadSigma);
  const psiB = gaussian(x, xB, spreadSigma);
  const psi = alpha * psiA + beta * psiB;
  return psi * psi;
}

const X_MIN = -4;
const X_MAX = 4;
const N_SAMPLES = 256;

function getDensityCurve(
  params: WaveFunctionCollapseParams,
  phase: SimPhase,
  collapsedX: number | null,
  collapseT: number
): { x: number; density: number }[] {
  const { probA, spreadSigma, peakSeparation, collapseDuration } = params;
  const out: { x: number; density: number }[] = [];
  let maxDensity = 0;

  for (let i = 0; i <= N_SAMPLES; i++) {
    const x = X_MIN + (i / N_SAMPLES) * (X_MAX - X_MIN);
    let density: number;

    if (phase === "superposition" || (phase === "collapsing" && collapseT <= 0)) {
      density = getSuperpositionDensity(x, probA, spreadSigma, peakSeparation);
    } else if (phase === "collapsed" || (phase === "collapsing" && collapseT >= 1)) {
      const spikeSigma = 0.12;
      density = collapsedX !== null ? gaussian(x, collapsedX, spikeSigma) ** 2 : 0;
    } else {
      const t = clamp(collapseT, 0, 1);
      const superD = getSuperpositionDensity(x, probA, spreadSigma, peakSeparation);
      const spikeSigma = 0.12;
      const collapsedD =
        collapsedX !== null ? gaussian(x, collapsedX, spikeSigma) ** 2 : 0;
      density = (1 - t) * superD + t * collapsedD;
    }

    out.push({ x, density });
    if (density > maxDensity) maxDensity = density;
  }

  const norm = maxDensity > 0 ? maxDensity : 1;
  return out.map(({ x, density }) => ({ x, density: density / norm }));
}

// ---------------------------------------------------------------------------
// Canvas: fuzzy probability → sharp result on observation
// ---------------------------------------------------------------------------

interface CanvasSimulatorProps {
  params: WaveFunctionCollapseParams;
  phase: SimPhase;
  collapsedX: number | null;
  collapseT: number;
  onCollapseComplete: () => void;
}

const CanvasSimulator: React.FC<CanvasSimulatorProps> = ({
  params,
  phase,
  collapsedX,
  collapseT,
  onCollapseComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<number>(0);
  const collapseStartRef = useRef<number>(0);

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

  // Set collapse start time only when entering "collapsing" (so animation isn't reset on param change)
  useEffect(() => {
    if (phase === "collapsing") collapseStartRef.current = performance.now();
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = canvas.width / Math.max(1, el.getBoundingClientRect().width);
    const w = canvas.width;
    const h = canvas.height;

    const bg = "#0a0a12";
    const grid = "rgba(148,163,184,0.15)";
    const axis = "#94a3b8";
    const text = "#e2e8f0";
    const fuzzyGradientStart = "rgba(99,102,241,0.85)";
    const fuzzyGradientEnd = "rgba(139,92,246,0.4)";
    const fuzzyStroke = "rgba(129,140,248,0.9)";
    const sharpColor = "rgba(34,211,238,0.95)";
    const sharpStroke = "rgba(56,189,248,1)";

    const pad = 20 * dpr;
    const leftPad = 52 * dpr;
    const rightPad = 24 * dpr;
    const bottomPad = 44 * dpr;
    const topPad = 28 * dpr;

    const plotX0 = leftPad;
    const plotX1 = w - rightPad;
    const plotY0 = topPad;
    const plotY1 = h - bottomPad;
    const plotW = plotX1 - plotX0;
    const plotH = plotY1 - plotY0;

    const toScreenX = (x: number) => {
      const t = (x - X_MIN) / (X_MAX - X_MIN);
      return plotX0 + clamp(t, 0, 1) * plotW;
    };
    const toScreenY = (density: number) => {
      const margin = 0.1;
      const scale = 1 - margin;
      const yNorm = margin + density * scale;
      return plotY1 - yNorm * plotH;
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      const gradBg = ctx.createLinearGradient(0, 0, w, h);
      gradBg.addColorStop(0, bg);
      gradBg.addColorStop(1, "#0f0f1a");
      ctx.fillStyle = gradBg;
      ctx.fillRect(0, 0, w, h);

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

      const durationSec = params.collapseDuration;
      const elapsed = (t - collapseStartRef.current) / 1000;
      const collapseProgress =
        phase === "collapsing"
          ? clamp(elapsed / durationSec, 0, 1)
          : phase === "collapsed"
            ? 1
            : 0;

      const curve = getDensityCurve(
        params,
        phase,
        collapsedX,
        collapseProgress
      );

      const isSharp = phase === "collapsed" || (phase === "collapsing" && collapseProgress >= 1);

      ctx.beginPath();
      ctx.moveTo(toScreenX(curve[0].x), plotY1);
      for (let i = 0; i < curve.length; i++) {
        ctx.lineTo(toScreenX(curve[i].x), toScreenY(curve[i].density));
      }
      ctx.lineTo(toScreenX(curve[curve.length - 1].x), plotY1);
      ctx.closePath();

      if (isSharp) {
        const sharpGrad = ctx.createLinearGradient(plotX0, plotY1, plotX1, plotY0);
        sharpGrad.addColorStop(0, "rgba(34,211,238,0.2)");
        sharpGrad.addColorStop(0.5, sharpColor);
        sharpGrad.addColorStop(1, "rgba(34,211,238,0.2)");
        ctx.fillStyle = sharpGrad;
        ctx.fill();
        ctx.strokeStyle = sharpStroke;
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(toScreenX(curve[0].x), toScreenY(curve[0].density));
        for (let i = 1; i < curve.length; i++) {
          ctx.lineTo(toScreenX(curve[i].x), toScreenY(curve[i].density));
        }
        ctx.stroke();
      } else {
        const cloudGrad = ctx.createLinearGradient(plotX0, plotY1, plotX1, plotY0);
        cloudGrad.addColorStop(0, fuzzyGradientEnd);
        cloudGrad.addColorStop(0.5, fuzzyGradientStart);
        cloudGrad.addColorStop(1, fuzzyGradientEnd);
        ctx.fillStyle = cloudGrad;
        ctx.fill();
        ctx.strokeStyle = fuzzyStroke;
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(toScreenX(curve[0].x), toScreenY(curve[0].density));
        for (let i = 1; i < curve.length; i++) {
          ctx.lineTo(toScreenX(curve[i].x), toScreenY(curve[i].density));
        }
        ctx.stroke();
      }

      ctx.fillStyle = axis;
      ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("x (position)", (plotX0 + plotX1) / 2, plotY1 + 12 * dpr);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.save();
      ctx.translate(plotX0 - 8 * dpr, (plotY0 + plotY1) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("|ψ|² (probability density)", 0, 0);
      ctx.restore();

      ctx.fillStyle = text;
      ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const phaseLabel =
        phase === "superposition"
          ? "Superposition — before measurement (fuzzy)"
          : phase === "collapsing"
            ? "Collapsing…"
            : "Collapsed — after measurement (sharp)";
      ctx.fillText(phaseLabel, plotX0, plotY0 - 2 * dpr);
    };

    const tick = (t: number) => {
      draw(t);
      if (phase === "collapsing") {
        const elapsed = (t - collapseStartRef.current) / 1000;
        if (elapsed >= params.collapseDuration) {
          onCollapseComplete();
          animRef.current = 0;
          return;
        }
        animRef.current = requestAnimationFrame(tick);
      }
    };

    if (phase === "collapsing") {
      animRef.current = requestAnimationFrame(tick);
    } else {
      draw(performance.now());
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [params, phase, collapsedX, onCollapseComplete]);

  return (
    <div className="rounded-3xl border border-cyan-500/40 bg-neutral-950/60 p-4 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">
            Wave function collapse — fuzzy → sharp
          </div>
          <div className="text-xs text-neutral-400">
            Before measurement: probability spread. After measurement: one definite outcome.
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#050510]"
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

export default function WaveFunctionCollapseSimulation() {
  const [params, setParams] = useState<WaveFunctionCollapseParams>(DEFAULT_PARAMS);
  const [phase, setPhase] = useState<SimPhase>("superposition");
  const [collapsedX, setCollapsedX] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);

  const resetDefaults = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setPhase("superposition");
    setCollapsedX(null);
  }, []);

  const measure = useCallback(() => {
    if (phase === "collapsing") return;
    const outcome = Math.random() < params.probA ? "A" : "B";
    const xA = -params.peakSeparation / 2;
    const xB = params.peakSeparation / 2;
    setCollapsedX(outcome === "A" ? xA : xB);
    setPhase("collapsing");
  }, [params.probA, params.peakSeparation, phase]);

  const resetToSuperposition = useCallback(() => {
    setPhase("superposition");
    setCollapsedX(null);
  }, []);

  const onCollapseComplete = useCallback(() => {
    setPhase("collapsed");
  }, []);

  const canMeasure = phase === "superposition";
  const canResetToSuperposition = phase === "collapsed" || phase === "superposition";

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      if (phase === "superposition") {
        measure();
      } else if (phase === "collapsed") {
        resetToSuperposition();
      }
    }, 1400);
    return () => window.clearInterval(id);
  }, [playing, phase, measure, resetToSuperposition]);

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a]" />

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-10">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
            <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
              <div className="mb-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/50 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-white">Wave function collapse</div>
                  <div className="text-xs text-neutral-400">Before measurement: spread probability. After measurement: one definite outcome.</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={resetDefaults} className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800">{"\u21BA Reset"}</button>
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    className="rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
                  >
                    {playing ? "\u23F8 Pause" : "\u25B6 Play"}
                  </button>
                  <button type="button" onClick={resetToSuperposition} disabled={!canResetToSuperposition} className="rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:pointer-events-none disabled:opacity-50">Back to superposition</button>
                  <button type="button" onClick={measure} disabled={!canMeasure} className="rounded-xl border border-amber-500/50 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 disabled:pointer-events-none disabled:opacity-50">Measure</button>
                </div>
              </div>

              <CanvasSimulator params={params} phase={phase} collapsedX={collapsedX} collapseT={phase === "collapsed" ? 1 : 0} onCollapseComplete={onCollapseComplete} />
            </div>

            <aside className="col-span-1 h-[580px] overflow-y-auto">
                <div className="h-full rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-white">Parameters</h3>
                    <div className="text-xs text-neutral-400">Set probabilities and shape, then click Measure.</div>
                  </div>
                <div className="grid gap-3">
                  <SliderRow label="P(A) probability" value={params.probA} min={0} max={1} step={0.05} unit="" accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow" onChange={(probA) => { setParams((p) => ({ ...p, probA })); if (phase === "superposition") setCollapsedX(null); }} />
                  <SliderRow label="Spread sigma" value={params.spreadSigma} min={0.2} max={1.2} step={0.05} unit="" accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:shadow" onChange={(spreadSigma) => setParams((p) => ({ ...p, spreadSigma }))} />
                  <SliderRow label="Peak separation d" value={params.peakSeparation} min={1} max={3.5} step={0.1} unit="" accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow" onChange={(peakSeparation) => setParams((p) => ({ ...p, peakSeparation }))} />
                  <SliderRow label="Collapse duration" value={params.collapseDuration} min={0.2} max={1} step={0.1} unit="s" accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow" onChange={(collapseDuration) => setParams((p) => ({ ...p, collapseDuration }))} />
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl text-neutral-300">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Concept</div>
              <p className="mt-3 text-sm">Measurement changes a superposition (fuzzy distribution) into one definite observed state.</p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Key formulas</div>
              <div className="mt-3 space-y-2 text-sm font-mono text-neutral-200">
                <div>|psi&gt; = alpha|A&gt; + beta|B&gt;</div>
                <div>P(A) = |alpha|^2, P(B) = |beta|^2</div>
                <div>|alpha|^2 + |beta|^2 = 1</div>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Variables</div>
              <div className="mt-3 space-y-2 text-sm">
                <div>alpha, beta: amplitudes</div>
                <div>sigma: spread parameter</div>
                <div>|psi(x)|^2: probability density</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
