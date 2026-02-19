"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// ——— Types ———
interface ParameterRecord {
  timestamp: number;
  value: number;
  calculatedResults: { [key: string]: number };
}

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
  onChange: (v: number) => void;
  dramaticRange?: [number, number];
  icon?: string;
}

// ——— SHM Physics (spring-mass) ———
// x(t) = A cos(ωt + φ), v(t) = -Aω sin(ωt + φ), a(t) = -ω²x
// ω = √(k/m), T = 2π√(m/k), E = (1/2)kA²
function angularFrequency(springK: number, mass: number): number {
  if (mass <= 0) return 0;
  return Math.sqrt(springK / mass);
}

function period(springK: number, mass: number): number {
  const omega = angularFrequency(springK, mass);
  return omega > 0 ? (2 * Math.PI) / omega : 0;
}

function positionAt(t: number, A: number, omega: number, phaseRad: number): number {
  return A * Math.cos(omega * t + phaseRad);
}

function velocityAt(t: number, A: number, omega: number, phaseRad: number): number {
  return -A * omega * Math.sin(omega * t + phaseRad);
}

function totalEnergy(springK: number, A: number): number {
  return 0.5 * springK * A * A;
}

function kineticEnergy(m: number, v: number): number {
  return 0.5 * m * v * v;
}

function potentialEnergy(springK: number, x: number): number {
  return 0.5 * springK * x * x;
}

// Visual radius from mass (∛mass for sphere-like)
function visualRadius(mass: number, baseRadius = 12): number {
  return baseRadius * Math.cbrt(Math.max(0.1, mass));
}

// ——— Defaults ———
const DEFAULT_AMPLITUDE = 1.5;
const DEFAULT_MASS = 1;
const DEFAULT_SPRING_K = 40;
const DEFAULT_PHASE_DEG = 0;

const DEFAULTS = {
  amplitude: DEFAULT_AMPLITUDE,
  mass: DEFAULT_MASS,
  springK: DEFAULT_SPRING_K,
  phaseDeg: DEFAULT_PHASE_DEG,
};

// ——— Slider component (dark theme to match other pages) ———
function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  defaultValue,
  onChange,
  dramaticRange,
  icon,
}: ParameterSliderProps) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
        {icon && <span aria-hidden>{icon}</span>}
        <span>{label}</span>
        <span className="tabular-nums text-sky-400 font-bold">
          {value.toFixed(step < 1 ? 2 : 1)} {unit}
        </span>
      </label>
      <div className="relative h-8 flex items-center">
        {dramaticRange && (
          <div
            className="absolute h-3 rounded-full bg-sky-500/20 pointer-events-none"
            style={{
              left: `${((dramaticRange[0] - min) / (max - min)) * 100}%`,
              width: `${((dramaticRange[1] - dramaticRange[0]) / (max - min)) * 100}%`,
            }}
          />
        )}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-3 rounded-full appearance-none bg-neutral-700 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-sky-400
            [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(56,189,248,0.5)]
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-sky-400
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-[0_0_0_2px_rgba(56,189,248,0.5)]"
          aria-label={`${label}: ${value} ${unit}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`}
        />
      </div>
      <div className="flex justify-between text-xs text-neutral-500">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

