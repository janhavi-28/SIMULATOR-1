"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TAU = 2 * Math.PI;

// ——— Tuning fork params (like the diagram) ———
interface TuningForkParams {
  freqAHz: number;
  freqBHz: number;
  damping: number;
  strikeStrength: number;
}

const DEFAULT_PARAMS: TuningForkParams = {
  freqAHz: 440,
  freqBHz: 440,
  damping: 0.92,
  strikeStrength: 1,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatNum(n: number, digits = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

// ——— Sound: play tone when a tuning fork is struck ———
function useTuningForkSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((frequencyHz: number, durationMs: number, gainStart: number) => {
    if (typeof window === "undefined") return;
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequencyHz, ctx.currentTime);
      gain.gain.setValueAtTime(gainStart * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // ignore if AudioContext not supported
    }
  }, []);

  return playTone;
}

// ——— Slider ———
function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  dramaticRange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  dramaticRange?: [number, number];
}) {
  const id = label.replace(/\s/g, "-").toLowerCase();
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <div className="flex justify-between items-baseline gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-[#3D2817] truncate">
          {label}
        </label>
        <span className="tabular-nums text-sm font-bold text-[#8B4513] shrink-0">
          {formatNum(value, step < 1 ? 1 : 0)} {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-amber-200 to-orange-300 accent-orange-500"
        aria-label={`${label}: ${value} ${unit}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} ${unit}`}
      />
    </div>
  );
}

