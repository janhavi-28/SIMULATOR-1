"use client";

import React, { useEffect, useRef, useState } from "react";

// ——— Black Holes: full Schwarzschild null geodesics (G = c = 1) ———
// Exact equation: d²u/dφ² + u = 3 M u² with u = 1/r. First integral: (du/dφ)² = 1/b² − u² + 2M u³.
// b_crit = (3√3/2) r_s; photon sphere at r = 1.5 r_s. Trajectories from RK4 integration only.

type Params = {
  /** Mass strength (scales r_s for display), dimensionless 0.5–2 */
  massStrength: number;
  /** Impact parameter in units of r_s (b > b_crit → escape; b < b_crit → capture) */
  impactParam: number;
  /** Number of light rays (1–5) */
  numRays: number;
  /** Animation speed multiplier */
  simSpeed: number;
};

const DEFAULT_PARAMS: Params = {
  massStrength: 1,
  impactParam: 2.8,
  numRays: 3,
  simSpeed: 1,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatNum(n: number, decimals = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(decimals);
}

// Natural units: G = c = 1 ⇒ r_s = 2M. We work in units where r_s = 1, so M = 0.5.
const R_S_UNIT = 1;
const M_UNIT = 0.5;

/** Critical impact parameter: b_crit = (3√3/2) r_s. Photons with b &lt; b_crit are captured. */
export function criticalImpactParam(): number {
  return (3 * Math.sqrt(3)) / 2; // ≈ 2.598 when r_s = 1
}

/** Schwarzschild radius in world (canvas) units for drawing. */
function schwarzschildRadiusWorld(massStrength: number): number {
  return 0.35 * massStrength;
}

/** RK4 step for d²u/dφ² + u = 3 M u². State y = [u, du/dφ], M = 0.5. */
function geodesicDerivative(y1: number, y2: number): [number, number] {
  const dy1 = y2;
  const dy2 = 3 * M_UNIT * y1 * y1 - y1;
  return [dy1, dy2];
}

/** Integrate null geodesic in Schwarzschild (RK4). b in r_s units; returns (x,y,r) in world units. */
function integrateSchwarzschildRay(
  impactParam: number,
  massStrength: number,
  r_sWorld: number,
  maxPhi = 12 * Math.PI,
  dPhi = 0.015
): { x: number; y: number; r: number }[] {
  const points: { x: number; y: number; r: number }[] = [];
  // Start at 10 r_s so trajectory fits in view (world extent ±4); physics remains strong-field.
  const r0 = 10 * R_S_UNIT;
  const u0 = 1 / r0;
  // First integral: (du/dφ)² = 1/b² − u² + 2M u³. Photon approaching ⇒ du/dφ > 0.
  const b = impactParam * R_S_UNIT;
  const disc = 1 / (b * b) - u0 * u0 + 2 * M_UNIT * u0 * u0 * u0;
  if (disc <= 0) return points; // no valid initial condition
  let y1 = u0;
  let y2 = Math.sqrt(disc);

  let phi = 0;
  const maxSteps = Math.ceil(maxPhi / dPhi);
  const maxWorldR = 4.5; // only store points within visible world coords

  for (let i = 0; i < maxSteps; i++) {
    const r = 1 / y1;
    const xWorld = r * r_sWorld * Math.cos(phi);
    const yWorld = r * r_sWorld * Math.sin(phi);
    if (r * r_sWorld <= maxWorldR) {
      points.push({ x: xWorld, y: yWorld, r: r * r_sWorld });
    }

    if (r <= R_S_UNIT * 1.001) break; // captured (crossed event horizon)
    if (phi > Math.PI && r > 8 * R_S_UNIT) break; // escaped to infinity

    // RK4
    const [k1_1, k1_2] = geodesicDerivative(y1, y2);
    const [k2_1, k2_2] = geodesicDerivative(y1 + 0.5 * dPhi * k1_1, y2 + 0.5 * dPhi * k1_2);
    const [k3_1, k3_2] = geodesicDerivative(y1 + 0.5 * dPhi * k2_1, y2 + 0.5 * dPhi * k2_2);
    const [k4_1, k4_2] = geodesicDerivative(y1 + dPhi * k3_1, y2 + dPhi * k3_2);
    y1 += (dPhi / 6) * (k1_1 + 2 * k2_1 + 2 * k3_1 + k4_1);
    y2 += (dPhi / 6) * (k1_2 + 2 * k2_2 + 2 * k3_2 + k4_2);
    phi += dPhi;

    if (y1 <= 0 || !Number.isFinite(y1) || !Number.isFinite(y2)) break;
  }

  return points;
}

/** Time dilation factor at radius r: √(1 − r_s/r). Returns 0–1. */
function timeDilationFactor(r: number, r_s: number): number {
  if (r <= r_s || !Number.isFinite(r)) return 0;
  const t = 1 - r_s / r;
  return t > 0 ? Math.sqrt(t) : 0;
}

// ——— Slider row ———
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/70 px-4 py-3 shadow-sm">
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="flex items-center gap-3">
        <span className="min-w-[3.5rem] text-right text-sm tabular-nums text-neutral-300">
          {formatNum(value, 2)}
          {unit ? ` ${unit}` : ""}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="physics-range flex-1 min-w-0"
          aria-label={label}
        />
      </div>
    </div>
  );
}

