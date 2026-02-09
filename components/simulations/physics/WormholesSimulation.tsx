"use client";

import React, { useEffect, useRef, useState } from "react";

// ——— Morris–Thorne Wormhole: Full geodesic integration ———
// ds² = -e^{2Φ(r)} dt² + dr²/(1 - b(r)/r) + r² dφ²
// b(r) = r0²/r, Φ(r) = -k/r (or 0). Christoffel symbols computed numerically.
// Geodesics integrated via RK4. Embedding diagram from dz/dr = ±1/√(r/b(r) - 1).

const DR = 1e-6;

type Params = {
  throatRadius: number;
  redshiftK: number;
  impactParam: number;
  geodesicType: "null" | "timelike";
  stabilityEpsilon: number;
  numRays: number;
  simSpeed: number;
};

const DEFAULT_PARAMS: Params = {
  throatRadius: 1,
  redshiftK: 0,
  impactParam: 2.5,
  geodesicType: "null",
  stabilityEpsilon: 0.05,
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

// ——— Morris–Thorne: b(r) = r0²/r, Φ(r) = -k/r ———
function shapeFunc(r: number, r0: number): number {
  if (r <= 0) return 0;
  return (r0 * r0) / r;
}

function shapeFuncPrime(r: number, r0: number): number {
  if (r <= 0) return 0;
  return -(r0 * r0) / (r * r);
}

function redshiftFunc(r: number, k: number): number {
  if (r <= 0 || k === 0) return 0;
  return -k / r;
}

function redshiftFuncPrime(r: number, k: number): number {
  if (r <= 0 || k === 0) return 0;
  return k / (r * r);
}

// Metric components (covariant)
function gTT(r: number, r0: number, k: number): number {
  const phi = redshiftFunc(r, k);
  return -Math.exp(2 * phi);
}

function gRR(r: number, r0: number): number {
  const b = shapeFunc(r, r0);
  const denom = 1 - b / r;
  if (denom <= 0) return 1e10;
  return 1 / denom;
}

function gPhPh(r: number): number {
  return r * r;
}

// Numerical derivatives
function dGttDr(r: number, r0: number, k: number): number {
  return (gTT(r + DR, r0, k) - gTT(r - DR, r0, k)) / (2 * DR);
}

function dGrrDr(r: number, r0: number): number {
  return (gRR(r + DR, r0) - gRR(r - DR, r0)) / (2 * DR);
}

// Christoffel symbols (equatorial, diagonal metric)
function christoffel(
  r: number,
  phi: number,
  r0: number,
  k: number
): {
  Gttr: number;
  Grtt: number;
  Grrr: number;
  Grphph: number;
  Gphrph: number;
} {
  const gtt = gTT(r, r0, k);
  const grr = gRR(r, r0);
  const gphph = gPhPh(r);
  const invGtt = 1 / gtt;
  const invGrr = 1 / grr;
  const invGphph = 1 / gphph;

  const dgtt = dGttDr(r, r0, k);
  const dgrr = dGrrDr(r, r0);

  const Gttr = 0.5 * invGtt * dgtt;
  const Grtt = -0.5 * invGrr * dgtt;
  const Grrr = 0.5 * invGrr * dgrr;
  const Grphph = -0.5 * invGrr * 2 * r;
  const Gphrph = 0.5 * invGphph * 2 * r;

  return { Gttr, Grtt, Grrr, Grphph, Gphrph };
}

// Geodesic acceleration: d²x^μ/dλ² = -Γ^μ_{αβ} u^α u^β
// State: [t, r, φ, ut, ur, uφ]
type GeodesicState = [number, number, number, number, number, number];

function geodesicDerivative(
  state: GeodesicState,
  r0: number,
  k: number,
  isNull: boolean
): GeodesicState {
  const [, r, ph, ut, ur, uph] = state;
  if (r <= r0 * 1.001) return [0, 0, 0, 0, 0, 0];

  const G = christoffel(r, ph, r0, k);

  const d2t = -2 * G.Gttr * ut * ur;
  const d2r =
    -G.Grtt * ut * ut - G.Grrr * ur * ur - G.Grphph * uph * uph;
  const d2ph = -2 * G.Gphrph * ur * uph;

  return [ut, ur, uph, d2t, d2r, d2ph];
}

// RK4 step
function rk4Step(
  state: GeodesicState,
  dlambda: number,
  r0: number,
  k: number,
  isNull: boolean
): GeodesicState {
  const k1 = geodesicDerivative(state, r0, k, isNull);
  const s2: GeodesicState = [
    state[0] + 0.5 * dlambda * k1[0],
    state[1] + 0.5 * dlambda * k1[1],
    state[2] + 0.5 * dlambda * k1[2],
    state[3] + 0.5 * dlambda * k1[3],
    state[4] + 0.5 * dlambda * k1[4],
    state[5] + 0.5 * dlambda * k1[5],
  ];
  const k2 = geodesicDerivative(s2, r0, k, isNull);
  const s3: GeodesicState = [
    state[0] + 0.5 * dlambda * k2[0],
    state[1] + 0.5 * dlambda * k2[1],
    state[2] + 0.5 * dlambda * k2[2],
    state[3] + 0.5 * dlambda * k2[3],
    state[4] + 0.5 * dlambda * k2[4],
    state[5] + 0.5 * dlambda * k2[5],
  ];
  const k3 = geodesicDerivative(s3, r0, k, isNull);
  const s4: GeodesicState = [
    state[0] + dlambda * k3[0],
    state[1] + dlambda * k3[1],
    state[2] + dlambda * k3[2],
    state[3] + dlambda * k3[3],
    state[4] + dlambda * k3[4],
    state[5] + dlambda * k3[5],
  ];
  const k4 = geodesicDerivative(s4, r0, k, isNull);

  const next: GeodesicState = [
    state[0] + (dlambda / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    state[1] + (dlambda / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    state[2] + (dlambda / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    state[3] + (dlambda / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]),
    state[4] + (dlambda / 6) * (k1[4] + 2 * k2[4] + 2 * k3[4] + k4[4]),
    state[5] + (dlambda / 6) * (k1[5] + 2 * k2[5] + 2 * k3[5] + k4[5]),
  ];
  return next;
}

// Enforce constraint: null → g_μν u^μ u^ν = 0; timelike → -1
function rescaleFourVelocity(
  state: GeodesicState,
  r0: number,
  k: number,
  isNull: boolean
): GeodesicState {
  const [t, r, ph, ut, ur, uph] = state;
  const gtt = gTT(r, r0, k);
  const grr = gRR(r, r0);
  const gphph = gPhPh(r);

  if (isNull) {
    const radicand = (-gtt * ut * ut - gphph * uph * uph) / (grr > 0 ? grr : 1);
    if (radicand >= 0) {
      const signUr = ur >= 0 ? 1 : -1;
      const newUr = signUr * Math.sqrt(radicand);
      return [t, r, ph, ut, newUr, uph];
    }
    return state;
  }
  const norm = gtt * ut * ut + grr * ur * ur + gphph * uph * uph;
  const target = -1;
  if (Math.abs(norm - target) < 1e-12) return state;
  const scale = Math.sqrt(target / norm);
  if (!Number.isFinite(scale) || scale <= 0) return state;
  return [t, r, ph, ut * scale, ur * scale, uph * scale];
}

// Integrate geodesic; returns (r, φ, z) with z from embedding for visualization
function integrateGeodesic(
  r0: number,
  k: number,
  impactParam: number,
  isNull: boolean,
  rInit: number,
  maxSteps: number,
  dlambda: number
): { r: number; phi: number; z: number }[] {
  const points: { r: number; phi: number; z: number }[] = [];
  const b = impactParam;

  const r = rInit;
  const gtt = gTT(r, r0, k);
  const grr = gRR(r, r0);
  const gphph = gPhPh(r);

  const ut = 1;
  const uph = b / (r * r);
  const urSq = (grr > 0 ? 1 / grr : 0) * (-gtt * ut * ut - gphph * uph * uph);
  let ur = urSq > 0 ? -Math.sqrt(urSq) : -0.1;

  let state: GeodesicState = [0, r, 0, ut, ur, uph];
  state = rescaleFourVelocity(state, r0, k, isNull);

  let z = 0;
  let sheet: 1 | -1 = 1;
  let prevR = r;
  const dzStep = (rMid: number, dR: number) => {
    if (rMid <= r0 * 1.001) return 0;
    const bVal = shapeFunc(rMid, r0);
    const arg = rMid / bVal - 1;
    if (arg <= 0) return 0;
    return (sheet * dR) / Math.sqrt(arg);
  };

  for (let i = 0; i < maxSteps; i++) {
    const [, rr, ph] = state;
    if (rr <= r0 * 0.98 || rr > 50 || !Number.isFinite(rr)) break;
    z += dzStep((prevR + rr) / 2, rr - prevR);
    if (rr <= r0 * 1.02 && prevR > rr) sheet = -1;
    prevR = rr;
    points.push({ r: rr, phi: ph, z });
    state = rk4Step(state, dlambda, r0, k, isNull);
    state = rescaleFourVelocity(state, r0, k, isNull);
  }
  return points;
}

// Embedding diagram: dz/dr = ±1/√(r/b(r) - 1). Integrate to get z(r).
function embeddingZ(r: number, r0: number, sign: 1 | -1): number {
  if (r <= r0) return 0;
  const b = shapeFunc(r, r0);
  const arg = r / b - 1;
  if (arg <= 0) return 0;
  const dzdr = 1 / Math.sqrt(arg);
  return sign * dzdr;
}

function integrateEmbedding(
  r0: number,
  rMin: number,
  rMax: number,
  numPts: number,
  sign: 1 | -1
): { r: number; z: number }[] {
  const pts: { r: number; z: number }[] = [];
  let z = 0;
  const dr = (rMax - rMin) / Math.max(1, numPts - 1);
  for (let i = 0; i < numPts; i++) {
    const r = rMin + i * dr;
    if (r <= r0 * 1.001) {
      pts.push({ r, z: 0 });
      continue;
    }
    const dzdr = embeddingZ(r, r0, sign);
    z += dzdr * dr;
    pts.push({ r, z });
  }
  return pts;
}

// Stress-energy from Einstein: G_μν = 8π T_μν. Null energy: ρ + p_r < 0.
// For Morris-Thorne, at throat: ρ + p_r ∝ (b' - 1)/(2r²) < 0 when b' < 1.
// b(r) = r0²/r ⇒ b'(r0) = -1, so b' - 1 = -2 < 0 ⇒ NEC violated.
function rhoPlusPrAtThroat(r0: number): number {
  const b = r0;
  const bp = shapeFuncPrime(r0, r0);
  return (bp - 1) / (2 * r0 * r0);
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

const BG = "#050810";
const GRID = "rgba(100, 116, 139, 0.12)";
const EMBED_COLOR = "rgba(34, 211, 238, 0.5)";
const EMBED_STROKE = "#22d3ee";
const RAY_COLOR = "#7dd3fc";
const RAY_HIGHLIGHT = "#38bdf8";
const PHOTON_COLOR = "#fde047";
const TEXT = "rgba(226, 232, 240, 0.95)";
const SUBTEXT = "rgba(148, 163, 184, 0.85)";
const NEC_VIOLATION = "rgba(251, 146, 60, 0.9)";

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
    const topPad = 36 * dpr;
    const bottomPad = 44 * dpr;
    const plotW = w - leftPad - rightPad;
    const plotH = h - topPad - bottomPad;
    const cx = leftPad + plotW / 2;
    const cy = topPad + plotH / 2;

    const r0Base = params.throatRadius;
    const eps = params.stabilityEpsilon;
    const omega = 2;
    const r0 = r0Base + eps * Math.sin(omega * time);

    const rMax = 4;
    const zMax = 2.5;
    const scaleR = plotW / (2 * rMax);
    const scaleZ = plotH / (2 * zMax);

    const embedToScreen = (r: number, z: number, side: "L" | "R") => {
      const sx = side === "L" ? cx - r * scaleR : cx + r * scaleR;
      const sy = cy - z * scaleZ;
      return { x: sx, y: sy };
    };

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    const numEmbedPts = 80;
    const embedLeft = integrateEmbedding(r0, r0, rMax, numEmbedPts, 1);
    const embedRight = integrateEmbedding(r0, r0, rMax, numEmbedPts, -1);

    ctx.strokeStyle = EMBED_STROKE;
    ctx.lineWidth = 2 * dpr;
    ctx.fillStyle = EMBED_COLOR;
    ctx.beginPath();
    embedLeft.forEach((p, i) => {
      const { x, y } = embedToScreen(p.r, p.z, "L");
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    embedRight.forEach((p, i) => {
      const { x, y } = embedToScreen(p.r, p.z, "R");
      ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const rInit = 3.5 * r0;
    const rays = [
      params.impactParam,
      params.impactParam - 0.5,
      params.impactParam + 0.5,
    ].filter((b) => b > r0 * 1.2);

    const dlambda = 0.02;
    const maxSteps = 800;
    const isNull = params.geodesicType === "null";

    const allTrajectories = rays
      .slice(0, params.numRays)
      .map((b) =>
        integrateGeodesic(r0, params.redshiftK, b, isNull, rInit, maxSteps, dlambda)
      );

    allTrajectories.forEach((points, idx) => {
      const isMain = idx === 0;
      ctx.strokeStyle = isMain ? RAY_HIGHLIGHT : RAY_COLOR;
      ctx.lineWidth = (isMain ? 2.5 : 1.5) * dpr;
      ctx.beginPath();
      points.forEach((p, i) => {
        const side = p.z >= 0 ? "L" : "R";
        const { x: sx, y: sy } = embedToScreen(p.r, p.z, side);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
    });

    const mainPts = allTrajectories[0] ?? [];
    const pathLen = mainPts.length;
    const seg = (time * 2) % Math.max(1, pathLen - 1);
    const i0 = Math.floor(seg);
    const i1 = Math.min(i0 + 1, pathLen - 1);
    const t = seg - i0;
    const p0 = mainPts[i0];
    const p1 = mainPts[i1];
    if (p0 && p1) {
      const rp = p0.r + (p1.r - p0.r) * t;
      const zp = p0.z + (p1.z - p0.z) * t;
      const side = zp >= 0 ? "L" : "R";
      const { x: sx, y: sy } = embedToScreen(rp, zp, side);
      ctx.fillStyle = PHOTON_COLOR;
      ctx.strokeStyle = "rgba(253, 224, 71, 0.8)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.arc(sx, sy, 6 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = SUBTEXT;
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("r (embedding)", cx, topPad + plotH + 10 * dpr);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("z", leftPad - 8 * dpr, cy);

    ctx.fillStyle = TEXT;
    ctx.font = `${11 * dpr}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hudX = leftPad + 8 * dpr;
    const hudY = topPad + 8 * dpr;
    ctx.fillStyle = RAY_COLOR;
    ctx.fillText("Geodesics (RK4, Morris–Thorne)", hudX, hudY);
    ctx.fillStyle = SUBTEXT;
    ctx.fillText(`r₀ = ${formatNum(r0, 2)} · b = ${formatNum(params.impactParam, 2)}`, hudX, hudY + 16 * dpr);
  }, [params, time]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-teal-500/40 bg-[#050810]"
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

export default function WormholesSimulation() {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setTime((t) => t + dt * params.simSpeed);
      requestAnimationFrame(tick);
    };
    lastTickRef.current = performance.now();
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, params.simSpeed]);

  const reset = () => {
    setParams(DEFAULT_PARAMS);
    setTime(0);
    setPlaying(true);
  };

  const rhoPlusPr = rhoPlusPrAtThroat(params.throatRadius);

  return (
    <main className="min-h-screen bg-[#020617]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="relative w-full shrink-0 lg:w-[60%]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs text-neutral-400">
                Morris–Thorne wormhole: embedding diagram from dz/dr = ±1/√(r/b(r)−1). Geodesics integrated via RK4 from metric.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-200 hover:border-teal-400 hover:bg-teal-500/20"
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

            <div className="relative z-10 mt-6 rounded-3xl border border-neutral-700 bg-neutral-950/50 p-4 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Parameters</div>
                  <div className="text-xs text-neutral-400">
                    Throat r₀, redshift k, impact param b. Geodesics computed from metric.
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
                  label="Throat r₀"
                  value={params.throatRadius}
                  min={0.5}
                  max={2}
                  step={0.05}
                  unit=""
                  onChange={(throatRadius) =>
                    setParams((p) => ({ ...p, throatRadius: clamp(throatRadius, 0.5, 2) }))
                  }
                />
                <SliderRow
                  label="Redshift k (Φ = −k/r)"
                  value={params.redshiftK}
                  min={0}
                  max={0.5}
                  step={0.02}
                  unit=""
                  onChange={(redshiftK) =>
                    setParams((p) => ({ ...p, redshiftK: clamp(redshiftK, 0, 0.5) }))
                  }
                />
                <SliderRow
                  label="Impact param. b"
                  value={params.impactParam}
                  min={params.throatRadius * 1.1}
                  max={5}
                  step={0.1}
                  unit=""
                  onChange={(impactParam) =>
                    setParams((p) => ({
                      ...p,
                      impactParam: clamp(impactParam, p.throatRadius * 1.1, 5),
                    }))
                  }
                />
                <SliderRow
                  label="Stability ε"
                  value={params.stabilityEpsilon}
                  min={0}
                  max={0.2}
                  step={0.01}
                  unit=""
                  onChange={(stabilityEpsilon) =>
                    setParams((p) => ({ ...p, stabilityEpsilon: clamp(stabilityEpsilon, 0, 0.2) }))
                  }
                />
                <SliderRow
                  label="Num. rays"
                  value={params.numRays}
                  min={1}
                  max={5}
                  step={1}
                  unit=""
                  onChange={(numRays) =>
                    setParams((p) => ({
                      ...p,
                      numRays: Math.round(clamp(numRays, 1, 5)),
                    }))
                  }
                />
                <div className="flex flex-col gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/70 px-4 py-3 shadow-sm">
                  <div className="text-sm font-semibold text-white">Geodesic type</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, geodesicType: "null" }))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        params.geodesicType === "null"
                          ? "bg-teal-500/30 text-teal-200 border border-teal-500/50"
                          : "border border-neutral-600 text-neutral-400 hover:bg-neutral-800"
                      }`}
                    >
                      Null (light)
                    </button>
                    <button
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, geodesicType: "timelike" }))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        params.geodesicType === "timelike"
                          ? "bg-teal-500/30 text-teal-200 border border-teal-500/50"
                          : "border border-neutral-600 text-neutral-400 hover:bg-neutral-800"
                      }`}
                    >
                      Timelike (massive)
                    </button>
                  </div>
                </div>
                <SliderRow
                  label="Sim speed"
                  value={params.simSpeed}
                  min={0.5}
                  max={2}
                  step={0.25}
                  unit="×"
                  onChange={(simSpeed) => setParams((p) => ({ ...p, simSpeed }))}
                />
              </div>

              <div className="mt-4 flex items-center gap-4 rounded-xl border border-neutral-700 bg-neutral-900/50 px-4 py-3">
                <span className="text-xs font-semibold text-neutral-300">Energy condition at throat:</span>
                <span className={rhoPlusPr < 0 ? "text-amber-400 font-mono text-sm" : "text-neutral-400 text-sm"}>
                  ρ + p_r = {formatNum(rhoPlusPr, 4)} {rhoPlusPr < 0 && "(NEC violated)"}
                </span>
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[40%]">
            <div className="h-full rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl">
              <div className="text-sm font-semibold text-white">
                Wormholes — Morris–Thorne Geodesics
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                Morris–Thorne metric (G=c=1): ds² = −e{"^{2Φ}"} dt² + dr²/(1−b/r) + r² dΩ². Shape b(r)=r₀²/r; throat at r=r₀. Geodesics integrated via RK4 from Christoffel symbols. Embedding diagram from dz/dr = ±1/√(r/b−1). Exotic matter violates NEC: ρ+p_r &lt; 0 at throat.
              </p>

              <div className="mt-6 rounded-2xl border border-neutral-700 bg-neutral-900/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Metric &amp; geodesic</div>
                <div className="mt-3 space-y-2 text-sm font-mono text-neutral-200">
                  <div><span className="text-teal-300">ds² = −e^(2Φ) dt² + dr²/(1−b/r) + r² dφ²</span></div>
                  <div><span className="text-teal-300">b(r) = r₀²/r</span></div>
                  <div><span className="text-teal-300">Φ(r) = −k/r</span></div>
                  <div className="text-neutral-400 font-sans font-normal">
                    d²x^μ/dλ² + Γ^μ{"_{αβ}"} u^α u^β = 0 integrated with RK4.
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Variables</div>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">r₀</dt>
                    <dd className="text-neutral-400">throat radius</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">b(r)</dt>
                    <dd className="text-neutral-400">shape function</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">Φ(r)</dt>
                    <dd className="text-neutral-400">redshift (e{"^{2Φ}"}≠0 ⇒ no horizon)</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-200">ρ + p_r</dt>
                    <dd className="text-neutral-400">NEC: &lt;0 ⇒ exotic matter</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-neutral-300">
                <span className="font-semibold text-amber-400">NEC violation:</span> At the throat, b&apos;(r₀)=−1, so ρ+p_r ∝ (b&apos;−1)/(2r²) &lt; 0. Traversable wormholes require exotic matter.
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
