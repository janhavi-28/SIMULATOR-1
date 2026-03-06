"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowPathIcon, PauseIcon, PlayIcon } from "@heroicons/react/24/solid";

interface QuantumEntanglementParams {
  separation: number;
  correlationStrength: number;
  measurementAngleA: number;
  measurementAngleB: number;
}

interface MeasurementResult {
  a: 1 | -1;
  b: 1 | -1;
  correlation: number;
  sameProbability: number;
  angleDeltaDeg: number;
}

const DEFAULT_PARAMS: QuantumEntanglementParams = {
  separation: 0.6,
  correlationStrength: 1,
  measurementAngleA: 0,
  measurementAngleB: 180,
};

function formatNumber(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "-";
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
        <div className="text-right text-xs text-neutral-400">
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
    </div>
  );
}

function measureA(): 1 | -1 {
  return Math.random() < 0.5 ? 1 : -1;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function wrapDeg(a: number): number {
  return ((a % 360) + 360) % 360;
}

function shortestDeltaDeg(a: number, b: number): number {
  const d = Math.abs(wrapDeg(a) - wrapDeg(b));
  return d > 180 ? 360 - d : d;
}

function computeCorrelation(params: QuantumEntanglementParams): { e: number; angleDeltaDeg: number } {
  const angleDeltaDeg = shortestDeltaDeg(params.measurementAngleA, params.measurementAngleB);
  const deltaRad = (angleDeltaDeg * Math.PI) / 180;
  const ideal = -Math.cos(deltaRad);
  const e = clamp01(params.correlationStrength) * ideal;
  return { e, angleDeltaDeg };
}

function sampleMeasurement(params: QuantumEntanglementParams): MeasurementResult {
  const a = measureA();
  const { e, angleDeltaDeg } = computeCorrelation(params);
  const sameProbability = clamp01((1 + e) / 2);
  const b = Math.random() < sameProbability ? a : (a === 1 ? -1 : 1);
  return { a, b, correlation: e, sameProbability, angleDeltaDeg };
}

interface CanvasSimulatorProps {
  params: QuantumEntanglementParams;
  lastMeasurement: MeasurementResult | null;
  measureTrigger: number;
  onMeasured: (result: MeasurementResult) => void;
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
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

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
    if (measureTrigger <= 0) return;
    const result = sampleMeasurement(paramsRef.current);
    onMeasured(result);
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
    const detectorAColor = "rgba(251,191,36,0.9)";
    const detectorBColor = "rgba(52,211,153,0.9)";

    const pad = 24 * dpr;
    const plotX0 = pad;
    const plotX1 = w - pad;
    const plotY0 = pad;
    const plotY1 = h - pad;
    const plotW = plotX1 - plotX0;
    const plotH = plotY1 - plotY0;
    const centerX = (plotX0 + plotX1) / 2;
    const centerY = (plotY0 + plotY1) / 2;

    const halfGap = params.separation * Math.min(plotW, plotH) * 0.4;
    const ax = centerX - halfGap;
    const bx = centerX + halfGap;
    const py = centerY;
    const thetaA = (params.measurementAngleA * Math.PI) / 180;
    const thetaB = (params.measurementAngleB * Math.PI) / 180;
    const { e } = computeCorrelation(params);

    const draw = () => {
      const flash = flashRef.current;
      ctx.clearRect(0, 0, w, h);

      const gradBg = ctx.createLinearGradient(0, 0, w, h);
      gradBg.addColorStop(0, bg);
      gradBg.addColorStop(1, "#0a0a14");
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

      ctx.setLineDash([8 * dpr, 8 * dpr]);
      ctx.strokeStyle = linkColor;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(ax, py);
      ctx.lineTo(bx, py);
      ctx.stroke();
      ctx.setLineDash([]);

      const radius = 28 * dpr;
      const axisLen = radius * 0.9;

      ctx.strokeStyle = detectorAColor;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(ax - Math.cos(thetaA) * axisLen, py - Math.sin(thetaA) * axisLen);
      ctx.lineTo(ax + Math.cos(thetaA) * axisLen, py + Math.sin(thetaA) * axisLen);
      ctx.stroke();

      ctx.strokeStyle = detectorBColor;
      ctx.beginPath();
      ctx.moveTo(bx - Math.cos(thetaB) * axisLen, py - Math.sin(thetaB) * axisLen);
      ctx.lineTo(bx + Math.cos(thetaB) * axisLen, py + Math.sin(thetaB) * axisLen);
      ctx.stroke();

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
        ctx.fillText(lastMeasurement.a === 1 ? "+" : "-", ax, py);
      } else {
        ctx.fillStyle = "rgba(148,163,184,0.6)";
        ctx.fillText("?", ax, py);
      }

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
        ctx.fillText(lastMeasurement.b === 1 ? "+" : "-", bx, py);
      } else {
        ctx.fillStyle = "rgba(148,163,184,0.6)";
        ctx.fillText("?", bx, py);
      }

      ctx.fillStyle = axis;
      ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillText("Particle A", ax, py + radius + 18 * dpr);
      ctx.fillText("Particle B", bx, py + radius + 18 * dpr);

      ctx.fillStyle = text;
      ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Entangled pair: measure one -> the other correlates instantly", centerX, plotY0 - 4 * dpr);
      ctx.fillStyle = "rgba(226,232,240,0.8)";
      ctx.fillText(`E = ${formatNumber(e, 2)} (from strength and angle difference)`, centerX, plotY1 + 16 * dpr);
    };

    draw();

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

