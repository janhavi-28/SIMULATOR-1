"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// -----------------------------
// Types & constants
// -----------------------------

interface RutherfordParams {
  /** Nuclear charge number (unitless). Gold: Z = 79. */
  Z: number;
  /** Alpha kinetic energy (MeV). Higher energy → smaller deflection. */
  energyMeV: number;
  /** Approximate emission rate of α-particles (particles per simulated second). */
  emissionRate: number;
  /** Half-width of incoming beam around nucleus (fm). */
  beamHalfWidthFm: number;
  /** Effective nuclear radius / softening length (fm). */
  nucleusRadiusFm: number;
}

interface Particle {
  id: number;
  // Position, in arbitrary femtometre units (for labeling only)
  x: number;
  y: number;
  // Velocity in simulation units
  vx: number;
  vy: number;
  // Has the particle reached the foil region yet?
  enteredFoil: boolean;
  // Used for fading / trail intensity
  alpha: number;
}

interface Stats {
  launched: number;
  passingCount: number;
  scatteredCount: number;
  forwardCount: number;
  backscatterCount: number;
  meanExitAngleDeg: number;
  backscatterPercent: number;
}

const DEFAULT_PARAMS: RutherfordParams = {
  Z: 79,
  energyMeV: 5,
  emissionRate: 35,
  beamHalfWidthFm: 35,
  nucleusRadiusFm: 7,
};

// -----------------------------
// Utility helpers
// -----------------------------

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function formatNumber(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

// -----------------------------
// Reusable slider row
// -----------------------------

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  accentClassName?: string;
  onChange: (v: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  accentClassName,
  onChange,
}) => {
  // Extract accent color from className (e.g., bg-rose-400 -> #fb7185 approx)
  // Let's rely on standard physics-range styles from global css or inline style accentColor
  // For simplicity, we can use the accentClassName or map them.
  // The simplest fix to restore visibility is making it a block layout or giving flex-1,
  // but let's match the requested design: removing numbers below the label.
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">{label}</span>
        <span className="text-sm text-neutral-400 tabular-nums">
          {formatNumber(value, step < 1 ? 2 : 0)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`physics-range w-full h-2 cursor-pointer appearance-none rounded-full outline-none bg-neutral-800 ${accentClassName}`}
        aria-label={label}
      />
    </div>
  );
};

// -----------------------------
// Canvas-based Rutherford simulator
// -----------------------------

interface CanvasSimulatorProps {
  params: RutherfordParams;
  paused: boolean;
  onTogglePaused: () => void;
  onHardReset: () => void;
}