// ——— Tuning fork canvas: two forks on resonance boxes, sound waves, strike → sound ———
function TuningForkCanvas({
  params,
  strikeAAt,
  strikeBAt,
  amplitudeA,
  amplitudeB,
  soundWavePhase,
  onStrikeA,
  onStrikeB,
  playSound,
}: {
  params: TuningForkParams;
  strikeAAt: number | null;
  strikeBAt: number | null;
  amplitudeA: number;
  amplitudeB: number;
  soundWavePhase: number;
  onStrikeA: () => void;
  onStrikeB: () => void;
  playSound: (freq: number, durationMs: number, gain: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const resize = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
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
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const boxW = w * 0.22;
    const boxH = h * 0.28;
    const leftX = w * 0.2;
    const rightX = w * 0.8;
    const boxY = h * 0.5 - boxH / 2;

    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#1a0f0a");
    grad.addColorStop(0.5, "#2d1810");
    grad.addColorStop(1, "#3d2817");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const drawResonanceBox = (x: number, label: string, subLabel: string) => {
      ctx.fillStyle = "#8B6914";
      ctx.strokeStyle = "#5C4A0E";
      ctx.lineWidth = 2;
      ctx.fillRect(x - boxW / 2, boxY, boxW, boxH);
      ctx.strokeRect(x - boxW / 2, boxY, boxW, boxH);
      ctx.fillStyle = "rgba(255,248,220,0.9)";
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, x, boxY + boxH / 2 - 6);
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,248,220,0.8)";
      ctx.fillText(subLabel, x, boxY + boxH / 2 + 10);
    };

    const drawTuningFork = (cx: number, amplitude: number, isStruck: boolean, label: string) => {
      const tineW = 8;
      const tineH = 48;
      const stemY = boxY - 10;
      const tipY = stemY - tineH;
      const wobble = amplitude * Math.sin(soundWavePhase * 0.5) * 6;
      const x = cx + wobble;

      ctx.fillStyle = "#C0C0C0";
      ctx.strokeStyle = "#E8E8E8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - tineW, stemY);
      ctx.lineTo(x - tineW, tipY);
      ctx.lineTo(x, tipY + 12);
      ctx.lineTo(x + tineW, tipY);
      ctx.lineTo(x + tineW, stemY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (isStruck || amplitude > 0.02) {
        ctx.strokeStyle = "rgba(255,215,0,0.6)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU * 0.3 + soundWavePhase * 0.2;
          const r = 12 + amplitude * 15;
          ctx.beginPath();
          ctx.moveTo(x - tineW, tipY + 4);
          ctx.lineTo(x - tineW - Math.cos(a) * r, tipY + 4 - Math.sin(a) * r);
          ctx.moveTo(x + tineW, tipY + 4);
          ctx.lineTo(x + tineW + Math.cos(a) * r, tipY + 4 - Math.sin(a) * r);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "rgba(255,248,220,0.95)";
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, x, tipY - 14);
    };

    drawResonanceBox(leftX, "Tuning fork A", "Vibrating air column");
    drawResonanceBox(rightX, "Tuning fork B", "Sympathetic vibration");

    const resonanceMatch = params.freqAHz > 0
      ? 1 / (1 + Math.pow((params.freqAHz - params.freqBHz) / 50, 2))
      : 0;

    drawTuningFork(leftX, amplitudeA, strikeAAt !== null, "Tuning fork A");
    drawTuningFork(rightX, amplitudeB * resonanceMatch, strikeBAt !== null, "Tuning fork B");

    ctx.fillStyle = "rgba(255,248,220,0.7)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sound waves", (leftX + rightX) / 2, h * 0.28);

    for (let i = 0; i < 7; i++) {
      const wavePhase = soundWavePhase + i * 0.8;
      const waveX = leftX + (wavePhase % 1) * (rightX - leftX - 40);
      if (waveX > leftX + 20 && waveX < rightX - 20) {
        const arcRadius = 18 + Math.sin(wavePhase * TAU) * 4;
        ctx.strokeStyle = `rgba(255,140,66,${0.2 + 0.5 * (1 - (waveX - leftX) / (rightX - leftX))})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(waveX, h * 0.5, arcRadius, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();
      }
    }
  }, [params, strikeAAt, strikeBAt, amplitudeA, amplitudeB, soundWavePhase]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const xRatio = (e.clientX - rect.left) / rect.width;
      const leftCenter = 0.2;
      const rightCenter = 0.8;
      const hitRadius = 0.14;
      if (Math.abs(xRatio - leftCenter) < hitRadius) {
        onStrikeA();
        playSound(params.freqAHz, 800, params.strikeStrength);
      } else if (Math.abs(xRatio - rightCenter) < hitRadius) {
        onStrikeB();
        playSound(params.freqBHz, 800, params.strikeStrength);
      }
    },
    [onStrikeA, onStrikeB, params.freqAHz, params.freqBHz, params.strikeStrength, playSound]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0 rounded-2xl overflow-hidden border-2 border-amber-600/40 shadow-lg cursor-pointer"
      style={{ aspectRatio: "16/9" }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStrikeA();
          playSound(params.freqAHz, 800, params.strikeStrength);
        }
      }}
      aria-label="Click left tuning fork (A) or right tuning fork (B) to strike and hear sound"
    >
      <canvas ref={canvasRef} className="w-full h-full block" style={{ background: "#1a0f0a" }} />
      <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-amber-200/90 bg-black/50 px-3 py-1.5 rounded mx-2">
        Click a tuning fork to strike it and hear sound
      </div>
    </div>
  );
}

export default function ResonanceSimulation() {
  const [playing, setPlaying] = useState(true);
  const [params, setParams] = useState<TuningForkParams>(DEFAULT_PARAMS);
  const [strikeAAt, setStrikeAAt] = useState<number | null>(null);
  const [strikeBAt, setStrikeBAt] = useState<number | null>(null);
  const [amplitudeA, setAmplitudeA] = useState(0);
  const [amplitudeB, setAmplitudeB] = useState(0);
  const [soundWavePhase, setSoundWavePhase] = useState(0);
  const playSound = useTuningForkSound();

  const strikeA = useCallback(() => {
    setStrikeAAt(Date.now());
    setAmplitudeA(1);
  }, []);
  const strikeB = useCallback(() => {
    setStrikeBAt(Date.now());
    setAmplitudeB(1);
  }, []);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const run = (t: number) => {
      raf = requestAnimationFrame(run);
      const dt = (t - start) * 0.001;
      setSoundWavePhase(dt * 4);
      setAmplitudeA((a) => (a > 0.005 ? a * params.damping : 0));
      setAmplitudeB((b) => (b > 0.005 ? b * params.damping : 0));
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [params.damping]);

  useEffect(() => {
    if (strikeAAt === null) return;
    const t = setTimeout(() => setStrikeAAt(null), 400);
    return () => clearTimeout(t);
  }, [strikeAAt]);
  useEffect(() => {
    if (strikeBAt === null) return;
    const t = setTimeout(() => setStrikeBAt(null), 400);
    return () => clearTimeout(t);
  }, [strikeBAt]);

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setAmplitudeA(0);
    setAmplitudeB(0);
    setStrikeAAt(null);
    setStrikeBAt(null);
  }, []);

  const resonanceMatch = params.freqAHz > 0
    ? (1 / (1 + Math.pow((params.freqAHz - params.freqBHz) / 50, 2))) * 100
    : 0;

  return (
    <div className="flex flex-col w-full min-h-[600px] bg-gradient-to-br from-[#FFF8DC] via-[#FFFAF0] to-[#FFE4C4]">
      {/* Top: Simulation (left) + Parameters (right) */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Tuning forks simulation */}
        <div className="flex-[2] min-w-0 p-4 flex flex-col relative">
          <h2 className="text-lg font-bold text-[#FF8C42] mb-2">What is resonance</h2>
          <div className="flex-1 min-h-[280px]">
            <TuningForkCanvas
              params={params}
              strikeAAt={strikeAAt}
              strikeBAt={strikeBAt}
              amplitudeA={amplitudeA}
              amplitudeB={amplitudeB}
              soundWavePhase={soundWavePhase}
              onStrikeA={strikeA}
              onStrikeB={strikeB}
              playSound={playSound}
            />
          </div>
          <div className="flex gap-4 mt-2">
            <button
              type="button"
              onClick={() => { strikeA(); playSound(params.freqAHz, 800, params.strikeStrength); }}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-amber-600"
            >
              Strike Fork A
            </button>
            <button
              type="button"
              onClick={() => { strikeB(); playSound(params.freqBHz, 800, params.strikeStrength); }}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-amber-600"
            >
              Strike Fork B
            </button>
          </div>
        </div>

        {/* Right: Parameters tab */}
        <div className="col-span-1 lg:col-span-2 min-w-0 border-l-2 border-[#D4AF37] bg-gradient-to-b from-[#FFF8DC] to-[#FFEFD5] p-4 overflow-auto">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-sm font-bold text-[#FF8C42]">Parameters</span>
                <button
                  type="button"
                  onClick={() => setPlaying(p => !p)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  {playing ? "⏸ Pause" : "▶ Play"}
                </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
              aria-label="Reset to default"
            >
              ↺ Reset
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <ParamSlider
              label="Tuning fork A frequency"
              value={params.freqAHz}
              min={200}
              max={800}
              step={10}
              unit="Hz"
              onChange={(v) => setParams((p) => ({ ...p, freqAHz: v }))}
              dramaticRange={[420, 460]}
            />
            <ParamSlider
              label="Tuning fork B frequency"
              value={params.freqBHz}
              min={200}
              max={800}
              step={10}
              unit="Hz"
              onChange={(v) => setParams((p) => ({ ...p, freqBHz: v }))}
              dramaticRange={[420, 460]}
            />
            <ParamSlider
              label="Strike strength"
              value={params.strikeStrength}
              min={0.3}
              max={1.5}
              step={0.1}
              unit=""
              onChange={(v) => setParams((p) => ({ ...p, strikeStrength: v }))}
            />
            <ParamSlider
              label="Damping (decay)"
              value={params.damping}
              min={0.7}
              max={0.99}
              step={0.01}
              unit=""
              onChange={(v) => setParams((p) => ({ ...p, damping: v }))}
            />
          </div>
          <div className="mt-4 rounded-lg border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-xs">
            <div className="font-bold text-[#8B4513]">Resonance match</div>
            <div className="font-mono text-[#3D2817]">{formatNum(resonanceMatch, 0)}% — match A and B for strong sympathetic vibration</div>
          </div>
        </div>
      </div>

      {/* Bottom: Detailed description */}
      <section className="border-t-2 border-[#D4AF37] bg-[#FFF8DC] p-6 text-[#3D2817]">
        <h3 className="text-lg font-bold text-[#FF8C42] mb-3">What is resonance — detailed</h3>
        <p className="text-sm leading-relaxed max-w-4xl mb-3">
          <strong>Resonance</strong> is when one vibrating object causes another object with the same natural frequency to vibrate strongly, without direct contact. In this simulation, <strong>Tuning fork A</strong> (left) is struck by hand. It vibrates and sets the air inside its <strong>resonance box</strong> (the wooden box) into motion. That vibrating air column sends <strong>sound waves</strong> through the air toward <strong>Tuning fork B</strong> (right). When the two forks have the same or very close natural frequency, the sound waves from A drive fork B to vibrate in step—this is called <strong>sympathetic vibration</strong>. Fork B’s resonance box also has a vibrating air column, which makes the effect louder. If the frequencies differ much, B barely moves.
        </p>
        <p className="text-sm leading-relaxed max-w-4xl mb-3">
          When you <strong>strike a tuning fork</strong> (click it or use “Strike Fork A” / “Strike Fork B”), you hear a tone because the fork vibrates at its natural frequency and pushes the air. Use the <strong>Parameters</strong> panel on the right to set the frequency of each fork: when A and B are both 440 Hz (or close), you will see fork B respond strongly to A’s sound. When they differ (e.g. A = 440 Hz, B = 600 Hz), sympathetic vibration is weak.
        </p>
        <p className="text-sm leading-relaxed max-w-4xl">
          <strong>Key idea:</strong> The resonance box under each fork is a “vibrating air column” that amplifies the sound. The sound waves carry energy from fork A to fork B. When the driving frequency matches B’s natural frequency, energy is absorbed most efficiently and B’s amplitude is largest—that is resonance.
        </p>
      </section>
    </div>
  );
}