// ——— Main simulation component ———
export default function SimpleHarmonicMotionSimulation() {
  const [amplitude, setAmplitude] = useState(DEFAULT_AMPLITUDE);
  const [mass, setMass] = useState(DEFAULT_MASS);
  const [springK, setSpringK] = useState(DEFAULT_SPRING_K);
  const [phaseDeg, setPhaseDeg] = useState(DEFAULT_PHASE_DEG);
  const [simTime, setSimTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [fps, setFps] = useState(60);
  const [historyAmplitude, setHistoryAmplitude] = useState<ParameterRecord[]>([]);
  const [historyMass, setHistoryMass] = useState<ParameterRecord[]>([]);
  const [historySpringK, setHistorySpringK] = useState<ParameterRecord[]>([]);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const lastHistoryTime = useRef(0);
  const lastFrameTime = useRef(0);
  const frameCount = useRef(0);
  const fpsInterval = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animId = useRef<number>(0);

  const phaseRad = (phaseDeg * Math.PI) / 180;
  const omega = angularFrequency(springK, mass);
  const T = period(springK, mass);
  const x = positionAt(simTime, amplitude, omega, phaseRad);
  const v = velocityAt(simTime, amplitude, omega, phaseRad);
  const ETotal = totalEnergy(springK, amplitude);
  const KE = kineticEnergy(mass, v);
  const PE = potentialEnergy(springK, x);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Parameter history (throttled ~100ms)
  const recordHistory = useCallback(() => {
    const now = Date.now();
    if (now - lastHistoryTime.current < 100) return;
    lastHistoryTime.current = now;
    const calc = {
      omega,
      period: T,
      position: x,
      velocity: v,
      totalEnergy: ETotal,
      kineticEnergy: KE,
      potentialEnergy: PE,
    };
    setHistoryAmplitude((prev) =>
      prev.length >= 50 ? [...prev.slice(1), { timestamp: now, value: amplitude, calculatedResults: calc }] : [...prev, { timestamp: now, value: amplitude, calculatedResults: calc }]
    );
    setHistoryMass((prev) =>
      prev.length >= 50 ? [...prev.slice(1), { timestamp: now, value: mass, calculatedResults: calc }] : [...prev, { timestamp: now, value: mass, calculatedResults: calc }]
    );
    setHistorySpringK((prev) =>
      prev.length >= 50 ? [...prev.slice(1), { timestamp: now, value: springK, calculatedResults: calc }] : [...prev, { timestamp: now, value: springK, calculatedResults: calc }]
    );
  }, [amplitude, mass, springK, omega, T, x, v, ETotal, KE, PE]);

  useEffect(() => {
    recordHistory();
  }, [amplitude, mass, springK, recordHistory]);

  const resetToDefault = useCallback(() => {
    setAmplitude(DEFAULTS.amplitude);
    setMass(DEFAULTS.mass);
    setSpringK(DEFAULTS.springK);
    setPhaseDeg(DEFAULTS.phaseDeg);
    setSimTime(0);
    setTrail([]);
  }, []);

  // Animation loop (60 FPS target)
  useEffect(() => {
    if (!isPlaying) return;
    const targetFrameTime = 1000 / 60;
    let last = performance.now();
    let acc = 0;

    const tick = (now: number) => {
      animId.current = requestAnimationFrame(tick);
      const delta = now - last;
      last = now;
      frameCount.current += 1;
      if (now - fpsInterval.current >= 500) {
        setFps(Math.round((frameCount.current * 1000) / (now - fpsInterval.current)));
        frameCount.current = 0;
        fpsInterval.current = now;
      }
      acc += delta;
      while (acc >= targetFrameTime) {
        acc -= targetFrameTime;
        // Slow motion: advance at ~0.35x real time so oscillation is easy to follow
        setSimTime((t) => t + 0.35 * (targetFrameTime / 1000));
      }
    };
    fpsInterval.current = performance.now();
    animId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId.current);
  }, [isPlaying]);

  // Trail update
  useEffect(() => {
    if (prefersReducedMotion) return;
    setTrail((prev) => {
      const next = [...prev, { x, y: 0 }];
      const maxLen = 80;
      return next.length > maxLen ? next.slice(-maxLen) : next;
    });
  }, [x, prefersReducedMotion]);

  // Canvas resize observer — update canvas size and container size so draw effect re-runs
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      const cw = Math.max(1, Math.floor(rect.width * dpr));
      const ch = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = cw;
      canvas.height = ch;
      setContainerSize({ w: rect.width, h: rect.height });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Canvas render + auto-scale
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || containerSize.w <= 0 || containerSize.h <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = canvas.width / Math.max(1, containerSize.w);
    const w = canvas.width;
    const h = canvas.height;
    const cy = h / 2;

    // Left/right margins so fixed wall and full motion are clearly visible (nothing cut off)
    const leftMargin = 110 * dpr;
    const rightMargin = 80 * dpr;
    const plotWidth = Math.max(1, w - leftMargin - rightMargin);
    const originPx = leftMargin; // fixed wall at left edge of plot
    // Map world x in [-A, A] to pixels: x = -A -> originPx, x = +A -> originPx + plotWidth
    const xPx = originPx + ((x + amplitude) / (2 * amplitude)) * plotWidth;
    const massRadius = visualRadius(mass, 14);
    const springLengthPx = Math.max(20, xPx - originPx);

    // Dark theme to match other simulation pages
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#0b1120");
    bgGrad.addColorStop(0.5, "#020617");
    bgGrad.addColorStop(1, "#0b1120");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Grid (subtle, dark theme)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
    ctx.lineWidth = 1;
    const gridStep = 30 * dpr;
    for (let gx = 0; gx <= w; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let gy = 0; gy <= h; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Origin marker (fixed wall / spring anchor) — fully inside left margin
    ctx.fillStyle = "#334155";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(originPx - 6 * dpr, cy - 28 * dpr, 20 * dpr, 56 * dpr);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${10 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Fixed", originPx + 4 * dpr, cy - 34 * dpr);

    // Trail
    const meterToPxTrail = (xM: number) => originPx + ((xM + amplitude) / (2 * amplitude)) * plotWidth;
    if (trail.length >= 2 && !prefersReducedMotion) {
      for (let i = 0; i < trail.length - 1; i++) {
        const p0 = trail[i];
        const p1 = trail[i + 1];
        const px0 = meterToPxTrail(p0.x);
        const px1 = meterToPxTrail(p1.x);
        const t = i / trail.length;
        const alpha = 0.2 + 0.5 * t;
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px0, cy);
        ctx.lineTo(px1, cy);
        ctx.stroke();
      }
    }

    // Spring (coils)
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2 * dpr;
    const coils = Math.max(6, Math.floor(springLengthPx / 12));
    ctx.beginPath();
    let sx = originPx;
    let sy = cy;
    ctx.moveTo(sx, sy);
    for (let i = 1; i <= coils; i++) {
      const t = i / coils;
      const nx = originPx + t * springLengthPx;
      const ny = cy + (i % 2 === 0 ? -8 : 8) * dpr;
      ctx.lineTo(nx, ny);
      sx = nx;
      sy = ny;
    }
    ctx.lineTo(xPx, cy);
    ctx.stroke();

    // Mass (circle with glow) — cyan/sky to match site
    const glowR = massRadius * (1 + Math.log10(Math.max(0.1, mass)) / 5);
    const glowGrad = ctx.createRadialGradient(xPx, cy, 0, xPx, cy, glowR * 2);
    glowGrad.addColorStop(0, "rgba(56, 189, 248, 0.9)");
    glowGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.35)");
    glowGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(xPx, cy, glowR * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(xPx, cy, massRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = `${11 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("m", xPx, cy);

    // Velocity vector
    const vScale = (plotWidth / (2 * amplitude)) * 0.12;
    const vLen = Math.min(70, Math.abs(v) * vScale);
    if (vLen > 2) {
      const vx = v > 0 ? vLen : -vLen;
      ctx.strokeStyle = "#f472b6";
      ctx.fillStyle = "#f472b6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xPx, cy);
      ctx.lineTo(xPx + vx, cy);
      ctx.stroke();
      const arrow = 8 * dpr;
      ctx.beginPath();
      ctx.moveTo(xPx + vx, cy);
      ctx.lineTo(xPx + vx - (vx > 0 ? arrow : -arrow), cy - arrow);
      ctx.lineTo(xPx + vx - (vx > 0 ? arrow : -arrow), cy + arrow);
      ctx.closePath();
      ctx.fill();
    }

    // Axis label
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${12 * dpr}px system-ui, sans-serif`;
    ctx.fillText("x (m)", w - 40 * dpr, cy + 24 * dpr);
    ctx.fillText("0", originPx - 14 * dpr, cy + 4 * dpr);

  }, [amplitude, mass, trail, x, v, prefersReducedMotion, containerSize.w, containerSize.h]);

  const ampHistory = historyAmplitude;
  const peakAmp = ampHistory.length ? Math.max(...ampHistory.map((r) => r.value)) : amplitude;
  const avgAmp = ampHistory.length ? ampHistory.reduce((s, r) => s + r.value, 0) / ampHistory.length : amplitude;

  return (
    <div
      className="flex flex-col lg:flex-row w-full max-w-[1920px] mx-auto overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900/80 shadow-xl"
      style={{ minHeight: "min(600px, 70vh)" }}
    >
      {/* Left panel: 65% */}
      <div className="flex flex-1 lg:w-[65%] flex-col min-h-0 border-r-0 lg:border-r border-neutral-700">
        {/* Visual: 75% of left */}
        <div ref={containerRef} className="relative flex-1 min-h-[240px] flex-shrink-0 w-full bg-[#050816] rounded-tl-2xl overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full block"
            width={800}
            height={400}
          />
          <div className="absolute left-2 top-2 rounded-lg bg-black/40 px-2 py-1 text-xs text-neutral-300 tabular-nums">
            t = {simTime.toFixed(2)} s · x = {x.toFixed(3)} m · v = {v.toFixed(3)} m/s · FPS: {fps}
          </div>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="absolute right-2 top-2 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
        </div>

        {/* Controls: 25% of left — all in one view */}
        <div className="flex flex-shrink-0 min-h-[140px] flex-col justify-between border-t border-neutral-700 bg-neutral-900/90 p-3">
          <div className="flex items-end justify-between gap-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 min-w-0">
              <ParameterSlider
                label="Amplitude"
                value={amplitude}
                min={0.2}
                max={3}
                step={0.1}
                unit="m"
                defaultValue={DEFAULTS.amplitude}
                onChange={setAmplitude}
                dramaticRange={[1, 2]}
                icon="↔"
              />
              <ParameterSlider
                label="Mass"
                value={mass}
                min={0.2}
                max={5}
                step={0.1}
                unit="kg"
                defaultValue={DEFAULTS.mass}
                onChange={setMass}
                dramaticRange={[0.5, 2]}
                icon="⚖"
              />
              <ParameterSlider
                label="Spring k"
                value={springK}
                min={5}
                max={120}
                step={1}
                unit="N/m"
                defaultValue={DEFAULTS.springK}
                onChange={setSpringK}
                dramaticRange={[20, 60]}
                icon="⌒"
              />
              <ParameterSlider
                label="Phase"
                value={phaseDeg}
                min={0}
                max={360}
                step={5}
                unit="°"
                defaultValue={DEFAULTS.phaseDeg}
                onChange={setPhaseDeg}
                icon="φ"
              />
            </div>
            <button
              type="button"
              onClick={resetToDefault}
              className="flex-shrink-0 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
              aria-label="Reset to default"
            >
              ↺ Reset to Default
            </button>
          </div>
          <p className="text-xs text-neutral-400 bg-neutral-800/80 rounded-lg px-3 py-1.5 border border-neutral-600">
            💡 Try this: Amplitude 2 m, Mass 0.5 kg, Spring k 50 N/m for wide oscillations.
          </p>
        </div>
      </div>

      {/* Right panel: 35% */}
      <div className="flex flex-shrink-0 lg:w-[35%] w-full flex-col bg-neutral-900/90 overflow-auto min-h-[280px] border-l-0 lg:border-l border-neutral-700">
        {/* Data & records: 60% */}
        <div className="flex flex-col flex-1 min-h-0 overflow-auto border-b border-neutral-700 p-3">
          <h3 className="text-sm font-bold text-sky-400 mb-2">📊 Parameter history & live stats</h3>
          <div className="grid grid-cols-1 gap-2 mb-3">
            <div className="rounded-xl border border-neutral-600 bg-neutral-800/60 p-2">
              <div className="text-xs font-semibold text-neutral-400">Amplitude</div>
              <div className="tabular-nums text-neutral-200">Current: {amplitude.toFixed(2)} m · Peak: {peakAmp.toFixed(2)} m · Avg: {avgAmp.toFixed(2)} m</div>
            </div>
            <div className="rounded-xl border border-neutral-600 bg-neutral-800/60 p-2">
              <div className="text-xs font-semibold text-neutral-400">Mass / Spring k</div>
              <div className="tabular-nums text-neutral-200">m = {mass.toFixed(2)} kg · k = {springK.toFixed(1)} N/m</div>
            </div>
          </div>
          <div className="rounded-xl border border-sky-500/50 bg-neutral-800/60 p-2 mb-2">
            <div className="text-xs font-bold text-sky-400 mb-1">📐 Live equation</div>
            <div className="text-[11px] font-mono text-neutral-400 space-y-0.5">
              <div>x(t) = A cos(ωt + φ) = {amplitude.toFixed(2)} cos({omega.toFixed(2)}×{simTime.toFixed(2)} + {phaseRad.toFixed(2)})</div>
              <div className="text-neutral-200">→ x = <span className="font-bold text-sky-400">{x.toFixed(3)} m</span></div>
              <div>ω = √(k/m) = √({springK}/{mass}) = {omega.toFixed(2)} rad/s</div>
              <div>T = 2π√(m/k) = {T.toFixed(3)} s</div>
            </div>
          </div>
          <div className="rounded-xl border border-neutral-600 bg-neutral-800/60 p-2">
            <div className="text-xs font-bold text-sky-400">⚡ Performance</div>
            <ul className="text-[11px] text-neutral-300 space-y-0.5">
              <li>Velocity: {v.toFixed(3)} m/s</li>
              <li>Kinetic E: {KE.toFixed(2)} J · Potential E: {PE.toFixed(2)} J</li>
              <li>Total E: {ETotal.toFixed(2)} J (conserved)</li>
              <li>FPS: {fps}</li>
            </ul>
          </div>
        </div>

        {/* Educational: 40% */}
        <div className="flex flex-1 min-h-0 flex-col overflow-auto p-3">
          <h3 className="text-sm font-bold text-sky-400 mb-1">✨ The concept</h3>
          <p className="text-xs text-neutral-400 mb-2">
            In simple harmonic motion, a mass on a spring moves so that the restoring force is proportional to displacement (F = −kx). The motion is sinusoidal: x = A cos(ωt + φ). Energy alternates between kinetic and potential while total energy stays constant.
          </p>
          <div className="rounded-lg border border-neutral-600 bg-neutral-800/60 p-2 mb-2">
            <div className="text-xs font-bold text-sky-400">📐 Key formula</div>
            <p className="font-mono text-[11px] text-neutral-400 mt-0.5">
              x = A cos(ωt + φ), ω = √(k/m), T = 2π√(m/k), E = ½kA²
            </p>
            <p className="text-[10px] text-neutral-500 mt-1">
              A = amplitude, k = spring constant, m = mass, ω = angular frequency, T = period, φ = phase.
            </p>
          </div>
          <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-2">
            <div className="text-xs font-bold text-sky-300">💡 Try this for drama!</div>
            <ul className="text-[11px] text-neutral-400 mt-1 space-y-1">
              <li><strong className="text-neutral-200">🎯 Big & slow:</strong> Amplitude 2.5 m, Mass 3 kg, k 20 N/m → large, slow swing.</li>
              <li><strong className="text-neutral-200">⚡ Fast & small:</strong> Amplitude 0.5 m, Mass 0.3 kg, k 80 N/m → quick oscillations.</li>
              <li><strong className="text-neutral-200">🌟 Classic demo:</strong> A = 1.5 m, m = 1 kg, k = 40 N/m → smooth motion.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
