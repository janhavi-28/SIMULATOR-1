"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ShapeConfig {
  id: string;
  name: string;
  color: string;
  formula: string;
  calcI: (m: number, r: number, l: number) => number;
  draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, angle: number, color: string, m: number) => void;
}

// ─── Shape Definitions ────────────────────────────────────────────────────────
const SHAPES: ShapeConfig[] = [
  {
    id: "solid-disk",
    name: "Solid Disk",
    color: "#3B82F6",
    formula: "I = ½MR²",
    calcI: (m, r) => 0.5 * m * r * r,
    draw: (ctx, cx, cy, r, angle, color) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      // Disk body
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, color + "FF");
      grad.addColorStop(0.7, color + "CC");
      grad.addColorStop(1, color + "66");
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Spokes
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
        ctx.stroke();
      }
      // Center hub
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "hollow-ring",
    name: "Hollow Ring",
    color: "#8B5CF6",
    formula: "I = MR²",
    calcI: (m, r) => m * r * r,
    draw: (ctx, cx, cy, r, angle, color) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const innerR = r * 0.65;
      // Outer ring
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.arc(0, 0, innerR, 0, Math.PI * 2, true);
      const grad = ctx.createRadialGradient(0, 0, innerR, 0, 0, r);
      grad.addColorStop(0, color + "AA");
      grad.addColorStop(0.5, color + "EE");
      grad.addColorStop(1, color + "66");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, innerR, 0, Math.PI * 2);
      ctx.stroke();
      // Spokes
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * innerR, Math.sin(a) * innerR);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "solid-sphere",
    name: "Solid Sphere",
    color: "#06B6D4",
    formula: "I = ⅖MR²",
    calcI: (m, r) => 0.4 * m * r * r,
    draw: (ctx, cx, cy, r, angle, color) => {
      ctx.save();
      ctx.translate(cx, cy);
      // Sphere body
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.05, 0, 0, r);
      grad.addColorStop(0, "#FFFFFF99");
      grad.addColorStop(0.3, color + "EE");
      grad.addColorStop(1, color + "55");
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Equator lines rotating
      ctx.rotate(angle);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const yr = r * (i - 1) * 0.5;
        const xr = Math.sqrt(Math.max(0, r * r - yr * yr));
        ctx.beginPath();
        ctx.ellipse(0, yr, xr, xr * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "hollow-sphere",
    name: "Hollow Sphere",
    color: "#10B981",
    formula: "I = ⅔MR²",
    calcI: (m, r) => (2 / 3) * m * r * r,
    draw: (ctx, cx, cy, r, angle, color) => {
      ctx.save();
      ctx.translate(cx, cy);
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.6, 0, 0, r);
      grad.addColorStop(0, color + "44");
      grad.addColorStop(0.7, color + "99");
      grad.addColorStop(1, color + "EE");
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.rotate(angle);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const yr = r * (i - 1) * 0.5;
        const xr = Math.sqrt(Math.max(0, r * r - yr * yr));
        ctx.beginPath();
        ctx.ellipse(0, yr, xr, xr * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "rod-center",
    name: "Rod (Center)",
    color: "#F59E0B",
    formula: "I = 1/12·ML²",
    calcI: (m, _r, l) => (1 / 12) * m * l * l,
    draw: (ctx, cx, cy, r, angle, color) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const L = r * 2;
      const grad = ctx.createLinearGradient(-L, 0, L, 0);
      grad.addColorStop(0, color + "44");
      grad.addColorStop(0.5, color + "FF");
      grad.addColorStop(1, color + "44");
      ctx.beginPath();
      ctx.roundRect(-L, -r * 0.12, L * 2, r * 0.24, r * 0.1);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Axis dot
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "rod-end",
    name: "Rod (End)",
    color: "#EF4444",
    formula: "I = 1/3·ML²",
    calcI: (m, _r, l) => (1 / 3) * m * l * l,
    draw: (ctx, cx, cy, r, angle, color) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const L = r * 2;
      const grad = ctx.createLinearGradient(0, 0, L * 2, 0);
      grad.addColorStop(0, color + "FF");
      grad.addColorStop(1, color + "44");
      ctx.beginPath();
      ctx.roundRect(0, -r * 0.12, L * 2, r * 0.24, r * 0.1);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Pivot dot
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.restore();
    },
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MomentOfInertiaSimulator() {
  // Parameters
  const [playing, setPlaying] = useState(true);
  const [mass, setMass] = useState(2.0);
  const [radius, setRadius] = useState(1.0);
  const [torque, setTorque] = useState(5.0);
  const [length, setLength] = useState(2.0);
  const [selectedShape, setSelectedShape] = useState(0);
  const [compareMode, setCompareMode] = useState(false);

  // Animation state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);
  const omegaRef = useRef(0);
  const alphaRef = useRef(0);
  const trailRef = useRef<{x: number, y: number, a: number}[]>([]);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Smooth values
  const smoothMass = useRef(mass);
  const smoothRadius = useRef(radius);
  const smoothTorque = useRef(torque);

  const shape = SHAPES[selectedShape];
  const compareShape = SHAPES[(selectedShape + 1) % SHAPES.length];

  const getI = useCallback((s: ShapeConfig, m: number, r: number, l: number) => {
    return Math.max(0.001, s.calcI(m, r, l));
  }, []);

  const currentI = getI(shape, mass, radius, length);
  const compareI = getI(compareShape, mass, radius, length);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0F172A");
    bg.addColorStop(1, "#1E293B");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(148,163,184,0.07)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < W; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const sm = smoothMass.current;
    const sr = smoothRadius.current;
    const st = smoothTorque.current;

    const I1 = getI(shape, sm, sr, length);
    const I2 = compareMode ? getI(compareShape, sm, sr, length) : 0;
    const alpha1 = st / I1;
    const alpha2 = compareMode ? st / I2 : 0;
    alphaRef.current = alpha1;

    const visualR = Math.max(30, Math.min(90, sr * 50));

    if (compareMode) {
      // Side-by-side
      const cx1 = W * 0.28, cx2 = W * 0.72, cy = H * 0.5;
      const a1 = angleRef.current;
      const a2 = angleRef.current * (I1 / Math.max(0.001, I2));

      // Glow behind shapes
      const g1 = ctx.createRadialGradient(cx1, cy, 0, cx1, cy, visualR * 1.8);
      g1.addColorStop(0, shape.color + "33");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

      const g2 = ctx.createRadialGradient(cx2, cy, 0, cx2, cy, visualR * 1.8);
      g2.addColorStop(0, compareShape.color + "33");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

      // Draw trailing arc for angular sweep
      drawAngularTrail(ctx, cx1, cy, visualR + 15, a1, shape.color);
      drawAngularTrail(ctx, cx2, cy, visualR + 15, a2, compareShape.color);

      shape.draw(ctx, cx1, cy, visualR, a1, shape.color, sm);
      compareShape.draw(ctx, cx2, cy, visualR, a2, compareShape.color, sm);

      // Angular velocity indicators
      drawOmegaArrow(ctx, cx1, cy, visualR, omegaRef.current, shape.color);
      drawOmegaArrow(ctx, cx2, cy, visualR, omegaRef.current * (I1 / Math.max(0.001, I2)), compareShape.color);

      // Labels
      ctx.font = "bold 13px 'Courier New'";
      ctx.fillStyle = shape.color;
      ctx.textAlign = "center";
      ctx.fillText(shape.name, cx1, cy + visualR + 28);
      ctx.fillText(`I = ${I1.toFixed(2)} kg·m²`, cx1, cy + visualR + 44);
      ctx.fillText(`α = ${alpha1.toFixed(2)} rad/s²`, cx1, cy + visualR + 60);

      ctx.fillStyle = compareShape.color;
      ctx.fillText(compareShape.name, cx2, cy + visualR + 28);
      ctx.fillText(`I = ${I2.toFixed(2)} kg·m²`, cx2, cy + visualR + 44);
      ctx.fillText(`α = ${alpha2.toFixed(2)} rad/s²`, cx2, cy + visualR + 60);

      // VS divider
      ctx.font = "bold 28px 'Courier New'";
      ctx.fillStyle = "#F59E0B";
      ctx.fillText("VS", W * 0.5, H * 0.5 + 8);

    } else {
      // Single shape
      const cx = W * 0.5, cy = H * 0.5;

      // Glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, visualR * 2.2);
      glow.addColorStop(0, shape.color + "44");
      glow.addColorStop(0.5, shape.color + "22");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

      drawAngularTrail(ctx, cx, cy, visualR + 12, angleRef.current, shape.color);
      shape.draw(ctx, cx, cy, visualR, angleRef.current, shape.color, sm);
      drawOmegaArrow(ctx, cx, cy, visualR, omegaRef.current, shape.color);
      drawTorqueVector(ctx, cx, cy, visualR, st, shape.color);

      // Center label
      ctx.font = "bold 14px 'Courier New'";
      ctx.fillStyle = shape.color;
      ctx.textAlign = "center";
      ctx.fillText(shape.name, cx, cy + visualR + 28);
      ctx.fillText(`I = ${I1.toFixed(3)} kg·m²`, cx, cy + visualR + 46);
    }

    // Angular position arc
    if (!compareMode) {
      const cx = W * 0.5, cy = H * 0.5;
      ctx.strokeStyle = shape.color + "55";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, visualR * 1.25, 0, angleRef.current % (Math.PI * 2));
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [shape, compareShape, compareMode, length, selectedShape, getI]);

  function drawAngularTrail(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, angle: number, color: string) {
    const steps = 48;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const a = angle - t * Math.PI * 0.7;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      ctx.beginPath();
      ctx.arc(x, y, 3 * (1 - t), 0, Math.PI * 2);
      ctx.fillStyle = color + Math.floor((1 - t) * 180).toString(16).padStart(2, "0");
      ctx.fill();
    }
  }

  function drawOmegaArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, omega: number, color: string) {
    if (Math.abs(omega) < 0.01) return;
    const arrowLen = Math.min(Math.abs(omega) * 8, 30);
    const a = angleRef.current + Math.PI / 2 * Math.sign(omega);
    const ax = cx + Math.cos(angleRef.current) * (r + 14);
    const ay = cy + Math.sin(angleRef.current) * (r + 14);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + Math.cos(a) * arrowLen, ay + Math.sin(a) * arrowLen);
    ctx.stroke();
    // Arrowhead
    ctx.fillStyle = color;
    ctx.beginPath();
    const tip = { x: ax + Math.cos(a) * arrowLen, y: ay + Math.sin(a) * arrowLen };
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - Math.cos(a - 0.4) * 8, tip.y - Math.sin(a - 0.4) * 8);
    ctx.lineTo(tip.x - Math.cos(a + 0.4) * 8, tip.y - Math.sin(a + 0.4) * 8);
    ctx.fill();
    ctx.restore();
    void a;
  }

  function drawTorqueVector(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, torqueVal: number, color: string) {
    const arcR = r * 1.45;
    ctx.save();
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();
    // Arrowhead at end of torque arc
    const endA = Math.PI * 0.6;
    const ex = cx + Math.cos(endA) * arcR;
    const ey = cy + Math.sin(endA) * arcR;
    const tangA = endA + Math.PI / 2;
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - Math.cos(tangA - 0.4) * 9, ey - Math.sin(tangA - 0.4) * 9);
    ctx.lineTo(ex - Math.cos(tangA + 0.4) * 9, ey - Math.sin(tangA + 0.4) * 9);
    ctx.fill();
    // Torque label
    ctx.font = "11px 'Courier New'";
    ctx.fillStyle = "#F59E0B";
    ctx.textAlign = "left";
    ctx.fillText(`τ = ${torqueVal.toFixed(1)} N·m`, cx + arcR + 6, cy - 6);
    ctx.restore();
    void color;
  }

  // Animation loop
  useEffect(() => {
    let animId: number;
    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      timeRef.current += dt;

      // Smooth params
      smoothMass.current = lerp(smoothMass.current, mass, 0.12);
      smoothRadius.current = lerp(smoothRadius.current, radius, 0.12);
      smoothTorque.current = lerp(smoothTorque.current, torque, 0.12);

      const I = getI(shape, smoothMass.current, smoothRadius.current, length);
      const alpha = smoothTorque.current / I;
      omegaRef.current += alpha * dt;
      omegaRef.current *= 0.992; // slight damping for visual clarity
      angleRef.current += omegaRef.current * dt;

      draw();
      animId = requestAnimationFrame(animate);
    };
    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [mass, radius, torque, length, shape, draw, getI]);

  const handleReset = () => {
    setMass(2.0); setRadius(1.0); setTorque(5.0); setLength(2.0);
    angleRef.current = 0; omegaRef.current = 0;
  };

  const omega = omegaRef.current;
  const KE = 0.5 * currentI * omega * omega;
  const alpha = torque / currentI;
  const angularMomentum = currentI * omega;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: "#0F172A", minHeight: "100vh", color: "#E2E8F0", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <div style={{ padding: "10px 20px", borderBottom: "1px solid #1E3A5F", background: "#0D1B2A", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "conic-gradient(#3B82F6, #8B5CF6, #06B6D4, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "white" }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#3B82F6", letterSpacing: 1 }}>MOMENT OF INERTIA</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>Interactive Physics Simulator</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setCompareMode(c => !c)}
            style={{ padding: "6px 16px", borderRadius: 6, border: `1px solid ${compareMode ? "#8B5CF6" : "#334155"}`, background: compareMode ? "#8B5CF633" : "transparent", color: compareMode ? "#8B5CF6" : "#94A3B8", cursor: "pointer", fontSize: 12 }}
          >
            ⚖ Compare Shapes
          </button>
        </div>
      </div>

      {/* MAIN: SIM + CONTROLS */}
      <div style={{ display: "flex", height: "65vh", minHeight: 380 }}>
        {/* SIMULATION CANVAS */}
        <div style={{ flex: "0 0 65%", position: "relative", borderRight: "1px solid #1E3A5F" }}>
          <canvas
            ref={canvasRef}
            width={900}
            height={520}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          {/* Live stats overlay */}
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(15,23,42,0.88)", border: "1px solid #1E3A5F", borderRadius: 8, padding: "8px 14px", fontSize: 12 }}>
            <div style={{ color: "#64748B", marginBottom: 4, fontSize: 10 }}>⚡ LIVE STATS</div>
            <div style={{ color: "#3B82F6" }}>I = <span style={{ color: "#60A5FA", fontWeight: 700 }}>{currentI.toFixed(3)}</span> kg·m²</div>
            <div style={{ color: "#8B5CF6" }}>α = <span style={{ color: "#A78BFA", fontWeight: 700 }}>{alpha.toFixed(3)}</span> rad/s²</div>
            <div style={{ color: "#06B6D4" }}>ω = <span style={{ color: "#67E8F9", fontWeight: 700 }}>{Math.abs(omega).toFixed(3)}</span> rad/s</div>
            <div style={{ color: "#10B981" }}>KE = <span style={{ color: "#34D399", fontWeight: 700 }}>{KE.toFixed(2)}</span> J</div>
            <div style={{ color: "#F59E0B" }}>L = <span style={{ color: "#FCD34D", fontWeight: 700 }}>{Math.abs(angularMomentum).toFixed(3)}</span> kg·m²/s</div>
          </div>
          {/* Formula overlay */}
          <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(15,23,42,0.88)", border: `1px solid ${shape.color}44`, borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>
            <div style={{ color: "#64748B", fontSize: 10, marginBottom: 4 }}>📐 FORMULA</div>
            <div style={{ color: shape.color, fontWeight: 700, fontSize: 15 }}>{shape.formula}</div>
            <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 4 }}>τ = I·α → α = τ/I</div>
          </div>
        </div>

        {/* CONTROLS PANEL */}
        <div style={{ flex: "0 0 35%", padding: "14px 18px", overflowY: "auto", background: "#0D1B2A" }}>
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 10, letterSpacing: 1 }}>⚙ PARAMETERS</div>

          {/* Shape selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>Shape</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {SHAPES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedShape(i); omegaRef.current = 0; angleRef.current = 0; }}
                  style={{
                    padding: "5px 6px", borderRadius: 6, fontSize: 10, cursor: "pointer", textAlign: "left",
                    border: `1px solid ${selectedShape === i ? s.color : "#1E3A5F"}`,
                    background: selectedShape === i ? s.color + "22" : "#0F172A",
                    color: selectedShape === i ? s.color : "#64748B",
                    transition: "all 0.2s"
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          {[
            { label: "Mass (M)", value: mass, set: setMass, min: 0.1, max: 10, step: 0.1, unit: "kg", color: "#3B82F6", icon: "⚖" },
            { label: "Radius (R)", value: radius, set: setRadius, min: 0.1, max: 3, step: 0.05, unit: "m", color: "#8B5CF6", icon: "📏" },
            { label: "Torque (τ)", value: torque, set: setTorque, min: 0, max: 30, step: 0.5, unit: "N·m", color: "#F59E0B", icon: "🔄" },
            { label: "Length (L)", value: length, set: setLength, min: 0.2, max: 4, step: 0.1, unit: "m", color: "#06B6D4", icon: "📐" },
          ].map(p => (
            <div key={p.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{p.icon} {p.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.value.toFixed(p.step < 0.1 ? 2 : 1)} <span style={{ fontSize: 10, fontWeight: 400, color: "#64748B" }}>{p.unit}</span></span>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="range" min={p.min} max={p.max} step={p.step} value={p.value}
                  onChange={e => p.set(Number(e.target.value))}
                  aria-label={`${p.label}: ${p.value} ${p.unit}`}
                  style={{ width: "100%", accentColor: p.color, height: 6, cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#334155", marginTop: 1 }}>
                  <span>{p.min}</span><span>{p.max}</span>
                </div>
              </div>
            </div>
          ))}

          {/* I Comparison Bar */}
          <div style={{ background: "#0F172A", border: "1px solid #1E3A5F", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#64748B", marginBottom: 8 }}>INERTIA COMPARISON</div>
            {SHAPES.slice(0, 4).map(s => {
              const Iv = getI(s, mass, radius, length);
              const maxI = getI(SHAPES[1], mass, radius, length); // ring is max
              return (
                <div key={s.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                    <span style={{ color: s.color }}>{s.name}</span>
                    <span style={{ color: "#94A3B8" }}>{Iv.toFixed(3)}</span>
                  </div>
                  <div style={{ height: 5, background: "#1E293B", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (Iv / (maxI + 0.001)) * 100)}%`, background: s.color, borderRadius: 3, transition: "width 0.3s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pro Tips */}
          <div style={{ background: "#0F2040", border: "1px solid #1E3A5F", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 11 }}>
            <div style={{ color: "#F59E0B", fontWeight: 700, marginBottom: 6 }}>💡 Try This!</div>
            <div style={{ color: "#94A3B8", lineHeight: 1.6 }}>
              🎯 <strong style={{ color: "#60A5FA" }}>Max inertia:</strong> Hollow Ring + large R<br />
              ⚡ <strong style={{ color: "#A78BFA" }}>High spin:</strong> Low I + high torque<br />
              📐 <strong style={{ color: "#67E8F9" }}>Compare:</strong> Enable "Compare Shapes"
            </div>
          </div>

          {/* Reset */}
                <button
                  type="button"
                  onClick={() => setPlaying(p => !p)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400 hover:bg-cyan-500/20"
                >
                  {playing ? "⏸ Pause" : "▶ Play"}
                </button>
          <button
            onClick={handleReset}
            style={{ width: "100%", padding: "10px", borderRadius: 8, background: "#3B82F6", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: 0.5, transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#2563EB")}
            onMouseLeave={e => (e.currentTarget.style.background = "#3B82F6")}
          >↺ Reset</button>
        </div>
      </div>

      {/* BOTTOM EDUCATIONAL PANEL */}
      <div style={{ flex: 1, borderTop: "1px solid #1E3A5F", background: "#0D1B2A", padding: "18px 24px", display: "flex", gap: 20, minHeight: 220 }}>
        {/* Left: Theory */}
        <div style={{ flex: "0 0 38%" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#3B82F6", marginBottom: 10, borderBottom: "1px solid #1E3A5F", paddingBottom: 6 }}>✨ The Concept</div>
          <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.7, marginBottom: 12 }}>
            <strong style={{ color: "#E2E8F0" }}>Moment of Inertia (I)</strong> is the rotational analogue of mass — it measures how hard it is to start or stop a rotating object. Objects with mass concentrated <em style={{ color: "#60A5FA" }}>far from the axis</em> resist angular acceleration more than those with mass near the center.
          </p>
          <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.7 }}>
            Just as <strong style={{ color: "#E2E8F0" }}>F = ma</strong> governs linear motion, the rotational equivalent is <strong style={{ color: "#F59E0B" }}>τ = Iα</strong> — torque equals inertia times angular acceleration.
          </p>
          <div style={{ marginTop: 12, background: "#0F172A", borderRadius: 8, padding: "10px 14px", border: "1px solid #1E3A5F" }}>
            <div style={{ fontSize: 10, color: "#64748B", marginBottom: 6 }}>📐 KEY FORMULAE</div>
            {[
              { label: "Solid Disk", f: "I = ½MR²", c: "#3B82F6" },
              { label: "Hollow Ring", f: "I = MR²", c: "#8B5CF6" },
              { label: "Solid Sphere", f: "I = ⅖MR²", c: "#06B6D4" },
              { label: "Hollow Sphere", f: "I = ⅔MR²", c: "#10B981" },
            ].map(x => (
              <div key={x.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: "#64748B" }}>{x.label}</span>
                <span style={{ color: x.c, fontWeight: 700 }}>{x.f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Live Calculation */}
        <div style={{ flex: "0 0 32%", borderLeft: "1px solid #1E3A5F", paddingLeft: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#8B5CF6", marginBottom: 10, borderBottom: "1px solid #1E3A5F", paddingBottom: 6 }}>📊 Live Calculation</div>
          <div style={{ background: "#0F172A", borderRadius: 8, padding: "12px 14px", border: "1px solid #1E3A5F", fontSize: 12, lineHeight: 2 }}>
            <div style={{ color: "#64748B" }}>Newton's 2nd Law (Rotation):</div>
            <div style={{ color: "#F59E0B", fontWeight: 700 }}>τ = I · α</div>
            <div style={{ color: "#94A3B8" }}>↓ Rearranged for α:</div>
            <div style={{ color: "#A78BFA" }}>α = τ / I</div>
            <div style={{ color: "#94A3B8" }}>↓ Substituting:</div>
            <div style={{ color: "#E2E8F0" }}>
              α = <span style={{ color: "#F59E0B" }}>{torque.toFixed(1)}</span> / <span style={{ color: "#60A5FA" }}>{currentI.toFixed(3)}</span>
            </div>
            <div style={{ color: "#34D399", fontWeight: 700, fontSize: 14 }}>
              α = {alpha.toFixed(4)} rad/s²
            </div>
          </div>
          <div style={{ marginTop: 12, background: "#0F172A", borderRadius: 8, padding: "10px 14px", border: "1px solid #1E3A5F", fontSize: 11 }}>
            <div style={{ color: "#64748B", marginBottom: 6, fontSize: 10 }}>⚡ CURRENT VALUES</div>
            <div style={{ color: "#60A5FA" }}>Inertia (I): <strong>{currentI.toFixed(4)} kg·m²</strong></div>
            <div style={{ color: "#A78BFA" }}>Angular Accel (α): <strong>{alpha.toFixed(4)} rad/s²</strong></div>
            <div style={{ color: "#67E8F9" }}>Angular Velocity (ω): <strong>{Math.abs(omega).toFixed(4)} rad/s</strong></div>
            <div style={{ color: "#34D399" }}>Kinetic Energy: <strong>{KE.toFixed(4)} J</strong></div>
            <div style={{ color: "#FCD34D" }}>Angular Momentum: <strong>{Math.abs(angularMomentum).toFixed(4)} kg·m²/s</strong></div>
          </div>
        </div>

        {/* Right: Tips */}
        <div style={{ flex: 1, borderLeft: "1px solid #1E3A5F", paddingLeft: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#06B6D4", marginBottom: 10, borderBottom: "1px solid #1E3A5F", paddingBottom: 6 }}>💡 Try This for Drama!</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                icon: "🏎",
                title: "Maximum Spin Speed",
                desc: "Solid Disk · M=0.1kg · R=0.1m · τ=30 N·m",
                result: "Tiny I → Huge α → Rockets to speed!",
                color: "#3B82F6",
              },
              {
                icon: "🐌",
                title: "Resist Rotation",
                desc: "Hollow Ring · M=10kg · R=3m · τ=1 N·m",
                result: "Massive I → Near-zero α → Barely moves!",
                color: "#8B5CF6",
              },
              {
                icon: "⚖",
                title: "Compare Ring vs Disk",
                desc: "Enable Compare Shapes · Same M and R",
                result: "Ring accelerates 2× slower than disk!",
                color: "#F59E0B",
              },
              {
                icon: "🎯",
                title: "Mass Distribution Effect",
                desc: "Same shape, increase R gradually",
                result: "Watch I grow as R² — quadratic scaling!",
                color: "#10B981",
              },
            ].map(tip => (
              <div key={tip.title} style={{ background: "#0F172A", border: `1px solid ${tip.color}44`, borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontWeight: 700, color: tip.color, fontSize: 12, marginBottom: 3 }}>{tip.icon} {tip.title}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2 }}>{tip.desc}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>→ {tip.result}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* THEORY SECTION */}
      <div style={{ borderTop: "2px solid #1E3A5F", background: "#0A1628", padding: "20px 28px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#3B82F6", marginBottom: 14, letterSpacing: 1 }}>📚 PHYSICS THEORY — MOMENT OF INERTIA</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, fontSize: 12, color: "#94A3B8", lineHeight: 1.8 }}>
          <div>
            <div style={{ color: "#60A5FA", fontWeight: 700, marginBottom: 6 }}>What Is It?</div>
            The moment of inertia is a scalar quantity that depends on both the total mass of an object and how that mass is distributed relative to the rotation axis. A larger moment of inertia means the object requires more torque to achieve the same angular acceleration — it's fundamentally the rotational resistance to change in spin.
          </div>
          <div>
            <div style={{ color: "#A78BFA", fontWeight: 700, marginBottom: 6 }}>Parallel Axis Theorem</div>
            When the axis of rotation doesn't pass through the center of mass, the moment of inertia increases: <strong style={{ color: "#C4B5FD" }}>I = I_cm + Md²</strong>, where <em>d</em> is the distance between the parallel axes. This is why a rod spinning about its end (I = ML²/3) has a larger inertia than one spinning at its center (I = ML²/12).
          </div>
          <div>
            <div style={{ color: "#67E8F9", fontWeight: 700, marginBottom: 6 }}>Real-World Examples</div>
            Figure skaters pull in their arms to reduce I and spin faster (conserving angular momentum: L = Iω = constant). Flywheels in engines have large I to store rotational kinetic energy. Bicycle wheels, gymnasts, tops, planets — all governed by this elegant principle connecting mass distribution to rotational dynamics.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1E3A5F", padding: "8px 20px", background: "#060E1A", fontSize: 10, color: "#334155", display: "flex", justifyContent: "space-between" }}>
        <span>Moment of Inertia Simulator · τ = Iα</span>
        <span>All shapes: axis through center unless noted · Units: SI</span>
      </div>
    </div>
  );
}