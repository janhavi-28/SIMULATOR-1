"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Law = 1 | 2 | 3;

interface Vec2 { x: number; y: number; }

interface Planet {
  a: number;       // semi-major axis (px)
  b: number;       // semi-minor axis (px)
  e: number;       // eccentricity
  angle: number;   // current true anomaly (rad)
  speed: number;   // base angular speed multiplier
  color: string;
  radius: number;
  name: string;
  period: number;  // relative period
  trailPoints: Vec2[];
  sweptPoints: Vec2[];   // for law 2 shading
  sweptArea: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TWO_PI = 2 * Math.PI;
const SUN_RADIUS = 28;
const TRAIL_MAX = 300;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function polarToCart(a: number, b: number, angle: number, cx: number, cy: number, e: number): Vec2 {
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
  return {
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  };
}

function ellipsePoint(a: number, b: number, cx: number, cy: number, t: number): Vec2 {
  return { x: cx + a * Math.cos(t), y: cy + b * Math.sin(t) };
}

function drawEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, a: number, b: number, focus: number, color: string, dashed = true) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.45;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.ellipse(cx - focus, cy, a, b, 0, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Slider with live value
function Slider({ label, icon, value, min, max, step, unit, onChange, tip }: {
  label: string; icon: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void; tip?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-gray-700">{icon} {label}</span>
        <span className="text-sm font-bold text-blue-600 tabular-nums">{value.toFixed(2)} {unit}</span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="w-full h-2 rounded-full bg-gray-200 relative overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
            style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          aria-label={`${label}: ${value} ${unit}`}
          aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
          className="absolute w-full h-2 opacity-0 cursor-pointer"
        />
        <div className="absolute h-4 w-4 rounded-full bg-blue-500 shadow-md border-2 border-white pointer-events-none transition-all"
          style={{ left: `calc(${pct}% - 8px)` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{min}</span><span>{max}</span>
      </div>
      {tip && <p className="text-xs text-blue-500 mt-0.5">{tip}</p>}
    </div>
  );
}

// ─── Law 1 Canvas ─────────────────────────────────────────────────────────────
function Law1Canvas({ eccentricity, speed, paused }: { eccentricity: number; speed: number; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ angle: 0, trail: [] as Vec2[] });
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let running = true;

    // DPI-aware resize
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);

    const draw = (ts: number) => {
      if (!running) return;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width / dpr, H = canvas.height / dpr;
      const cx = W / 2, cy = H / 2;
      const PAD = 48;
      // Sun at canvas centre; a sized so full ellipse always fits within PAD margin
      const maxA_horiz = (W / 2 - PAD) / (1 + eccentricity);
      const maxA_vert2 = (H / 2 - PAD) / Math.sqrt(1 - eccentricity * eccentricity + 1e-9);
      const a = Math.min(maxA_horiz, maxA_vert2);
      const b = a * Math.sqrt(Math.max(0, 1 - eccentricity * eccentricity));
      const focalDist = a * eccentricity;
      const sunX = cx, sunY = cy;

      // Advance angle
      if (!paused) {
        const r = (a * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(stateRef.current.angle));
        const angularSpeed = (speed * 0.5 * a * b) / (r * r);
        stateRef.current.angle = (stateRef.current.angle + angularSpeed * dt) % TWO_PI;
      }

      const planet = polarToCart(a, b, stateRef.current.angle, sunX, sunY, eccentricity);

      // Trail
      stateRef.current.trail.push({ ...planet });
      if (stateRef.current.trail.length > TRAIL_MAX) stateRef.current.trail.shift();

      // Draw
      ctx.clearRect(0, 0, W, H);

      // Starfield bg
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, 0, W, H);
      // Stars (static with canvas seed trick)
      ctx.save();
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 137.5) % W);
        const sy = ((i * 97.3 + 40) % H);
        const sr = Math.random() < 0.01 ? 1.5 : 0.8;
        ctx.globalAlpha = 0.4 + (i % 5) * 0.08;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TWO_PI); ctx.fill();
      }
      ctx.restore();

      // Grid
      ctx.save();
      ctx.strokeStyle = "#1E3A5F";
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.5;
      for (let gx = 0; gx < W; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 50) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      ctx.restore();

      // Major/minor axis dashes through ellipse centre
      const eCx = sunX - focalDist, eCy = sunY;
      ctx.save();
      ctx.strokeStyle = "#2563EB44";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(eCx - a, eCy); ctx.lineTo(eCx + a, eCy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(eCx, eCy - b); ctx.lineTo(eCx, eCy + b); ctx.stroke();
      ctx.restore();

      // Perihelion / Aphelion markers
      const perihelion = { x: sunX + a * (1 - eccentricity), y: sunY };
      const aphelion = { x: sunX - a * (1 + eccentricity), y: sunY };
      ctx.save();
      ctx.fillStyle = "#60A5FA";
      ctx.font = "11px 'Courier New', monospace";
      ctx.globalAlpha = 0.8;
      ctx.fillText("Perihelion", perihelion.x - 30, perihelion.y + 18);
      ctx.fillText("Aphelion", aphelion.x - 25, aphelion.y + 18);
      ctx.restore();

      // Orbital ellipse — centre is at (sunX - focalDist, sunY)
      drawEllipse(ctx, eCx, eCy, a, b, 0, "#3B82F6");

      // Trail
      if (stateRef.current.trail.length > 1) {
        ctx.save();
        for (let i = 1; i < stateRef.current.trail.length; i++) {
          const alpha = i / stateRef.current.trail.length;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(6,182,212,${alpha * 0.7})`;
          ctx.lineWidth = 1.5 * alpha;
          ctx.moveTo(stateRef.current.trail[i - 1].x, stateRef.current.trail[i - 1].y);
          ctx.lineTo(stateRef.current.trail[i].x, stateRef.current.trail[i].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Line from sun to planet (radius vector)
      ctx.save();
      ctx.strokeStyle = "#F59E0B55";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(planet.x, planet.y);
      ctx.stroke();
      ctx.restore();

      // Sun glow
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, SUN_RADIUS * 3);
      sunGrad.addColorStop(0, "#FDE68A");
      sunGrad.addColorStop(0.4, "#F59E0B");
      sunGrad.addColorStop(1, "transparent");
      ctx.save();
      ctx.fillStyle = sunGrad;
      ctx.beginPath(); ctx.arc(sunX, sunY, SUN_RADIUS * 3, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = "#FEF3C7";
      ctx.beginPath(); ctx.arc(sunX, sunY, SUN_RADIUS, 0, TWO_PI); ctx.fill();
      ctx.restore();

      // Second focus (empty) — on the opposite side of ellipse centre from Sun
      const focus2X = sunX - 2 * focalDist;
      ctx.save();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(focus2X, sunY, 5, 0, TWO_PI); ctx.stroke();
      ctx.fillStyle = "#1E293B";
      ctx.fill();
      ctx.fillStyle = "#64748B";
      ctx.font = "10px 'Courier New'";
      ctx.fillText("Focus 2", focus2X - 20, sunY + 18);
      ctx.restore();

      // Planet glow
      const pGrad = ctx.createRadialGradient(planet.x, planet.y, 0, planet.x, planet.y, 22);
      pGrad.addColorStop(0, "#BFDBFE");
      pGrad.addColorStop(0.4, "#3B82F6");
      pGrad.addColorStop(1, "transparent");
      ctx.save();
      ctx.fillStyle = pGrad;
      ctx.beginPath(); ctx.arc(planet.x, planet.y, 22, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = "#DBEAFE";
      ctx.beginPath(); ctx.arc(planet.x, planet.y, 10, 0, TWO_PI); ctx.fill();
      ctx.restore();

      // Annotations
      ctx.save();
      ctx.fillStyle = "#93C5FD";
      ctx.font = "bold 12px 'Courier New', monospace";
      ctx.fillText(`e = ${eccentricity.toFixed(2)}`, 12, 24);
      ctx.fillText(`a = ${(a / 100).toFixed(2)} AU`, 12, 40);
      ctx.fillText(`b = ${(b / 100).toFixed(2)} AU`, 12, 56);
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [eccentricity, speed, paused]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}

// ─── Law 2 Canvas ─────────────────────────────────────────────────────────────
function Law2Canvas({ eccentricity, speed, paused }: { eccentricity: number; speed: number; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    angle: 0,
    trail: [] as Vec2[],
    sweepSegments: [] as { pts: Vec2[]; age: number; hue: number }[],
    lastSweepAngle: 0,
    sweepAccum: [] as Vec2[],
  });
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let running = true;
    stateRef.current.angle = 0;
    stateRef.current.lastSweepAngle = 0;
    stateRef.current.sweepAccum = [];
    stateRef.current.sweepSegments = [];

    const resizeCanvas2 = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas2();
    const ro2 = new ResizeObserver(resizeCanvas2);
    ro2.observe(canvas);

    const SWEEP_INTERVAL = Math.PI / 5; // flush every 36°

    const draw = (ts: number) => {
      if (!running) return;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width / dpr, H = canvas.height / dpr;
      const cx = W / 2, cy = H / 2;
      const PAD2 = 48;
      const maxA_h = (W / 2 - PAD2) / (1 + eccentricity);
      const maxA_v = (H / 2 - PAD2) / Math.sqrt(Math.max(1e-9, 1 - eccentricity * eccentricity));
      const a = Math.min(maxA_h, maxA_v);
      const b = a * Math.sqrt(Math.max(0, 1 - eccentricity * eccentricity));
      const focalDist = a * eccentricity;
      const sunX = cx, sunY = cy;

      if (!paused) {
        const r = (a * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(stateRef.current.angle));
        const angularSpeed = (speed * 0.4 * a * b) / (r * r);
        stateRef.current.angle = (stateRef.current.angle + angularSpeed * dt) % TWO_PI;
      }

      const planet = polarToCart(a, b, stateRef.current.angle, sunX, sunY, eccentricity);

      // Accumulate sweep points
      stateRef.current.sweepAccum.push({ ...planet });

      // Flush segment
      const angleDiff = Math.abs(stateRef.current.angle - stateRef.current.lastSweepAngle);
      if (angleDiff > SWEEP_INTERVAL || (stateRef.current.angle < 0.1 && stateRef.current.lastSweepAngle > Math.PI)) {
        if (stateRef.current.sweepAccum.length > 2) {
          stateRef.current.sweepSegments.push({
            pts: [{ x: sunX, y: sunY }, ...stateRef.current.sweepAccum, { x: sunX, y: sunY }],
            age: 0,
            hue: (stateRef.current.angle / TWO_PI) * 300,
          });
          if (stateRef.current.sweepSegments.length > 8) stateRef.current.sweepSegments.shift();
        }
        stateRef.current.sweepAccum = [{ ...planet }];
        stateRef.current.lastSweepAngle = stateRef.current.angle;
      }

      // Trail
      stateRef.current.trail.push({ ...planet });
      if (stateRef.current.trail.length > TRAIL_MAX) stateRef.current.trail.shift();

      // Age segments
      stateRef.current.sweepSegments.forEach(s => s.age += dt);

      // ── Draw ──
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0F172A"; ctx.fillRect(0, 0, W, H);

      // Stars
      for (let i = 0; i < 80; i++) {
        ctx.globalAlpha = 0.3 + (i % 3) * 0.1;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc((i * 137.5) % W, (i * 97.3 + 40) % H, 0.7, 0, TWO_PI); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Orbital ellipse
      drawEllipse(ctx, sunX - focalDist, sunY, a, b, 0, "#3B82F6");

      // Swept areas
      stateRef.current.sweepSegments.forEach((seg, idx) => {
        const alpha = Math.max(0, 0.55 - seg.age * 0.06);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        seg.pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.closePath();
        const colors = ["#3B82F655", "#06B6D455", "#8B5CF655", "#10B98155", "#F59E0B55", "#EF444455"];
        ctx.fillStyle = colors[idx % colors.length];
        ctx.fill();
        ctx.restore();
        // "A₁ = A₂" label on last 2
        if (idx >= stateRef.current.sweepSegments.length - 2) {
          const mid = seg.pts[Math.floor(seg.pts.length / 2)];
          ctx.save();
          ctx.globalAlpha = Math.max(0, 0.9 - seg.age * 0.1);
          ctx.fillStyle = "#F1F5F9";
          ctx.font = "bold 11px 'Courier New'";
          ctx.fillText(`A${idx + 1}`, mid.x - 8, mid.y + 4);
          ctx.restore();
        }
      });

      // Current sweep accumulation (live)
      if (stateRef.current.sweepAccum.length > 1) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        stateRef.current.sweepAccum.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = "#FDE68A55";
        ctx.fill();
        ctx.restore();
      }

      // Radius vector
      ctx.save();
      ctx.strokeStyle = "#FBBF24";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(planet.x, planet.y);
      ctx.stroke();
      ctx.restore();

      // Trail
      for (let i = 1; i < stateRef.current.trail.length; i++) {
        const alpha = (i / stateRef.current.trail.length) * 0.6;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(6,182,212,${alpha})`;
        ctx.lineWidth = 1.2 * alpha;
        ctx.moveTo(stateRef.current.trail[i - 1].x, stateRef.current.trail[i - 1].y);
        ctx.lineTo(stateRef.current.trail[i].x, stateRef.current.trail[i].y);
        ctx.stroke();
      }

      // Sun
      const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, SUN_RADIUS * 3);
      sg.addColorStop(0, "#FDE68A"); sg.addColorStop(0.4, "#F59E0B"); sg.addColorStop(1, "transparent");
      ctx.save();
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sunX, sunY, SUN_RADIUS * 3, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = "#FEF3C7"; ctx.beginPath(); ctx.arc(sunX, sunY, SUN_RADIUS, 0, TWO_PI); ctx.fill();
      ctx.restore();

      // Planet
      const pg = ctx.createRadialGradient(planet.x, planet.y, 0, planet.x, planet.y, 22);
      pg.addColorStop(0, "#BFDBFE"); pg.addColorStop(0.4, "#3B82F6"); pg.addColorStop(1, "transparent");
      ctx.save();
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(planet.x, planet.y, 22, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = "#DBEAFE"; ctx.beginPath(); ctx.arc(planet.x, planet.y, 10, 0, TWO_PI); ctx.fill();
      ctx.restore();

      // Speed annotation
      const r = Math.sqrt((planet.x - sunX) ** 2 + (planet.y - sunY) ** 2);
      const vRelative = (a * b) / (r * r);
      ctx.save();
      ctx.fillStyle = "#93C5FD";
      ctx.font = "bold 12px 'Courier New'";
      ctx.fillText(`Distance: ${(r / 100).toFixed(2)} AU`, 12, 24);
      ctx.fillText(`Rel. Speed: ${vRelative.toFixed(2)}`, 12, 40);
      ctx.fillText(`Equal areas = Equal time`, 12, 56);
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(rafRef.current); ro2.disconnect(); };
  }, [eccentricity, speed, paused]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}

