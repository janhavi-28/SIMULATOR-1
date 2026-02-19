"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SimulatorFrame, SIMULATOR_CANVAS_CLASS, SIMULATOR_CANVAS_STYLE } from "@/components/simulator/SimulatorFrame";

const TRANSITION_MS = 300;
const PARTICLE_SPEED_K = 120;
const COUNT_UP_MS = 400;

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
}

type CircuitMode = "simple" | "series" | "parallel";

const HOVER_HINTS: Record<string, string> = {
  battery: "Voltage source pushes charges",
  resistor: "Opposes current flow",
  wire: "Conductor path",
};

export default function CircuitSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [voltage, setVoltage] = useState(12);
  const [resistance, setResistance] = useState(24);
  const [resistance1, setResistance1] = useState(12);
  const [resistance2, setResistance2] = useState(12);
  const [circuitMode, setCircuitMode] = useState<CircuitMode>("simple");
  const [paused, setPaused] = useState(true);
  const [simTime, setSimTime] = useState(0);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [showFormulaHelper, setShowFormulaHelper] = useState(false);
  const [highlightVar, setHighlightVar] = useState<"V" | "I" | "R" | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [mouseCanvas, setMouseCanvas] = useState<{ x: number; y: number } | null>(null);

  const displayVoltageRef = useRef(voltage);
  const displayResistanceRef = useRef(resistance);
  const displayCurrentRef = useRef(0);
  const displayPowerRef = useRef(0);
  const displayEnergyRef = useRef(0);
  const fromVoltageRef = useRef(voltage);
  const fromResistanceRef = useRef(resistance);
  const fromCurrentRef = useRef(0);
  const fromPowerRef = useRef(0);
  const fromEnergyRef = useRef(0);
  const transitionStartRef = useRef(0);
  const rafIdRef = useRef<number>(0);

  const current = useMemo(() => {
    if (circuitMode === "simple") return resistance > 0 ? voltage / resistance : 0;
    if (circuitMode === "series") {
      const R = resistance1 + resistance2;
      return R > 0 ? voltage / R : 0;
    }
    const R = resistance1 * resistance2 / (resistance1 + resistance2);
    return R > 0 ? voltage / R : 0;
  }, [voltage, resistance, resistance1, resistance2, circuitMode]);

  const power = useMemo(() => voltage * current, [voltage, current]);
  const energy = useMemo(() => power * simTime, [power, simTime]);

  const handleVoltageChange = (v: number) => {
    fromVoltageRef.current = displayVoltageRef.current;
    transitionStartRef.current = performance.now();
    setVoltage(v);
  };
  const handleResistanceChange = (r: number) => {
    fromResistanceRef.current = displayResistanceRef.current;
    transitionStartRef.current = performance.now();
    setResistance(r);
  };
  const handleR1Change = (r: number) => {
    fromResistanceRef.current = displayResistanceRef.current;
    transitionStartRef.current = performance.now();
    setResistance1(r);
  };
  const handleR2Change = (r: number) => {
    fromResistanceRef.current = displayResistanceRef.current;
    transitionStartRef.current = performance.now();
    setResistance2(r);
  };
  const handleLaunch = () => {
    setSimTime(0);
    setPaused(false);
    setHasLaunched(true);
  };
  const handleReset = () => {
    setVoltage(12);
    setResistance(24);
    setResistance1(12);
    setResistance2(12);
    setSimTime(0);
    setPaused(true);
    setHasLaunched(false);
    displayVoltageRef.current = 12;
    displayResistanceRef.current = 24;
    displayCurrentRef.current = 12 / 24;
    displayPowerRef.current = 12 * (12 / 24);
    displayEnergyRef.current = 0;
    fromVoltageRef.current = 12;
    fromResistanceRef.current = 24;
  };

  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    let id: number;
    const tick = (t: number) => {
      id = requestAnimationFrame(tick);
      setSimTime((t - start) / 1000);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [paused]);

  const isAnimating = hasLaunched && !paused;

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pt = getCanvasPoint(e);
      if (!pt) return;
      setMouseCanvas(pt);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cw = canvas.width;
      const ch = canvas.height;
      const dpr = cw / rect.width;
      const cx = cw / 2;
      const cy = ch / 2;
      const boxW = Math.min(cw, ch) * 0.32;
      const boxH = boxW * 0.5;
      const left = cx - boxW;
      const right = cx + boxW;
      const top = cy - boxH;
      const bottom = cy + boxH;
      const batX = left + (cx - left) * 0.32;
      const batW = 14 * dpr;
      const resX = right - (right - cx) * 0.38;
      const resW = 28 * dpr;
      const resH = 20 * dpr;
      if (pt.x >= batX - 10 && pt.x <= batX + batW + 10 && pt.y >= top - 5 && pt.y <= bottom + 5) {
        setHoveredComponent("battery");
        return;
      }
      if (circuitMode === "simple" && pt.x >= resX - 5 && pt.x <= resX + resW + 5 && pt.y >= cy - resH - 5 && pt.y <= cy + resH + 5) {
        setHoveredComponent("resistor");
        return;
      }
      if (circuitMode !== "simple") {
        const resTop = top + (bottom - top) * 0.2;
        const resBot = bottom - (bottom - top) * 0.2;
        if (pt.x >= resX - 5 && pt.x <= resX + resW + 5 && pt.y >= resTop - 5 && pt.y <= resBot + 5) {
          setHoveredComponent("resistor");
          return;
        }
      }
      const onWire = (pt.x >= left - 2 && pt.x <= right + 2 && pt.y >= top - 2 && pt.y <= bottom + 2) &&
        (Math.abs(pt.x - left) < 20 * dpr || Math.abs(pt.x - right) < 20 * dpr || Math.abs(pt.y - top) < 15 * dpr || Math.abs(pt.y - bottom) < 15 * dpr);
      if (onWire) {
        setHoveredComponent("wire");
        return;
      }
      setHoveredComponent(null);
    },
    [getCanvasPoint, circuitMode]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setMouseCanvas(null);
    setHoveredComponent(null);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.floor(rect.width * dpr);
    const ch = Math.floor(rect.height * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const now = performance.now();
    const t = now / 1000;
    const transitionProgress = easeOutCubic(Math.min(1, (now - transitionStartRef.current) / TRANSITION_MS));
    const targetR = circuitMode === "simple" ? resistance : circuitMode === "series" ? resistance1 + resistance2 : resistance1 * resistance2 / (resistance1 + resistance2);
    const fromR = circuitMode === "simple" ? fromResistanceRef.current : resistance1 + resistance2;
    displayVoltageRef.current = fromVoltageRef.current + (voltage - fromVoltageRef.current) * transitionProgress;
    displayResistanceRef.current = fromResistanceRef.current + (targetR - fromResistanceRef.current) * transitionProgress;
    if (transitionProgress >= 1) {
      fromVoltageRef.current = voltage;
      fromResistanceRef.current = targetR;
    }
    const displayV = displayVoltageRef.current;
    const displayR = displayResistanceRef.current;
    const displayI = displayR > 0 ? displayV / displayR : 0;
    const displayP = displayV * displayI;
    const displayE = displayP * simTime;
    fromCurrentRef.current = fromCurrentRef.current + (displayI - fromCurrentRef.current) * easeOutCubic(Math.min(1, (now - transitionStartRef.current) / COUNT_UP_MS));
    fromPowerRef.current = fromPowerRef.current + (displayP - fromPowerRef.current) * easeOutCubic(Math.min(1, (now - transitionStartRef.current) / COUNT_UP_MS));
    fromEnergyRef.current = fromEnergyRef.current + (displayE - fromEnergyRef.current) * easeOutCubic(Math.min(1, (now - transitionStartRef.current) / COUNT_UP_MS));
    displayCurrentRef.current = displayI;
    displayPowerRef.current = displayP;
    displayEnergyRef.current = displayE;

    const cx = cw / 2;
    const cy = ch / 2;
    const boxW = Math.min(cw, ch) * 0.32;
    const boxH = boxW * 0.5;
    const left = cx - boxW;
    const right = cx + boxW;
    const top = cy - boxH;
    const bottom = cy + boxH;

    ctx.clearRect(0, 0, cw, ch);

    const labGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cw, ch) * 0.7);
    labGrad.addColorStop(0, "#0c1c3a");
    labGrad.addColorStop(0.8, "#050f23");
    labGrad.addColorStop(1, "#030a18");
    ctx.fillStyle = labGrad;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    const gridStep = 40 * dpr;
    for (let x = 0; x <= cw + gridStep; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
    for (let y = 0; y <= ch + gridStep; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 30 * dpr;
    ctx.shadowOffsetY = 15 * dpr;

    const wireGlow = 0.3 + 0.5 * Math.min(1, displayV / 24);
    ctx.strokeStyle = `rgba(125, 211, 252, ${0.5 + 0.2 * wireGlow})`;
    ctx.lineWidth = 2.5 * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    const batX = left + (cx - left) * 0.32;
    const batW = 14 * dpr;
    const batHShort = 12 * dpr;
    const batHTall = 18 * dpr;
    ctx.shadowColor = "rgba(59, 130, 246, 0.6)";
    ctx.shadowBlur = 8 * dpr + 6 * dpr * Math.min(1, displayV / 24);
    ctx.fillStyle = displayV >= 18 ? "#93c5fd" : displayV >= 12 ? "#fde047" : "#cbd5e1";
    ctx.fillRect(batX, top + (bottom - top) / 2 - batHTall / 2, 3 * dpr, batHTall);
    ctx.fillRect(batX + batW - 3 * dpr, top + (bottom - top) / 2 - batHShort / 2, 3 * dpr, batHShort);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#0f172a";
    ctx.font = `bold ${10 * dpr}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText("+", batX + 1.5 * dpr, cy - 2 * dpr);
    ctx.fillText("−", batX + batW - 1.5 * dpr, cy + 4 * dpr);
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${9 * dpr}px system-ui`;
    ctx.textAlign = "right";
    ctx.fillText(`${formatNum(displayV, 0)} V`, left - 6 * dpr, cy + 3 * dpr);

    const resX = right - (right - cx) * 0.38;
    const resW = 28 * dpr;
    const resH = 20 * dpr;
    const resGlow = Math.min(1, displayP / 20) * 10 * dpr;
    ctx.shadowColor = "rgba(249, 115, 22, 0.5)";
    ctx.shadowBlur = resGlow;
    ctx.fillStyle = displayP >= 8 ? "#fdba74" : displayP >= 3 ? "#fb923c" : "#4ade80";
    if (circuitMode === "simple") {
      ctx.fillRect(resX, cy - resH / 2, resW, resH);
      ctx.strokeStyle = "rgba(30,41,59,0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(resX, cy - resH / 2, resW, resH);
      ctx.fillStyle = "rgba(248,250,252,0.9)";
      ctx.font = `${9 * dpr}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("R", resX + resW / 2, cy - resH / 2 - 4 * dpr);
    } else if (circuitMode === "series") {
      const halfH = (bottom - top) * 0.45;
      ctx.fillRect(resX, top + 8 * dpr, resW, halfH - 8 * dpr);
      ctx.fillRect(resX, cy + 8 * dpr, resW, halfH - 8 * dpr);
      ctx.strokeStyle = "rgba(30,41,59,0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(resX, top + 8 * dpr, resW, halfH - 8 * dpr);
      ctx.strokeRect(resX, cy + 8 * dpr, resW, halfH - 8 * dpr);
      ctx.fillStyle = "rgba(248,250,252,0.9)";
      ctx.font = `${8 * dpr}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("R₁", resX + resW / 2, top + halfH / 2);
      ctx.fillText("R₂", resX + resW / 2, cy + halfH / 2);
    } else {
      const branchW = 12 * dpr;
      const branchGap = 8 * dpr;
      ctx.fillRect(resX, top + 10 * dpr, branchW, (bottom - top) * 0.35);
      ctx.fillRect(resX + resW - branchW, cy + 5 * dpr, branchW, (bottom - top) * 0.35);
      ctx.strokeStyle = "rgba(30,41,59,0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(resX, top + 10 * dpr, branchW, (bottom - top) * 0.35);
      ctx.strokeRect(resX + resW - branchW, cy + 5 * dpr, branchW, (bottom - top) * 0.35);
      ctx.fillStyle = "rgba(248,250,252,0.9)";
      ctx.font = `${8 * dpr}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("R₁", resX + branchW / 2, top + 10 * dpr + (bottom - top) * 0.175);
      ctx.fillText("R₂", resX + resW - branchW / 2, cy + 5 * dpr + (bottom - top) * 0.175);
    }
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
    ctx.fillText(circuitMode === "simple" ? `${resistance} Ω` : circuitMode === "series" ? `R₁+R₂` : "R₁∥R₂", right + 6 * dpr, cy + 3 * dpr);

    const perimeter = 2 * (right - left + bottom - top);
    const speed = (PARTICLE_SPEED_K * displayI * dpr) / Math.max(1, perimeter);
    const particleT = isAnimating ? t * speed : 0;
    const nDots = 8;
    const magGlow = Math.min(1, displayI / 2);
    for (let i = 0; i < nDots; i++) {
      const s = ((particleT * perimeter * 0.5 + (i / nDots) * perimeter) % perimeter) / perimeter;
      let x: number, y: number;
      if (s < 0.25) {
        x = left + (right - left) * (s / 0.25);
        y = top;
      } else if (s < 0.5) {
        x = right;
        y = top + (bottom - top) * ((s - 0.25) / 0.25);
      } else if (s < 0.75) {
        x = right - (right - left) * ((s - 0.5) / 0.25);
        y = bottom;
      } else {
        x = left;
        y = bottom - (bottom - top) * ((s - 0.75) / 0.25);
      }
      ctx.shadowColor = `rgba(56, 189, 248, ${0.4 + 0.5 * magGlow})`;
      ctx.shadowBlur = 6 * dpr;
      ctx.fillStyle = `rgba(125, 211, 252, ${0.85 + 0.15 * magGlow})`;
      ctx.beginPath();
      ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const valuesY = bottom + 22 * dpr;
    const cardW = 90 * dpr;
    const cardH = 36 * dpr;
    const cards = [
      { label: "I", value: fromCurrentRef.current, unit: "A", glow: "rgba(59, 130, 246, 0.4)" },
      { label: "V", value: displayV, unit: "V", glow: "rgba(234, 179, 8, 0.4)" },
      { label: "P", value: fromPowerRef.current, unit: "W", glow: "rgba(249, 115, 22, 0.4)" },
      { label: "E", value: fromEnergyRef.current, unit: "J", glow: "rgba(34, 211, 238, 0.4)" },
    ];
    const startX = left;
    cards.forEach((card, i) => {
      const cardX = startX + i * (cardW + 8 * dpr);
      ctx.save();
      ctx.shadowColor = card.glow;
      ctx.shadowBlur = 12 * dpr;
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = "rgba(71, 85, 105, 0.6)";
      ctx.lineWidth = 1;
      roundRect(ctx, cardX, valuesY, cardW, cardH, 6 * dpr);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
      ctx.font = `${9 * dpr}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText(card.label + " =", cardX + 6 * dpr, valuesY + 14 * dpr);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = `bold ${12 * dpr}px system-ui`;
      ctx.textAlign = "right";
      ctx.fillText(formatNum(card.value, card.unit === "J" ? 1 : 2) + " " + card.unit, cardX + cardW - 6 * dpr, valuesY + 24 * dpr);
    });

    if (hoveredComponent && mouseCanvas) {
      const hint = HOVER_HINTS[hoveredComponent];
      if (hint) {
        ctx.font = `${10 * dpr}px system-ui`;
        const m = ctx.measureText(hint);
        const tw = m.width + 16 * dpr;
        const th = 22 * dpr;
        let tx = mouseCanvas.x + 12 * dpr;
        let ty = mouseCanvas.y - th - 4 * dpr;
        if (tx + tw > cw) tx = cw - tw - 8;
        if (ty < 0) ty = mouseCanvas.y + 16 * dpr;
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.strokeStyle = "rgba(100, 116, 139, 0.5)";
        roundRect(ctx, tx, ty, tw, th, 4 * dpr);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#e2e8f0";
        ctx.textAlign = "left";
        ctx.fillText(hint, tx + 8 * dpr, ty + 15 * dpr);
      }
    }
  }, [
    voltage,
    resistance,
    resistance1,
    resistance2,
    circuitMode,
    simTime,
    isAnimating,
    mouseCanvas,
    hoveredComponent,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    draw();
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    let rafId: number;
    const loop = () => {
      rafId = requestAnimationFrame(loop);
      draw();
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [draw]);

  const headerControls = (
    <>
      <button
        type="button"
        onClick={handleLaunch}
        disabled={hasLaunched}
        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
          hasLaunched
            ? "border-neutral-600 bg-neutral-800/50 text-neutral-500 cursor-not-allowed"
            : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
        }`}
        aria-label="Launch simulation"
      >
        ▶ Launch
      </button>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        disabled={!hasLaunched}
        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
          !hasLaunched
            ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
            : paused
              ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              : "bg-neutral-600 text-neutral-200 hover:bg-neutral-500"
        }`}
        aria-label={paused ? "Play" : "Pause"}
      >
        ⏸ {paused ? "Play" : "Pause"}
      </button>
      <button
        type="button"
        onClick={handleReset}
        className="rounded-xl border border-neutral-600 bg-neutral-800/80 px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-neutral-200 transition"
        aria-label="Reset simulation"
      >
        🔁 Reset
      </button>
    </>
  );

  return (
    <SimulatorFrame
      title={
        <>
          <span aria-hidden>⚡</span>
          <span className="ml-1">Ohm&apos;s Law &amp; DC Circuit Playground</span>
        </>
      }
      subtitle="Adjust V and R. Launch to see current flow. Pause freezes time."
      headerControls={headerControls}
      controlPanel={
        <>
          <h2 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
            Parameters
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Circuit mode</label>
            <select
              value={circuitMode}
              onChange={(e) => setCircuitMode(e.target.value as CircuitMode)}
              className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200"
            >
              <option value="simple">Simple loop</option>
              <option value="series">Two resistors (series)</option>
              <option value="parallel">Two resistors (parallel)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-300">Voltage V (V)</label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500 tabular-nums w-6">1</span>
              <input
                type="range"
                min={1}
                max={24}
                value={voltage}
                onChange={(e) => handleVoltageChange(Number(e.target.value))}
                className="flex-1 h-2.5 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400"
              />
              <span className="text-[10px] text-neutral-500 tabular-nums w-6 text-right">24</span>
            </div>
            <div className="text-sm text-amber-300 font-mono tabular-nums">{voltage} V</div>
          </div>

          {circuitMode === "simple" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">Resistance R (Ω)</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 w-6">1</span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={resistance}
                  onChange={(e) => handleResistanceChange(Number(e.target.value))}
                  className="flex-1 h-2.5 rounded-full appearance-none bg-neutral-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-400"
                />
                <span className="text-[10px] text-neutral-500 w-7 text-right">100</span>
              </div>
              <div className="text-sm text-orange-300 font-mono tabular-nums">{resistance} Ω</div>
            </div>
          )}
          {circuitMode !== "simple" && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">R₁ (Ω)</label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={resistance1}
                  onChange={(e) => handleR1Change(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-neutral-600 [&::-webkit-slider-thumb]:bg-orange-400"
                />
                <div className="text-sm text-orange-300 font-mono">{resistance1} Ω</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-300">R₂ (Ω)</label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={resistance2}
                  onChange={(e) => handleR2Change(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-neutral-600 [&::-webkit-slider-thumb]:bg-orange-400"
                />
                <div className="text-sm text-orange-300 font-mono">{resistance2} Ω</div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
              Live values
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 shadow-[0_0_12px_-2px_rgba(59,130,246,0.3)]">
                <div className="text-[10px] text-blue-300 uppercase">I</div>
                <div className="text-sm font-mono font-semibold text-blue-200">{formatNum(current, 3)} A</div>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 shadow-[0_0_12px_-2px_rgba(234,179,8,0.3)]">
                <div className="text-[10px] text-amber-300 uppercase">V</div>
                <div className="text-sm font-mono font-semibold text-amber-200">{formatNum(voltage, 0)} V</div>
              </div>
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 shadow-[0_0_12px_-2px_rgba(249,115,22,0.3)]">
                <div className="text-[10px] text-orange-300 uppercase">P</div>
                <div className="text-sm font-mono font-semibold text-orange-200">{formatNum(power, 2)} W</div>
              </div>
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 shadow-[0_0_12px_-2px_rgba(34,211,238,0.3)]">
                <div className="text-[10px] text-cyan-300 uppercase">E</div>
                <div className="text-sm font-mono font-semibold text-cyan-200">{formatNum(energy, 1)} J</div>
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={showFormulaHelper}
              onChange={(e) => setShowFormulaHelper(e.target.checked)}
              className="rounded border-neutral-600 bg-neutral-800 text-cyan-500"
            />
            <span className="text-xs font-medium text-neutral-300">Show Formula Helper</span>
          </label>

          <p className="text-[11px] text-neutral-500 leading-snug border-t border-neutral-800 pt-3 mt-1">
            Try: Set V = 12 V, then double R. Watch I and P change.
          </p>
        </>
      }
    >
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[500px] lg:min-h-[580px] xl:min-h-[640px] w-full rounded-xl border border-neutral-700 overflow-visible bg-[#0c1c3a]"
        style={{ filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.5))" }}
      >
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 cursor-default ${SIMULATOR_CANVAS_CLASS}`}
          style={SIMULATOR_CANVAS_STYLE}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        />
        {showFormulaHelper && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl border border-cyan-500/40 bg-neutral-900/95 px-6 py-4 shadow-xl"
            style={{ minWidth: "140px" }}
          >
            <div className="text-center text-slate-200 text-sm mb-2">Ohm&apos;s Law</div>
            <div className="flex flex-col items-center gap-0.5 font-mono text-lg">
              <button
                type="button"
                onClick={() => setHighlightVar(highlightVar === "V" ? null : "V")}
                className={`px-3 py-1 rounded ${highlightVar === "V" ? "bg-amber-500/30 text-amber-200" : "text-slate-300 hover:bg-neutral-700"}`}
              >
                V
              </button>
              <div className="text-cyan-400/80">——</div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setHighlightVar(highlightVar === "I" ? null : "I")}
                  className={`px-3 py-1 rounded ${highlightVar === "I" ? "bg-blue-500/30 text-blue-200" : "text-slate-300 hover:bg-neutral-700"}`}
                >
                  I
                </button>
                <span className="text-slate-500">R</span>
                <button
                  type="button"
                  onClick={() => setHighlightVar(highlightVar === "R" ? null : "R")}
                  className={`px-3 py-1 rounded ${highlightVar === "R" ? "bg-orange-500/30 text-orange-200" : "text-slate-300 hover:bg-neutral-700"}`}
                >
                  R
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Click a variable to highlight
            </p>
          </div>
        )}
      </div>
    </SimulatorFrame>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
