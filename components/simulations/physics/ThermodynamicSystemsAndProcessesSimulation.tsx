"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
type ProcessType = "isothermal" | "adiabatic" | "isobaric" | "isochoric" | "carnot";

interface GasParticle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  trail: { x: number; y: number }[];
}

// ─── Gas colour helper ───────────────────────────────────────────────────────
const gasColor = (tempNorm: number, alpha = 1): string => {
  const n = Math.max(0, Math.min(1, tempNorm));
  if (n < 0.33) return `rgba(59,130,246,${alpha})`;
  if (n < 0.55) return `rgba(6,182,212,${alpha})`;
  if (n < 0.75) return `rgba(245,158,11,${alpha})`;
  return `rgba(239,68,68,${alpha})`;
};

// ─── Thermodynamics formulas ─────────────────────────────────────────────────
// Ideal Gas Law: PV = nRT
const R_GAS = 8.314; // J/(mol·K)
const getP = (n: number, T: number, V: number) => (n * R_GAS * T) / V;
const getT = (P: number, V: number, n: number) => (P * V) / (n * R_GAS);
const getV = (n: number, T: number, P: number) => (n * R_GAS * T) / P;

// Work done:
// Isothermal: W = nRT·ln(V2/V1)
// Adiabatic:  W = (P1V1 - P2V2) / (γ-1) = nR(T1-T2)/(γ-1)
// Isobaric:   W = P·ΔV = nRΔT
// Isochoric:  W = 0
const GAMMA = 1.4; // diatomic ideal gas

// PV curve point for isothermal: P = nRT/V
const isothermalP = (n: number, T: number, V: number) => (n * R_GAS * T) / V;
// PV curve point for adiabatic: PV^γ = const  → P = C/V^γ
const adiabaticP = (C: number, V: number) => C / Math.pow(V, GAMMA);