export default function QuantumEntanglementSimulation() {
  const [params, setParams] = useState<QuantumEntanglementParams>(DEFAULT_PARAMS);
  const [lastMeasurement, setLastMeasurement] = useState<MeasurementResult | null>(null);
  const [measureTrigger, setMeasureTrigger] = useState(0);
  const [playing, setPlaying] = useState(false);

  const resetDefaults = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setLastMeasurement(null);
  }, []);

  const onMeasured = useCallback((result: MeasurementResult) => {
    setLastMeasurement(result);
  }, []);

  const correlationPreview = computeCorrelation(params);
  const sameProbabilityPreview = clamp01((1 + correlationPreview.e) / 2);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setMeasureTrigger((t) => t + 1);
    }, 900);
    return () => window.clearInterval(id);
  }, [playing]);

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a]" />

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-10">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/50 px-4 py-3">
              <div className="text-sm font-semibold text-white">Quantum Entanglement - Instant correlation</div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className={`min-w-[110px] rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors flex gap-2 items-center justify-center ${playing ? "bg-green-700 hover:bg-green-800" : "bg-green-600 hover:bg-green-700"}`}
                >
                  {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    resetDefaults();
                  }}
                  className="min-w-[110px] rounded-xl border border-neutral-600 bg-neutral-800 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700 flex gap-2 items-center justify-center"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
            <CanvasSimulator
              params={params}
              lastMeasurement={lastMeasurement}
              measureTrigger={measureTrigger}
              onMeasured={onMeasured}
            />
            </div>

            <aside className="col-span-1 h-auto space-y-6">
              <div className="rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Parameters</h3>
                    <div className="text-xs text-neutral-400">Run or pause measurements and tune the entangled pair.</div>
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

                <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-300">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-neutral-400">Angle difference</div>
                    <div className="text-right tabular-nums">{formatNumber(correlationPreview.angleDeltaDeg, 0)} deg</div>
                    <div className="text-neutral-400">Predicted E</div>
                    <div className="text-right tabular-nums">{formatNumber(correlationPreview.e, 2)}</div>
                    <div className="text-neutral-400">P(same)</div>
                    <div className="text-right tabular-nums">{formatNumber(sameProbabilityPreview, 2)}</div>
                    <div className="text-neutral-400">P(opposite)</div>
                    <div className="text-right tabular-nums">{formatNumber(1 - sameProbabilityPreview, 2)}</div>
                  </div>
                  <div className="mt-3 border-t border-neutral-800 pt-3">
                    {lastMeasurement ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-neutral-400">Last outcome A</div>
                        <div className="text-right">{lastMeasurement.a === 1 ? "+" : "-"}</div>
                        <div className="text-neutral-400">Last outcome B</div>
                        <div className="text-right">{lastMeasurement.b === 1 ? "+" : "-"}</div>
                      </div>
                    ) : (
                      <div className="text-neutral-500">No measurements yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
            <div className="text-sm font-semibold text-white">Instant correlation over distance</div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-300">
              Entangled particles share a joint state. For the singlet, measuring spin of A is random, and B&apos;s outcome is always opposite, regardless of distance.
            </p>

            <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">Key formula</div>
              <div className="mt-3 space-y-2 text-sm text-neutral-200">
                <div className="font-mono">
                  |psi&gt; = (|up,down&gt; - |down,up&gt;) / sqrt(2)
                  <span className="ml-2 text-neutral-400">(Bell singlet)</span>
                </div>
                <div className="text-neutral-400 text-xs mt-2">
                  Measure A gives up or down with probability 1/2 each; B is always opposite. Correlation E(thetaA, thetaB) = -cos(thetaA - thetaB).
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">Variables</div>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-neutral-200">|up&gt;, |down&gt;</dt>
                <dd className="text-neutral-400">spin up / down</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-neutral-200">theta_A, theta_B</dt>
                <dd className="text-neutral-400">measurement angles (degrees)</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-neutral-200">E</dt>
                <dd className="text-neutral-400">correlation (from -1 to 1)</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-400">
              Einstein called it "spooky action at a distance." Experiments confirm the quantum prediction while preserving no-faster-than-light signaling.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

