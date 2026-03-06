"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SliderParam {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
  icon: string;
  description: string;
}

interface GasState {
  pressure: number;   // atm
  volume: number;     // L
  temperature: number; // K
  moles: number;      // mol
  gamma: number;      // heat capacity ratio
  processType: "isothermal" | "isobaric" | "isochoric" | "adiabatic";
}

interface PVPoint {
  pressure: number;
  volume: number;
  work: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  energy: number;
}

// ─── Physics Calculations ─────────────────────────────────────────────────────
const R = 0.0821; // L·atm/(mol·K)

const calcTemperature = (P: number, V: number, n: number): number =>
  (P * V) / (n * R);

const calcPressure = (V: number, n: number, T: number): number =>
  (n * R * T) / V;

const calcWorkIsothermal = (P1: number, V1: number, V2: number): number =>
  P1 * V1 * Math.log(V2 / V1); // W = nRT·ln(V2/V1)

const calcWorkIsobaric = (P: number, V1: number, V2: number): number =>
  P * (V2 - V1);

const calcWorkAdiabatic = (
  P1: number, V1: number, P2: number, V2: number, gamma: number
): number => (P1 * V1 - P2 * V2) / (gamma - 1);

const calcFinalPressureAdiabatic = (
  P1: number, V1: number, V2: number, gamma: number
): number => P1 * Math.pow(V1 / V2, gamma);

const generatePVCurve = (
  state: GasState,
  V2: number
): PVPoint[] => {
  const { pressure: P1, volume: V1, temperature: T1, moles: n, gamma, processType } = state;
  const points: PVPoint[] = [];
  const steps = 120;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const V = V1 + (V2 - V1) * t;
    let P: number;
    let work: number;

    switch (processType) {
      case "isothermal":
        P = (n * R * T1) / V;
        work = calcWorkIsothermal(P1, V1, V);
        break;
      case "isobaric":
        P = P1;
        work = calcWorkIsobaric(P1, V1, V);
        break;
      case "isochoric":
        P = P1 + (i / steps) * (calcPressure(V1, n, T1 * 1.5) - P1);
        work = 0;
        break;
      case "adiabatic":
        P = calcFinalPressureAdiabatic(P1, V1, V, gamma);
        const P2 = calcFinalPressureAdiabatic(P1, V1, V, gamma);
        work = calcWorkAdiabatic(P1, V1, P2, V, gamma);
        break;
      default:
        P = P1;
        work = 0;
    }
    points.push({ pressure: P, volume: V, work });
  }
  return points;
};

