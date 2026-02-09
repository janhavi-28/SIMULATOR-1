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
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 shadow-sm">
      <div className="min-w-[160px]">
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
        disabled={false}
        className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 outline-none disabled:opacity-50 ${accentClassName}`}
      />
      <div className="min-w-[80px] text-right text-xs text-neutral-400">
        <span className="tabular-nums text-neutral-200">
          {formatNumber(value, step < 1 ? 2 : 0)}
        </span>{" "}
        {unit}
      </div>
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

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a]" />

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Wave function collapse
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-400">
            In quantum mechanics, before a measurement the system is in a superposition of possibilities (fuzzy probability).
            The act of measurement collapses the wave function to one definite outcome (sharp result). Measurement changes the outcome.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:w-[60%]">
            <CanvasSimulator
              params={params}
              phase={phase}
              collapsedX={collapsedX}
              collapseT={phase === "collapsed" ? 1 : 0}
              onCollapseComplete={onCollapseComplete}
            />

            <div className="mt-6 rounded-3xl border border-neutral-800 bg-neutral-950/40 p-4 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Parameters
                  </div>
                  <div className="text-xs text-neutral-400">
                    Set probabilities and shape; then click Measure to collapse.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={resetDefaults}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
                  >
                    Reset defaults
                  </button>
                  <button
                    type="button"
                    onClick={resetToSuperposition}
                    disabled={!canResetToSuperposition}
                    className="rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Back to superposition
                  </button>
                  <button
                    type="button"
                    onClick={measure}
                    disabled={!canMeasure}
                    className="rounded-xl border border-amber-500/50 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Measure
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                <SliderRow
                  label="P(A) — prob. outcome A"
                  value={params.probA}
                  min={0}
                  max={1}
                  step={0.05}
                  unit=""
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(probA) => {
                    setParams((p) => ({ ...p, probA }));
                    if (phase === "superposition") setCollapsedX(null);
                  }}
                />
                <SliderRow
                  label="Spread σ (fuzziness)"
                  value={params.spreadSigma}
                  min={0.2}
                  max={1.2}
                  step={0.05}
                  unit=""
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(spreadSigma) => setParams((p) => ({ ...p, spreadSigma }))}
                />
                <SliderRow
                  label="Peak separation d"
                  value={params.peakSeparation}
                  min={1}
                  max={3.5}
                  step={0.1}
                  unit=""
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(peakSeparation) => setParams((p) => ({ ...p, peakSeparation }))}
                />
                <SliderRow
                  label="Collapse duration"
                  value={params.collapseDuration}
                  min={0.2}
                  max={1}
                  step={0.1}
                  unit="s"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(collapseDuration) => setParams((p) => ({ ...p, collapseDuration }))}
                />
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[40%]">
            <div className="sticky top-6 h-full rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">
                Measurement changes outcome
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                Before measurement the system is in a superposition: a probability distribution over possible outcomes.
                Observation collapses the wave function to one outcome with probability P(i) = |⟨ψ|i⟩|². The plot shows
                fuzzy probability → sharp result on observation.
              </p>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Key formulas
                </div>
                <div className="mt-3 space-y-2 text-sm text-neutral-200">
                  <div className="font-mono">
                    |ψ⟩ = α|A⟩ + β|B⟩
                    <span className="ml-2 text-neutral-400">(superposition)</span>
                  </div>
                  <div className="font-mono">
                    P(A) = |α|², P(B) = |β|²
                    <span className="ml-2 text-neutral-400">(Born rule)</span>
                  </div>
                  <div className="font-mono">
                    |α|² + |β|² = 1
                    <span className="ml-2 text-neutral-400">(normalization)</span>
                  </div>
                  <div className="font-mono text-neutral-300">
                    Measurement: |ψ⟩ → |i⟩ with prob. |⟨ψ|i⟩|²
                    <span className="ml-2 text-neutral-400">(collapse postulate)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Variables (with units)
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">α, β</dt>
                    <dd className="text-neutral-400">amplitudes (dimensionless)</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">σ</dt>
                    <dd className="text-neutral-400">spread of superposition (arb.)</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">|ψ(x)|²</dt>
                    <dd className="text-neutral-400">probability density (1/length)</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">P(A), P(B)</dt>
                    <dd className="text-neutral-400">probabilities of outcomes (0–1)</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-xs text-neutral-300">
                Simulation: adjust P(A) and the shape (σ, d), then click Measure. The wave function collapses to outcome A or B at random with the chosen probabilities—illustrating that measurement changes the state from fuzzy to sharp.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
