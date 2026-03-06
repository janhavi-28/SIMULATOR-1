"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface QuantumSuperpositionParams {
  probA: number;
  phaseDeg: number;
  spreadSigma: number;
  separation: number;
}

const DEFAULT_PARAMS: QuantumSuperpositionParams = {
  probA: 0.5,
  phaseDeg: 0,
  spreadSigma: 0.6,
  separation: 2,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function formatNumber(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "--";
  return n.toFixed(digits);
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
  const { label, value, min, max, step, unit, accentClassName, onChange } = props;
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-neutral-400">
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
        className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 outline-none ${accentClassName}`}
      />
    </div>
  );
}

function gaussian(x: number, center: number, sigma: number): number {
  const z = (x - center) / sigma;
  return Math.exp(-0.5 * z * z);
}

function getProbabilityDensity(
  x: number,
  probA: number,
  phaseDeg: number,
  spreadSigma: number,
  separation: number
): number {
  const alpha = Math.sqrt(probA);
  const beta = Math.sqrt(1 - probA);
  const phi = (phaseDeg * Math.PI) / 180;
  const xA = -separation / 2;
  const xB = separation / 2;
  const psiA = gaussian(x, xA, spreadSigma);
  const psiB = gaussian(x, xB, spreadSigma);
  const term1 = alpha * alpha * psiA * psiA;
  const term2 = beta * beta * psiB * psiB;
  const interference = 2 * alpha * beta * psiA * psiB * Math.cos(phi);
  return term1 + term2 + interference;
}

const X_MIN = -4;
const X_MAX = 4;
const N_SAMPLES = 256;

function getDensityCurve(params: QuantumSuperpositionParams): { x: number; density: number }[] {
  const { probA, phaseDeg, spreadSigma, separation } = params;
  const out: { x: number; density: number }[] = [];
  let maxDensity = 0;
  for (let i = 0; i <= N_SAMPLES; i++) {
    const x = X_MIN + (i / N_SAMPLES) * (X_MAX - X_MIN);
    const density = getProbabilityDensity(x, probA, phaseDeg, spreadSigma, separation);
    out.push({ x, density });
    if (density > maxDensity) maxDensity = density;
  }
  const norm = maxDensity > 0 ? maxDensity : 1;
  return out.map(({ x, density }) => ({ x, density: density / norm }));
}

function CanvasSimulator({ params }: { params: QuantumSuperpositionParams }) {
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

    const bg = "#0a0a12";
    const grid = "rgba(148,163,184,0.15)";
    const axis = "#94a3b8";
    const text = "#e2e8f0";
    const cloudGradientStart = "rgba(99,102,241,0.85)";
    const cloudGradientEnd = "rgba(139,92,246,0.4)";
    const cloudStroke = "rgba(129,140,248,0.9)";
    const stateAColor = "rgba(34,211,238,0.35)";
    const stateBColor = "rgba(251,146,60,0.35)";

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

    const curve = getDensityCurve(params);
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

    ctx.beginPath();
    ctx.moveTo(toScreenX(curve[0].x), plotY1);
    for (let i = 0; i < curve.length; i++) {
      ctx.lineTo(toScreenX(curve[i].x), toScreenY(curve[i].density));
    }
    ctx.lineTo(toScreenX(curve[curve.length - 1].x), plotY1);
    ctx.closePath();

    const cloudGrad = ctx.createLinearGradient(plotX0, plotY1, plotX1, plotY0);
    cloudGrad.addColorStop(0, cloudGradientEnd);
    cloudGrad.addColorStop(0.5, cloudGradientStart);
    cloudGrad.addColorStop(1, cloudGradientEnd);
    ctx.fillStyle = cloudGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(toScreenX(curve[0].x), toScreenY(curve[0].density));
    for (let i = 1; i < curve.length; i++) {
      ctx.lineTo(toScreenX(curve[i].x), toScreenY(curve[i].density));
    }
    ctx.strokeStyle = cloudStroke;
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    const xA = -params.separation / 2;
    const xB = params.separation / 2;
    const alpha = Math.sqrt(params.probA);
    const beta = Math.sqrt(1 - params.probA);
    for (const [center, color, amp] of [
      [xA, stateAColor, alpha] as const,
      [xB, stateBColor, beta] as const,
    ]) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(X_MIN), plotY1);
      for (let i = 0; i <= N_SAMPLES; i++) {
        const x = X_MIN + (i / N_SAMPLES) * (X_MAX - X_MIN);
        const g = amp * amp * gaussian(x, center, params.spreadSigma) * gaussian(x, center, params.spreadSigma);
        const density = g * 0.6;
        ctx.lineTo(toScreenX(x), toScreenY(density));
      }
      ctx.lineTo(toScreenX(X_MAX), plotY1);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
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
    ctx.fillText("|psi|^2 (probability density)", 0, 0);
    ctx.restore();

    ctx.fillStyle = text;
    ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Superposition: two states overlapping", plotX0, plotY0 - 2 * dpr);
  }, [params]);

  return (
    <div className="rounded-3xl border border-violet-500/40 bg-neutral-950/60 p-4 shadow-[0_0_40px_rgba(139,92,246,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Quantum Superposition - Probability cloud</div>
          <div className="text-xs text-neutral-400">|psi&gt; = alpha|A&gt; + beta e^(i*phi)|B&gt;. Before measurement, the system is in both states at once.</div>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border border-violet-500/30 bg-[#050510]"
        style={{ aspectRatio: "16/9" }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}

export default function QuantumSuperpositionSimulation() {
  const [params, setParams] = useState<QuantumSuperpositionParams>(DEFAULT_PARAMS);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setParams((p) => ({ ...p, phaseDeg: (p.phaseDeg + dt * 40) % 360 }));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing]);

  const resetDefaults = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setPlaying(true);
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a]" />

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-10">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="col-span-1 flex flex-col gap-4 lg:col-span-2">
                <div className="mb-1 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    className="rounded-xl border border-emerald-500/70 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(16,185,129,0.15)] hover:bg-emerald-500"
                  >
                    {playing ? "⏸ Pause" : "▶ Play"}
                  </button>
                  <button
                    type="button"
                    onClick={resetDefaults}
                    className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-700"
                  >
                    {"\u21BA Reset"}
                  </button>
                </div>
                <CanvasSimulator params={params} />
              </div>

              <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700">
                <div className="rounded-3xl border border-neutral-800 bg-neutral-950/40 p-4 shadow-xl">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-white">Parameters</h3>
                    <div className="text-xs text-neutral-400">Change state probability, phase, spread, or separation to see how the probability cloud changes.</div>
                  </div>

                  <div className="grid gap-3">
                    <SliderRow
                      label="State A probability (|alpha|^2)"
                      value={params.probA}
                      min={0}
                      max={1}
                      step={0.05}
                      unit=""
                      accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:shadow"
                      onChange={(probA) => setParams((p) => ({ ...p, probA }))}
                    />
                    <SliderRow
                      label="Phase phi"
                      value={params.phaseDeg}
                      min={0}
                      max={360}
                      step={5}
                      unit="°"
                      accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow"
                      onChange={(phaseDeg) => setParams((p) => ({ ...p, phaseDeg }))}
                    />
                    <SliderRow
                      label="Spread sigma"
                      value={params.spreadSigma}
                      min={0.2}
                      max={1.5}
                      step={0.05}
                      unit=""
                      accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow"
                      onChange={(spreadSigma) => setParams((p) => ({ ...p, spreadSigma }))}
                    />
                    <SliderRow
                      label="Separation d"
                      value={params.separation}
                      min={0.5}
                      max={4}
                      step={0.1}
                      unit=""
                      accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow"
                      onChange={(separation) => setParams((p) => ({ ...p, separation }))}
                    />
                  </div>
                </div>
              </aside>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">Superposition and probability clouds</div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                Before measurement, a quantum system is in a linear combination of states. The plot shows |psi(x)|^2, the
                probability density, as a cloud. Two peaks correspond to two possible outcomes; the phase between them
                creates constructive or destructive interference.
              </p>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">Key formulas</div>
                <div className="mt-3 space-y-2 text-sm text-neutral-200">
                  <div className="font-mono">|psi&gt; = alpha|A&gt; + beta e^(i*phi)|B&gt; <span className="ml-2 text-neutral-400">(superposition)</span></div>
                  <div className="font-mono">|alpha|^2 + |beta|^2 = 1 <span className="ml-2 text-neutral-400">(normalization)</span></div>
                  <div className="font-mono">|psi(x)|^2 = alpha^2 psi_A^2 + beta^2 psi_B^2 + 2 alpha beta psi_A psi_B cos(phi)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
