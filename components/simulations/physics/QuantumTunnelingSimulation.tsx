"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface QuantumTunnelingParams {
  energyRatio: number;
  barrierWidth: number;
  barrierHeight: number;
  mass: number;
}

const DEFAULT_PARAMS: QuantumTunnelingParams = {
  energyRatio: 0.5,
  barrierWidth: 1.5,
  barrierHeight: 1,
  mass: 1,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function formatNumber(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "--";
  return n.toFixed(digits);
}

function transmissionCoefficient(
  energyRatio: number,
  barrierWidth: number,
  barrierHeight: number,
  mass: number
): number {
  if (energyRatio >= 1) return 1;
  const E = energyRatio * barrierHeight;
  const V0 = barrierHeight;
  const L = barrierWidth;
  const kappa = Math.sqrt(2 * mass * (V0 - E));
  const sinhKL = Math.sinh(kappa * L);
  const denom = 1 + (V0 * V0 * sinhKL * sinhKL) / (4 * E * (V0 - E));
  return 1 / denom;
}

function SliderRow(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  color?: string;
  onChange: (next: number) => void;
}) {
  const { label, value, min, max, step, unit, color = "#34d399", onChange } = props;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="tabular-nums text-xs text-neutral-400">
          <span className="text-neutral-200">{formatNumber(value, step < 1 ? 2 : 0)}</span> {unit}
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
        className="physics-range w-full"
        style={{ accentColor: color }}
      />
    </div>
  );
}

interface Particle {
  id: number;
  x: number;
  side: "left" | "right";
  state: "approaching" | "reflected" | "tunneled";
  progress: number;
}

interface CanvasSimulatorProps {
  params: QuantumTunnelingParams;
  particles: Particle[];
  transmissionProb: number;
}

const CanvasSimulator: React.FC<CanvasSimulatorProps> = ({
  params,
  particles,
  transmissionProb,
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

    const bg = "#0a0a12";
    const grid = "rgba(148,163,184,0.12)";
    const axis = "#94a3b8";
    const text = "#e2e8f0";
    const barrierFill = "rgba(239,68,68,0.35)";
    const barrierStroke = "rgba(239,68,68,0.7)";
    const particleColor = "rgba(34,211,238,0.95)";
    const reflectedColor = "rgba(251,146,60,0.9)";
    const tunneledColor = "rgba(34,197,94,0.95)";
    const energyLineColor = "rgba(234,179,8,0.8)";

    const leftPad = 56 * dpr;
    const rightPad = 24 * dpr;
    const bottomPad = 48 * dpr;
    const topPad = 32 * dpr;

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

    const toScreenX = (t: number) => plotX0 + clamp(t, 0, 1) * plotW;
    const centerY = plotY0 + plotH / 2;

    const barrierLeft = 0.35;
    const barrierRight = 0.35 + (params.barrierWidth / 5) * 0.3;
    const x1 = toScreenX(barrierLeft);
    const x2 = toScreenX(barrierRight);
    const barrierW = Math.max(4, x2 - x1);

    ctx.fillStyle = barrierFill;
    ctx.strokeStyle = barrierStroke;
    ctx.lineWidth = 2 * dpr;
    ctx.fillRect(x1, plotY0, barrierW, plotH);
    ctx.strokeRect(x1, plotY0, barrierW, plotH);

    const energyY = centerY + plotH * 0.25;
    ctx.strokeStyle = energyLineColor;
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    ctx.beginPath();
    ctx.moveTo(plotX0, energyY);
    ctx.lineTo(x1, energyY);
    ctx.moveTo(x2, energyY);
    ctx.lineTo(plotX1, energyY);
    ctx.stroke();
    ctx.setLineDash([]);

    const radius = Math.max(2.5, 4 * dpr);
    for (const p of particles) {
      let xNorm = 0;
      if (p.state === "approaching") {
        xNorm = p.progress * barrierLeft;
      } else if (p.state === "reflected") {
        xNorm = barrierLeft * (1 - p.progress);
      } else {
        xNorm = barrierRight + p.progress * (1 - barrierRight);
      }
      const sx = toScreenX(xNorm);
      const color = p.state === "tunneled" ? tunneledColor : p.state === "reflected" ? reflectedColor : particleColor;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = axis;
    ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("x (position)", (plotX0 + plotX1) / 2, plotY1 + 14 * dpr);
    ctx.fillText("Source", plotX0 + (x1 - plotX0) / 2, plotY1 + 14 * dpr);
    ctx.fillText("Barrier", x1 + barrierW / 2, plotY1 + 14 * dpr);
    ctx.fillText("Detector", x2 + (plotX1 - x2) / 2, plotY1 + 14 * dpr);

    ctx.fillStyle = text;
    ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`T ~ ${(transmissionProb * 100).toFixed(2)}%`, plotX0, plotY0 - 2 * dpr);
    ctx.fillText("Cyan = incoming | Orange = reflected | Green = tunneled", plotX0, plotY0 + 14 * dpr);
  }, [params, particles, transmissionProb]);

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950/60 p-4">
      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-800 bg-[#050510]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
};