// ——— Canvas constants ———
const BG = "#030712";
const GRID = "rgba(100, 116, 139, 0.12)";
const AXIS = "rgba(226, 232, 240, 0.75)";
const TEXT = "rgba(226, 232, 240, 0.95)";
const SUBTEXT = "rgba(148, 163, 184, 0.85)";
const HORIZON_FILL = "#0f172a";
const HORIZON_STROKE = "rgba(248, 250, 252, 0.5)";
const RAY_COLOR = "#38bdf8";
const RAY_HIGHLIGHT = "#7dd3fc";
const PHOTON_COLOR = "#fde047";
const ACCRETION = "rgba(251, 191, 36, 0.25)";

function SimulatorCanvas({
  params,
  time,
  playing,
}: {
  params: Params;
  time: number;
  playing: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

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

    const leftPad = 52 * dpr;
    const rightPad = 16 * dpr;
    const topPad = 28 * dpr;
    const bottomPad = 40 * dpr;
    const plotW = w - leftPad - rightPad;
    const plotH = h - topPad - bottomPad;

    const r_s = schwarzschildRadiusWorld(params.massStrength);

    const worldToScreen = (wx: number, wy: number) => {
      const scale = Math.min(plotW, plotH) / 8;
      const cx = leftPad + plotW / 2;
      const cy = topPad + plotH / 2;
      return {
        x: cx + wx * scale,
        y: cy - wy * scale,
      };
    };

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    const scale = Math.min(plotW, plotH) / 8;
    const cx = leftPad + plotW / 2;
    const cy = topPad + plotH / 2;

    // Grid
    const gridExtent = 4;
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1 * dpr;
    for (let g = -gridExtent; g <= gridExtent; g += 1) {
      ctx.beginPath();
      ctx.moveTo(
        leftPad + ((g + gridExtent) / (2 * gridExtent)) * plotW,
        topPad
      );
      ctx.lineTo(
        leftPad + ((g + gridExtent) / (2 * gridExtent)) * plotW,
        topPad + plotH
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(leftPad, topPad + ((g + gridExtent) / (2 * gridExtent)) * plotH);
      ctx.lineTo(
        leftPad + plotW,
        topPad + ((g + gridExtent) / (2 * gridExtent)) * plotH
      );
      ctx.stroke();
    }

    // Event horizon (circle at r = r_s)
    const rScreen = r_s * scale;
    ctx.fillStyle = HORIZON_FILL;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, rScreen), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = HORIZON_STROKE;
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // Photon sphere (unstable circular orbit at r = 1.5 r_s)
    const rPhotonSphere = 1.5 * r_s * scale;
    if (rPhotonSphere > rScreen + 2) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.arc(cx, cy, rPhotonSphere, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Accretion glow just outside horizon
    const grad = ctx.createRadialGradient(cx, cy, Math.max(1, rScreen * 0.5), cx, cy, rScreen * 1.8);
    grad.addColorStop(0, "rgba(251, 191, 36, 0)");
    grad.addColorStop(0.6, ACCRETION);
    grad.addColorStop(1, "rgba(251, 191, 36, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rScreen * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Light rays
    const rays = [
      params.impactParam,
      params.impactParam - 0.5,
      params.impactParam + 0.5,
      params.impactParam - 1,
      params.impactParam + 1,
    ].filter((b) => Math.abs(b) > 0.3);

    const numToShow = Math.min(params.numRays, rays.length);
    const allPoints = rays
      .slice(0, numToShow)
      .map((b) => integrateSchwarzschildRay(b, params.massStrength, r_s));

    allPoints.forEach((points, idx) => {
      const isMain = idx === 0;
      ctx.strokeStyle = isMain ? RAY_HIGHLIGHT : RAY_COLOR;
      ctx.lineWidth = (isMain ? 2.5 : 1.5) * dpr;
      ctx.beginPath();
      points.forEach((p, i) => {
        const { x, y } = worldToScreen(p.x, p.y);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // Moving photon on main ray + time-dilation tint (slower near horizon)
    const mainPoints = allPoints[0] ?? [];
    const len = mainPoints.length;
    const seg = (time * 0.4) % Math.max(1, len - 1);
    const i0 = Math.floor(seg);
    const i1 = Math.min(i0 + 1, len - 1);
    const t = seg - i0;
    const p0 = mainPoints[i0];
    const p1 = mainPoints[i1];
    if (p0 && p1) {
      const px = p0.x + (p1.x - p0.x) * t;
      const py = p0.y + (p1.y - p0.y) * t;
      const r = p0.r + (p1.r - p0.r) * t;
      const dilation = timeDilationFactor(r, r_s);
      const { x, y } = worldToScreen(px, py);
      ctx.globalAlpha = 0.5 + 0.5 * dilation; // dimmer = slower time
      ctx.fillStyle = PHOTON_COLOR;
      ctx.beginPath();
      ctx.arc(x, y, 5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(253, 224, 71, 0.8)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Axis labels
    ctx.fillStyle = SUBTEXT;
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("x (sim units)", leftPad + plotW / 2, topPad + plotH + 10 * dpr);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("y", leftPad - 6 * dpr, topPad + plotH / 2);

    // HUD
    const bCrit = criticalImpactParam();
    ctx.fillStyle = TEXT;
    ctx.font = `${11 * dpr}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hudX = leftPad + 8 * dpr;
    const hudY = topPad + 8 * dpr;
    const lineH = 16 * dpr;
    ctx.fillText("Event horizon (r = r_s)", hudX, hudY);
    ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
    ctx.fillText("Photon sphere r = 1.5 r_s (dashed)", hudX, hudY + lineH);
    ctx.fillStyle = RAY_COLOR;
    ctx.fillText("Null geodesics (RK4, full Schwarzschild)", hudX, hudY + 2 * lineH);
    ctx.fillStyle = SUBTEXT;
    ctx.fillText(`b_crit = ${formatNum(bCrit, 2)} r_s · b < b_crit ⇒ capture`, hudX, hudY + 3 * lineH);
  }, [params, time]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      last = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#030712]"
      style={{ aspectRatio: "16/9" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ aspectRatio: "16/9" }}
      />
    </div>
  );
}

export default function BlackHolesSimulation() {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const lastTickRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setTime((t) => t + dt * params.simSpeed);
      rafRef.current = requestAnimationFrame(tick);
    };
    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, params.simSpeed]);

  const reset = () => {
    setParams(DEFAULT_PARAMS);
    setTime(0);
    setPlaying(true);
  };

  return (
    <main className="min-h-screen bg-[#020617]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left: 60% — simulator + bottom controls */}
          <div className="relative w-full shrink-0 lg:w-[60%]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs text-neutral-400">
                Event horizon, light bending, and time dilation. Rays and photon path update with mass and impact parameter.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  onClick={() => setTime(0)}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
                >
                  Reset time
                </button>
              </div>
            </div>

            <SimulatorCanvas params={params} time={time} playing={playing} />

            {/* Bottom: full-width parameter panel */}
            <div className="relative z-10 mt-6 rounded-3xl border border-neutral-700 bg-neutral-950/50 p-4 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Parameters</div>
                  <div className="text-xs text-neutral-400">
                    Mass sets event horizon size; impact parameter sets closest approach of light.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
                >
                  Reset
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SliderRow
                  label="Mass strength, M"
                  value={params.massStrength}
                  min={0.5}
                  max={2}
                  step={0.1}
                  unit=""
                  onChange={(massStrength) =>
                    setParams((p) => ({ ...p, massStrength: clamp(massStrength, 0.5, 2) }))
                  }
                />
                <SliderRow
                  label="Impact param., b / r_s"
                  value={params.impactParam}
                  min={1.2}
                  max={4}
                  step={0.05}
                  unit=""
                  onChange={(impactParam) =>
                    setParams((p) => ({ ...p, impactParam: clamp(impactParam, 1.2, 4) }))
                  }
                />
                <SliderRow
                  label="Number of rays"
                  value={params.numRays}
                  min={1}
                  max={5}
                  step={1}
                  unit=""
                  onChange={(numRays) =>
                    setParams((p) => ({ ...p, numRays: Math.round(clamp(numRays, 1, 5)) }))
                  }
                />
                <SliderRow
                  label="Sim speed"
                  value={params.simSpeed}
                  min={0.5}
                  max={2}
                  step={0.25}
                  unit="×"
                  onChange={(simSpeed) =>
                    setParams((p) => ({ ...p, simSpeed }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Right: 40% — info panel */}
          <aside className="w-full lg:w-[40%]">
            <div className="h-full rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">
                Black Holes — Event Horizon, Light Bending & Time Dilation
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                A black hole is a region where gravity is so strong that nothing, not even light, can escape. The boundary is the event horizon at radius r_s. Light rays bend around the hole; time runs slower near the horizon (gravitational time dilation). Matter crossing the horizon is stretched by tidal forces (spaghettification).
              </p>

              <div className="mt-6 rounded-2xl border border-neutral-700 bg-neutral-900/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Natural units &amp; exact equation
                </div>
                <div className="mt-3 space-y-3 text-sm font-mono text-neutral-200">
                  <div>
                    <span className="text-cyan-300">G = c = 1 ⇒ r_s = 2M</span>
                  </div>
                  <div>
                    <span className="text-cyan-300">d²u/dφ² + u = 3 M u²</span>
                    <div className="mt-1 font-sans text-xs font-normal text-neutral-400">
                      Null geodesic in Schwarzschild; u = 1/r. First integral: (du/dφ)² = 1/b² − u² + 2M u³.
                    </div>
                  </div>
                  <div>
                    <span className="text-cyan-300">b_crit = (3√3/2) r_s ≈ 2.60 r_s</span>
                    <div className="mt-1 font-sans text-xs font-normal text-neutral-400">
                      b &gt; b_crit → escape; b = b_crit → unstable orbit (photon sphere); b &lt; b_crit → capture.
                    </div>
                  </div>
                  <div>
                    <span className="text-cyan-300">Photon sphere: r = 1.5 r_s</span>
                    <div className="mt-1 font-sans text-xs font-normal text-neutral-400">
                      Unstable circular orbit for photons. Trajectories from RK4 integration only (no weak-field formula).
                    </div>
                  </div>
                  <div>
                    <span className="text-cyan-300">Δt' = Δt √(1 − r_s/r)</span>
                    <div className="mt-1 font-sans text-xs font-normal text-neutral-400">
                      Time dilation (r &gt; r_s). Photon dims near horizon in the sim.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Variables (natural units)
                </div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">r_s</dt>
                    <dd className="text-neutral-400">Schwarzschild radius (event horizon)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">M</dt>
                    <dd className="text-neutral-400">mass (r_s = 2M)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">b</dt>
                    <dd className="text-neutral-400">impact parameter (in r_s)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">φ</dt>
                    <dd className="text-neutral-400">azimuthal angle (rad)</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-700 bg-neutral-900/40 p-4 text-xs text-neutral-400">
                Sim uses RK4 on the exact Schwarzschild null geodesic equation. Set b just above b_crit to see multiple windings and large deflection; set b &lt; b_crit to see sharp capture. Dashed circle is the photon sphere at r = 1.5 r_s.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