const CanvasSimulator: React.FC<CanvasSimulatorProps> = ({
  params,
  paused,
  onTogglePaused,
  onHardReset,
}) => {
  const paramsRef = useLatestRef(params);
  const pausedRef = useLatestRef(paused);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simulation state kept in refs for fast rAF loop
  const particlesRef = useRef<Particle[]>([]);
  const nextIdRef = useRef(1);
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [stats, setStats] = useState<Stats>({
    launched: 0,
    passingCount: 0,
    scatteredCount: 0,
    forwardCount: 0,
    backscatterCount: 0,
    meanExitAngleDeg: 0,
    backscatterPercent: 0,
  });
  const statsRef = useLatestRef(stats);

  // World extents in fm, used only for labeling & mapping to canvas
  const world = useMemo(
    () => ({
      left: -180,
      right: 220,
      halfHeight: clamp(params.beamHalfWidthFm * 1.6, 40, 160),
    }),
    [params.beamHalfWidthFm]
  );

  // Resize canvas with container & devicePixelRatio
  useEffect(() => {
    const holder = containerRef.current;
    const canvas = canvasRef.current;
    if (!holder || !canvas) return;

    const resize = () => {
      const rect = holder.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(holder);
    return () => ro.disconnect();
  }, []);

  const resetSimulation = () => {
    particlesRef.current = [];
    nextIdRef.current = 1;
    lastTsRef.current = null;
    setStats({
      launched: 0,
      passingCount: 0,
      scatteredCount: 0,
      forwardCount: 0,
      backscatterCount: 0,
      meanExitAngleDeg: 0,
      backscatterPercent: 0,
    });
  };

  // Reset whenever core parameters change significantly
  useEffect(() => {
    resetSimulation();
  }, [params.Z, params.energyMeV, params.beamHalfWidthFm, params.nucleusRadiusFm]);

  // Expose a "hard reset" hook to parent
  useEffect(() => {
    if (!onHardReset) return;
  }, [onHardReset]);

  const spawnParticle = () => {
    const p = paramsRef.current;
    const x0 = world.left;
    const y0 =
      (Math.random() * 2 - 1) * clamp(p.beamHalfWidthFm, 5, world.halfHeight);

    // v ∝ sqrt(E), reflecting E = ½ m v².
    const vBase = 85; // fm / s_sim at 1 MeV (visual scale)
    const speed = vBase * Math.sqrt(clamp(p.energyMeV, 0.3, 20));

    const particle: Particle = {
      id: nextIdRef.current++,
      x: x0,
      y: y0,
      vx: speed,
      vy: 0,
      enteredFoil: false,
      alpha: 0.95,
    };

    particlesRef.current.push(particle);
    setStats((s) => ({ ...s, launched: s.launched + 1 }));
  };

  // Integrate motion using a softened repulsive Coulomb force
  const integrate = (dt: number) => {
    const p = paramsRef.current;
    const particles = particlesRef.current;

    // Visual Coulomb strength, ∝ Z / E (classical Rutherford).
    const strength = (p.Z / clamp(p.energyMeV, 0.4, 20)) * 4200;
    const soft = Math.max(2, p.nucleusRadiusFm);

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];

      if (!pt.enteredFoil && pt.x >= -2) {
        pt.enteredFoil = true;
      }

      // r-vector from nucleus (0,0)
      const rx = pt.x;
      const ry = pt.y;
      const r2 = rx * rx + ry * ry + soft * soft;
      const invR = 1 / Math.sqrt(r2);
      const invR3 = invR * invR * invR;

      // Repulsive acceleration away from the nucleus
      const ax = strength * rx * invR3;
      const ay = strength * ry * invR3;

      pt.vx += ax * dt;
      pt.vy += ay * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;

      pt.alpha = clamp(pt.alpha - dt * 0.035, 0.3, 1);
    }

    // Remove particles that have left the region; update statistics
    const kept: Particle[] = [];
    let forward = 0;
    let back = 0;
    let passing = 0;
    let scattered = 0;
    const exitAngles: number[] = [];

    for (const pt of particles) {
      const outTop = Math.abs(pt.y) > world.halfHeight * 1.3;
      const outRight = pt.x > world.right;
      const outLeft = pt.x < world.left - 20;

      if (outRight) {
        forward++;
        const angle = Math.atan2(pt.vy, pt.vx); // radians
        exitAngles.push(angle);
        const angleDeg = (angle * 180) / Math.PI;
        if (Math.abs(angleDeg) < 10) {
          passing++;
        } else {
          scattered++;
        }
        continue;
      }

      if (outLeft && pt.enteredFoil) {
        back++;
        const angle = Math.atan2(pt.vy, pt.vx);
        exitAngles.push(angle);
        continue;
      }

      if (outTop) continue;

      kept.push(pt);
    }

    particlesRef.current = kept.slice(-520);

    if (forward || back) {
      setStats((s) => {
        const nextForward = s.forwardCount + forward;
        const nextBack = s.backscatterCount + back;
        const nextPassing = s.passingCount + passing;
        const nextScattered = s.scatteredCount + scattered;
        const totalExited = nextForward + nextBack;

        let meanExitAngleDeg = s.meanExitAngleDeg;
        if (exitAngles.length > 0) {
          const prevCount = Math.max(1, s.forwardCount + s.backscatterCount);
          const prevMeanRad = (meanExitAngleDeg * Math.PI) / 180;
          const sumPrev = prevMeanRad * prevCount;
          const sumNew = exitAngles.reduce((acc, a) => acc + a, 0);
          const nextMeanRad =
            (sumPrev + sumNew) / (prevCount + exitAngles.length);
          meanExitAngleDeg = (nextMeanRad * 180) / Math.PI;
        }

        const backscatterPercent =
          totalExited > 0 ? (nextBack / totalExited) * 100 : s.backscatterPercent;

        return {
          ...s,
          forwardCount: nextForward,
          backscatterCount: nextBack,
          passingCount: nextPassing,
          scatteredCount: nextScattered,
          meanExitAngleDeg,
          backscatterPercent,
        };
      });
    }
  };

  // Main animation loop
  useEffect(() => {
    const step = (timestamp: number) => {
      rafRef.current = window.requestAnimationFrame(step);

      if (pausedRef.current) {
        draw();
        return;
      }

      const last = lastTsRef.current;
      lastTsRef.current = timestamp;

      if (last == null) {
        draw();
        return;
      }

      const dt = clamp((timestamp - last) / 1000, 0, 1 / 30);

      // Spawn particles at a steady rate, controlled by parameter
      const spawnRate = clamp(paramsRef.current.emissionRate, 5, 90); // particles / s
      const expected = spawnRate * dt;
      // Simple stochastic spawning around expected value
      const whole = Math.floor(expected);
      for (let i = 0; i < whole; i++) spawnParticle();
      if (Math.random() < expected - whole) spawnParticle();

      integrate(dt);
      draw();
    };

    rafRef.current = window.requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drawing
  const draw = () => {
    const canvas = canvasRef.current;
    const holder = containerRef.current;
    if (!canvas || !holder) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = holder.getBoundingClientRect();
    const dpr = canvas.width / Math.max(1, rect.width);
    const w = canvas.width;
    const h = canvas.height;

    // Color palette: deep navy background, gold accents, cyan trails, crimson highlights
    const bg0 = "#0a1128"; // deep navy
    const bg1 = "#040817"; // slightly darker navy for gradient
    const gridColor = "rgba(0, 255, 255, 0.12)"; // subtle cyan grid
    const axisColor = "rgba(212, 175, 55, 0.85)"; // gold/amber axes
    const textColor = "rgba(248,250,252,0.96)"; // near-white
    const subtextColor = "rgba(180,198,255,0.9)"; // cool, readable labels
    const foilColor = "rgba(212,175,55,0.6)"; // gold foil line
    const nucleusCore = "#dc143c"; // crimson nucleus
    const nucleusGlow = "rgba(220,20,60,0.35)"; // crimson glow
    const alphaColor = "#00ffff"; // cyan velocity arrows
    const alphaTrail = "rgba(0,255,255,0.3)"; // cyan trails
    const zoneSoft = "rgba(212,175,55,0.2)"; // gold scatter zone
    const zoneStrong = "rgba(220,20,60,0.25)"; // crimson strong-scatter zone
    const accent = "#d4af37"; // gold HUD accent

    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, bg0);
    grad.addColorStop(1, bg1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Plot area
    const pad = 18 * dpr;
    const leftPad = 52 * dpr;
    const bottomPad = 36 * dpr;
    const topPad = 16 * dpr;

    const plotX0 = leftPad;
    const plotY0 = topPad;
    const plotW = w - leftPad - pad;
    const plotH = h - topPad - bottomPad;

    const xMin = world.left;
    const xMax = world.right;
    const yMin = -world.halfHeight;
    const yMax = world.halfHeight;

    const toPx = (xFm: number) =>
      plotX0 + ((xFm - xMin) / (xMax - xMin)) * plotW;
    const toPy = (yFm: number) =>
      plotY0 + (1 - (yFm - yMin) / (yMax - yMin)) * plotH;

    // Reference grid
    const xMajor = 50;
    const yMajor = 20;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1 * dpr;

    for (let x = Math.ceil(xMin / xMajor) * xMajor; x <= xMax; x += xMajor) {
      const px = toPx(x);
      ctx.beginPath();
      ctx.moveTo(px, plotY0);
      ctx.lineTo(px, plotY0 + plotH);
      ctx.stroke();
    }

    for (let y = Math.ceil(yMin / yMajor) * yMajor; y <= yMax; y += yMajor) {
      const py = toPy(y);
      ctx.beginPath();
      ctx.moveTo(plotX0, py);
      ctx.lineTo(plotX0 + plotW, py);
      ctx.stroke();
    }

    // Axes + labels
    ctx.fillStyle = subtextColor;
    ctx.font = `${12 * dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("x (fm)", plotX0 + plotW - 38 * dpr, plotY0 + plotH + 26 * dpr);
    ctx.fillText("y (fm)", plotX0, plotY0 - 8 * dpr);

    // y-axis ticks
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let y = Math.ceil(yMin / yMajor) * yMajor; y <= yMax; y += yMajor) {
      const py = toPy(y);
      ctx.fillText(`${y}`, plotX0 - 8 * dpr, py);
      ctx.strokeStyle = axisColor;
      ctx.beginPath();
      ctx.moveTo(plotX0 - 4 * dpr, py);
      ctx.lineTo(plotX0, py);
      ctx.stroke();
    }

    // Thin gold foil at x=0
    const foilX = toPx(0);
    ctx.strokeStyle = foilColor;
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(foilX, plotY0);
    ctx.lineTo(foilX, plotY0 + plotH);
    ctx.stroke();
    ctx.fillStyle = subtextColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("gold foil (x = 0)", foilX, plotY0 + plotH + 8 * dpr);

    // Nucleus at origin: glowing disc with halo
    const nx = toPx(0);
    const ny = toPy(0);
    const nR = Math.max(5 * dpr, (paramsRef.current.nucleusRadiusFm / (xMax - xMin)) * plotW * 1.8);

    // Outer glow
    const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, nR * 2.3);
    glow.addColorStop(0, nucleusGlow);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(nx, ny, nR * 2.3, 0, Math.PI * 2);
    ctx.fill();

    // Scattering zones (angle wedges)
    ctx.save();
    ctx.translate(nx, ny);
    const zoneRadius = nR * 3.6;

    // Mild-scatter zone: small angle |θ| < 10°
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, zoneRadius, (-10 * Math.PI) / 180, (10 * Math.PI) / 180);
    ctx.closePath();
    ctx.fillStyle = "rgba(56,189,248,0.20)";
    ctx.fill();

    // Medium-scatter zone: 10°–60°
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, zoneRadius * 1.08, (-60 * Math.PI) / 180, (-10 * Math.PI) / 180);
    ctx.arc(0, 0, zoneRadius * 1.08, (10 * Math.PI) / 180, (60 * Math.PI) / 180, false);
    ctx.closePath();
    ctx.fillStyle = zoneSoft;
    ctx.fill();

    // Strong backscatter zone: θ > 90°
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, zoneRadius * 1.35, (110 * Math.PI) / 180, (250 * Math.PI) / 180);
    ctx.closePath();
    ctx.fillStyle = zoneStrong;
    ctx.fill();
    ctx.restore();

    // Nucleus core
    ctx.fillStyle = nucleusCore;
    ctx.strokeStyle = "#F97373";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(nx, ny, nR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Beam direction arrow (incoming alpha particles)
    const beamY = toPy(0);
    const beamStartX = toPx(world.left + 20);
    const beamEndX = toPx(world.left + 80);
    ctx.strokeStyle = alphaColor;
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(beamStartX, beamY);
    ctx.lineTo(beamEndX, beamY);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(beamEndX, beamY);
    ctx.lineTo(beamEndX - 8 * dpr, beamY - 4 * dpr);
    ctx.lineTo(beamEndX - 8 * dpr, beamY + 4 * dpr);
    ctx.closePath();
    ctx.fillStyle = alphaColor;
    ctx.fill();

    // Draw particles and velocity vectors
    const particles = particlesRef.current;
    ctx.lineWidth = 1.6 * dpr;
    particles.forEach((pt) => {
      const px = toPx(pt.x);
      const py = toPy(pt.y);

      // Trail backwards along velocity
      const vLen = Math.hypot(pt.vx, pt.vy);
      const ux = vLen > 1e-6 ? pt.vx / vLen : 1;
      const uy = vLen > 1e-6 ? pt.vy / vLen : 0;
      const trailLength =
        12 * dpr + (pt.enteredFoil ? 10 * dpr : 0) + clamp(vLen * 0.02, 0, 16 * dpr);

      ctx.strokeStyle = alphaTrail;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - ux * trailLength, py + uy * trailLength);
      ctx.stroke();

      // Velocity arrow (directional indicator)
      const arrowLen = 12 * dpr;
      ctx.strokeStyle = alphaColor;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + ux * arrowLen, py - uy * arrowLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + ux * arrowLen, py - uy * arrowLen);
      ctx.lineTo(
        px + ux * arrowLen - uy * 3 * dpr,
        py - uy * arrowLen - ux * 3 * dpr
      );
      ctx.lineTo(
        px + ux * arrowLen + uy * 3 * dpr,
        py - uy * arrowLen + ux * 3 * dpr
      );
      ctx.closePath();
      ctx.fillStyle = alphaColor;
      ctx.fill();

      // Particle core
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = "#F9FAFB";
      ctx.beginPath();
      ctx.arc(px, py, 2.8 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // HUD: real-time statistics & annotations
    ctx.fillStyle = textColor;
    ctx.font = `${13 * dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hudX = plotX0 + 12 * dpr;
    const hudY = plotY0 + 10 * dpr;
    const line = 18 * dpr;

    ctx.fillText(`Z = ${paramsRef.current.Z}`, hudX, hudY);
    ctx.fillText(
      `E = ${formatNumber(paramsRef.current.energyMeV, 2)} MeV`,
      hudX,
      hudY + line
    );
    ctx.fillText(
      `Beam half-width = ${formatNumber(paramsRef.current.beamHalfWidthFm, 0)} fm`,
      hudX,
      hudY + 2 * line
    );

    ctx.fillStyle = accent;
    ctx.fillText(
      `Backscatter ≈ ${formatNumber(stats.backscatterPercent, 1)} %`,
      hudX,
      hudY + 3 * line
    );
    ctx.fillStyle = textColor;
    ctx.fillText(
      `Mean exit angle ≈ ${formatNumber(stats.meanExitAngleDeg, 1)}°`,
      hudX,
      hudY + 4 * line
    );

    // Statistical overlay panel (bottom-left of plot)
    const panelW = 180 * dpr;
    const panelH = 62 * dpr;
    const panelX = plotX0 + 10 * dpr;
    const panelY = plotY0 + plotH - panelH - 10 * dpr;
    ctx.fillStyle = "rgba(15,23,42,0.85)";
    ctx.strokeStyle = "rgba(51,65,85,0.9)";
    ctx.lineWidth = 1 * dpr;
    // draw rounded panel (helper because `roundRect` isn't available on all TS DOM libs)
    const drawRoundedRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      const radius = Math.max(0, r);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    };

    drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 10 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = subtextColor;
    ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const liveStats = statsRef.current;

    ctx.fillText(
      `Total α: ${liveStats.launched}`,
      panelX + 10 * dpr,
      panelY + 8 * dpr
    );
    ctx.fillText(
      `Passing: ${liveStats.passingCount}`,
      panelX + 10 * dpr,
      panelY + 8 * dpr + 14 * dpr
    );
    ctx.fillText(
      `Scattered: ${liveStats.scatteredCount}`,
      panelX + 10 * dpr,
      panelY + 8 * dpr + 28 * dpr
    );
    ctx.fillText(
      `Backscatter: ${liveStats.backscatterCount}`,
      panelX + 10 * dpr,
      panelY + 8 * dpr + 42 * dpr
    );

    // Legend
    const legendY = plotY0 + plotH - 18 * dpr;
    ctx.textBaseline = "middle";
    ctx.fillStyle = subtextColor;
    ctx.fillText("Legend:", hudX, legendY);
    ctx.fillStyle = alphaColor;
    ctx.fillText("alpha particles", hudX + 60 * dpr, legendY);
    ctx.fillStyle = nucleusCore;
    ctx.fillText("nucleus", hudX + 168 * dpr, legendY);
  };

  const handleRestartClick = () => {
    resetSimulation();
    onHardReset();
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-4 mb-6">
        <div className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-rose-400 to-amber-400">
          ⚛ Rutherford Scattering
        </div>
        <div className="text-xs text-neutral-400 hidden sm:block">
          Cyan = α-particles, Crimson = nucleus, Gold = foil
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePaused}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors flex gap-2 items-center ${paused ? "bg-amber-600 hover:bg-amber-700" : "bg-cyan-600 hover:bg-cyan-700"
              }`}
          >
            {paused ? "▶ Play" : "⏸ Pause"}
          </button>
          <button
            type="button"
            onClick={handleRestartClick}
            className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-700 bg-[#0D1117]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full block" />
      </div>
    </div>
  );
};

// -----------------------------
// Page component (3-panel layout)
// -----------------------------

const RutherfordSimulation: React.FC = () => {
  const [params, setParams] = useState<RutherfordParams>(DEFAULT_PARAMS);
  const [paused, setPaused] = useState(false);

  const handleResetParams = () => {
    setParams(DEFAULT_PARAMS);
    setPaused(false);
  };

  return (
    <main className="min-h-screen bg-[#020617] text-neutral-200">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Top Row: Simulation Canvas */}
            <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
              <CanvasSimulator
                params={params}
                paused={paused}
                onTogglePaused={() => setPaused((p) => !p)}
                onHardReset={() => {
                  // no-op hook for now
                }}
              />
            </div>

            {/* Controls Panel */}
            <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
              <div className="flex items-center justify-between mb-2 border-b border-neutral-800 pb-2">
                <h3 className="text-xs font-bold tracking-widest text-neutral-500">⚙ PARAMETERS</h3>
                <button
                  type="button"
                  onClick={handleResetParams}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
                >
                  Restore Base Values
                </button>
              </div>

              <div className="grid gap-3 pt-2">
                <SliderRow
                  label="Nuclear charge, Z"
                  value={params.Z}
                  min={1}
                  max={92}
                  step={1}
                  unit=""
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(Z) => setParams((p) => ({ ...p, Z }))}
                />
                <SliderRow
                  label="Emission rate"
                  value={params.emissionRate}
                  min={5}
                  max={80}
                  step={1}
                  unit="α/s"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(emissionRate) => setParams((p) => ({ ...p, emissionRate }))}
                />
                <SliderRow
                  label="Alpha energy, E"
                  value={params.energyMeV}
                  min={0.5}
                  max={12}
                  step={0.1}
                  unit="MeV"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(energyMeV) => setParams((p) => ({ ...p, energyMeV }))}
                />
                <SliderRow
                  label="Beam half-width"
                  value={params.beamHalfWidthFm}
                  min={5}
                  max={120}
                  step={1}
                  unit="fm"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(beamHalfWidthFm) => setParams((p) => ({ ...p, beamHalfWidthFm }))}
                />
                <SliderRow
                  label="Nucleus radius"
                  value={params.nucleusRadiusFm}
                  min={2}
                  max={25}
                  step={0.5}
                  unit="fm"
                  accentClassName="[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow"
                  onChange={(nucleusRadiusFm) => setParams((p) => ({ ...p, nucleusRadiusFm }))}
                />
              </div>

              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <div className="font-bold text-blue-400 mb-2 font-sans">💡 Quick Tip</div>
                <p className="text-xs text-blue-200/80 leading-relaxed font-sans">
                  Increase <strong className="text-blue-300">Z</strong> and decrease <strong className="text-blue-300">E</strong> to strengthen Coulomb repulsion and observe more large-angle scatterings.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {/* Info Panel Below Grid */}
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-bold text-amber-500 tracking-widest uppercase">Concept: Empty Space & Core</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-sans">
              In Rutherford&apos;s experiment, fast α-particles were fired at a very thin gold foil. Most passed straight through with little deviation, showing that atoms are mostly empty space. A rare few scattered at huge angles (even back-scattered), leading to the revolutionary conclusion that an atom’s mass and positive charge are concentrated in a tiny core: the <strong>nucleus</strong>.
            </p>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <h4 className="text-sm font-semibold text-neutral-200 mb-3">Key Formulas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="font-mono text-sm text-neutral-300 bg-black/40 px-3 py-2 rounded border border-neutral-800">
                    F = k·Z₁Z₂e² / r²
                    <span className="text-neutral-500 float-right text-xs mt-0.5">(Force)</span>
                  </div>
                  <div className="font-mono text-sm text-neutral-300 bg-black/40 px-3 py-2 rounded border border-neutral-800">
                    θ ≈ 2 arctan(k·Z₁Z₂e² / (2Eb))
                    <span className="text-neutral-500 float-right text-xs mt-0.5">(Angle)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-mono text-sm text-neutral-300 bg-black/40 px-3 py-2 rounded border border-neutral-800">
                    b = impact parameter
                  </div>
                  <div className="font-mono text-sm text-neutral-300 bg-black/40 px-3 py-2 rounded border border-neutral-800">
                    dσ/dΩ ∝ csc⁴(θ/2)
                    <span className="text-neutral-500 float-right text-xs mt-0.5">(x-sec)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <h3 className="text-sm font-bold text-cyan-400 tracking-widest uppercase">Variables Reference</h3>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
              <table className="w-full text-sm font-sans text-left">
                <thead className="bg-neutral-800/50 text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-2 font-medium">Symbol</th>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  <tr>
                    <td className="px-4 py-3 font-mono text-amber-500 bg-neutral-950/30">Z</td>
                    <td className="px-4 py-3 text-neutral-300">Nuclear charge number</td>
                    <td className="px-4 py-3 text-neutral-500">—</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-emerald-400 bg-neutral-950/30">E</td>
                    <td className="px-4 py-3 text-neutral-300">Alpha kinetic energy</td>
                    <td className="px-4 py-3 text-neutral-500">MeV</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-violet-400 bg-neutral-950/30">b</td>
                    <td className="px-4 py-3 text-neutral-300">Impact parameter (offset)</td>
                    <td className="px-4 py-3 text-neutral-500">fm</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-pink-400 bg-neutral-950/30">θ</td>
                    <td className="px-4 py-3 text-neutral-300">Scattering angle</td>
                    <td className="px-4 py-3 text-neutral-500">deg / rad</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default RutherfordSimulation;

