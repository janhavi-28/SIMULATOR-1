"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface QuantumEntanglementParams {
  /** Visual separation between the two particles (0–1 of canvas width). */
  separation: number;
  /** Correlation strength: 1 = perfect anti-correlation (singlet), 0 = no correlation. */
  correlationStrength: number;
  /** Measurement angle for particle A (degrees). Affects which basis we "measure" in. */
  measurementAngleA: number;
  /** Measurement angle for particle B (degrees). Bell inequality: correlation depends on angle difference. */
  measurementAngleB: number;
}

const DEFAULT_PARAMS: QuantumEntanglementParams = {
  separation: 0.6,
  correlationStrength: 1,
  measurementAngleA: 0,
  measurementAngleB: 180,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function formatNumber(n: number, digits = 1): string {
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
        className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 outline-none ${accentClassName}`}
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
// Entanglement: Bell singlet |ψ⟩ = (|↑↓⟩ − |↓↑⟩)/√2
// When A is measured ↑, B is ↓ and vice versa—instant correlation, any distance.
// Correlation (simplified) ≈ −cos(θ_A − θ_B) for spin-1/2; we use correlationStrength to scale.
// ---------------------------------------------------------------------------

/** Returns +1 (up) or -1 (down) for particle A in singlet: 50/50. */
function measureA(): 1 | -1 {
  return Math.random() < 0.5 ? 1 : -1;
}

/** Given A's outcome, B is perfectly anti-correlated in singlet. */
function outcomeBGivenA(outcomeA: 1 | -1): 1 | -1 {
  return outcomeA === 1 ? -1 : 1;
}

// ---------------------------------------------------------------------------
// Canvas: two particles with instant correlation
// ---------------------------------------------------------------------------

interface CanvasSimulatorProps {
  params: QuantumEntanglementParams;
  /** Latest measurement: [A outcome, B outcome] or null if not yet measured. */
  lastMeasurement: { a: 1 | -1; b: 1 | -1 } | null;
  /** Trigger a new measurement (parent sets this and then clears flash). */
  measureTrigger: number;
  onMeasured: (a: 1 | -1, b: 1 | -1) => void;
}

const CanvasSimulator: React.FC<CanvasSimulatorProps> = ({
  params,
  lastMeasurement,
  measureTrigger,
  onMeasured,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number>(0);
  const flashRef = useRef(0);

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

  // When measureTrigger increments, perform a measurement and notify parent
  useEffect(() => {
    if (measureTrigger <= 0) return;
    const a: 1 | -1 = measureA();
    const b: 1 | -1 = outcomeBGivenA(a);
    onMeasured(a, b);
    flashRef.current = 1;
  }, [measureTrigger, onMeasured]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = canvas.width / Math.max(1, el.getBoundingClientRect().width);
    const w = canvas.width;
    const h = canvas.height;

    const bg = "#050510";
    const grid = "rgba(148,163,184,0.12)";
    const axis = "#94a3b8";
    const text = "#e2e8f0";
    const particleAColor = "#22d3ee";
    const particleBColor = "#a78bfa";
    const linkColor = "rgba(167, 139, 250, 0.35)";
    const flashColor = "rgba(255,255,255,0.7)";

    const pad = 24 * dpr;
    const plotX0 = pad;
    const plotX1 = w - pad;
    const plotY0 = pad;
    const plotY1 = h - pad;
    const plotW = plotX1 - plotX0;
    const plotH = plotY1 - plotY0;
    const centerX = (plotX0 + plotX1) / 2;
    const centerY = (plotY0 + plotY1) / 2;

    // Particle positions: separation in [0,1] maps to distance from center
    const halfGap = (params.separation * Math.min(plotW, plotH) * 0.4);
    const ax = centerX - halfGap;
    const bx = centerX + halfGap;
    const py = centerY;

    const draw = () => {
      const flash = flashRef.current;
      ctx.clearRect(0, 0, w, h);

      const gradBg = ctx.createLinearGradient(0, 0, w, h);
      gradBg.addColorStop(0, bg);
      gradBg.addColorStop(1, "#0a0a14");
      ctx.fillStyle = gradBg;
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

      // Entanglement "link" (dashed line between particles)
      ctx.setLineDash([8 * dpr, 8 * dpr]);
      ctx.strokeStyle = linkColor;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(ax, py);
      ctx.lineTo(bx, py);
      ctx.stroke();
      ctx.setLineDash([]);

      const radius = 28 * dpr;

      // Particle A
      const aFlash = flash > 0 && lastMeasurement ? 0.3 + 0.7 * (1 - flash) : 0.3;
      ctx.beginPath();
      ctx.arc(ax, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(34, 211, 238, ${aFlash})`;
      ctx.fill();
      ctx.strokeStyle = particleAColor;
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();
      ctx.fillStyle = text;
      ctx.font = `bold ${14 * dpr}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (lastMeasurement) {
        ctx.fillText(lastMeasurement.a === 1 ? "↑" : "↓", ax, py);
      } else {
        ctx.fillStyle = "rgba(148,163,184,0.6)";
        ctx.fillText("?", ax, py);
      }

      // Particle B
      const bFlash = flash > 0 && lastMeasurement ? 0.3 + 0.7 * (1 - flash) : 0.3;
      ctx.beginPath();
      ctx.arc(bx, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167, 139, 250, ${bFlash})`;
      ctx.fill();
      ctx.strokeStyle = particleBColor;
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();
      ctx.fillStyle = text;
      if (lastMeasurement) {
        ctx.fillText(lastMeasurement.b === 1 ? "↑" : "↓", bx, py);
      } else {
        ctx.fillStyle = "rgba(148,163,184,0.6)";
        ctx.fillText("?", bx, py);
      }

      // Labels
      ctx.fillStyle = axis;
      ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillText("Particle A", ax, py + radius + 18 * dpr);
      ctx.fillText("Particle B", bx, py + radius + 18 * dpr);

      // Title
      ctx.fillStyle = text;
      ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Entangled pair: measure one → the other correlates instantly", centerX, plotY0 - 4 * dpr);
    };

    draw();

    // Decay flash over ~0.4 s at 60fps
    const tick = () => {
      if (flashRef.current > 0) {
        flashRef.current = Math.max(0, flashRef.current - 0.025);
        draw();
      }
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, [params, lastMeasurement]);

  return (
    <div className="rounded-3xl border border-fuchsia-500/40 bg-neutral-950/60 p-4 shadow-[0_0_40px_rgba(192,132,252,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">
            Quantum Entanglement – Instant correlation
          </div>
          <div className="text-xs text-neutral-400">
            Two particles in a singlet state: measuring one fixes the other&apos;s outcome, no matter how far apart.
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-[#050510]"
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

export default function QuantumEntanglementSimulation() {
  const [params, setParams] = useState<QuantumEntanglementParams>(DEFAULT_PARAMS);
  const [lastMeasurement, setLastMeasurement] = useState<{ a: 1 | -1; b: 1 | -1 } | null>(null);
  const [measureTrigger, setMeasureTrigger] = useState(0);

  const resetDefaults = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setLastMeasurement(null);
  }, []);

  const runMeasurement = useCallback(() => {
    setMeasureTrigger((t) => t + 1);
  }, []);

  const onMeasured = useCallback((a: 1 | -1, b: 1 | -1) => {
    setLastMeasurement({ a, b });
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a]" />

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Quantum Entanglement
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-400">
            Two particles can be correlated so that measuring one instantly determines the other&apos;s outcome—no matter how far apart they are. This simulator shows one pair in a singlet state: measure A (↑ or ↓) and B is always the opposite.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:w-[60%]">
            <CanvasSimulator
              params={params}
              lastMeasurement={lastMeasurement}
              measureTrigger={measureTrigger}
              onMeasured={onMeasured}
            />

            <div className="mt-6 rounded-3xl border border-neutral-800 bg-neutral-950/40 p-4 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Parameters
                  </div>
                  <div className="text-xs text-neutral-400">
                    Change separation and correlation; then click Measure to see instant correlation.
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={runMeasurement}
                    className="rounded-xl border border-fuchsia-500/50 bg-fuchsia-500/20 px-4 py-2 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-500/30"
                  >
                    Measure
                  </button>
                  <button
                    type="button"
                    onClick={resetDefaults}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
                  >
                    Reset defaults
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                <SliderRow
                  label="Separation"
                  value={params.separation}
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  unit=""
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(separation) => setParams((p) => ({ ...p, separation }))}
                />
                <SliderRow
                  label="Correlation strength"
                  value={params.correlationStrength}
                  min={0}
                  max={1}
                  step={0.05}
                  unit=""
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fuchsia-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(correlationStrength) => setParams((p) => ({ ...p, correlationStrength }))}
                />
                <SliderRow
                  label="Measurement angle A"
                  value={params.measurementAngleA}
                  min={0}
                  max={360}
                  step={15}
                  unit="°"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(measurementAngleA) => setParams((p) => ({ ...p, measurementAngleA }))}
                />
                <SliderRow
                  label="Measurement angle B"
                  value={params.measurementAngleB}
                  min={0}
                  max={360}
                  step={15}
                  unit="°"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(measurementAngleB) => setParams((p) => ({ ...p, measurementAngleB }))}
                />
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[40%]">
            <div className="sticky top-6 h-full rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">
                Instant correlation over distance
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                Entangled particles share a joint state. For the singlet, measuring spin of A gives ↑ or ↓ at random;
                B&apos;s outcome is then determined instantly and is always opposite—regardless of how far apart they are. No signal travels between them; the correlation is established when the pair is created.
              </p>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Key formula
                </div>
                <div className="mt-3 space-y-2 text-sm text-neutral-200">
                  <div className="font-mono">
                    |ψ⟩ = (|↑↓⟩ − |↓↑⟩) / √2
                    <span className="ml-2 text-neutral-400">(Bell singlet)</span>
                  </div>
                  <div className="text-neutral-400 text-xs mt-2">
                    Measure A → ↑ or ↓ with probability ½ each; B is always the opposite. Correlation E(θ_A, θ_B) = −cos(θ_A − θ_B) for spin-1/2.
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Variables
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">|↑⟩, |↓⟩</dt>
                    <dd className="text-neutral-400">spin up / down (e.g. along z)</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">θ_A, θ_B</dt>
                    <dd className="text-neutral-400">measurement angles (degrees)</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">E</dt>
                    <dd className="text-neutral-400">correlation (dimensionless, −1 to 1)</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-400">
                Einstein called it &quot;spooky action at a distance.&quot; Quantum mechanics predicts—and experiments confirm—that the correlation is instant. No hidden variable theory matching QM can be local (Bell&apos;s theorem).
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