export default function QuantumTunnelingSimulation() {
  const [params, setParams] = useState<QuantumTunnelingParams>(DEFAULT_PARAMS);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [playing, setPlaying] = useState(true);
  const nextIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const T = transmissionCoefficient(
    params.energyRatio,
    params.barrierWidth,
    params.barrierHeight,
    params.mass
  );

  const resetDefaults = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setParticles([]);
    setPlaying(true);
  }, []);

  const clearScreen = useCallback(() => setParticles([]), []);

  useEffect(() => {
    let lastEmit = 0;
    const emitInterval = 600;

    const tick = (now: number) => {
      if (!playing) {
        lastTimeRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      lastTimeRef.current = now;

      setParticles((prev) => {
        const next: Particle[] = prev
          .map((p) => {
            const speed = 0.015;
            const newProgress = p.progress + speed;
            if (p.state === "approaching" && newProgress >= 1) {
              const tunneled = Math.random() < T;
              const newState: "tunneled" | "reflected" = tunneled ? "tunneled" : "reflected";
              return {
                ...p,
                state: newState,
                progress: 0,
              };
            }
            if ((p.state === "reflected" || p.state === "tunneled") && newProgress >= 1) {
              return null;
            }
            return { ...p, progress: newProgress };
          })
          .filter((p): p is Particle => p !== null);

        if (now - lastEmit > emitInterval) {
          lastEmit = now;
          nextIdRef.current += 1;
          next.push({
            id: nextIdRef.current,
            x: 0,
            side: "left",
            state: "approaching",
            progress: 0,
          });
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame((now) => {
      lastTimeRef.current = now;
      tick(now);
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [T, playing]);

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a]" />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
            <div className="mb-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/50 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-white">
                  Quantum Tunneling - Energy barrier and probability leak-through
                </div>
                <div className="text-xs text-neutral-400">
                  Cyan particles approach the barrier; orange reflects; green tunnels through.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className={`min-w-[110px] rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
                    playing ? "bg-emerald-700 hover:bg-emerald-800" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {playing ? "\u23F8 Pause" : "\u25B6 Play"}
                </button>
                <button
                  type="button"
                  onClick={clearScreen}
                  className="min-w-[110px] rounded-xl border border-neutral-600 bg-neutral-800 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                >
                  {"\u21BA Reset"}
                </button>
              </div>
            </div>

            <CanvasSimulator params={params} particles={particles} transmissionProb={T} />
          </div>

          <aside className="col-span-1 h-[580px] overflow-y-auto">
            <div className="h-full rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Parameters</h3>
                  <div className="text-xs text-neutral-400">
                    Adjust E/V0, barrier width, and mass to see how tunneling changes.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetDefaults}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-100 transition-colors hover:bg-neutral-700"
                >
                  {"\u21BA Reset"}
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <SliderRow
                  label="E/V0 (energy ratio)"
                  value={params.energyRatio}
                  min={0.1}
                  max={0.95}
                  step={0.02}
                  unit=""
                  color="#34d399"
                  onChange={(energyRatio) => setParams((p) => ({ ...p, energyRatio }))}
                />
                <SliderRow
                  label="Barrier width L"
                  value={params.barrierWidth}
                  min={0.5}
                  max={4}
                  step={0.1}
                  unit=""
                  color="#22d3ee"
                  onChange={(barrierWidth) => setParams((p) => ({ ...p, barrierWidth }))}
                />
                <SliderRow
                  label="Barrier V0"
                  value={params.barrierHeight}
                  min={0.5}
                  max={2}
                  step={0.1}
                  unit="eV"
                  color="#fbbf24"
                  onChange={(barrierHeight) => setParams((p) => ({ ...p, barrierHeight }))}
                />
                <SliderRow
                  label="Mass m"
                  value={params.mass}
                  min={0.1}
                  max={2}
                  step={0.1}
                  unit="u"
                  color="#a78bfa"
                  onChange={(mass) => setParams((p) => ({ ...p, mass }))}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
ok 
        <div className="mt-6 rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Tunneling Through a Barrier</div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                Classically, a particle with E &lt; V0 cannot cross a barrier. Quantum mechanically, the wave function
                decays exponentially inside the barrier but remains nonzero, so a fraction T tunnels through.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Key Formula</div>
              <div className="mt-3 space-y-2 text-sm text-neutral-200">
                <div className="font-mono">T = 1 / (1 + (V0^2 sinh^2(kL)) / (4E(V0-E)))</div>
                <div className="font-mono text-neutral-300">k = sqrt(2m(V0-E)) / hbar</div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="text-sm font-semibold text-white">Variables (units)</div>
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="text-neutral-200">E</dt>
                  <dd className="text-neutral-400">particle energy (eV)</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="text-neutral-200">V0</dt>
                  <dd className="text-neutral-400">barrier height (eV)</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="text-neutral-200">L</dt>
                  <dd className="text-neutral-400">barrier width</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="text-neutral-200">k</dt>
                  <dd className="text-neutral-400">decay constant (1/length)</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="text-neutral-200">T</dt>
                  <dd className="text-neutral-400">transmission probability</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
