"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface SimParams {
  centralMass: number;   // × 10^24 kg  (Earth = 5.972)
  orbitRadius: number;   // × 10^6 m    (LEO ≈ 6.8)
  satelliteMass: number; // kg
  eccentricity: number;  // 0 = circle, 0 → 0.9
}

const DEFAULTS: SimParams = {
  centralMass: 5.972,
  orbitRadius: 6.8,
  satelliteMass: 500,
  eccentricity: 0.0,
};

const G = 6.674e-11;

// ── Physics helpers ────────────────────────────────────────────────────────
function orbitalVelocity(M_e24: number, r_e6: number) {
  const M = M_e24 * 1e24;
  const r = r_e6 * 1e6;
  return Math.sqrt((G * M) / r); // m/s
}

function orbitalPeriod(M_e24: number, r_e6: number) {
  const M = M_e24 * 1e24;
  const r = r_e6 * 1e6;
  return 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / (G * M)); // s
}

function escapeVelocity(M_e24: number, r_e6: number) {
  return orbitalVelocity(M_e24, r_e6) * Math.sqrt(2);
}

function centripetal(M_e24: number, r_e6: number) {
  const v = orbitalVelocity(M_e24, r_e6);
  const r = r_e6 * 1e6;
  return (v * v) / r; // m/s²
}

// Semi-minor axis from semi-major & eccentricity
function semiMinor(a: number, e: number) {
  return a * Math.sqrt(1 - e * e);
}