// ─── Law 3 Canvas ─────────────────────────────────────────────────────────────
interface Planet3 { a: number; angle: number; color: string; r: number; name: string; trail: Vec2[]; }

function Law3Canvas({ starMass, speed, paused }: { starMass: number; speed: number; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const planetsRef = useRef<Planet3[]>([]);

  useEffect(() => {
    const PLANET_DATA = [
      { name: "Mercury", aFrac: 0.15, color: "#94A3B8", r: 7 },
      { name: "Venus", aFrac: 0.22, color: "#FCD34D", r: 10 },
      { name: "Earth", aFrac: 0.30, color: "#3B82F6", r: 11 },
      { name: "Mars", aFrac: 0.40, color: "#EF4444", r: 9 },
      { name: "Jupiter", aFrac: 0.55, color: "#F97316", r: 18 },
    ];
    planetsRef.current = PLANET_DATA.map((pd, i) => ({
      ...pd,
      a: 0, // computed per frame
      angle: (i * TWO_PI) / PLANET_DATA.length,
      trail: [],
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let running = true;

    const resizeCanvas3 = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas3();
    const ro3 = new ResizeObserver(resizeCanvas3);
    ro3.observe(canvas);

    const draw = (ts: number) => {
      if (!running) return;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width / dpr, H = canvas.height / dpr;
      const cx = W / 2, cy = H / 2;
      const maxR = Math.min(W, H) * 0.44;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0F172A"; ctx.fillRect(0, 0, W, H);

      // Stars
      for (let i = 0; i < 100; i++) {
        ctx.globalAlpha = 0.25 + (i % 4) * 0.07;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc((i * 137.5) % W, (i * 97.3 + 40) % H, 0.7, 0, TWO_PI); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Grid circles
      ctx.save();
      ctx.strokeStyle = "#1E3A5F88";
      ctx.lineWidth = 0.5;
      for (let rr = maxR * 0.25; rr <= maxR; rr += maxR * 0.25) {
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TWO_PI); ctx.stroke();
      }
      ctx.restore();

      const PLANET_DATA = [
        { name: "Mercury", aFrac: 0.17, color: "#94A3B8", r: 7 },
        { name: "Venus", aFrac: 0.26, color: "#FCD34D", r: 10 },
        { name: "Earth", aFrac: 0.36, color: "#3B82F6", r: 11 },
        { name: "Mars", aFrac: 0.48, color: "#EF4444", r: 9 },
        { name: "Jupiter", aFrac: 0.62, color: "#F97316", r: 18 },
      ];

      // Kepler's 3rd: T² ∝ a³ / M → ω = √(GM/a³) in natural units
      const G_NATURAL = 0.5 * starMass;

      PLANET_DATA.forEach((pd, i) => {
        const a = pd.aFrac * maxR;
        const omega = speed * Math.sqrt(G_NATURAL / Math.pow(a, 3)) * maxR;
        const planet = planetsRef.current[i];
        if (!planet) return;

        if (!paused) planet.angle = (planet.angle + omega * dt) % TWO_PI;

        const pos: Vec2 = { x: cx + a * Math.cos(planet.angle), y: cy + a * Math.sin(planet.angle) };

        // Orbit path
        ctx.save();
        ctx.strokeStyle = pd.color + "44";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.arc(cx, cy, a, 0, TWO_PI); ctx.stroke();
        ctx.restore();

        // Trail
        planet.trail.push({ ...pos });
        if (planet.trail.length > 120) planet.trail.shift();
        for (let j = 1; j < planet.trail.length; j++) {
          const al = (j / planet.trail.length) * 0.5;
          ctx.beginPath();
          ctx.strokeStyle = pd.color + Math.floor(al * 255).toString(16).padStart(2, "0");
          ctx.lineWidth = 1.5 * al;
          ctx.moveTo(planet.trail[j - 1].x, planet.trail[j - 1].y);
          ctx.lineTo(planet.trail[j].x, planet.trail[j].y);
          ctx.stroke();
        }

        // Period label
        const T = TWO_PI / (speed * Math.sqrt(G_NATURAL / Math.pow(a, 3)) * maxR);
        ctx.save();
        ctx.fillStyle = pd.color;
        ctx.font = "10px 'Courier New'";
        ctx.fillText(`T=${T.toFixed(1)}s`, cx + a + 4, cy + 4);
        ctx.restore();

        // Planet glow
        const pg = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, pd.r * 2.5);
        pg.addColorStop(0, pd.color + "FF");
        pg.addColorStop(1, pd.color + "00");
        ctx.save();
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(pos.x, pos.y, pd.r * 2.5, 0, TWO_PI); ctx.fill();
        ctx.fillStyle = "#FFF8"; ctx.beginPath(); ctx.arc(pos.x, pos.y, pd.r * 0.5, 0, TWO_PI); ctx.fill();
        ctx.restore();

        // Name
        ctx.save();
        ctx.fillStyle = pd.color;
        ctx.font = "bold 10px 'Courier New'";
        ctx.fillText(pd.name, pos.x + pd.r + 3, pos.y - pd.r);
        ctx.restore();
      });

      // Star (sun)
      const starR = 14 + 4 * starMass;
      const stg = ctx.createRadialGradient(cx, cy, 0, cx, cy, starR * 3);
      stg.addColorStop(0, "#FDE68A"); stg.addColorStop(0.5, "#F59E0B"); stg.addColorStop(1, "transparent");
      ctx.save();
      ctx.fillStyle = stg; ctx.beginPath(); ctx.arc(cx, cy, starR * 3, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = "#FEF3C7"; ctx.beginPath(); ctx.arc(cx, cy, starR, 0, TWO_PI); ctx.fill();
      ctx.restore();

      // T² vs a³ ratio annotation
      ctx.save();
      ctx.fillStyle = "#93C5FD";
      ctx.font = "bold 12px 'Courier New'";
      ctx.fillText(`T² ∝ a³ / M`, 12, 24);
      ctx.fillText(`Star Mass: ${starMass.toFixed(1)}×`, 12, 40);
      ctx.fillText(`Kepler's Third Law`, 12, 56);
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(rafRef.current); ro3.disconnect(); };
  }, [starMass, speed, paused]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function KeplersLaws() {
  const [activeLaw, setActiveLaw] = useState<Law>(1);
  const [paused, setPaused] = useState(false);

  // Law 1 & 2 params
  const [eccentricity, setEccentricity] = useState(0.6);
  const [speed, setSpeed] = useState(1.0);

  // Law 3 params
  const [starMass, setStarMass] = useState(1.0);

  const resetDefaults = () => {
    setEccentricity(0.6);
    setSpeed(1.0);
    setStarMass(1.0);
  };

  const lawInfo = {
    1: {
      title: "First Law — The Law of Ellipses",
      formula: "r = a(1 - e²) / (1 + e·cosθ)",
      formulaVars: "a = semi-major axis, e = eccentricity, θ = true anomaly",
      concept: "Every planet moves in an elliptical orbit with the Sun at one of the two foci. The shape of the orbit is characterized by its eccentricity (e=0 is circular, e→1 is parabolic).",
      tips: [
        { emoji: "🎯", title: "Perfect Circle", desc: "Set e = 0.00 for a circular orbit" },
        { emoji: "🚀", title: "Highly Elliptical", desc: "Set e = 0.90 for a comet-like orbit" },
        { emoji: "⚖️", title: "Earth-like", desc: "Set e = 0.02 for near-circular like Earth" },
      ],
      liveCalc: (e: number) => {
        const b_over_a = Math.sqrt(1 - e * e);
        const perihelion = 1 - e;
        const aphelion = 1 + e;
        return [
          { label: "b/a ratio", val: b_over_a.toFixed(3) },
          { label: "Perihelion (AU)", val: perihelion.toFixed(3) },
          { label: "Aphelion (AU)", val: aphelion.toFixed(3) },
        ];
      },
    },
    2: {
      title: "Second Law — Equal Areas in Equal Times",
      formula: "dA/dt = L / 2m = const",
      formulaVars: "L = angular momentum, m = planet mass, A = swept area",
      concept: "A line joining a planet to the Sun sweeps out equal areas during equal intervals of time. This means planets move faster when closer to the Sun (perihelion) and slower when farther (aphelion).",
      tips: [
        { emoji: "⚡", title: "Max Speed Contrast", desc: "Set e = 0.85, watch speed vary dramatically" },
        { emoji: "🐌", title: "Near Circle", desc: "Set e = 0.05 for nearly constant speed" },
        { emoji: "🌟", title: "Sweet Spot", desc: "e = 0.60 shows beautiful area sweeps" },
      ],
      liveCalc: (e: number) => {
        const periSpeed = Math.sqrt((1 + e) / (1 - e));
        const aphSpeed = Math.sqrt((1 - e) / (1 + e));
        return [
          { label: "Perihelion Speed (rel)", val: periSpeed.toFixed(3) },
          { label: "Aphelion Speed (rel)", val: aphSpeed.toFixed(3) },
          { label: "Speed Ratio (peri/aph)", val: (periSpeed / aphSpeed).toFixed(3) },
        ];
      },
    },
    3: {
      title: "Third Law — Harmonic Law",
      formula: "T² = (4π² / GM) · a³",
      formulaVars: "T = period, G = gravitational const, M = star mass, a = semi-major axis",
      concept: "The square of a planet's orbital period is directly proportional to the cube of the semi-major axis of its orbit. More massive stars cause faster orbits for all planets.",
      tips: [
        { emoji: "💫", title: "Massive Star", desc: "Set Star Mass = 3.0× to see fast orbits" },
        { emoji: "🐢", title: "Lightweight Star", desc: "Set Star Mass = 0.3× for slow, lazy orbits" },
        { emoji: "📊", title: "Compare T & a", desc: "Watch period labels update as mass changes" },
      ],
      liveCalc: (mass: number) => {
        const T_earth_relative = 1 / Math.sqrt(mass);
        const T_jupiter_relative = Math.pow(5.2, 1.5) / Math.sqrt(mass);
        return [
          { label: "Earth T (rel)", val: T_earth_relative.toFixed(3) },
          { label: "Jupiter T (rel)", val: T_jupiter_relative.toFixed(2) },
          { label: "T² / a³ ratio", val: (4 * Math.PI * Math.PI / mass).toFixed(3) },
        ];
      },
    },
  } as const;

  const info = lawInfo[activeLaw];
  const liveData = activeLaw === 3 ? info.liveCalc(starMass) : info.liveCalc(eccentricity);

  return (
    <main className="min-h-screen bg-[#020617] text-neutral-200 font-mono select-none">
      {/* Header — always visible, never shrinks */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Canvas + Header (2 columns) */}
            <div className="col-span-1 flex flex-col gap-4 lg:col-span-2">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🪐</span>
                  <div className="text-sm font-semibold text-white">Kepler&apos;s Laws Simulator</div>
                </div>
                <div className="flex items-center gap-2">
                  {([1, 2, 3] as Law[]).map(l => (
                    <button key={l}
                      onClick={() => setActiveLaw(l)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 border ${activeLaw === l
                        ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900"
                        : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700"
                        }`}
                    >
                      Law {l}
                    </button>
                  ))}
                  <button
                    onClick={() => setPaused(p => !p)}
                    className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20"
                  >
                    {paused ? "▶ Play" : "⏸ Pause"}
                  </button>
                  <button onClick={resetDefaults}
                    className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>

              <div className="w-full rounded-2xl overflow-hidden border border-neutral-800 shadow-xl" style={{ height: "55vh" }}>
                {activeLaw === 1 && <Law1Canvas eccentricity={eccentricity} speed={speed} paused={paused} />}
                {activeLaw === 2 && <Law2Canvas eccentricity={eccentricity} speed={speed} paused={paused} />}
                {activeLaw === 3 && <Law3Canvas starMass={starMass} speed={speed} paused={paused} />}
              </div>
            </div>

            {/* Controls Panel (1 column) */}
            <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">⚙️ Parameters</h3>
                <div className="flex flex-col gap-3">
                  {activeLaw === 3 ? (
                    <>
                      <Slider label="Star Mass" icon="⭐" value={starMass} min={0.2} max={3} step={0.05} unit="M☉"
                        onChange={setStarMass} tip="Higher mass → faster orbits" />
                      <Slider label="Sim Speed" icon="⏩" value={speed} min={0.1} max={3} step={0.1} unit="×"
                        onChange={setSpeed} />
                    </>
                  ) : (
                    <>
                      <Slider label="Eccentricity" icon="🔵" value={eccentricity} min={0.01} max={0.95} step={0.01} unit="e"
                        onChange={setEccentricity} tip="0=circle, →1=comet" />
                      <Slider label="Sim Speed" icon="⏩" value={speed} min={0.1} max={3} step={0.1} unit="×"
                        onChange={setSpeed} />
                    </>
                  )}
                </div>
              </div>

              {/* Live Data */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                <p className="text-cyan-400 text-xs font-bold mb-2">📊 Live Data</p>
                {liveData.map(d => (
                  <div key={d.label} className="flex justify-between items-center text-xs py-1.5 border-b border-neutral-800 last:border-0">
                    <span className="text-neutral-300">{d.label}</span>
                    <span className="text-blue-300 font-bold tabular-nums ml-2">{d.val}</span>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div className="rounded-xl border border-blue-900/50 bg-blue-950/50 p-4">
                <p className="text-yellow-400 text-xs font-bold mb-2">💡 Try This!</p>
                {info.tips.map(t => (
                  <div key={t.title} className="mb-2 last:mb-0">
                    <p className="text-xs text-white font-bold">{t.emoji} {t.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{t.desc}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>

        {/* Bottom Row: Info Panel */}
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Concept & Formula */}
            <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-cyan-400 mb-3">✨ {info.title}</h4>
              <p className="text-sm leading-relaxed mb-3">{info.concept}</p>
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                <p className="text-xs font-bold text-yellow-400 mb-1">📐 Key Formula</p>
                <p className="text-green-300 text-sm font-bold font-mono mb-1">{info.formula}</p>
                <p className="text-neutral-400 text-xs">{info.formulaVars}</p>
              </div>
            </div>

            {/* Live Physics */}
            <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-cyan-400 mb-3">⚡ Live Physics</h4>
              {activeLaw === 1 && (
                <div className="bg-neutral-950 rounded-lg p-3 text-xs font-mono border border-neutral-800 space-y-1">
                  <p className="text-neutral-400">r = a(1 - e²) / (1 + e·cosθ)</p>
                  <p className="text-yellow-300">b/a = √(1 - e²)</p>
                  <p className="text-blue-300">b/a = √(1 - {eccentricity.toFixed(2)}²)</p>
                  <p className="text-green-400 font-bold">= {Math.sqrt(1 - eccentricity ** 2).toFixed(4)}</p>
                  <hr className="border-neutral-800" />
                  <p className="text-neutral-300">Perihelion = a(1−e) = {(1 - eccentricity).toFixed(3)} AU</p>
                  <p className="text-neutral-300">Aphelion &nbsp;= a(1+e) = {(1 + eccentricity).toFixed(3)} AU</p>
                </div>
              )}
              {activeLaw === 2 && (
                <div className="bg-neutral-950 rounded-lg p-3 text-xs font-mono border border-neutral-800 space-y-1">
                  <p className="text-neutral-400">dA/dt = const (Kepler&apos;s 2nd)</p>
                  <p className="text-yellow-300">v_peri / v_aph = (1+e)/(1−e)</p>
                  <p className="text-blue-300">= (1+{eccentricity.toFixed(2)})/(1−{eccentricity.toFixed(2)})</p>
                  <p className="text-green-400 font-bold">= {((1 + eccentricity) / (1 - eccentricity)).toFixed(3)}</p>
                  <hr className="border-neutral-800" />
                  <p className="text-neutral-300">Swept area rate is constant</p>
                  <p className="text-neutral-300">regardless of orbital position</p>
                </div>
              )}
              {activeLaw === 3 && (
                <div className="bg-neutral-950 rounded-lg p-3 text-xs font-mono border border-neutral-800 space-y-1">
                  <p className="text-neutral-400">T² = (4π²/GM) · a³</p>
                  <p className="text-yellow-300">Earth (a=1AU, M={starMass.toFixed(1)}M☉):</p>
                  <p className="text-blue-300">T = 1/√{starMass.toFixed(1)}</p>
                  <p className="text-green-400 font-bold">T = {(1 / Math.sqrt(starMass)).toFixed(3)} yr (rel)</p>
                  <hr className="border-neutral-800" />
                  <p className="text-neutral-300">Jupiter (a=5.2 AU):</p>
                  <p className="text-green-400">T = {(Math.pow(5.2, 1.5) / Math.sqrt(starMass)).toFixed(2)} yr (rel)</p>
                </div>
              )}
            </div>

            {/* Theory */}
            <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-cyan-400 mb-3">📚 Theory</h4>
              {activeLaw === 1 && (
                <p className="text-sm leading-relaxed">
                  Johannes Kepler (1571–1630) derived the laws of planetary motion from Tycho Brahe&apos;s observations. The First Law replaced the ancient belief in circular orbits. An ellipse has two foci; the Sun sits at one. Eccentricity (e) quantifies elongation — Earth has e≈0.017 while Halley&apos;s Comet has e≈0.967.
                </p>
              )}
              {activeLaw === 2 && (
                <p className="text-sm leading-relaxed">
                  The Second Law is equivalent to conservation of angular momentum (L = m·r²·ω = constant). As a planet approaches perihelion, its distance r decreases, so angular velocity ω must increase. This is why comets move rapidly at closest approach and slowly at aphelion.
                </p>
              )}
              {activeLaw === 3 && (
                <p className="text-sm leading-relaxed">
                  Kepler published the Third Law in 1619: T² ∝ a³. Newton&apos;s gravity gives T² = (4π²/GM)·a³. This allows us to &ldquo;weigh&rdquo; a star. More massive stars produce shorter periods. This principle detects exoplanets, measures black hole masses, and probes dark matter.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}