// ─── History path type ───────────────────────────────────────────────────────
interface PVPoint { V: number; P: number; }

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ThermodynamicProcesses() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pvCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const runningRef = useRef(true);
  const particlesRef = useRef<GasParticle[]>([]);
  const pvPathRef = useRef<PVPoint[]>([]);
  const stateRef = useRef({ T: 400, V: 0.01, n: 1, process: "isothermal" as ProcessType });

  // ── Slider state ─────────────────────────────────────────────────────────
  const [process, setProcess] = useState<ProcessType>("isothermal");
  const [temperature, setTemperature] = useState(400);   // K
  const [volume, setVolume] = useState(0.010);            // m³ (0.001–0.030)
  const [moles, setMoles] = useState(1.0);               // mol
  const [isRunning, setIsRunning] = useState(true);

  // derived
  const pressure = getP(moles, temperature, volume);    // Pa

  // live stats
  const [liveStats, setLiveStats] = useState({
    P: pressure, T: temperature, V: volume, W: 0, Q: 0, dU: 0, efficiency: 0,
  });

  // sync refs
  useEffect(() => {
    stateRef.current = { T: temperature, V: volume, n: moles, process };
  }, [temperature, volume, moles, process]);

  // ── Init gas particles ────────────────────────────────────────────────────
  const initParticles = useCallback((W: number, H: number, T: number) => {
    const count = Math.round(8 + moles * 12);
    const speed = Math.sqrt(T / 300) * 2.2;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: W * 0.1 + Math.random() * W * 0.8,
      y: H * 0.1 + Math.random() * H * 0.8,
      vx: (Math.random() - 0.5) * speed * 2,
      vy: (Math.random() - 0.5) * speed * 2,
      r: 5,
      trail: [],
    }));
    pvPathRef.current = [];
  }, [moles]);

  // ── Animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const setSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const { T } = stateRef.current;
      initParticles(canvas.width, canvas.height * 0.72, T);
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(container);

    const ctx = canvas.getContext("2d")!;
    let frameCount = 0;
    let pvTimer = 0;

    const loop = (now: number) => {
      animRef.current = requestAnimationFrame(loop);
      const rawDt = Math.min((now - lastTimeRef.current) / 1000, 0.033);
      lastTimeRef.current = now;
      const dt = rawDt || 0.016;
      const W = canvas.width, H = canvas.height;
      if (W < 10 || H < 10) return;
      frameCount++;

      const { T, V, n, process: proc } = stateRef.current;
      const P = getP(n, T, V);
      const tempNorm = Math.min(T / 800, 1);

      // ── Update piston position based on volume ──────────────────────────
      // Volume range 0.001–0.030 m³ → piston x range W*0.08 to W*0.92
      const volFrac = (V - 0.001) / 0.029;
      const pistonX = W * 0.08 + volFrac * W * 0.84;
      const gasTop = H * 0.08, gasBot = H * 0.72;
      const gasH = gasBot - gasTop;

      // ── Physics step for particles ──────────────────────────────────────
      if (runningRef.current) {
        pvTimer += dt;
        const speed = Math.sqrt(Math.max(T, 50) / 300) * 2.2;

        for (const p of particlesRef.current) {
          p.x += p.vx * dt * 60;
          p.y += p.vy * dt * 60;

          // Walls: left, right (piston), top, bottom
          if (p.x - p.r < 0) { p.x = p.r; p.vx = Math.abs(p.vx); }
          if (p.x + p.r > pistonX) { p.x = pistonX - p.r; p.vx = -Math.abs(p.vx); }
          if (p.y - p.r < gasTop) { p.y = gasTop + p.r; p.vy = Math.abs(p.vy); }
          if (p.y + p.r > gasBot) { p.y = gasBot - p.r; p.vy = -Math.abs(p.vy); }

          // Sync speed magnitude to temperature
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (spd > 0.01) {
            const target = speed * (0.6 + Math.random() * 0.8);
            const newSpd = spd * 0.97 + target * 0.03;
            p.vx = (p.vx / spd) * newSpd;
            p.vy = (p.vy / spd) * newSpd;
          }

          // Trail
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 8) p.trail.shift();
        }

        // Record PV path point every 0.3s
        if (pvTimer > 0.3) {
          pvTimer = 0;
          pvPathRef.current.push({ V, P });
          if (pvPathRef.current.length > 80) pvPathRef.current.shift();
        }
      }

      // ── Compute thermodynamic quantities ───────────────────────────────
      // Reference state: T0=300K, V0=0.01m³
      const T0 = 300, V0 = 0.01;
      const P0 = getP(n, T0, V0);
      let W_work = 0, Q_heat = 0, dU = 0;

      if (proc === "isothermal") {
        W_work = n * R_GAS * T * Math.log(V / V0);
        Q_heat = W_work;
        dU = 0;
      } else if (proc === "adiabatic") {
        dU = (n * R_GAS * (T - T0)) / (GAMMA - 1);
        W_work = -dU;
        Q_heat = 0;
      } else if (proc === "isobaric") {
        W_work = P * (V - V0);
        dU = (n * R_GAS * (T - T0)) / (GAMMA - 1);
        Q_heat = dU + W_work;
      } else if (proc === "isochoric") {
        W_work = 0;
        dU = (n * R_GAS * (T - T0)) / (GAMMA - 1);
        Q_heat = dU;
      } else if (proc === "carnot") {
        const Tc = Math.min(T, T0);
        const Th = Math.max(T, T0);
        const eta = Th > 0 ? 1 - Tc / Th : 0;
        W_work = Q_heat * eta;
        dU = 0;
        Q_heat = n * R_GAS * Th * Math.log(V / V0);
        W_work = Q_heat * eta;
      }

      // ── DRAW ───────────────────────────────────────────────────────────
      ctx.fillStyle = "#0D1117";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(148,163,184,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // ── Cylinder body ──────────────────────────────────────────────────
      // Gas chamber background
      const gasGrad = ctx.createLinearGradient(0, gasTop, pistonX, gasTop);
      gasGrad.addColorStop(0, gasColor(tempNorm, 0.35));
      gasGrad.addColorStop(1, gasColor(tempNorm, 0.08));
      ctx.fillStyle = gasGrad;
      ctx.fillRect(0, gasTop, pistonX, gasH);

      // Cylinder walls
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.lineWidth = 3;
      ctx.strokeRect(0, gasTop, pistonX, gasH);

      // Piston
      const pistonW = 18;
      const pistonGrad = ctx.createLinearGradient(pistonX - pistonW, gasTop, pistonX, gasTop);
      pistonGrad.addColorStop(0, "#64748B");
      pistonGrad.addColorStop(1, "#94A3B8");
      ctx.fillStyle = pistonGrad;
      ctx.fillRect(pistonX - pistonW, gasTop, pistonW, gasH);
      // Piston bolts
      for (let by = gasTop + 20; by < gasBot - 10; by += 30) {
        ctx.fillStyle = "#475569";
        ctx.beginPath(); ctx.arc(pistonX - pistonW / 2, by, 4, 0, Math.PI * 2); ctx.fill();
      }
      // Piston rod
      ctx.fillStyle = "#94A3B8";
      ctx.fillRect(pistonX, (gasTop + gasBot) / 2 - 6, W - pistonX, 12);
      // Arrow on rod showing force direction
      const arrowDir = volFrac > 0.5 ? 1 : -1;
      ctx.fillStyle = arrowDir > 0 ? "#EF4444" : "#3B82F6";
      ctx.beginPath();
      const aX = pistonX + (W - pistonX) * 0.5;
      const aY = (gasTop + gasBot) / 2;
      ctx.moveTo(aX + arrowDir * 16, aY);
      ctx.lineTo(aX - arrowDir * 4, aY - 8);
      ctx.lineTo(aX - arrowDir * 4, aY + 8);
      ctx.fill();

      // ── Gas particles ──────────────────────────────────────────────────
      for (const p of particlesRef.current) {
        // Trail
        for (let i = 1; i < p.trail.length; i++) {
          const a = (i / p.trail.length) * 0.25;
          ctx.strokeStyle = gasColor(tempNorm, a);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
          ctx.stroke();
        }
        // Glow
        const gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        gg.addColorStop(0, gasColor(tempNorm, 0.45));
        gg.addColorStop(1, "transparent");
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2); ctx.fill();
        // Core
        const gc = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, 0.5, p.x, p.y, p.r);
        gc.addColorStop(0, "#FFFFFF");
        gc.addColorStop(0.4, gasColor(tempNorm, 1));
        gc.addColorStop(1, gasColor(tempNorm, 0.7));
        ctx.fillStyle = gc;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }

      // ── State labels on cylinder ───────────────────────────────────────
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(`T = ${Math.round(T)} K`, pistonX / 2, gasTop - 8);
      ctx.fillText(`P = ${(P / 1000).toFixed(1)} kPa`, pistonX / 2, gasBot + 18);
      ctx.fillText(`V = ${(V * 1000).toFixed(1)} L`, pistonX / 2, gasBot + 34);

      // ── Process label ──────────────────────────────────────────────────
      const procLabels: Record<ProcessType, string> = {
        isothermal: "ISOTHERMAL  (T = const)",
        adiabatic: "ADIABATIC  (Q = 0)",
        isobaric: "ISOBARIC  (P = const)",
        isochoric: "ISOCHORIC  (V = const)",
        carnot: "CARNOT CYCLE",
      };
      const procColors: Record<ProcessType, string> = {
        isothermal: "#3B82F6", adiabatic: "#EF4444", isobaric: "#10B981",
        isochoric: "#F59E0B", carnot: "#A78BFA",
      };
      ctx.font = "bold 13px monospace";
      ctx.fillStyle = procColors[proc];
      ctx.textAlign = "left";
      ctx.fillText(procLabels[proc], 8, 20);

      // ── PV Diagram (bottom portion of canvas) ─────────────────────────
      drawPVDiagram(ctx, W, H, gasBot + 45, H - 10, n, T, V, P, proc, pvPathRef.current, procColors[proc]);

      // ── Energy bar overlay ─────────────────────────────────────────────
      drawEnergyBars(ctx, W, W_work, Q_heat, dU, gasTop, gasH);

      // Update stats
      if (frameCount % 8 === 0) {
        setLiveStats({
          P: Math.round(P), T: Math.round(T),
          V: Math.round(V * 10000) / 10000,
          W: Math.round(W_work * 10) / 10,
          Q: Math.round(Q_heat * 10) / 10,
          dU: Math.round(dU * 10) / 10,
          efficiency: proc === "carnot" ? Math.round((1 - Math.min(T, 300) / Math.max(T, 300)) * 1000) / 10 : 0,
        });
      }
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []); // eslint-disable-line

  // ── PV Diagram drawer ─────────────────────────────────────────────────────
  function drawPVDiagram(
    ctx: CanvasRenderingContext2D,
    W: number, H: number,
    yTop: number, yBot: number,
    n: number, T: number, V: number, P: number,
    proc: ProcessType,
    path: PVPoint[],
    color: string
  ) {
    const plotL = W * 0.06, plotR = W * 0.94;
    const plotT = yTop + 4, plotB = yBot - 4;
    const plotW = plotR - plotL, plotH = plotB - plotT;

    // Background
    ctx.fillStyle = "rgba(15,23,42,0.85)";
    ctx.fillRect(plotL, plotT, plotW, plotH);
    ctx.strokeStyle = "rgba(100,116,139,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(plotL, plotT, plotW, plotH);

    // Axis labels
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "#94A3B8";
    ctx.textAlign = "center";
    ctx.fillText("P–V Diagram", plotL + plotW / 2, plotT + 12);
    ctx.textAlign = "left";
    ctx.fillText("P (kPa)↑", plotL + 2, plotT + 24);
    ctx.textAlign = "right";
    ctx.fillText("V (L) →", plotR - 2, plotB - 3);

    // V range: 0.001→0.030 (1→30 L), P range: 0→50 kPa
    const Vmin = 0.001, Vmax = 0.030;
    const Pmin_d = 0, Pmax_d = 60000;
    const toX = (v: number) => plotL + ((v - Vmin) / (Vmax - Vmin)) * plotW;
    const toY = (p: number) => plotB - ((p - Pmin_d) / (Pmax_d - Pmin_d)) * plotH;

    // Draw reference curves
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;

    // Isothermal curves at T=200,400,600K
    for (const tRef of [200, 400, 600]) {
      ctx.strokeStyle = `rgba(59,130,246,${tRef === 400 ? 0.25 : 0.1})`;
      ctx.beginPath();
      let first = true;
      for (let v = Vmin; v <= Vmax; v += 0.001) {
        const p = isothermalP(n, tRef, v);
        if (p > Pmax_d || p < 0) continue;
        const x = toX(v), y = toY(p);
        if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(59,130,246,0.5)";
      ctx.textAlign = "left";
      ctx.fillText(`${tRef}K`, toX(Vmax) + 1, toY(isothermalP(n, tRef, Vmax)));
    }
    ctx.setLineDash([]);

    // Traced path
    if (path.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < path.length; i++) {
        const x = toX(path[i].V), y = toY(path[i].P);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Current state dot
    const cx = toX(V), cy = toY(P);
    const dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
    dg.addColorStop(0, color + "FF");
    dg.addColorStop(1, "transparent");
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();

    // Grid lines inside plot
    ctx.strokeStyle = "rgba(148,163,184,0.07)";
    ctx.lineWidth = 1;
    for (let v = Vmin; v <= Vmax; v += 0.005) {
      const x = toX(v);
      ctx.beginPath(); ctx.moveTo(x, plotT); ctx.lineTo(x, plotB); ctx.stroke();
    }
    for (let p = 10000; p <= Pmax_d; p += 10000) {
      const y = toY(p);
      ctx.beginPath(); ctx.moveTo(plotL, y); ctx.lineTo(plotR, y); ctx.stroke();
    }
  }

  // ── Energy bars drawer ───────────────────────────────────────────────────
  function drawEnergyBars(
    ctx: CanvasRenderingContext2D,
    W: number, W_work: number, Q_heat: number, dU: number,
    gasTop: number, gasH: number
  ) {
    const barX = W - 90, barY = gasTop + 10, barW = 14, maxH = gasH - 20;
    const scale = 1 / Math.max(Math.abs(W_work), Math.abs(Q_heat), Math.abs(dU), 100);

    const bars = [
      { label: "W", val: W_work, color: "#F59E0B" },
      { label: "Q", val: Q_heat, color: "#EF4444" },
      { label: "ΔU", val: dU, color: "#3B82F6" },
    ];

    ctx.font = "bold 9px monospace";
    for (let i = 0; i < bars.length; i++) {
      const { label, val, color } = bars[i];
      const x = barX + i * 26;
      const h = Math.min(Math.abs(val) * scale * maxH * 0.4, maxH / 2 - 5);
      const baseY = barY + maxH / 2;

      // Base line
      ctx.strokeStyle = "rgba(148,163,184,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, barY); ctx.lineTo(x, barY + maxH); ctx.stroke();

      // Bar
      ctx.fillStyle = color + "CC";
      if (val >= 0) ctx.fillRect(x - barW / 2, baseY - h, barW, h);
      else ctx.fillRect(x - barW / 2, baseY, barW, h);

      // Label
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.fillText(label, x, barY + maxH + 12);
      ctx.fillStyle = "#CBD5E1";
      ctx.fillText(val >= 0 ? `+${Math.round(val)}` : `${Math.round(val)}`, x, val >= 0 ? baseY - h - 3 : baseY + h + 11);
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setProcess("isothermal"); setTemperature(400); setVolume(0.010); setMoles(1.0);
    setIsRunning(true); runningRef.current = true;
    pvPathRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) initParticles(canvas.width, canvas.height * 0.72, 400);
  };

  // ── Slider ────────────────────────────────────────────────────────────────
  const Slider = ({
    label, value, min, max, step, unit, icon, color = "#3B82F6", onChange, decimals = 0,
  }: {
    label: string; value: number; min: number; max: number; step: number;
    unit: string; icon: string; color?: string; onChange: (v: number) => void; decimals?: number;
  }) => (
    <div style={{ marginBottom: 15 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{icon} {label}</span>
        <span style={{
          fontSize: 13, fontWeight: 800, color,
          background: "rgba(255,255,255,0.06)", padding: "1px 8px", borderRadius: 5
        }}>
          {decimals > 0 ? value.toFixed(decimals) : Math.round(value)} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={`${label}: ${value} ${unit}`}
        style={{ width: "100%", height: 6, accentColor: color, cursor: "pointer", display: "block" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#334155", marginTop: 1 }}>
        <span>{min}</span><span>{max} {unit}</span>
      </div>
    </div>
  );

  const procColors: Record<ProcessType, string> = {
    isothermal: "#3B82F6", adiabatic: "#EF4444", isobaric: "#10B981",
    isochoric: "#F59E0B", carnot: "#A78BFA",
  };

  const theories: Record<ProcessType, { title: string; body: string; formula: string; vars: string }> = {
    isothermal: {
      title: "Isothermal Process (T = constant)",
      body: "Temperature stays constant while pressure and volume change inversely (Boyle's Law). The gas must exchange heat with the surroundings to maintain constant temperature. Internal energy ΔU = 0.",
      formula: "W = nRT·ln(V₂/V₁)  |  PV = nRT = const",
      vars: "W=work(J) · n=moles · R=8.314 J/mol·K · T=temperature(K) · V=volume(m³)",
    },
    adiabatic: {
      title: "Adiabatic Process (Q = 0)",
      body: "No heat exchange with surroundings. All work comes from internal energy change. The gas cools when it expands. PV^γ = constant gives a steeper curve than isothermal.",
      formula: "PV^γ = const  |  W = nR(T₁−T₂)/(γ−1)  |  Q = 0",
      vars: "γ=Cp/Cv=1.4 (diatomic) · W=work done · T=temperature · ΔU=-W",
    },
    isobaric: {
      title: "Isobaric Process (P = constant)",
      body: "Pressure remains constant while volume and temperature both change. Heat is added or removed to maintain constant pressure. Both work and internal energy change.",
      formula: "W = PΔV = nRΔT  |  Q = nCpΔT  |  ΔU = nCvΔT",
      vars: "Cp=7/2·R (diatomic) · Cv=5/2·R · ΔV=volume change · ΔT=temp change",
    },
    isochoric: {
      title: "Isochoric Process (V = constant)",
      body: "Volume stays constant — the piston doesn't move. All heat added goes entirely into increasing internal energy. No work is done by or on the gas.",
      formula: "W = 0  |  Q = ΔU = nCvΔT  |  P/T = const",
      vars: "Cv=5/2·R=20.8 J/mol·K · Q=heat added · ΔU=internal energy change",
    },
    carnot: {
      title: "Carnot Cycle (Maximum Efficiency)",
      body: "The ideal reversible heat engine cycle with two isothermal and two adiabatic processes. Sets the theoretical maximum efficiency between two temperatures. No real engine can exceed Carnot efficiency.",
      formula: "η = 1 − Tc/Th  |  η_max = (Th−Tc)/Th",
      vars: "η=efficiency · Th=hot reservoir(K) · Tc=cold reservoir(K) · W=net work output",
    },
  };

  const tips: Record<ProcessType, { icon: string; title: string; sub: string; result: string; col: string }[]> = {
    isothermal: [
      { icon: "📈", title: "Boyle's Law", sub: "T=400K, drag V from 5L to 25L", result: "Watch pressure drop as volume expands!", col: "#3B82F6" },
      { icon: "🔥", title: "High Temp", sub: "Set T=700K, expand volume", result: "Gas expands further doing more work!", col: "#EF4444" },
      { icon: "🧪", title: "More Moles", sub: "n=2, T=400K, V=15L", result: "Double the gas = double the pressure!", col: "#10B981" },
    ],
    adiabatic: [
      { icon: "💨", title: "Rapid Expansion", sub: "V=25L — watch T drop!", result: "Gas cools dramatically without heat exchange!", col: "#EF4444" },
      { icon: "🔧", title: "Compression", sub: "V=2L — watch T rise!", result: "Diesel ignition: adiabatic compression heats gas!", col: "#F59E0B" },
      { icon: "⚡", title: "High γ Effect", sub: "Compare with isothermal slope", result: "Adiabatic curve is always steeper than isothermal!", col: "#A78BFA" },
    ],
    isobaric: [
      { icon: "🎈", title: "Balloon Heating", sub: "T from 200K to 700K", result: "Volume expands proportionally — Charles's Law!", col: "#10B981" },
      { icon: "🔥", title: "Max Work", sub: "T=700K, n=2mol", result: "Large ΔV means lots of work done by gas!", col: "#EF4444" },
      { icon: "❄", title: "Cooling", sub: "T=100K — watch contraction", result: "Gas contracts as it cools at constant pressure!", col: "#3B82F6" },
    ],
    isochoric: [
      { icon: "🔒", title: "Lock the Piston", sub: "V is fixed — only T changes", result: "All heat goes to pressure — no work done!", col: "#F59E0B" },
      { icon: "💥", title: "Pressure Surge", sub: "n=2, T=700K, V=5L", result: "Enormous pressure with no volume change!", col: "#EF4444" },
      { icon: "🧊", title: "Cool It Down", sub: "T=100K — watch P drop", result: "Pressure falls proportionally with temperature!", col: "#3B82F6" },
    ],
    carnot: [
      { icon: "♾", title: "Max Efficiency", sub: "T=700K (hot) cold=300K", result: "η = 57%! The theoretical maximum!", col: "#A78BFA" },
      { icon: "📉", title: "Low ΔT", sub: "T=320K vs 300K cold", result: "Only 6% efficiency — tiny temp difference!", col: "#F59E0B" },
      { icon: "🌡", title: "Hot reservoir", sub: "Push T to 800K, Tc=100K", result: "η = 87.5% — highest possible efficiency!", col: "#EF4444" },
    ],
  };

  const eqDisplay: Record<ProcessType, (s: typeof liveStats) => string[]> = {
    isothermal: s => [
      `PV = nRT`,
      `P = nRT/V = ${s.P / 1000} kPa`,
      `W = nRT·ln(V/V₀) = ${s.W} J`,
      `Q = W = ${s.Q} J  |  ΔU = 0`,
    ],
    adiabatic: s => [
      `PV^γ = constant  (γ=1.4)`,
      `P = ${s.P / 1000} kPa`,
      `W = nR(T₀−T)/(γ−1) = ${s.W} J`,
      `ΔU = -W = ${s.dU} J  |  Q = 0`,
    ],
    isobaric: s => [
      `P = const = ${s.P / 1000} kPa`,
      `W = PΔV = nRΔT = ${s.W} J`,
      `ΔU = nCvΔT = ${s.dU} J`,
      `Q = ΔU + W = ${s.Q} J`,
    ],
    isochoric: s => [
      `V = const  |  W = 0`,
      `P/T = nR/V = const`,
      `Q = ΔU = nCvΔT = ${s.Q} J`,
      `P_now = ${s.P / 1000} kPa`,
    ],
    carnot: s => [
      `η = 1 − Tc/Th`,
      `Th = ${s.T} K  Tc ≈ 300 K`,
      `η = ${s.efficiency}%`,
      `W_net = η × Q_in = ${s.W} J`,
    ],
  };

  return (
    <div style={{
      width: "100%", height: "100vh", display: "flex", flexDirection: "column",
      background: "#020617", fontFamily: "'Courier New', monospace",
      color: "#E2E8F0", overflow: "hidden"
    }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, minHeight: 46, display: "flex", alignItems: "center",
        flexWrap: "wrap", padding: "6px 12px", gap: 10, background: "#0D1117", borderBottom: "1px solid #1E293B"
      }}>
        <span style={{
          fontSize: 16, fontWeight: 800,
          background: "linear-gradient(90deg,#EF4444,#F59E0B,#10B981,#3B82F6,#A78BFA)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>⚗ Thermodynamic Processes</span>

        {/* Process tabs */}
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {(["isothermal", "adiabatic", "isobaric", "isochoric", "carnot"] as ProcessType[]).map(p => (
            <button key={p} onClick={() => { setProcess(p); pvPathRef.current = []; }}
              style={{
                padding: "3px 10px", borderRadius: 5, border: "none", cursor: "pointer",
                fontFamily: "monospace", fontSize: 10, fontWeight: 700,
                background: process === p ? procColors[p] + "33" : "rgba(255,255,255,0.04)",
                color: process === p ? procColors[p] : "#475569",
                borderBottom: process === p ? `2px solid ${procColors[p]}` : "2px solid transparent",
              }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={() => { const n = !isRunning; setIsRunning(n); runningRef.current = n; }}
            style={{
              padding: "4px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              background: isRunning ? "#1D4ED8" : "#15803D",
              color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "monospace"
            }}>{isRunning ? "⏸ Pause" : "▶ Play"}</button>
          <button onClick={handleReset}
            style={{
              padding: "4px 14px", borderRadius: 6, border: "1px solid #334155",
              background: "transparent", color: "#94A3B8", cursor: "pointer",
              fontSize: 11, fontWeight: 700, fontFamily: "monospace"
            }}>↺ Reset</button>
        </div>
      </div>

      {/* ── Top: Sim + Controls ─────────────────────────────────────────────── */}
      <div style={{ flex: "0 0 62%", display: "flex", minHeight: 0 }}>

        {/* Canvas */}
        <div ref={containerRef}
          style={{ flex: "0 0 65%", position: "relative", overflow: "hidden", background: "#0D1117" }}>
          <canvas ref={canvasRef}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "block" }} />

          {/* State overlay badge */}
          <div style={{
            position: "absolute", top: 8, right: 10, zIndex: 2,
            background: "rgba(13,17,23,0.92)", border: `1px solid ${procColors[process]}55`,
            borderRadius: 8, padding: "5px 12px", pointerEvents: "none"
          }}>
            <div style={{ fontSize: 9, color: "#64748B", letterSpacing: 1 }}>STATE</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: procColors[process], lineHeight: 1.6 }}>
              P = {(liveStats.P / 1000).toFixed(1)} kPa<br />
              T = {liveStats.T} K<br />
              V = {(liveStats.V * 1000).toFixed(1)} L
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          flex: "0 0 35%", background: "#0A0F1E", borderLeft: "1px solid #1E293B",
          padding: "14px 16px", overflowY: "auto", display: "flex", flexDirection: "column"
        }}>
          <div style={{ fontSize: 10, color: "#334155", letterSpacing: 2, fontWeight: 700, marginBottom: 14 }}>
            ⚙ GAS PARAMETERS
          </div>

          <Slider label="Temperature" value={temperature} min={100} max={800} step={10} unit="K"
            icon="🌡" color="#EF4444" onChange={setTemperature} />

          {process !== "isochoric" && (
            <Slider label="Volume" value={volume} min={0.001} max={0.030} step={0.001} unit="m³"
              icon="📦" color="#3B82F6" onChange={setVolume} decimals={3} />
          )}

          <Slider label="Amount of Gas" value={moles} min={0.1} max={3.0} step={0.1} unit="mol"
            icon="⚗" color="#10B981" onChange={setMoles} decimals={1} />

          {/* Derived state */}
          <div style={{
            background: "rgba(15,23,42,0.9)", border: `1px solid ${procColors[process]}33`,
            borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontFamily: "monospace"
          }}>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1, marginBottom: 6 }}>DERIVED STATE (PV=nRT)</div>
            <div style={{ fontSize: 11, lineHeight: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Pressure</span>
                <span style={{ color: "#10B981", fontWeight: 700 }}>{(pressure / 1000).toFixed(1)} kPa</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>W (work)</span>
                <span style={{ color: "#F59E0B", fontWeight: 700 }}>{liveStats.W} J</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Q (heat)</span>
                <span style={{ color: "#EF4444", fontWeight: 700 }}>{liveStats.Q} J</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>ΔU (int.energy)</span>
                <span style={{ color: "#3B82F6", fontWeight: 700 }}>{liveStats.dU} J</span>
              </div>
              {process === "carnot" && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Efficiency</span>
                  <span style={{ color: "#A78BFA", fontWeight: 700 }}>{liveStats.efficiency}%</span>
                </div>
              )}
            </div>
          </div>

          {/* First Law reminder */}
          <div style={{
            background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 11
          }}>
            <div style={{ fontWeight: 700, color: "#10B981", marginBottom: 3 }}>⚖ 1st Law of Thermodynamics</div>
            <div style={{ color: "#6EE7B7", fontFamily: "monospace", fontSize: 12 }}>ΔU = Q − W</div>
            <div style={{ color: "#334155", fontSize: 10, marginTop: 3 }}>
              Q={liveStats.Q}J − W={liveStats.W}J = ΔU={liveStats.dU}J ✓
            </div>
          </div>

          <button onClick={handleReset} style={{
            marginTop: "auto", width: "100%", padding: "10px", borderRadius: 8,
            border: "none", cursor: "pointer",
            background: `linear-gradient(135deg,${procColors[process]},#1D4ED8)`,
            color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "monospace"
          }}>↺ Reset</button>
        </div>
      </div>

      {/* ── Bottom: Educational ──────────────────────────────────────────────── */}
      <div style={{
        flex: 1, minHeight: 0, background: "#060C1A",
        borderTop: "1px solid #1E293B", display: "flex", overflowY: "auto"
      }}>
        {/* Theory */}
        <div style={{ flex: "0 0 37%", padding: "12px 16px", borderRight: "1px solid #1E293B", overflowY: "auto" }}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 6,
            color: procColors[process]
          }}>
            ✨ {theories[process].title.toUpperCase()}
          </div>
          <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.75, margin: "0 0 8px" }}>
            {theories[process].body}
          </p>
          <div style={{
            background: "#0A0F1E", border: "1px solid #1E293B",
            borderRadius: 8, padding: "10px 12px", fontFamily: "monospace"
          }}>
            <div style={{ fontSize: 10, color: procColors[process], marginBottom: 5, fontWeight: 700 }}>📐 KEY FORMULA</div>
            <div style={{ fontSize: 12, color: "#E2E8F0", lineHeight: 1.9 }}>{theories[process].formula}</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 5 }}>{theories[process].vars}</div>
          </div>

          {/* 1st law visual */}
          <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", fontSize: 11 }}>
            {[
              { val: `ΔU=${liveStats.dU}J`, col: "#3B82F6" },
              { val: "=", col: "#64748B" },
              { val: `Q=${liveStats.Q}J`, col: "#EF4444" },
              { val: "−", col: "#64748B" },
              { val: `W=${liveStats.W}J`, col: "#F59E0B" },
            ].map((item, i) => (
              <span key={i} style={{ color: item.col, fontWeight: 700, fontFamily: "monospace" }}>{item.val}</span>
            ))}
          </div>
        </div>

        {/* Live data */}
        <div style={{ flex: "0 0 32%", padding: "12px 16px", borderRight: "1px solid #1E293B", overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#06B6D4", letterSpacing: 1, marginBottom: 10 }}>
            ⚡ LIVE PHYSICS DATA
          </div>

          <div style={{
            background: "#0A0F1E", border: "1px solid #1E293B",
            borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 11, marginBottom: 10
          }}>
            <div style={{ color: "#334155", marginBottom: 5 }}>Current Equations:</div>
            {eqDisplay[process](liveStats).map((line, i) => (
              <div key={i} style={{
                color: i === eqDisplay[process](liveStats).length - 1 ? "#10B981" : i === 0 ? "#94A3B8" : "#7DD3FC",
                fontWeight: i === eqDisplay[process](liveStats).length - 1 ? 800 : 400,
                marginBottom: 3, lineHeight: 1.6
              }}>{line}</div>
            ))}
          </div>

          <div style={{ background: "#0A0F1E", border: "1px solid #1E293B", borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 11 }}>
            <div style={{ color: "#334155", marginBottom: 6 }}>⚡ Live Stats</div>
            {([
              ["Temperature T", `${liveStats.T} K`, "#EF4444"],
              ["Volume V", `${(liveStats.V * 1000).toFixed(1)} L`, "#3B82F6"],
              ["Pressure P", `${(liveStats.P / 1000).toFixed(2)} kPa`, "#10B981"],
              ["Work W", `${liveStats.W} J`, "#F59E0B"],
              ["Heat Q", `${liveStats.Q} J`, "#EF4444"],
              ["Int. Energy ΔU", `${liveStats.dU} J`, "#3B82F6"],
              ...(process === "carnot" ? [["Carnot η", `${liveStats.efficiency}%`, "#A78BFA"] as [string, string, string]] : []),
            ] as [string, string, string][]).map(([k, v, c]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#475569" }}>├ {k}</span>
                <span style={{ color: c, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div style={{ flex: 1, padding: "12px 16px", overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#F59E0B", letterSpacing: 1, marginBottom: 10 }}>
            💡 TRY THIS FOR DRAMA!
          </div>
          {tips[process].map(t => (
            <div key={t.title} style={{
              marginBottom: 10, background: "rgba(15,23,42,0.7)",
              border: `1px solid ${t.col}30`, borderRadius: 8, padding: "8px 12px"
            }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: t.col }}>{t.icon} {t.title}</div>
              <div style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", margin: "2px 0" }}>{t.sub}</div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>→ {t.result}</div>
            </div>
          ))}

          <div style={{
            marginTop: 6, background: "rgba(15,23,42,0.8)", border: "1px solid #1E293B",
            borderRadius: 8, padding: "10px 12px"
          }}>
            <div style={{ fontSize: 11, color: "#3B82F6", fontWeight: 700, marginBottom: 6 }}>📊 Process Comparison</div>
            {[
              { name: "Isothermal", cstr: "T=const", work: "nRT·ln(V₂/V₁)", col: "#3B82F6" },
              { name: "Adiabatic", cstr: "Q=0", work: "nR·ΔT/(γ-1)", col: "#EF4444" },
              { name: "Isobaric", cstr: "P=const", work: "PΔV=nRΔT", col: "#10B981" },
              { name: "Isochoric", cstr: "V=const", work: "0", col: "#F59E0B" },
            ].map(r => (
              <div key={r.name} style={{ display: "flex", gap: 6, marginBottom: 5, fontSize: 10, alignItems: "center" }}>
                <span style={{
                  color: r.col, fontWeight: 700, minWidth: 76,
                  textDecoration: r.name.toLowerCase() === process ? "underline" : "none"
                }}>{r.name}</span>
                <span style={{ color: "#475569", minWidth: 60 }}>{r.cstr}</span>
                <span style={{ color: "#64748B", fontFamily: "monospace" }}>W={r.work}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