// ── Canvas Renderer ────────────────────────────────────────────────────────
function renderFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  params: SimParams,
  angle: number,
  trail: { x: number; y: number }[]
) {
  ctx.clearRect(0, 0, W, H);

  // ── Background ────────────────────────────────────────────────────────
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  bg.addColorStop(0, "#0d1b2a");
  bg.addColorStop(1, "#050d18");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stars
  const starCount = 120;
  ctx.save();
  for (let i = 0; i < starCount; i++) {
    // deterministic pseudo-random via sin
    const sx = ((Math.sin(i * 127.1) * 0.5 + 0.5) * W) | 0;
    const sy = ((Math.sin(i * 311.7) * 0.5 + 0.5) * H) | 0;
    const sr = Math.sin(i * 53.3) * 0.5 + 0.8;
    const alpha = Math.sin(i * 71.1) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }
  ctx.restore();

  // ── Grid ──────────────────────────────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = "rgba(59,130,246,0.08)";
  ctx.lineWidth = 1;
  const gridStep = 60;
  for (let x = 0; x < W; x += gridStep) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += gridStep) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  const cx = W / 2;
  const cy = H / 2;

  // ── Orbital ellipse dimensions ────────────────────────────────────────
  // Map orbitRadius (6–42 × 10^6 m) → pixel semi-major axis
  const maxPx = Math.min(W, H) * 0.42;
  const minPx = Math.min(W, H) * 0.15;
  const rNorm = (params.orbitRadius - 6) / (42 - 6); // 0..1
  const a_px = minPx + rNorm * (maxPx - minPx);
  const e = params.eccentricity;
  const b_px = semiMinor(a_px, e);
  const focus_px = a_px * e; // focal offset

  // ── Draw orbit path (dashed ellipse) ──────────────────────────────────
  ctx.save();
  ctx.strokeStyle = "rgba(96,165,250,0.35)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.ellipse(cx - focus_px, cy, a_px, b_px, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // direction arrow at top of orbit
  const arrowX = cx - focus_px + a_px * Math.cos(-Math.PI / 2);
  const arrowY = cy + b_px * Math.sin(-Math.PI / 2);
  ctx.strokeStyle = "rgba(96,165,250,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(arrowX - 8, arrowY);
  ctx.lineTo(arrowX + 8, arrowY);
  ctx.lineTo(arrowX + 4, arrowY - 5);
  ctx.stroke();
  ctx.restore();

  // ── Periapsis / Apoapsis markers ─────────────────────────────────────
  if (e > 0.05) {
    // periapsis (closest)
    const periX = cx - focus_px + a_px;
    ctx.save();
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 10px monospace";
    ctx.fillText("P", periX + 4, cy - 6);
    ctx.beginPath();
    ctx.arc(periX, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#34d399";
    ctx.fill();
    // apoapsis (farthest)
    const apoX = cx - focus_px - a_px;
    ctx.fillStyle = "#f59e0b";
    ctx.fillText("A", apoX - 14, cy - 6);
    ctx.beginPath();
    ctx.arc(apoX, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Hill Sphere ───────────────────────────────────────────────────────
  const hillR = a_px * 0.9;
  ctx.save();
  ctx.strokeStyle = "rgba(139,92,246,0.15)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, hillR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(139,92,246,0.12)";
  ctx.font = "10px monospace";
  ctx.fillText("Hill Sphere", cx + hillR * 0.65, cy - 6);
  ctx.restore();

  // ── Gravitational field rings ─────────────────────────────────────────
  const massNorm = (params.centralMass - 0.1) / (20 - 0.1);
  for (let i = 1; i <= 4; i++) {
    const gr = (a_px * 0.12 * i * (0.6 + massNorm * 0.4));
    ctx.save();
    ctx.strokeStyle = `rgba(59,130,246,${0.12 - i * 0.02})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, gr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ── Central body (planet) ─────────────────────────────────────────────
  const planetR = 14 + Math.cbrt(params.centralMass / 5.972) * 12;
  // glow
  const planetGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, planetR * 2.5);
  planetGlow.addColorStop(0, "rgba(59,130,246,0.5)");
  planetGlow.addColorStop(0.4, "rgba(59,130,246,0.15)");
  planetGlow.addColorStop(1, "rgba(59,130,246,0)");
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, planetR * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = planetGlow;
  ctx.fill();
  // body gradient
  const planetFill = ctx.createRadialGradient(cx - planetR * 0.3, cy - planetR * 0.3, 0, cx, cy, planetR);
  planetFill.addColorStop(0, "#60a5fa");
  planetFill.addColorStop(0.4, "#3b82f6");
  planetFill.addColorStop(0.75, "#1d4ed8");
  planetFill.addColorStop(1, "#1e3a8a");
  ctx.beginPath();
  ctx.arc(cx, cy, planetR, 0, Math.PI * 2);
  ctx.fillStyle = planetFill;
  ctx.fill();
  // atmosphere ring
  ctx.strokeStyle = "rgba(147,197,253,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, planetR + 3, 0, Math.PI * 2);
  ctx.stroke();
  // label
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("M", cx, cy + 3);
  ctx.restore();

  // ── Satellite position ────────────────────────────────────────────────
  // Parametric ellipse with focus at center-of-planet
  const satX = cx - focus_px + a_px * Math.cos(angle);
  const satY = cy + b_px * Math.sin(angle);

  // ── Trail ─────────────────────────────────────────────────────────────
  if (trail.length > 1) {
    for (let i = 1; i < trail.length; i++) {
      const t = i / trail.length;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.strokeStyle = `rgba(6,182,212,${t * 0.7})`;
      ctx.lineWidth = 1.5 * t;
      ctx.stroke();
    }
  }

  // ── Velocity vector ───────────────────────────────────────────────────
  const vLen = 40;
  const vAngle = angle + Math.PI / 2; // tangent to ellipse (approx)
  ctx.save();
  ctx.strokeStyle = "#34d399";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(satX, satY);
  ctx.lineTo(satX + vLen * Math.cos(vAngle), satY + vLen * Math.sin(vAngle));
  ctx.stroke();
  // arrowhead
  ctx.fillStyle = "#34d399";
  ctx.beginPath();
  const ax = satX + vLen * Math.cos(vAngle);
  const ay = satY + vLen * Math.sin(vAngle);
  ctx.moveTo(ax + 6 * Math.cos(vAngle - 2.5), ay + 6 * Math.sin(vAngle - 2.5));
  ctx.lineTo(ax + 6 * Math.cos(vAngle + 2.5), ay + 6 * Math.sin(vAngle + 2.5));
  ctx.lineTo(ax + 10 * Math.cos(vAngle), ay + 10 * Math.sin(vAngle));
  ctx.fill();
  ctx.restore();

  // ── Gravitational force vector (toward center) ─────────────────────────
  const dx = cx - satX, dy = cy - satY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const fLen = 30;
  ctx.save();
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(satX, satY);
  ctx.lineTo(satX + (dx / dist) * fLen, satY + (dy / dist) * fLen);
  ctx.stroke();
  ctx.fillStyle = "#f59e0b";
  const fx = satX + (dx / dist) * fLen;
  const fy = satY + (dy / dist) * fLen;
  const fang = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(fx + 6 * Math.cos(fang - 2.5), fy + 6 * Math.sin(fang - 2.5));
  ctx.lineTo(fx + 6 * Math.cos(fang + 2.5), fy + 6 * Math.sin(fang + 2.5));
  ctx.lineTo(fx + 10 * Math.cos(fang), fy + 10 * Math.sin(fang));
  ctx.fill();
  ctx.restore();

  // ── Satellite ─────────────────────────────────────────────────────────
  const satR = 7 + Math.cbrt(params.satelliteMass / 500) * 4;
  const satGlow = ctx.createRadialGradient(satX, satY, 0, satX, satY, satR * 3);
  satGlow.addColorStop(0, "rgba(6,182,212,0.7)");
  satGlow.addColorStop(0.5, "rgba(6,182,212,0.2)");
  satGlow.addColorStop(1, "rgba(6,182,212,0)");
  ctx.save();
  ctx.beginPath();
  ctx.arc(satX, satY, satR * 3, 0, Math.PI * 2);
  ctx.fillStyle = satGlow;
  ctx.fill();
  // satellite body
  ctx.beginPath();
  ctx.arc(satX, satY, satR, 0, Math.PI * 2);
  const satFill = ctx.createRadialGradient(satX - satR * 0.3, satY - satR * 0.3, 0, satX, satY, satR);
  satFill.addColorStop(0, "#ffffff");
  satFill.addColorStop(0.4, "#67e8f9");
  satFill.addColorStop(1, "#0891b2");
  ctx.fillStyle = satFill;
  ctx.fill();
  // solar panels (simple rects)
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(satX + satR, satY - 2, 12, 4);
  ctx.fillRect(satX - satR - 12, satY - 2, 12, 4);
  ctx.restore();

  // ── Labels ────────────────────────────────────────────────────────────
  ctx.save();
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = "#34d399";
  ctx.fillText("v (orbital)", satX + vLen * Math.cos(vAngle) + 4, satY + vLen * Math.sin(vAngle) - 4);
  ctx.fillStyle = "#f59e0b";
  ctx.fillText("F_g", fx + 4, fy + 4);
  // radius line
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(satX, satY);
  ctx.stroke();
  ctx.setLineDash([]);
  // R label
  const midX = (cx + satX) / 2;
  const midY = (cy + satY) / 2;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "10px monospace";
  ctx.fillText("R", midX + 3, midY - 3);
  ctx.restore();

  // ── Escape velocity ring ──────────────────────────────────────────────
  const vOrb = orbitalVelocity(params.centralMass, params.orbitRadius);
  const vEsc = escapeVelocity(params.centralMass, params.orbitRadius);
  const ratio = vOrb / vEsc; // always < 1 normally
  const exceedColor = ratio > 0.9 ? "rgba(239,68,68,0.4)" : "rgba(59,130,246,0.2)";
  ctx.save();
  ctx.strokeStyle = exceedColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 8]);
  ctx.beginPath();
  ctx.arc(cx, cy, a_px * 1.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = exceedColor;
  ctx.font = "9px monospace";
  ctx.fillText("v_esc threshold", cx + a_px * 1.12 * 0.68, cy - 6);
  ctx.restore();

  // ── Scale bar ─────────────────────────────────────────────────────────
  ctx.save();
  const sbX = 16, sbY = H - 20;
  const sbW = 80;
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sbX, sbY); ctx.lineTo(sbX + sbW, sbY);
  ctx.moveTo(sbX, sbY - 4); ctx.lineTo(sbX, sbY + 4);
  ctx.moveTo(sbX + sbW, sbY - 4); ctx.lineTo(sbX + sbW, sbY + 4);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "9px monospace";
  ctx.fillText(`${(params.orbitRadius * 1e3).toFixed(0)} km scale`, sbX, sbY - 8);
  ctx.restore();
}

// ── Slider component ────────────────────────────────────────────────────────
interface SliderProps {
  label: string;
  icon: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  display?: (v: number) => string;
  onChange: (v: number) => void;
  dramaticRange?: [number, number];
}

function ControlSlider({ label, icon, value, min, max, step, unit, display, onChange, dramaticRange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const disp = display ? display(value) : value.toFixed(value < 10 ? 2 : 0);
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-blue-200 tracking-wide">{icon} {label}</span>
        <span className="text-sm font-bold text-cyan-300 tabular-nums">{disp} <span className="text-xs text-blue-400">{unit}</span></span>
      </div>
      <div className="relative h-2 rounded-full bg-gray-700">
        {dramaticRange && (
          <div
            className="absolute h-full rounded-full bg-blue-500 opacity-20"
            style={{
              left: `${((dramaticRange[0] - min) / (max - min)) * 100}%`,
              width: `${((dramaticRange[1] - dramaticRange[0]) / (max - min)) * 100}%`,
            }}
          />
        )}
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          aria-label={`${label}: ${disp} ${unit}`}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 10 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg shadow-cyan-400/50"
          style={{ left: `calc(${pct}% - 8px)`, pointerEvents: "none" }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-gray-500">{min}{unit}</span>
        <span className="text-[9px] text-gray-500">{max}{unit}</span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function OrbitalVelocitySimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const angleRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const orbitCountRef = useRef<number>(0);

  const [params, setParams] = useState<SimParams>({ ...DEFAULTS });
  const [orbitCount, setOrbitCount] = useState(0);
  const [fps, setFps] = useState(60);
  const fpsRef = useRef(60);
  const fpsCountRef = useRef({ frames: 0, last: 0 });

  const setParam = useCallback(<K extends keyof SimParams>(key: K, val: number) => {
    setParams(p => ({ ...p, [key]: val }));
    // reset trail on param change
    trailRef.current = [];
  }, []);

  // Derived physics
  const vOrb = orbitalVelocity(params.centralMass, params.orbitRadius);
  const T = orbitalPeriod(params.centralMass, params.orbitRadius);
  const vEsc = escapeVelocity(params.centralMass, params.orbitRadius);
  const ac = centripetal(params.centralMass, params.orbitRadius);
  const Fg = (G * params.centralMass * 1e24 * params.satelliteMass) / Math.pow(params.orbitRadius * 1e6, 2);
  const KE = 0.5 * params.satelliteMass * vOrb * vOrb;
  const PE = -(G * params.centralMass * 1e24 * params.satelliteMass) / (params.orbitRadius * 1e6);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const W = parent.offsetWidth;
      const H = parent.offsetHeight;
      canvas.width = W * window.devicePixelRatio;
      canvas.height = H * window.devicePixelRatio;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const TRAIL_MAX = 160;
    let angularSpeedBase = (2 * Math.PI) / T; // rad/s

    const loop = (now: number) => {
      animRef.current = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      // FPS counter
      fpsCountRef.current.frames++;
      if (now - fpsCountRef.current.last > 500) {
        const computed = Math.round(fpsCountRef.current.frames / ((now - fpsCountRef.current.last) / 1000));
        fpsRef.current = computed;
        setFps(computed);
        fpsCountRef.current = { frames: 0, last: now };
      }

      // Angular speed (faster near periapsis via Kepler's second law approx)
      const e = params.eccentricity;
      const r_norm = 1 - e * Math.cos(angleRef.current); // proportional factor
      angularSpeedBase = (2 * Math.PI) / orbitalPeriod(params.centralMass, params.orbitRadius);
      const angSpeed = angularSpeedBase / (r_norm * r_norm); // Kepler's 2nd law approx

      angleRef.current += angSpeed * dt * 5; // ×5 speed-up for visibility
      if (angleRef.current > 2 * Math.PI) {
        angleRef.current -= 2 * Math.PI;
        orbitCountRef.current++;
        setOrbitCount(orbitCountRef.current);
      }

      const W = canvas.width / window.devicePixelRatio;
      const H = canvas.height / window.devicePixelRatio;
      const cx = W / 2;
      const cy = H / 2;
      const maxPx = Math.min(W, H) * 0.42;
      const minPx = Math.min(W, H) * 0.15;
      const rNorm = (params.orbitRadius - 6) / (42 - 6);
      const a_px = minPx + rNorm * (maxPx - minPx);
      const b_px = semiMinor(a_px, e);
      const focus_px = a_px * e;
      const satX = cx - focus_px + a_px * Math.cos(angleRef.current);
      const satY = cy + b_px * Math.sin(angleRef.current);

      trailRef.current.push({ x: satX, y: satY });
      if (trailRef.current.length > TRAIL_MAX) trailRef.current.shift();

      renderFrame(ctx, W, H, params, angleRef.current, trailRef.current);
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [params]);

  const reset = () => {
    setParams({ ...DEFAULTS });
    trailRef.current = [];
    angleRef.current = 0;
    orbitCountRef.current = 0;
    setOrbitCount(0);
  };

  const fmt = (n: number, d = 2) => n.toFixed(d);
  const fmtSI = (n: number) => {
    if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + " T";
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + " G";
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + " M";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + " k";
    return n.toFixed(2);
  };

  return (
    <div className="flex flex-col bg-gray-950 text-white font-mono" style={{ fontFamily: "'Courier New', monospace", minHeight: "100vh", width: "100%" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-blue-900">
        <div>
          <h1 className="text-lg font-bold text-blue-300 tracking-widest">🛰 ORBITAL VELOCITY SIMULATOR</h1>
          <p className="text-xs text-blue-500">Real-time orbital mechanics · Kepler's Laws · Gravitational Physics</p>
        </div>
        <div className="flex gap-4 text-xs text-gray-400">
          <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700">FPS: <span className="text-green-400 font-bold">{fps}</span></span>
          <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700">Orbits: <span className="text-cyan-400 font-bold">{orbitCount}</span></span>
        </div>
      </div>

      {/* Top section: Sim + Controls */}
      <div className="flex" style={{ height: "65vh", minHeight: 400 }}>
        {/* Canvas */}
        <div className="relative bg-gray-950" style={{ width: "65%", minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ display: "block", width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
          />
          {/* Legend overlay */}
          <div className="absolute top-3 left-3 bg-gray-900/80 border border-blue-900 rounded-lg px-3 py-2 text-[10px] space-y-1 backdrop-blur" style={{ zIndex: 10 }}>
            <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-green-400 inline-block" /><span className="text-green-300">Orbital Velocity (v)</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-amber-400 inline-block" /><span className="text-amber-300">Gravitational Force (F_g)</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-blue-400 inline-block border-dashed" style={{ borderTop: "1px dashed" }} /><span className="text-blue-300">Orbital Path</span></div>
            <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-cyan-400 inline-block" /><span className="text-cyan-300">Satellite Trail</span></div>
          </div>
        </div>

        {/* Controls panel */}
        <div className="bg-gray-900 border-l border-blue-900 flex flex-col overflow-hidden" style={{ width: "35%", minWidth: 240 }}>
          <div className="px-4 py-3 border-b border-blue-900">
            <h2 className="text-xs font-bold text-blue-300 tracking-widest">⚙ PARAMETERS</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <ControlSlider
              label="Central Body Mass"
              icon="🌍"
              value={params.centralMass}
              min={0.1}
              max={20}
              step={0.1}
              unit="×10²⁴kg"
              display={v => v.toFixed(2)}
              onChange={v => setParam("centralMass", v)}
              dramaticRange={[5, 15]}
            />
            <ControlSlider
              label="Orbital Radius"
              icon="📏"
              value={params.orbitRadius}
              min={6}
              max={42}
              step={0.1}
              unit="×10⁶m"
              display={v => v.toFixed(1)}
              onChange={v => setParam("orbitRadius", v)}
              dramaticRange={[6.5, 12]}
            />
            <ControlSlider
              label="Satellite Mass"
              icon="🛰"
              value={params.satelliteMass}
              min={10}
              max={5000}
              step={10}
              unit="kg"
              display={v => v.toFixed(0)}
              onChange={v => setParam("satelliteMass", v)}
            />
            <ControlSlider
              label="Eccentricity"
              icon="🔴"
              value={params.eccentricity}
              min={0}
              max={0.9}
              step={0.01}
              unit=""
              display={v => v.toFixed(2)}
              onChange={v => setParam("eccentricity", v)}
              dramaticRange={[0.5, 0.85]}
            />

            {/* Live stats inside panel */}
            <div className="mt-4 space-y-1.5 text-[11px] border-t border-gray-800 pt-3">
              <div className="flex justify-between"><span className="text-gray-400">Orbital Velocity</span><span className="text-cyan-300 font-bold">{fmtSI(vOrb)}m/s</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Period</span><span className="text-cyan-300 font-bold">{T > 3600 ? (T / 3600).toFixed(2) + "h" : (T / 60).toFixed(1) + "min"}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Escape Velocity</span><span className="text-amber-300 font-bold">{fmtSI(vEsc)}m/s</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Centripetal Acc.</span><span className="text-green-300 font-bold">{ac.toFixed(3)} m/s²</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Gravity Force</span><span className="text-blue-300 font-bold">{fmtSI(Fg)}N</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Kinetic Energy</span><span className="text-purple-300 font-bold">{fmtSI(KE)}J</span></div>
            </div>

            {/* Tip */}
            <div className="mt-3 bg-blue-950/60 border border-blue-800 rounded-lg p-2 text-[10px] text-blue-200">
              💡 <span className="font-bold">Try:</span> Set Mass=10, Radius=6 for a tight, fast orbit. Or eccentricity=0.8 to see Kepler's speed variation!
            </div>

            <button
              onClick={reset}
              className="mt-4 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold tracking-widest transition-colors border border-blue-400"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>

      {/* Bottom section: Educational */}
      <div className="border-t border-blue-900 bg-gray-900" style={{ minHeight: "30vh" }}>
        <div className="grid grid-cols-3 gap-0 h-full" style={{ minHeight: "28vh" }}>

          {/* Column 1: Concept + Formula */}
          <div className="border-r border-blue-900 px-5 py-4">
            <h3 className="text-xs font-bold text-blue-400 tracking-widest mb-2">✨ THE CONCEPT</h3>
            <p className="text-[11px] text-gray-300 leading-relaxed mb-3">
              A satellite orbits when its tangential velocity exactly balances the gravitational pull of the central body — it's continuously "falling" around the planet. The orbital speed depends only on the central mass and orbital radius, not the satellite's own mass.
            </p>
            <div className="bg-gray-950 border border-blue-900 rounded-lg p-3 text-[11px]">
              <div className="text-blue-400 font-bold mb-2">📐 KEY FORMULAS</div>
              <div className="text-cyan-300 font-bold mb-1">v = √(GM/r)</div>
              <div className="text-gray-400 text-[10px] mb-2">G = 6.674×10⁻¹¹ N·m²/kg² · M = central mass · r = orbital radius</div>
              <div className="text-amber-300 font-bold mb-1">T = 2π√(r³/GM)</div>
              <div className="text-gray-400 text-[10px] mb-2">T = orbital period (Kepler's 3rd Law)</div>
              <div className="text-green-300 font-bold">v_esc = √2 · v_orb</div>
              <div className="text-gray-400 text-[10px]">Escape velocity is always √2 × orbital velocity</div>
            </div>
          </div>

          {/* Column 2: Live calculation */}
          <div className="border-r border-blue-900 px-5 py-4">
            <h3 className="text-xs font-bold text-blue-400 tracking-widest mb-2">⚡ LIVE CALCULATION</h3>
            <div className="bg-gray-950 border border-blue-900 rounded-lg p-3 text-[10px] font-mono">
              <div className="text-gray-400 mb-1">v = √(G × M / r)</div>
              <div className="text-gray-400 mb-1">v = √(6.674×10⁻¹¹ × {(params.centralMass * 1e24).toExponential(2)} / {(params.orbitRadius * 1e6).toExponential(2)})</div>
              <div className="text-cyan-300 font-bold mb-3">v = {fmtSI(vOrb)} m/s</div>

              <div className="text-gray-400 mb-1">T = 2π√(r³ / GM)</div>
              <div className="text-amber-300 font-bold mb-3">T = {T > 3600 ? (T / 3600).toFixed(2) + " hours" : (T / 60).toFixed(1) + " minutes"}</div>

              <div className="text-gray-400 mb-1">a_c = v² / r</div>
              <div className="text-green-300 font-bold mb-3">a_c = {ac.toFixed(4)} m/s²</div>

              <div className="text-gray-400 mb-1">F_g = GMm / r²</div>
              <div className="text-purple-300 font-bold">F_g = {fmtSI(Fg)} N</div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
              <div className="bg-gray-950 border border-green-900 rounded p-1.5">
                <span className="text-gray-400">KE</span>
                <div className="text-green-300 font-bold">{fmtSI(KE)} J</div>
              </div>
              <div className="bg-gray-950 border border-red-900 rounded p-1.5">
                <span className="text-gray-400">PE</span>
                <div className="text-red-300 font-bold">{fmtSI(PE)} J</div>
              </div>
            </div>
          </div>

          {/* Column 3: Tips */}
          <div className="px-5 py-4">
            <h3 className="text-xs font-bold text-blue-400 tracking-widest mb-2">💡 TRY THIS!</h3>
            <div className="space-y-2 text-[10px]">
              <div className="bg-blue-950/50 border border-blue-800 rounded-lg p-2">
                <div className="text-blue-300 font-bold mb-0.5">🚀 ISS-Like Orbit</div>
                <div className="text-gray-300">Mass = 5.97, Radius = 6.8 × 10⁶m<br />→ ~7,660 m/s, ~92 min period!</div>
              </div>
              <div className="bg-purple-950/50 border border-purple-800 rounded-lg p-2">
                <div className="text-purple-300 font-bold mb-0.5">🪐 Massive Star Orbit</div>
                <div className="text-gray-300">Mass = 18, Radius = 8 × 10⁶m<br />→ Extreme speed &amp; tight path!</div>
              </div>
              <div className="bg-amber-950/50 border border-amber-800 rounded-lg p-2">
                <div className="text-amber-300 font-bold mb-0.5">🔴 Kepler's 2nd Law</div>
                <div className="text-gray-300">Set Eccentricity = 0.75<br />→ Watch it speed up at periapsis!</div>
              </div>
              <div className="bg-green-950/50 border border-green-800 rounded-lg p-2">
                <div className="text-green-300 font-bold mb-0.5">🌙 Distant Slow Orbit</div>
                <div className="text-gray-300">Mass = 5.97, Radius = 38 × 10⁶m<br />→ Much slower — like geostationary!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Theory footer */}
        <div className="border-t border-blue-900 bg-gray-950 px-6 py-3">
          <p className="text-[10px] text-gray-500 leading-relaxed max-w-5xl">
            <span className="text-blue-400 font-bold">Theory: </span>
            Orbital velocity is governed by Newton's law of gravitation and circular motion dynamics. For a circular orbit, gravitational force provides the centripetal force: <span className="text-cyan-300">GMm/r² = mv²/r</span>, giving <span className="text-cyan-300">v = √(GM/r)</span>. For elliptical orbits, Kepler's second law states that equal areas are swept in equal times — so the satellite moves fastest at periapsis and slowest at apoapsis. The orbital period follows Kepler's third law: <span className="text-amber-300">T² ∝ r³</span>, meaning distant satellites always take longer to complete one orbit regardless of their mass.
          </p>
        </div>
      </div>
    </div>
  );
}