// ─── Particle System ──────────────────────────────────────────────────────────
const createParticles = (count: number, boxW: number, boxH: number, energy: number): Particle[] => {
  const colors = ["#60A5FA", "#34D399", "#A78BFA", "#F472B6", "#38BDF8"];
  return Array.from({ length: count }, (_, i) => {
    const speed = 1.5 + Math.random() * energy * 2;
    const angle = Math.random() * Math.PI * 2;
    return {
      x: 20 + Math.random() * (boxW - 40),
      y: 20 + Math.random() * (boxH - 40),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4 + Math.random() * 3,
      color: colors[i % colors.length],
      energy,
    };
  });
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GasWorkSimulator() {
  // Slider parameters
  const [params, setParams] = useState<Record<string, SliderParam>>({
    initialPressure: {
      label: "Initial Pressure", value: 2.0, min: 0.5, max: 10, step: 0.1, unit: "atm",
      defaultValue: 2.0, icon: "🔴", description: "Gas pressure at start"
    },
    initialVolume: {
      label: "Initial Volume", value: 1.0, min: 0.1, max: 5, step: 0.1, unit: "L",
      defaultValue: 1.0, icon: "📦", description: "Starting container volume"
    },
    finalVolume: {
      label: "Final Volume", value: 4.0, min: 0.1, max: 10, step: 0.1, unit: "L",
      defaultValue: 4.0, icon: "📐", description: "Expanded/compressed volume"
    },
    moles: {
      label: "Amount (n)", value: 1.0, min: 0.1, max: 5, step: 0.1, unit: "mol",
      defaultValue: 1.0, icon: "⚗️", description: "Moles of gas"
    },
    gamma: {
      label: "γ (Cp/Cv)", value: 1.4, min: 1.1, max: 2.0, step: 0.05, unit: "",
      defaultValue: 1.4, icon: "γ", description: "Heat capacity ratio (monatomic=1.67, diatomic=1.4)"
    },
  });

  const [processType, setProcessType] = useState<GasState["processType"]>("isothermal");
  const [animProgress, setAnimProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [pvCurve, setPvCurve] = useState<PVPoint[]>([]);
  const [currentWork, setCurrentWork] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pvCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particleFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const animStartRef = useRef<number>(0);

  // Derived state
  const P1 = params.initialPressure.value;
  const V1 = params.initialVolume.value;
  const V2 = params.finalVolume.value;
  const n = params.moles.value;
  const gamma = params.gamma.value;
  const T1 = calcTemperature(P1, V1, n);

  const getProcessColor = () => {
    switch (processType) {
      case "isothermal": return "#3B82F6";
      case "isobaric": return "#10B981";
      case "isochoric": return "#F59E0B";
      case "adiabatic": return "#EF4444";
    }
  };

  const getFinalPressure = () => {
    switch (processType) {
      case "isothermal": return calcPressure(V2, n, T1);
      case "isobaric": return P1;
      case "isochoric": return P1;
      case "adiabatic": return calcFinalPressureAdiabatic(P1, V1, V2, gamma);
    }
  };

  const getTotalWork = () => {
    const P2 = getFinalPressure();
    switch (processType) {
      case "isothermal": return calcWorkIsothermal(P1, V1, V2);
      case "isobaric": return calcWorkIsobaric(P1, V1, V2);
      case "isochoric": return 0;
      case "adiabatic": return calcWorkAdiabatic(P1, V1, P2, V2, gamma);
    }
  };

  const getFormula = () => {
    switch (processType) {
      case "isothermal": return "W = nRT·ln(V₂/V₁) = P₁V₁·ln(V₂/V₁)";
      case "isobaric": return "W = P·ΔV = P·(V₂ − V₁)";
      case "isochoric": return "W = 0  (no volume change)";
      case "adiabatic": return "W = (P₁V₁ − P₂V₂)/(γ − 1)";
    }
  };

  const getSubstitutedFormula = () => {
    const P2 = getFinalPressure();
    const W = getTotalWork();
    const t = (animProgress / 100);
    const Vcurrent = V1 + (V2 - V1) * t;
    switch (processType) {
      case "isothermal":
        return `W = ${P1.toFixed(2)}×${V1.toFixed(2)}×ln(${V2.toFixed(2)}/${V1.toFixed(2)}) = ${W.toFixed(3)} L·atm`;
      case "isobaric":
        return `W = ${P1.toFixed(2)}×(${V2.toFixed(2)}−${V1.toFixed(2)}) = ${W.toFixed(3)} L·atm`;
      case "isochoric":
        return `W = 0 (ΔV = 0, V = ${V1.toFixed(2)} L throughout)`;
      case "adiabatic":
        return `W = (${P1.toFixed(2)}×${V1.toFixed(2)}−${P2.toFixed(3)}×${V2.toFixed(2)})/(${gamma}−1) = ${W.toFixed(3)} L·atm`;
    }
  };

  // Generate PV curve whenever inputs change
  useEffect(() => {
    const state: GasState = {
      pressure: P1, volume: V1, temperature: T1, moles: n, gamma, processType
    };
    const curve = generatePVCurve(state, V2);
    setPvCurve(curve);
    setAnimProgress(0);
    setCurrentWork(0);
  }, [P1, V1, V2, n, gamma, processType]);

  // Draw PV diagram
  useEffect(() => {
    const canvas = pvCanvasRef.current;
    if (!canvas || pvCurve.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const pad = { l: 55, r: 20, t: 20, b: 40 };

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(148,163,184,0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = pad.l + (i / 5) * (W - pad.l - pad.r);
      const y = pad.t + (i / 5) * (H - pad.t - pad.b);
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    }

    // Find ranges
    const allP = pvCurve.map(p => p.pressure);
    const allV = pvCurve.map(p => p.volume);
    const minP = Math.min(...allP) * 0.9;
    const maxP = Math.max(...allP) * 1.1;
    const minV = Math.min(...allV) * 0.9;
    const maxV = Math.max(...allV) * 1.1;

    const toX = (v: number) => pad.l + ((v - minV) / (maxV - minV)) * (W - pad.l - pad.r);
    const toY = (p: number) => H - pad.b - ((p - minP) / (maxP - minP)) * (H - pad.t - pad.b);

    // Shaded area under curve (work done)
    const progressIdx = Math.floor((animProgress / 100) * (pvCurve.length - 1));
    const shadePoints = pvCurve.slice(0, progressIdx + 1);

    if (shadePoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(toX(shadePoints[0].volume), toY(shadePoints[0].pressure));
      shadePoints.forEach(pt => ctx.lineTo(toX(pt.volume), toY(pt.pressure)));
      ctx.lineTo(toX(shadePoints[shadePoints.length - 1].volume), toY(minP));
      ctx.lineTo(toX(shadePoints[0].volume), toY(minP));
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
      grad.addColorStop(0, `${getProcessColor()}44`);
      grad.addColorStop(1, `${getProcessColor()}11`);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Full curve (dashed future)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = `${getProcessColor()}55`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    pvCurve.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(toX(pt.volume), toY(pt.pressure));
      else ctx.lineTo(toX(pt.volume), toY(pt.pressure));
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Drawn curve (solid progress)
    if (shadePoints.length > 1) {
      const lineGrad = ctx.createLinearGradient(
        toX(shadePoints[0].volume), 0, toX(shadePoints[shadePoints.length - 1].volume), 0
      );
      lineGrad.addColorStop(0, getProcessColor() + "aa");
      lineGrad.addColorStop(1, getProcessColor());
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      shadePoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(toX(pt.volume), toY(pt.pressure));
        else ctx.lineTo(toX(pt.volume), toY(pt.pressure));
      });
      ctx.stroke();

      // Current point glow
      const last = shadePoints[shadePoints.length - 1];
      const cx = toX(last.volume), cy = toY(last.pressure);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
      glow.addColorStop(0, getProcessColor() + "ff");
      glow.addColorStop(0.4, getProcessColor() + "88");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    }

    // Start point
    const sx = toX(pvCurve[0].volume), sy = toY(pvCurve[0].pressure);
    ctx.fillStyle = "#10B981";
    ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();

    // Axes labels
    ctx.fillStyle = "#94A3B8";
    ctx.font = "11px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText("Volume (L)", W / 2, H - 8);
    ctx.save();
    ctx.translate(14, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Pressure (atm)", 0, 0);
    ctx.restore();

    // Axis values
    ctx.font = "10px 'Courier New'";
    ctx.fillStyle = "#64748B";
    for (let i = 0; i <= 4; i++) {
      const v = minV + (i / 4) * (maxV - minV);
      const p = minP + (i / 4) * (maxP - minP);
      ctx.textAlign = "center";
      ctx.fillText(v.toFixed(1), toX(v), H - pad.b + 15);
      ctx.textAlign = "right";
      ctx.fillText(p.toFixed(2), pad.l - 5, toY(p) + 4);
    }
  }, [pvCurve, animProgress, processType]);

  // Particle simulation in the cylinder
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const t = animProgress / 100;
    const Vcurrent = V1 + (V2 - V1) * t;
    const volumeRatio = Vcurrent / V2;

    // Box dimensions - pistons showing expansion
    const W = canvas.width;
    const H = canvas.height;
    const boxLeft = 40;
    const boxRight = W - 40;
    const boxTop = 30;
    const boxBottom = H - 30;
    const boxW = boxRight - boxLeft;
    const boxH = boxBottom - boxTop;

    // Piston position based on current volume
    const maxPistonX = boxRight - 20;
    const minPistonX = boxLeft + 60;
    const pistonX = minPistonX + (maxPistonX - minPistonX) * t;

    const gasWidth = pistonX - boxLeft;

    // Particle count scales with temperature/energy
    const T_current = processType === "isobaric"
      ? T1 * (Vcurrent / V1)
      : processType === "isochoric"
      ? T1 * (1 + t * 0.5)
      : processType === "isothermal"
      ? T1
      : T1 * Math.pow(V1 / Vcurrent, gamma - 1);

    const particleCount = Math.max(8, Math.min(30, Math.round(n * 8)));
    const energyFactor = Math.sqrt(T_current / T1);

    // Initialize or update particles
    if (particles.length === 0) {
      setParticles(createParticles(particleCount, gasWidth, boxH, energyFactor));
    }

    // Animation loop for particles
    let animId: number;
    let localParticles = particles.length > 0 ? [...particles] : createParticles(particleCount, gasWidth, boxH, energyFactor);

    const drawFrame = () => {
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#0A0F1E";
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = "rgba(59,130,246,0.06)";
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = boxLeft; x <= boxRight; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, boxTop); ctx.lineTo(x, boxBottom); ctx.stroke();
      }
      for (let y = boxTop; y <= boxBottom; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(boxLeft, y); ctx.lineTo(boxRight, y); ctx.stroke();
      }

      // Gas region glow
      const gasGrad = ctx.createLinearGradient(boxLeft, 0, pistonX, 0);
      const T_norm = Math.min(1, (T_current - 200) / 1000);
      const hue = 240 - T_norm * 60; // blue to cyan
      gasGrad.addColorStop(0, `hsla(${hue},80%,50%,0.08)`);
      gasGrad.addColorStop(1, `hsla(${hue},80%,70%,0.03)`);
      ctx.fillStyle = gasGrad;
      ctx.fillRect(boxLeft, boxTop, gasWidth, boxH);

      // Cylinder walls
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 3;
      ctx.strokeRect(boxLeft, boxTop, boxW, boxH);

      // Wall highlights
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(boxLeft + 2, boxTop + 2); ctx.lineTo(boxLeft + 2, boxBottom - 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(boxLeft + 2, boxTop + 2); ctx.lineTo(boxRight - 2, boxTop + 2); ctx.stroke();

      // Update particles
      localParticles = localParticles.map(p => {
        let { x, y, vx, vy } = p;
        const speed = Math.sqrt(vx * vx + vy * vy);
        const targetSpeed = 1.5 + energyFactor * 2.5;
        const speedFactor = targetSpeed / Math.max(speed, 0.01);
        vx *= 0.98 + speedFactor * 0.02;
        vy *= 0.98 + speedFactor * 0.02;

        x += vx;
        y += vy;

        // Bounds: left wall
        if (x - p.radius < boxLeft) { x = boxLeft + p.radius; vx = Math.abs(vx); }
        // Piston (right boundary of gas)
        if (x + p.radius > pistonX) { x = pistonX - p.radius; vx = -Math.abs(vx); }
        // Top
        if (y - p.radius < boxTop) { y = boxTop + p.radius; vy = Math.abs(vy); }
        // Bottom
        if (y + p.radius > boxBottom) { y = boxBottom - p.radius; vy = -Math.abs(vy); }

        return { ...p, x, y, vx, vy };
      });

      // Draw particles with glow
      localParticles.forEach(p => {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const speedNorm = Math.min(1, speed / 6);

        // Glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        glow.addColorStop(0, p.color + "cc");
        glow.addColorStop(0.5, p.color + "44");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2); ctx.fill();

        // Core
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();

        // White core
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath(); ctx.arc(p.x - p.radius * 0.25, p.y - p.radius * 0.25, p.radius * 0.3, 0, Math.PI * 2); ctx.fill();

        // Velocity arrow
        if (speed > 0.5) {
          const arrowLen = Math.min(speed * 4, 20);
          ctx.strokeStyle = p.color + "88";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + (p.vx / speed) * arrowLen, p.y + (p.vy / speed) * arrowLen);
          ctx.stroke();
        }
      });

      setParticles(localParticles);

      // Piston
      const pistonGrad = ctx.createLinearGradient(pistonX, 0, pistonX + 20, 0);
      pistonGrad.addColorStop(0, "#94A3B8");
      pistonGrad.addColorStop(0.5, "#CBD5E1");
      pistonGrad.addColorStop(1, "#64748B");
      ctx.fillStyle = pistonGrad;
      ctx.fillRect(pistonX, boxTop, 20, boxH);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.strokeRect(pistonX, boxTop, 20, boxH);

      // Piston handle
      ctx.fillStyle = "#94A3B8";
      ctx.beginPath();
      ctx.roundRect(pistonX + 20, boxTop + boxH * 0.4, 25, boxH * 0.2, 4);
      ctx.fill();

      // Force arrow showing work direction
      if (V2 > V1 && animProgress > 5) {
        const arrowStart = pistonX + 22;
        const arrowEnd = arrowStart + 35;
        ctx.strokeStyle = "#10B981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(arrowStart, boxTop + boxH / 2);
        ctx.lineTo(arrowEnd, boxTop + boxH / 2);
        ctx.stroke();
        ctx.fillStyle = "#10B981";
        ctx.beginPath();
        ctx.moveTo(arrowEnd, boxTop + boxH / 2 - 8);
        ctx.lineTo(arrowEnd + 12, boxTop + boxH / 2);
        ctx.lineTo(arrowEnd, boxTop + boxH / 2 + 8);
        ctx.closePath();
        ctx.fill();
      } else if (V2 < V1 && animProgress > 5) {
        const arrowStart = pistonX - 5;
        const arrowEnd = arrowStart - 35;
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(arrowStart, boxTop + boxH / 2);
        ctx.lineTo(arrowEnd, boxTop + boxH / 2);
        ctx.stroke();
        ctx.fillStyle = "#EF4444";
        ctx.beginPath();
        ctx.moveTo(arrowEnd, boxTop + boxH / 2 - 8);
        ctx.lineTo(arrowEnd - 12, boxTop + boxH / 2);
        ctx.lineTo(arrowEnd, boxTop + boxH / 2 + 8);
        ctx.closePath();
        ctx.fill();
      }

      // Labels
      ctx.font = "bold 13px 'Courier New'";
      ctx.fillStyle = "#94A3B8";
      ctx.textAlign = "center";
      ctx.fillText(`V = ${Vcurrent.toFixed(2)} L`, boxLeft + gasWidth / 2, boxBottom + 20);

      ctx.fillStyle = "#64748B";
      ctx.font = "11px 'Courier New'";
      ctx.fillText("GAS", boxLeft + gasWidth / 2, boxTop + boxH / 2);

      // Pressure indicator (color band on left wall)
      const pNorm = Math.min(1, (getFinalPressure() - 0.5) / 9.5);
      const pressGrad = ctx.createLinearGradient(0, boxBottom, 0, boxTop);
      pressGrad.addColorStop(0, "#3B82F6");
      pressGrad.addColorStop(pNorm, "#EF4444");
      pressGrad.addColorStop(1, "#EF4444");
      ctx.fillStyle = pressGrad;
      ctx.fillRect(boxLeft - 12, boxBottom - (boxH * pNorm), 8, boxH * pNorm);
      ctx.fillStyle = "#64748B";
      ctx.font = "9px 'Courier New'";
      ctx.textAlign = "center";
      ctx.fillText("P", boxLeft - 8, boxTop - 8);

      // Temperature color aura on top wall
      const T_norm2 = Math.min(1, T_current / 2000);
      ctx.fillStyle = `hsla(${240 - T_norm2 * 200}, 80%, 60%, ${0.1 + T_norm2 * 0.2})`;
      ctx.fillRect(boxLeft, boxTop, gasWidth, 6);
    };

    drawFrame();

    if (isAnimating) {
      animId = requestAnimationFrame(drawFrame);
    }

    return () => cancelAnimationFrame(animId);
  }, [animProgress, particles, isAnimating, processType, P1, V1, V2, n, gamma, T1]);

  // Animation control
  const startAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimProgress(0);
    setParticles([]);
    let progress = 0;
    const duration = 4000;
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = time - start;
      progress = Math.min(100, (elapsed / duration) * 100);
      setAnimProgress(progress);

      // Update current work
      const t = progress / 100;
      const Vcur = V1 + (V2 - V1) * t;
      const P2cur = processType === "adiabatic"
        ? calcFinalPressureAdiabatic(P1, V1, Vcur, gamma)
        : getFinalPressure();
      let w = 0;
      switch (processType) {
        case "isothermal": w = calcWorkIsothermal(P1, V1, Vcur); break;
        case "isobaric": w = calcWorkIsobaric(P1, V1, Vcur); break;
        case "isochoric": w = 0; break;
        case "adiabatic": w = calcWorkAdiabatic(P1, V1, P2cur, Vcur, gamma); break;
      }
      setCurrentWork(w);

      if (progress < 100) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [isAnimating, P1, V1, V2, n, gamma, processType, T1]);

  const resetAll = () => {
    cancelAnimationFrame(animFrameRef.current);
    setIsAnimating(false);
    setAnimProgress(0);
    setCurrentWork(0);
    setParticles([]);
    setParams(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { next[k] = { ...next[k], value: next[k].defaultValue }; });
      return next;
    });
    setProcessType("isothermal");
  };

  const processColor = getProcessColor();
  const totalWork = getTotalWork();
  const P2 = getFinalPressure();
  const T2 = processType === "isochoric"
    ? T1 * 1.5
    : calcTemperature(P2, V2, n);

  const workInJoules = totalWork * 101.325; // L·atm to J

  // Process type info
  const processInfo = {
    isothermal: { name: "Isothermal", color: "#3B82F6", condition: "T = constant", emoji: "🌡️" },
    isobaric: { name: "Isobaric", color: "#10B981", condition: "P = constant", emoji: "⚖️" },
    isochoric: { name: "Isochoric", color: "#F59E0B", condition: "V = constant", emoji: "🔒" },
    adiabatic: { name: "Adiabatic", color: "#EF4444", condition: "Q = 0", emoji: "🔥" },
  };

  const tips = {
    isothermal: ["Set V₂=8L for maximum isothermal work!", "Low initial volume + high pressure = dramatic curve", "nRT stays constant — watch the hyperbola!"],
    isobaric: ["W = P·ΔV is simplest! Try P=5 atm, ΔV=3L", "Isobaric = constant pressure — straight horizontal line on PV diagram", "Higher pressure → steeper slope, more work per unit volume"],
    isochoric: ["No work done! V is constant → W = 0", "Watch pressure/temperature rise with no volume change", "Represents heating in a rigid container"],
    adiabatic: ["γ=1.67 (monatomic noble gases) for sharper curve", "Adiabatic cools the gas during expansion", "Steeper than isothermal on PV diagram!"],
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-950 text-slate-100 overflow-auto">
      {/* Header */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm">⚡</div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Work Done by Gas Simulator</h1>
            <p className="text-xs text-slate-400">Thermodynamic Process Explorer</p>
          </div>
        </div>
        <div className="flex gap-2 ml-auto items-center">
          {(["isothermal", "isobaric", "isochoric", "adiabatic"] as const).map(pt => (
            <button
              key={pt}
              onClick={() => { setProcessType(pt); setAnimProgress(0); setParticles([]); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200"
              style={{
                background: processType === pt ? processInfo[pt].color + "22" : "transparent",
                borderColor: processType === pt ? processInfo[pt].color : "#334155",
                color: processType === pt ? processInfo[pt].color : "#94A3B8",
              }}
            >
              {processInfo[pt].emoji} {processInfo[pt].name}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Top Section (70vh) ─────────────────────────────────────────────── */}
      <div className="flex gap-0 shrink-0" style={{ height: "calc(70vh - 52px)" }}>

        {/* Simulation Canvas (65%) */}
        <div className="flex flex-col" style={{ width: "65%" }}>
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-r border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Cylinder & Piston</span>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-green-400">T={T1.toFixed(0)} K</span>
              <span style={{ color: processColor }}>Process: {processInfo[processType].name}</span>
              <span className="text-amber-400">W={currentWork.toFixed(3)} L·atm</span>
            </div>
          </div>
          <div className="flex-1 relative border-r border-slate-800 bg-slate-950">
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              className="w-full h-full"
              style={{ display: "block" }}
            />
            {/* Overlay stats */}
            <div className="absolute top-2 left-2 bg-slate-900/90 rounded-lg px-3 py-2 border border-slate-700">
              <div className="text-xs font-mono space-y-0.5">
                <div className="text-slate-400">Current State:</div>
                <div className="text-blue-400">V = {(V1 + (V2 - V1) * animProgress / 100).toFixed(3)} L</div>
                <div className="text-purple-400">P = {(processType === "isothermal"
                  ? calcPressure(V1 + (V2 - V1) * animProgress / 100, n, T1)
                  : processType === "isobaric"
                  ? P1
                  : processType === "adiabatic"
                  ? calcFinalPressureAdiabatic(P1, V1, V1 + (V2 - V1) * animProgress / 100, gamma)
                  : P1).toFixed(3)} atm</div>
                <div className="text-amber-400">W = {currentWork.toFixed(3)} L·atm</div>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="px-3 py-2 bg-slate-900 border-t border-r border-slate-800 flex items-center gap-3">
            <button
              onClick={startAnimation}
              disabled={isAnimating}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: isAnimating ? "#334155" : processColor,
                color: "#fff",
                opacity: isAnimating ? 0.6 : 1
              }}
            >
              {isAnimating ? "⏸ Pause" : "▶ Play"}
            </button>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${animProgress}%`,
                  background: `linear-gradient(90deg, ${processColor}88, ${processColor})`,
                }}
              />
            </div>
            <span className="text-xs font-mono text-slate-400 w-12 text-right">{animProgress.toFixed(0)}%</span>
          </div>
        </div>

        {/* PV Diagram + Controls (35%) */}
        <div className="flex flex-col" style={{ width: "35%" }}>
          {/* PV Diagram */}
          <div className="flex flex-col bg-slate-900" style={{ height: "45%" }}>
            <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">P-V Diagram</span>
              <span className="text-xs font-mono" style={{ color: processColor }}>
                W<sub>total</sub> = {totalWork.toFixed(3)} L·atm = {workInJoules.toFixed(1)} J
              </span>
            </div>
            <div className="flex-1 p-1">
              <canvas
                ref={pvCanvasRef}
                width={400}
                height={200}
                className="w-full h-full"
                style={{ display: "block" }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col bg-slate-900 border-t border-slate-800 overflow-y-auto" style={{ height: "55%" }}>
            <div className="px-3 py-1.5 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Parameters</span>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
              {Object.entries(params).map(([key, p]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <span className="text-sm">{p.icon}</span> {p.label}
                    </label>
                    <span className="text-xs font-mono font-bold text-white">
                      {p.value.toFixed(key === "gamma" ? 2 : 1)} <span className="text-slate-500">{p.unit}</span>
                    </span>
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-600 w-6 text-right">{p.min}</span>
                      <input
                        type="range"
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        value={p.value}
                        aria-label={`${p.label}: ${p.value} ${p.unit}`}
                        aria-valuemin={p.min}
                        aria-valuemax={p.max}
                        aria-valuenow={p.value}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          setParams(prev => ({ ...prev, [key]: { ...prev[key], value: val } }));
                          setAnimProgress(0);
                          setParticles([]);
                        }}
                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(90deg, ${processColor} ${((p.value - p.min) / (p.max - p.min)) * 100}%, #334155 0%)`
                        }}
                      />
                      <span className="text-xs text-slate-600 w-6">{p.max}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">{p.description}</p>
                </div>
              ))}

              {/* Pro tip */}
              <div className="rounded-lg border border-blue-900/50 bg-blue-950/30 p-2 mt-1">
                <div className="text-xs font-semibold text-blue-400 mb-1">💡 Pro Tip</div>
                <p className="text-xs text-blue-300/80">
                  {tips[processType][Math.floor(Date.now() / 10000) % 3]}
                </p>
              </div>
            </div>

            {/* Reset */}
            <div className="px-3 py-2 border-t border-slate-800">
              <button
                onClick={resetAll}
                className="w-full py-2 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center justify-center gap-2"
              >↺ Reset</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Section ──────────────────────────────────────────────────── */}
      <div className="flex border-t border-slate-800 bg-slate-900" style={{ minHeight: "320px" }}>

        {/* Left: Concept + Formula (40%) */}
        <div className="flex flex-col p-4 border-r border-slate-800 overflow-y-auto" style={{ width: "40%", maxHeight: "420px" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded flex items-center justify-center text-xs" style={{ background: processColor + "22", color: processColor }}>✨</div>
            <h3 className="text-sm font-bold text-white">The Concept</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            When a gas expands or contracts, it exchanges energy with its surroundings as mechanical work.
            The amount of work equals the area under the P-V curve — different thermodynamic processes
            follow different paths, yielding different work values even between the same endpoints.
          </p>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
              <span>📐</span> Key Formula — {processInfo[processType].name}
            </div>
            <div className="font-mono text-sm font-bold text-center py-1 mb-2" style={{ color: processColor }}>
              {getFormula()}
            </div>
            <div className="text-xs text-slate-500 space-y-0.5">
              <div>n = {n.toFixed(1)} mol &nbsp;|&nbsp; R = 0.0821 L·atm/(mol·K)</div>
              <div>T₁ = {T1.toFixed(0)} K &nbsp;|&nbsp; Condition: <span style={{ color: processColor }}>{processInfo[processType].condition}</span></div>
              <div>1 L·atm = 101.325 J</div>
            </div>
          </div>
        </div>

        {/* Middle: Live Calculation (30%) */}
        <div className="flex flex-col p-4 border-r border-slate-800 overflow-y-auto" style={{ width: "30%", maxHeight: "420px" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded flex items-center justify-center text-xs bg-purple-900/40 text-purple-400">⚡</div>
            <h3 className="text-sm font-bold text-white">Live Calculation</h3>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 mb-2">
            <div className="font-mono text-xs text-slate-400 mb-2 uppercase tracking-widest">Current Values:</div>
            <div className="font-mono text-xs space-y-1.5">
              <div className="text-slate-300">{getSubstitutedFormula()}</div>
              <div className="border-t border-slate-700 pt-1.5 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">P₁ →</span><span className="text-blue-400">{P1.toFixed(2)} atm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">P₂ →</span><span className="text-purple-400">{P2.toFixed(3)} atm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">T₁ →</span><span className="text-amber-400">{T1.toFixed(0)} K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">T₂ →</span><span className="text-orange-400">{T2.toFixed(0)} K</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-1">
                  <span className="text-slate-400 font-bold">W (total)</span>
                  <span className="font-bold" style={{ color: processColor }}>{totalWork.toFixed(3)} L·atm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">= (J)</span>
                  <span className="text-green-400">{workInJoules.toFixed(1)} J</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tips (30%) */}
        <div className="flex flex-col p-4 overflow-y-auto" style={{ width: "30%", maxHeight: "420px" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded flex items-center justify-center text-xs bg-amber-900/40 text-amber-400">💡</div>
            <h3 className="text-sm font-bold text-white">Try This for Drama!</h3>
          </div>

          <div className="space-y-2">
            {[
              {
                emoji: "🎯", title: "Max Work (Isothermal)",
                tip: "Set P₁=8, V₁=1, V₂=8, process=Isothermal",
                result: "Watch the hyperbolic PV curve!"
              },
              {
                emoji: "⚡", title: "Adiabatic Expansion",
                tip: "Process=Adiabatic, γ=1.67, V₂=4× V₁",
                result: "Gas cools dramatically with no heat!"
              },
              {
                emoji: "🔒", title: "Zero Work",
                tip: "Process=Isochoric (constant volume)",
                result: "All energy goes to internal energy!"
              },
              {
                emoji: "⚖️", title: "Constant Pressure",
                tip: "Process=Isobaric, P=5atm, V₁=1→V₂=5",
                result: "Straight horizontal line on PV graph!"
              }
            ].map((t, i) => (
              <div key={i} className="rounded-lg border border-slate-700/60 bg-slate-800/30 px-3 py-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-0.5">
                  <span>{t.emoji}</span>{t.title}
                </div>
                <p className="text-xs text-slate-500">{t.tip}</p>
                <p className="text-xs text-blue-400 mt-0.5">→ {t.result}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Theory Section (extra below) ────────────────────────────────────── */}
      <div className="bg-slate-950 border-t border-slate-800 px-6 py-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-blue-400">📚</span> Thermodynamics Theory: Work Done by Gas
        </h2>
        <div className="grid grid-cols-2 gap-6 text-sm text-slate-400 leading-relaxed">
          <div className="space-y-3">
            <div>
              <h3 className="text-white font-semibold mb-1 text-xs uppercase tracking-widest text-blue-400">What is Thermodynamic Work?</h3>
              <p>When a gas exerts pressure on a piston and moves it, the gas does mechanical work on the surroundings. The fundamental expression for work done by a gas is <strong className="text-white">dW = P dV</strong>, meaning work equals pressure times the infinitesimal volume change. For a finite process, we integrate this over the entire volume change.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1 text-xs uppercase tracking-widest text-green-400">First Law of Thermodynamics</h3>
              <p>The First Law states: <strong className="text-white">ΔU = Q − W</strong>, where ΔU is the change in internal energy, Q is heat absorbed, and W is work done by the gas. This means energy is always conserved — energy added as heat either increases internal energy or is expelled as work.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="text-white font-semibold mb-1 text-xs uppercase tracking-widest text-purple-400">Four Thermodynamic Processes</h3>
              <ul className="space-y-1">
                <li><span className="text-blue-400 font-semibold">Isothermal (T=const):</span> W = nRT·ln(V₂/V₁). Gas stays at same temperature; heat flows in or out to compensate.</li>
                <li><span className="text-green-400 font-semibold">Isobaric (P=const):</span> W = PΔV. Simplest case — constant pressure throughout, volume and temperature change proportionally.</li>
                <li><span className="text-amber-400 font-semibold">Isochoric (V=const):</span> W = 0. No volume change means no mechanical work. All energy change is purely thermal.</li>
                <li><span className="text-red-400 font-semibold">Adiabatic (Q=0):</span> W = (P₁V₁−P₂V₂)/(γ−1). No heat exchange; gas cools when expanding, heats when compressed.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1 text-xs uppercase tracking-widest text-amber-400">The PV Diagram Insight</h3>
              <p>On a Pressure-Volume diagram, work done by the gas equals the area under the process curve. Different paths between the same initial and final states yield different amounts of work — demonstrating that work is a path function, not a state function.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Slider thumb styling */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3B82F6;
          border: 2px solid #1D4ED8;
          cursor: pointer;
          box-shadow: 0 0 6px rgba(59,130,246,0.5);
        }
        input[type=range]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3B82F6;
          border: 2px solid #1D4ED8;
          cursor: pointer;
        }
        input[type=range]:focus {
          outline: none;
        }
        input[type=range]:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(59,130,246,0.3);
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0F172A; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}