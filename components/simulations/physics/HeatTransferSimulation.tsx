"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────
type Mode = "conduction" | "convection" | "radiation";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  temp: number;   // 0–1 normalised
  alpha: number;
  size: number;
  life: number;   // 0–1, used for convection plumes & radiation photons
  type: "fluid" | "phonon" | "photon";
}

// ─── Colour helpers ─────────────────────────────────────────────────────────
const heatColor = (t: number, a = 1): string => {
  // t: 0 (cold/blue) → 1 (hot/red)
  const n = Math.max(0, Math.min(1, t));
  if (n < 0.25) {
    const f = n / 0.25;
    return `rgba(${Math.round(59 + f * 37)},${Math.round(130 + f * 30)},246,${a})`;
  } else if (n < 0.5) {
    const f = (n - 0.25) / 0.25;
    return `rgba(${Math.round(96 + f * 143)},${Math.round(160 - f * 90)},${Math.round(186 - f * 160)},${a})`;
  } else if (n < 0.75) {
    const f = (n - 0.5) / 0.25;
    return `rgba(${Math.round(239)},${Math.round(70 + f * 89)},${Math.round(26 - f * 20)},${a})`;
  } else {
    const f = (n - 0.75) / 0.25;
    return `rgba(255,${Math.round(159 - f * 100)},0,${a})`;
  }
};

const tempToHex = (t: number): string => {
  const n = Math.max(0, Math.min(1, t));
  if (n < 0.3) return "#3B82F6";
  if (n < 0.55) return "#06B6D4";
  if (n < 0.75) return "#F59E0B";
  return "#EF4444";
};

// ─── Physics formulas ───────────────────────────────────────────────────────
// Fourier's Law: Q = k * A * ΔT / d
const conductionHeatFlow = (k: number, A: number, dT: number, d: number) =>
  (k * A * dT) / d;

// Newton's Law of Cooling: Q = h * A * ΔT
const convectionHeatFlow = (h: number, A: number, dT: number) => h * A * dT;

// Stefan-Boltzmann: Q = ε * σ * A * (T_hot⁴ - T_cold⁴)
const SIGMA = 5.67e-8;
const radiationHeatFlow = (eps: number, A: number, Th: number, Tc: number) =>
  eps * SIGMA * A * (Math.pow(Th, 4) - Math.pow(Tc, 4));

