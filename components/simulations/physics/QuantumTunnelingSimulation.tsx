"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Quantum Tunneling: Particles passing through energy barrier (E < V₀)
// Transmission T = 1 / (1 + (V₀² sinh²(κL))/(4E(V₀-E))), κ = √(2m(V₀-E))/ℏ
// ---------------------------------------------------------------------------

interface QuantumTunnelingParams {
  /** Particle energy E as fraction of barrier height V₀. 0.1–0.95; tunneling only when E < V₀. */
  energyRatio: number;
  /** Barrier width L (natural units). Thinner → more tunneling. */
  barrierWidth: number;
  /** Barrier height V₀ (eV). Fixed reference; E = energyRatio × V₀. */
  barrierHeight: number;
  /** Particle mass (u). Lighter particles tunnel more. */
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
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

// Transmission coefficient for rectangular barrier (E < V₀)
// T = 1 / (1 + (V₀² sinh²(κL)) / (4E(V₀-E)))
// κ = √(2m(V₀-E)) in ℏ=1 units
function transmissionCoefficient(
  energyRatio: number,
  barrierWidth: number,
  barrierHeight: number,
  mass: number
): number {
  if (energyRatio >= 1) return 1; // Classically allowed
  const E = energyRatio * barrierHeight;
  const V0 = barrierHeight;
  const L = barrierWidth;
  const kappa = Math.sqrt(2 * mass * (V0 - E));
  const sinhKL = Math.sinh(kappa * L);
  const denom = 1 + (V0 * V0 * sinhKL * sinhKL) / (4 * E * (V0 - E));
  return 1 / denom;
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
      <div className="min-w-[140px]">
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
        className={`h-2 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-800 outline-none ${accentClassName}`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Particle for animation (position, velocity, tunneled?)
// ---------------------------------------------------------------------------

interface Particle {
  id: number;
  x: number;
  side: "left" | "right";
  state: "approaching" | "reflected" | "tunneled";
  progress: number;
}

// ---------------------------------------------------------------------------
// Canvas: Energy barrier + particles passing/reflecting
// ---------------------------------------------------------------------------

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

    const pad = 20 * dpr;
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

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const gradBg = ctx.createLinearGradient(0, 0, w, h);
      gradBg.addColorStop(0, bg);
      gradBg.addColorStop(1, "#0f0f1a");
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

      // Map x (0..1 = left to right) to screen
      const toScreenX = (t: number) => plotX0 + clamp(t, 0, 1) * plotW;
      const centerY = plotY0 + plotH / 2;

      // Energy barrier: rectangular region
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

      // Energy level line (E < V₀)
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

      // Particles
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

      // Labels
      ctx.fillStyle = axis;
      ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("x (position)", (plotX0 + plotX1) / 2, plotY1 + 14 * dpr);
      ctx.fillText("Source", plotX0 + (x1 - plotX0) / 2, plotY1 + 14 * dpr);
      ctx.fillText("Barrier", x1 + barrierW / 2, plotY1 + 14 * dpr);
      ctx.fillText("Detector", x2 + (plotX1 - x2) / 2, plotY1 + 14 * dpr);

      // HUD
      ctx.fillStyle = text;
      ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`T ≈ ${(transmissionProb * 100).toFixed(2)}%`, plotX0, plotY0 - 2 * dpr);
      ctx.fillText("Cyan = incoming · Orange = reflected · Green = tunneled", plotX0, plotY0 + 14 * dpr);
    };

    draw();
  }, [params, particles, transmissionProb]);

  return (
    <div className="rounded-3xl border border-emerald-500/40 bg-neutral-950/60 p-4 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">
            Quantum Tunneling – Energy barrier & probability leak-through
          </div>
          <div className="text-xs text-neutral-400">
            Particles with E &lt; V₀ can tunnel through classically forbidden regions.
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#050510]"
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

export default function QuantumTunnelingSimulation() {
  const [params, setParams] = useState<QuantumTunnelingParams>(DEFAULT_PARAMS);
  const [particles, setParticles] = useState<Particle[]>([]);
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
  }, []);

  // Emit and animate particles
  useEffect(() => {
    let lastEmit = 0;
    const emitInterval = 600;

    const tick = (now: number) => {
      const dt = Math.min(50, now - lastTimeRef.current);
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
  }, [T]);

  return (
    <main className="min-h-screen bg-neutral-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a]" />

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Quantum Tunneling
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-400">
            A quantum particle with energy E below a potential barrier V₀ can still appear on the other side—a classically impossible process called tunneling. Watch particles pass through or reflect based on the transmission probability T.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:w-[60%] flex flex-col gap-6">
            <CanvasSimulator
              params={params}
              particles={particles}
              transmissionProb={T}
            />

            <div className="rounded-3xl border border-neutral-800 bg-neutral-950/40 p-4 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Parameters
                  </div>
                  <div className="text-xs text-neutral-400">
                    Adjust E/V₀, barrier width, and mass to see how tunneling probability changes.
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

              <div className="grid gap-3 sm:grid-cols-2">
                <SliderRow
                  label="E/V₀ (energy ratio)"
                  value={params.energyRatio}
                  min={0.1}
                  max={0.95}
                  step={0.02}
                  unit=""
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(energyRatio) => setParams((p) => ({ ...p, energyRatio }))}
                />
                <SliderRow
                  label="Barrier width L"
                  value={params.barrierWidth}
                  min={0.5}
                  max={4}
                  step={0.1}
                  unit=""
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(barrierWidth) => setParams((p) => ({ ...p, barrierWidth }))}
                />
                <SliderRow
                  label="Barrier V₀"
                  value={params.barrierHeight}
                  min={0.5}
                  max={2}
                  step={0.1}
                  unit="eV"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(barrierHeight) => setParams((p) => ({ ...p, barrierHeight }))}
                />
                <SliderRow
                  label="Mass m"
                  value={params.mass}
                  min={0.1}
                  max={2}
                  step={0.1}
                  unit="u"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(mass) => setParams((p) => ({ ...p, mass }))}
                />
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[40%]">
            <div className="sticky top-6 h-full rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">
                Tunneling through a barrier
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                Classically, a particle with E &lt; V₀ cannot cross a barrier. Quantum mechanically, the wave function decays exponentially inside the barrier but remains nonzero—so a fraction T of the wave tunnels through.
              </p>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Key formula
                </div>
                <div className="mt-3 space-y-2 text-sm text-neutral-200">
                  <div className="font-mono">
                    T = 1 / (1 + (V₀² sinh²(κL)) / (4E(V₀−E)))
                  </div>
                  <div className="font-mono text-neutral-300">
                    κ = √(2m(V₀−E))/ℏ
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  Variables (units)
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">E</dt>
                    <dd className="text-neutral-400">particle energy (eV)</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">V₀</dt>
                    <dd className="text-neutral-400">barrier height (eV)</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">L</dt>
                    <dd className="text-neutral-400">barrier width</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">κ</dt>
                    <dd className="text-neutral-400">decay constant (1/length)</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-neutral-200">T</dt>
                    <dd className="text-neutral-400">transmission probability</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-400">
                Higher E/V₀, thinner barriers, and lighter mass increase T. Alpha decay and scanning tunneling microscopes rely on tunneling.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