// ─── Main Component ─────────────────────────────────────────────────────────
export default function HeatTransfer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const runningRef = useRef(true);
  const particlesRef = useRef<Particle[]>([]);
  const pidRef = useRef(0);
  const modeRef = useRef<Mode>("conduction");
  const paramsRef = useRef({
    hotTemp: 800, coldTemp: 100, conductivity: 50,
    convCoeff: 25, emissivity: 0.85, rodLength: 0.6,
    fluidViscosity: 0.4
  });

  const [mode, setMode] = useState<Mode>("conduction");
  const [hotTemp, setHotTemp] = useState(800);
  const [coldTemp, setColdTemp] = useState(100);
  const [conductivity, setConductivity] = useState(50);
  const [convCoeff, setConvCoeff] = useState(25);
  const [emissivity, setEmissivity] = useState(0.85);
  const [rodLength, setRodLength] = useState(0.6);
  const [fluidViscosity, setFluidViscosity] = useState(0.4);
  const [isRunning, setIsRunning] = useState(true);
  const [liveStats, setLiveStats] = useState({
    heatFlow: 0, heatFlowLabel: "W",
    deltaT: 0, particles: 0, elapsed: 0
  });

  // sync refs
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => {
    paramsRef.current = { hotTemp, coldTemp, conductivity, convCoeff, emissivity, rodLength, fluidViscosity };
  }, [hotTemp, coldTemp, conductivity, convCoeff, emissivity, rodLength, fluidViscosity]);

  // ── Particle spawner helpers ─────────────────────────────────────────────
  const spawnPhonon = (x: number, y: number, targetX: number) => {
    const angle = (Math.random() - 0.5) * 0.4;
    const speed = 1.5 + Math.random() * 1;
    const dir = targetX > x ? 1 : -1;
    particlesRef.current.push({
      id: pidRef.current++, x, y,
      vx: dir * speed * Math.cos(angle),
      vy: speed * Math.sin(angle),
      temp: 1, alpha: 1, size: 3 + Math.random() * 3,
      life: 1, type: "phonon"
    });
  };

  const spawnFluid = (W: number, H: number, p: typeof paramsRef.current) => {
    // hot particles rise from bottom, cool fall from top
    const x = 0.25 * W + Math.random() * 0.5 * W;
    const isHot = Math.random() > 0.4;
    const t = isHot ? 0.7 + Math.random() * 0.3 : 0.05 + Math.random() * 0.2;
    particlesRef.current.push({
      id: pidRef.current++,
      x,
      y: isHot ? H - 30 : 30,
      vx: (Math.random() - 0.5) * 0.5,
      vy: isHot ? -(1.5 + (1 - p.fluidViscosity) * 2) : (0.8 + (1 - p.fluidViscosity) * 1.5),
      temp: t, alpha: 0.85, size: 6 + Math.random() * 6,
      life: 1, type: "fluid"
    });
  };

  const spawnPhoton = (srcX: number, srcY: number) => {
    const angle = (Math.random() - 0.5) * Math.PI * 0.8;
    const speed = 3 + Math.random() * 2;
    particlesRef.current.push({
      id: pidRef.current++,
      x: srcX, y: srcY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      temp: 0.8 + Math.random() * 0.2,
      alpha: 1, size: 2 + Math.random() * 3,
      life: 1, type: "photon"
    });
  };

  // ── Main animation loop ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const setSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      particlesRef.current = [];
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(container);

    const ctx = canvas.getContext("2d")!;
    let frameCount = 0;
    let elapsed = 0;

    const loop = (now: number) => {
      animRef.current = requestAnimationFrame(loop);
      const rawDt = Math.min((now - lastTimeRef.current) / 1000, 0.033);
      lastTimeRef.current = now;
      const dt = rawDt || 0.016;
      const W = canvas.width, H = canvas.height;
      if (W < 10 || H < 10) return;

      const p = paramsRef.current;
      const m = modeRef.current;
      frameCount++;
      if (runningRef.current) elapsed += dt;

      // ── Spawn particles ──────────────────────────────────────────────
      if (runningRef.current) {
        const dT = Math.max(0, p.hotTemp - p.coldTemp);
        const spawnRate = Math.max(1, Math.floor(dT / 100));

        if (m === "conduction" && frameCount % Math.max(1, 6 - Math.floor(conductivity / 25)) === 0) {
          const rodLeft = W * 0.1;
          const rodRight = W * (0.1 + p.rodLength * 0.8);
          const rodY = H / 2;
          for (let s = 0; s < 2; s++) spawnPhonon(rodLeft + 10, rodY + (Math.random() - 0.5) * 20, rodRight);
        }
        if (m === "convection" && frameCount % 3 === 0) {
          for (let s = 0; s < Math.min(3, spawnRate); s++) spawnFluid(W, H, p);
        }
        if (m === "radiation" && frameCount % 2 === 0) {
          const srcX = W * 0.18;
          const srcY = H / 2;
          for (let s = 0; s < Math.min(4, spawnRate); s++) spawnPhoton(srcX, srcY);
        }
      }

      // ── Update particles ─────────────────────────────────────────────
      const keep: Particle[] = [];
      for (const pt of particlesRef.current) {
        pt.x += pt.vx * dt * 60;
        pt.y += pt.vy * dt * 60;
        pt.life -= dt * (pt.type === "fluid" ? 0.2 : pt.type === "phonon" ? 0.35 : 0.25);
        pt.alpha = pt.life;

        if (pt.type === "fluid") {
          pt.vx += (Math.random() - 0.5) * 0.3;
          pt.vy += (Math.random() - 0.5) * 0.1;
          // clamp
          if (pt.x < 20) pt.x = 20;
          if (pt.x > W - 20) pt.x = W - 20;
        }
        if (pt.type === "phonon") {
          pt.vy += (Math.random() - 0.5) * 0.2;
          pt.temp = Math.max(0, pt.temp - dt * 0.5);
        }
        if (pt.type === "photon") {
          // bounce off top/bottom walls slightly
          if (pt.y < 20 || pt.y > H - 20) pt.vy *= -1;
        }

        if (pt.life > 0 && pt.x > 0 && pt.x < W && pt.y > 0 && pt.y < H) keep.push(pt);
      }
      particlesRef.current = keep.slice(-300);

      // ── Physics calc ─────────────────────────────────────────────────
      const A = 0.01; // 1 cm²
      const d = 0.1 * p.rodLength + 0.01;
      const dT = Math.max(0, p.hotTemp - p.coldTemp);
      let heatFlow = 0;
      let heatFlowLabel = "W";
      if (m === "conduction") {
        heatFlow = conductionHeatFlow(p.conductivity, A, dT, d);
        heatFlowLabel = "W";
      } else if (m === "convection") {
        heatFlow = convectionHeatFlow(p.convCoeff, A, dT);
        heatFlowLabel = "W";
      } else {
        heatFlow = Math.abs(radiationHeatFlow(p.emissivity, A, p.hotTemp, p.coldTemp));
        heatFlowLabel = "W";
      }

      // ── DRAW ─────────────────────────────────────────────────────────
      ctx.fillStyle = "#0D1117";
      ctx.fillRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = "rgba(148,163,184,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      if (m === "conduction") drawConduction(ctx, W, H, p, particlesRef.current);
      if (m === "convection") drawConvection(ctx, W, H, p, particlesRef.current);
      if (m === "radiation") drawRadiation(ctx, W, H, p, particlesRef.current, now);

      // update stats every 8 frames
      if (frameCount % 8 === 0) {
        setLiveStats({
          heatFlow: Math.round(heatFlow * 100) / 100,
          heatFlowLabel,
          deltaT: Math.round(dT),
          particles: particlesRef.current.length,
          elapsed: Math.round(elapsed * 10) / 10,
        });
      }
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []); // eslint-disable-line

  // ── Draw functions ────────────────────────────────────────────────────────
  function drawConduction(
    ctx: CanvasRenderingContext2D, W: number, H: number,
    p: typeof paramsRef.current, pts: Particle[]
  ) {
    const rodLeft = W * 0.08;
    const rodRight = W * (0.08 + p.rodLength * 0.82);
    const rodY = H / 2;
    const rodH = 36;

    // Temperature gradient along rod
    const steps = 80;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = rodLeft + t * (rodRight - rodLeft);
      const temp = (p.hotTemp - p.coldTemp) * (1 - t) / (p.hotTemp - p.coldTemp || 1)
        * ((p.hotTemp - p.coldTemp) / 1000) + p.coldTemp / 1000;
      const normT = (p.hotTemp - (p.hotTemp - p.coldTemp) * t) / 1000;
      ctx.fillStyle = heatColor(normT, 1);
      ctx.fillRect(x, rodY - rodH / 2, (rodRight - rodLeft) / steps + 1, rodH);
    }

    // Rod border
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.strokeRect(rodLeft, rodY - rodH / 2, rodRight - rodLeft, rodH);

    // Hot source (left block)
    const hotNorm = Math.min(p.hotTemp / 1000, 1);
    const gHot = ctx.createRadialGradient(rodLeft - 5, rodY, 0, rodLeft - 5, rodY, 50);
    gHot.addColorStop(0, heatColor(hotNorm, 0.9));
    gHot.addColorStop(1, "transparent");
    ctx.fillStyle = gHot;
    ctx.fillRect(rodLeft - 55, rodY - 55, 55, 110);

    ctx.fillStyle = heatColor(hotNorm, 1);
    ctx.fillRect(rodLeft - 55, rodY - 40, 50, 80);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(rodLeft - 55, rodY - 40, 50, 80);

    // Hot label
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.fillText("HOT", rodLeft - 30, rodY - 48);
    ctx.fillText(`${Math.round(p.hotTemp)} K`, rodLeft - 30, rodY + 52);

    // Cold sink (right block)
    const coldNorm = Math.min(p.coldTemp / 1000, 1);
    ctx.fillStyle = heatColor(coldNorm, 1);
    ctx.fillRect(rodRight + 5, rodY - 40, 50, 80);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(rodRight + 5, rodY - 40, 50, 80);

    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.fillText("COLD", rodRight + 30, rodY - 48);
    ctx.fillText(`${Math.round(p.coldTemp)} K`, rodRight + 30, rodY + 52);

    // Material label
    ctx.font = "12px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textAlign = "center";
    ctx.fillText(`k = ${p.conductivity} W/m·K`, (rodLeft + rodRight) / 2, rodY - rodH / 2 - 10);

    // Phonon particles
    for (const pt of pts) {
      if (pt.type !== "phonon") continue;
      const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.size * 2);
      g.addColorStop(0, heatColor(pt.temp, pt.alpha));
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${pt.alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Arrow showing Q direction
    const arrowY = rodY + rodH / 2 + 22;
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(rodLeft, arrowY);
    ctx.lineTo(rodRight, arrowY);
    ctx.stroke();
    ctx.setLineDash([]);
    // arrowhead
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.moveTo(rodRight + 8, arrowY);
    ctx.lineTo(rodRight - 6, arrowY - 5);
    ctx.lineTo(rodRight - 6, arrowY + 5);
    ctx.fill();
    ctx.font = "11px monospace";
    ctx.fillStyle = "#F59E0B";
    ctx.textAlign = "center";
    ctx.fillText("Q  (heat flow)", (rodLeft + rodRight) / 2, arrowY - 6);

    // Formula annotation
    ctx.font = "12px monospace";
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.textAlign = "left";
    const Q = conductionHeatFlow(p.conductivity, 0.01, p.hotTemp - p.coldTemp, 0.1 * p.rodLength + 0.01);
    ctx.fillText(`Q = k·A·ΔT/d = ${Q.toFixed(1)} W`, rodLeft, 22);
  }

  function drawConvection(
    ctx: CanvasRenderingContext2D, W: number, H: number,
    p: typeof paramsRef.current, pts: Particle[]
  ) {
    // Container / fluid tank
    const tx = W * 0.1, ty = H * 0.08, tw = W * 0.8, th = H * 0.84;

    // Fluid background (gradient cold top → hot bottom)
    const fluidGrad = ctx.createLinearGradient(tx, ty, tx, ty + th);
    fluidGrad.addColorStop(0, `rgba(59,130,246,0.15)`);
    fluidGrad.addColorStop(1, `rgba(239,68,68,${0.12 + (p.hotTemp / 1000) * 0.25})`);
    ctx.fillStyle = fluidGrad;
    ctx.fillRect(tx, ty, tw, th);

    // Hot plate at bottom
    const hotNorm = Math.min(p.hotTemp / 1000, 1);
    const hg = ctx.createLinearGradient(tx, ty + th - 18, tx, ty + th);
    hg.addColorStop(0, heatColor(hotNorm, 0.9));
    hg.addColorStop(1, heatColor(hotNorm, 1));
    ctx.fillStyle = hg;
    ctx.fillRect(tx, ty + th - 18, tw, 18);

    // Cool plate at top
    const coldNorm = Math.min(p.coldTemp / 1000, 1);
    const cg = ctx.createLinearGradient(tx, ty, tx, ty + 18);
    cg.addColorStop(0, heatColor(coldNorm, 1));
    cg.addColorStop(1, heatColor(coldNorm, 0.8));
    ctx.fillStyle = cg;
    ctx.fillRect(tx, ty, tw, 18);

    // Tank border
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(tx, ty, tw, th);

    // Labels
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.fillText(`HOT PLATE — ${Math.round(p.hotTemp)} K`, tx + tw / 2, ty + th + 16);
    ctx.fillText(`COOL PLATE — ${Math.round(p.coldTemp)} K`, tx + tw / 2, ty - 8);

    // Fluid particle blobs
    for (const pt of pts) {
      if (pt.type !== "fluid") continue;
      const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.size * 1.5);
      g.addColorStop(0, heatColor(pt.temp, pt.alpha * 0.9));
      g.addColorStop(1, heatColor(pt.temp, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Convection arrows (circulatory)
    const arrowPairs = [
      { x: tx + tw * 0.25, dir: 1 },
      { x: tx + tw * 0.75, dir: -1 },
    ];
    for (const ap of arrowPairs) {
      drawConvectionArrow(ctx, ap.x, ty + 20, th - 40, ap.dir, p.convCoeff / 50);
    }

    // h label
    ctx.font = "12px monospace";
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.textAlign = "left";
    const Qc = convectionHeatFlow(p.convCoeff, 0.01, p.hotTemp - p.coldTemp);
    ctx.fillText(`Q = h·A·ΔT = ${Qc.toFixed(1)} W`, tx + 4, ty + th / 2);
  }

  function drawConvectionArrow(
    ctx: CanvasRenderingContext2D,
    cx: number, topY: number, height: number, dir: number, intensity: number
  ) {
    const bot = topY + height;
    const rx = 28 * intensity;
    ctx.strokeStyle = `rgba(251,191,36,${0.35 + intensity * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    // left side going up / right going down
    ctx.beginPath();
    ctx.moveTo(cx + dir * rx, bot);
    ctx.bezierCurveTo(cx + dir * rx, bot - height * 0.4, cx - dir * rx, bot - height * 0.6, cx - dir * rx, topY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - dir * rx, topY);
    ctx.bezierCurveTo(cx - dir * rx, topY + height * 0.4, cx + dir * rx, topY + height * 0.6, cx + dir * rx, bot);
    ctx.stroke();
    ctx.setLineDash([]);
    // arrowhead top
    ctx.fillStyle = `rgba(251,191,36,${0.7 + intensity * 0.3})`;
    const topAX = cx - dir * rx;
    ctx.beginPath();
    ctx.moveTo(topAX, topY);
    ctx.lineTo(topAX - 5, topY + 10);
    ctx.lineTo(topAX + 5, topY + 10);
    ctx.fill();
    // arrowhead bottom
    const botAX = cx + dir * rx;
    ctx.beginPath();
    ctx.moveTo(botAX, bot);
    ctx.lineTo(botAX - 5, bot - 10);
    ctx.lineTo(botAX + 5, bot - 10);
    ctx.fill();
  }

  function drawRadiation(
    ctx: CanvasRenderingContext2D, W: number, H: number,
    p: typeof paramsRef.current, pts: Particle[], now: number
  ) {
    const srcX = W * 0.18, srcY = H / 2;
    const recvX = W * 0.82, recvY = H / 2;
    const bodyH = 100;

    // Hot emitter
    const hotNorm = Math.min(p.hotTemp / 1000, 1);
    const pulse = 0.85 + 0.15 * Math.sin(now / 300);
    const eg = ctx.createRadialGradient(srcX, srcY, 5, srcX, srcY, 65 * pulse);
    eg.addColorStop(0, heatColor(hotNorm, 0.95));
    eg.addColorStop(0.5, heatColor(hotNorm, 0.4));
    eg.addColorStop(1, "transparent");
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(srcX, srcY, 65 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = heatColor(hotNorm, 1);
    ctx.fillRect(srcX - 28, srcY - bodyH / 2, 56, bodyH);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(srcX - 28, srcY - bodyH / 2, 56, bodyH);

    // ε label
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.fillText(`ε = ${p.emissivity.toFixed(2)}`, srcX, srcY + bodyH / 2 + 16);
    ctx.fillText(`${Math.round(p.hotTemp)} K`, srcX, srcY - bodyH / 2 - 8);
    ctx.fillText("EMITTER", srcX, srcY - bodyH / 2 - 20);

    // Cold receiver
    const coldNorm = Math.min(p.coldTemp / 1000, 1);
    ctx.fillStyle = heatColor(coldNorm, 0.7);
    ctx.fillRect(recvX - 28, recvY - bodyH / 2, 56, bodyH);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(recvX - 28, recvY - bodyH / 2, 56, bodyH);

    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(p.coldTemp)} K`, recvX, recvY - bodyH / 2 - 8);
    ctx.fillText("RECEIVER", recvX, recvY - bodyH / 2 - 20);

    // Photon particles
    for (const pt of pts) {
      if (pt.type !== "photon") continue;
      const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.size * 2.5);
      g.addColorStop(0, `rgba(255,255,200,${pt.alpha})`);
      g.addColorStop(0.5, heatColor(pt.temp, pt.alpha * 0.7));
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
      // bright core
      ctx.fillStyle = `rgba(255,255,255,${pt.alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wavelength oscillation lines (static suggestion)
    const lineY = srcY + bodyH / 2 + 30;
    const lineXStart = srcX + 30, lineXEnd = recvX - 30;
    const wavelength = 40 - p.hotTemp / 50; // shorter λ = hotter
    const wl = Math.max(10, wavelength);
    ctx.strokeStyle = `rgba(251,191,36,0.5)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lineXStart, lineY);
    for (let x = lineXStart; x < lineXEnd; x += 2) {
      const t = (x - lineXStart) / (lineXEnd - lineXStart);
      ctx.lineTo(x, lineY + Math.sin(((x - lineXStart) / wl) * Math.PI * 2 + now / 200) * 8);
    }
    ctx.stroke();
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(251,191,36,0.8)";
    ctx.textAlign = "center";
    ctx.fillText(`λ ≈ ${wl.toFixed(0)} μm  (infrared)`, (lineXStart + lineXEnd) / 2, lineY + 22);

    // Formula
    ctx.font = "12px monospace";
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.textAlign = "left";
    const Qr = Math.abs(radiationHeatFlow(p.emissivity, 0.01, p.hotTemp, p.coldTemp));
    ctx.fillText(`Q = ε·σ·A·(T₁⁴−T₂⁴) = ${Qr.toExponential(2)} W`, W * 0.05, 22);
  }

  // ── Handle reset ──────────────────────────────────────────────────────────
  const handleReset = () => {
    setHotTemp(800); setColdTemp(100); setConductivity(50);
    setConvCoeff(25); setEmissivity(0.85); setRodLength(0.6);
    setFluidViscosity(0.4); setIsRunning(true); runningRef.current = true;
    particlesRef.current = [];
  };

  // ── Slider ────────────────────────────────────────────────────────────────
  function SliderRow({
    label, value, min, max, step, unit, icon, color = "#3B82F6", onChange,
  }: {
    label: string; value: number; min: number; max: number; step: number;
    unit: string; icon: string; color?: string; onChange: (v: number) => void;
  }) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">{icon} {label}</span>
          <span className="text-sm text-neutral-400 tabular-nums">
            {step < 0.1 ? value.toFixed(2) : Math.round(value)}
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
          className="physics-range w-full"
          style={{ accentColor: color }}
          aria-label={label}
        />
      </div>
    );
  }

  // Current live formula display
  const dT = Math.max(0, hotTemp - coldTemp);
  const condQ = conductionHeatFlow(conductivity, 0.01, dT, 0.1 * rodLength + 0.01);
  const convQ = convectionHeatFlow(convCoeff, 0.01, dT);
  const radQ = Math.abs(radiationHeatFlow(emissivity, 0.01, hotTemp, coldTemp));

  const modeLabels: Record<Mode, string> = {
    conduction: "⚙ Conduction",
    convection: "💧 Convection",
    radiation: "☀ Radiation",
  };

  const tips: Record<Mode, { icon: string; title: string; sub: string; result: string; col: string }[]> = {
    conduction: [
      { icon: "🔥", title: "Max Flow", sub: "k=100, ΔT=900K, short rod", result: "Huge heat current — rod glows end to end!", col: "#EF4444" },
      { icon: "🧱", title: "Insulator", sub: "k=1 (foam), long rod", result: "Barely any phonons get through!", col: "#8B5CF6" },
      { icon: "⚡", title: "Metal Rod", sub: "k=100 (copper), ΔT=700K", result: "Phonons rush across instantly!", col: "#F59E0B" },
    ],
    convection: [
      { icon: "🌋", title: "Boiling", sub: "T_hot=900K, h=50, viscosity=0.1", result: "Violent plumes erupt upward!", col: "#EF4444" },
      { icon: "🌊", title: "Gentle Flow", sub: "ΔT=100K, h=5, viscosity=0.8", result: "Slow, laminar circulation forms", col: "#3B82F6" },
      { icon: "☁", title: "Atmosphere", sub: "h=25, T_hot=500K, cold=100K", result: "Classic hot-air balloon physics!", col: "#10B981" },
    ],
    radiation: [
      { icon: "☀", title: "Star", sub: "T_hot=1000K, ε=1.0", result: "Maximum blackbody radiation!", col: "#F59E0B" },
      { icon: "🧊", title: "Polished Metal", sub: "ε=0.05 — almost no emission!", result: "Thermos flask physics!", col: "#3B82F6" },
      { icon: "🌡", title: "Stefan-Boltzmann", sub: "ε=1.0, ΔT=800K", result: "Radiation ∝ T⁴ — huge exponent effect!", col: "#A78BFA" },
    ],
  };

  return (
    <main className="min-h-screen bg-[#020617] text-neutral-200">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />

      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Top Row: Simulation Canvas (2 columns) */}
          <div className="col-span-1 flex flex-col gap-6 lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-4 mb-6">
              <div className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-cyan-500">
                🌡 Heat Transfer Mechanisms
              </div>
              <div className="flex gap-2 bg-neutral-900 border border-neutral-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                {(["conduction", "convection", "radiation"] as Mode[]).map(m => (
                  <button key={m} onClick={() => { setMode(m); particlesRef.current = []; }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-1 sm:flex-none ${mode === m ? 'bg-amber-600/80 text-white shadow-sm' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300'}`}
                  >
                    {modeLabels[m]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { const n = !isRunning; setIsRunning(n); runningRef.current = n; }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors ${isRunning ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isRunning ? "⏸ Pause" : "▶ Play"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            <div ref={containerRef} className="relative w-full overflow-hidden rounded-2xl border border-neutral-700 bg-[#0D1117] aspect-video">
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-neutral-950/90 border border-neutral-700 rounded-lg px-3 py-1 text-xs font-bold text-amber-500 shadow-md">
                ΔT = {liveStats.deltaT} K
              </div>
              <div className="absolute bottom-3 left-3 z-10 bg-neutral-950/90 border border-neutral-700 rounded-lg px-3 py-1 text-xs text-neutral-400 shadow-md">
                {liveStats.elapsed}s | {liveStats.particles} particles | Q = {liveStats.heatFlow.toFixed(2)} {liveStats.heatFlowLabel}
              </div>
            </div>
          </div>

          {/* Controls Panel (1 column) */}
          <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">
            <div>
              <h3 className="mb-4 text-xs font-bold tracking-widest text-neutral-500">⚙ PARAMETERS</h3>
              <div className="flex flex-col gap-3">
                <SliderRow label="Hot Source Temp" value={hotTemp} min={100} max={1000} step={10} unit="K"
                  icon="🔴" color="#EF4444" onChange={setHotTemp} />
                <SliderRow label="Cold Sink Temp" value={coldTemp} min={50} max={600} step={10} unit="K"
                  icon="🔵" color="#3B82F6" onChange={setColdTemp} />

                {mode === "conduction" && <>
                  <SliderRow label="Thermal Conductivity" value={conductivity} min={1} max={400} step={1} unit="W/m·K"
                    icon="⚙" color="#F97316" onChange={setConductivity} />
                  <SliderRow label="Rod Length" value={rodLength} min={0.1} max={1.0} step={0.05} unit="m"
                    icon="📏" color="#A78BFA" onChange={setRodLength} />
                </>}

                {mode === "convection" && <>
                  <SliderRow label="Convection Coefficient" value={convCoeff} min={1} max={100} step={1} unit="W/m²K"
                    icon="💧" color="#06B6D4" onChange={setConvCoeff} />
                  <SliderRow label="Fluid Viscosity" value={fluidViscosity} min={0.05} max={1.0} step={0.05} unit=""
                    icon="🌊" color="#10B981" onChange={setFluidViscosity} />
                </>}

                {mode === "radiation" && <>
                  <SliderRow label="Emissivity (ε)" value={emissivity} min={0.01} max={1.0} step={0.01} unit=""
                    icon="☀" color="#F59E0B" onChange={setEmissivity} />
                </>}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="text-[10px] text-emerald-300 font-bold tracking-wider mb-1">HEAT FLOW RATE</div>
              <div className="text-2xl font-black text-emerald-400">
                {mode === "conduction" ? condQ.toFixed(1)
                  : mode === "convection" ? convQ.toFixed(1)
                    : radQ.toExponential(2)} W
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="font-bold text-blue-400 mb-2 font-sans">💡 Quick Tips</div>
              <div className="space-y-3 font-sans">
                {tips[mode].map((t, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="text-blue-300 font-bold mb-0.5">{t.icon} {t.title}</div>
                    <div className="text-blue-200/80 mb-0.5">{t.sub}</div>
                    <div className="text-neutral-400">→ {t.result}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
          </div>
        </div>

          {/* Bottom Row: Info Panel */}
          <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300 flex flex-col md:flex-row gap-6">

            <div className="flex-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-blue-400 mb-3 tracking-widest">✨ HEAT TRANSFER — THEORY</h4>
              {mode === "conduction" && (
                <>
                  <p className="text-sm text-neutral-400 mb-4 font-sans leading-relaxed">
                    <strong className="text-neutral-200">Conduction</strong> is heat transfer through a solid
                    material via lattice vibrations (phonons). Atoms vibrate and pass energy to their neighbours
                    without any bulk movement of material. Better conductors (metals) have more free electrons
                    that carry energy rapidly.
                  </p>
                  <div className="rounded-xl border border-neutral-700 bg-neutral-950 p-4">
                    <div className="text-blue-400 font-bold mb-1 font-sans">📐 Fourier's Law</div>
                    <div className="text-neutral-200 mb-2 font-mono">Q = k · A · ΔT / d</div>
                    <div className="text-[10px] text-neutral-500 font-sans">k = conductivity (W/mK) · A = area (m²) · ΔT = temp diff (K) · d = thickness (m)</div>
                  </div>
                </>
              )}
              {mode === "convection" && (
                <>
                  <p className="text-sm text-neutral-400 mb-4 font-sans leading-relaxed">
                    <strong className="text-neutral-200">Convection</strong> is heat transfer via bulk fluid
                    motion. Hot fluid rises (lower density), cool fluid sinks — creating a circulation current.
                    This is how ocean currents, weather systems, and boiling pots all work.
                  </p>
                  <div className="rounded-xl border border-neutral-700 bg-neutral-950 p-4">
                    <div className="text-cyan-400 font-bold mb-1 font-sans">📐 Newton's Law of Cooling</div>
                    <div className="text-neutral-200 mb-2 font-mono">Q = h · A · ΔT</div>
                    <div className="text-[10px] text-neutral-500 font-sans">h = convection coefficient (W/m²K) · A = surface area (m²) · ΔT = temp diff (K)</div>
                  </div>
                </>
              )}
              {mode === "radiation" && (
                <>
                  <p className="text-sm text-neutral-400 mb-4 font-sans leading-relaxed">
                    <strong className="text-neutral-200">Radiation</strong> is heat transfer via electromagnetic
                    waves (photons) — no medium needed. All objects above 0 K emit infrared radiation. Hotter
                    objects emit more and shorter-wavelength radiation (T⁴ dependence makes this dramatic!).
                  </p>
                  <div className="rounded-xl border border-neutral-700 bg-neutral-950 p-4">
                    <div className="text-amber-500 font-bold mb-1 font-sans">📐 Stefan-Boltzmann Law</div>
                    <div className="text-neutral-200 mb-2 font-mono">Q = ε · σ · A · (T₁⁴ − T₂⁴)</div>
                    <div className="text-[10px] text-neutral-500 font-sans">ε = emissivity (0-1) · σ = 5.67×10⁻⁸ W/m²K⁴ · T in Kelvin</div>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 border border-neutral-800 bg-neutral-900/50 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-emerald-400 mb-3 tracking-widest">⚡ LIVE PHYSICS DATA</h4>

              {mode === "conduction" && (
                <div className="rounded-xl border border-neutral-700 bg-neutral-950 p-4 mb-4 font-mono text-sm shadow-inner">
                  <div className="text-neutral-500 text-xs mb-1 font-sans">Fourier's Law substituted:</div>
                  <div className="text-neutral-400">Q = k · A · ΔT / d</div>
                  <div className="text-cyan-300 my-2 text-xs opacity-90">= {conductivity} × 0.01 × {dT} / {(0.1 * rodLength + 0.01).toFixed(3)}</div>
                  <div className="text-emerald-400 font-bold">= {condQ.toFixed(2)} W</div>
                </div>
              )}
              {mode === "convection" && (
                <div className="rounded-xl border border-neutral-700 bg-neutral-950 p-4 mb-4 font-mono text-sm shadow-inner">
                  <div className="text-neutral-500 text-xs mb-1 font-sans">Newton's Law substituted:</div>
                  <div className="text-neutral-400">Q = h · A · ΔT</div>
                  <div className="text-cyan-300 my-2 text-xs opacity-90">= {convCoeff} × 0.01 × {dT}</div>
                  <div className="text-emerald-400 font-bold">= {convQ.toFixed(2)} W</div>
                </div>
              )}
              {mode === "radiation" && (
                <div className="rounded-xl border border-neutral-700 bg-neutral-950 p-4 mb-4 font-mono text-sm shadow-inner">
                  <div className="text-neutral-500 text-xs mb-1 font-sans">Stefan-Boltzmann substituted:</div>
                  <div className="text-neutral-400">Q = ε·σ·A·(T₁⁴−T₂⁴)</div>
                  <div className="text-cyan-300 my-2 text-xs opacity-90">= {emissivity} × 5.67e-8 × 0.01 × ({hotTemp}⁴−{coldTemp}⁴)</div>
                  <div className="text-emerald-400 font-bold">= {radQ.toExponential(3)} W</div>
                </div>
              )}

              <div className="rounded-xl border border-neutral-700 bg-neutral-950 p-4 font-mono text-xs shadow-inner">
                {([
                  ["Hot Source", `${hotTemp} K`, tempToHex(hotTemp / 1000)],
                  ["Cold Sink", `${coldTemp} K`, tempToHex(coldTemp / 1000)],
                  ["ΔT", `${dT} K`, "#F59E0B"],
                ] as [string, string, string][]).map(([k, v, c]) => (
                  <div key={k} className="flex justify-between items-center mb-2 last:mb-0">
                    <span className="text-neutral-500">├ {k}</span>
                    <span style={{ color: c }} className="font-bold text-sm bg-neutral-900 px-2 py-0.5 rounded">{v}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
    </main>
  );
}
