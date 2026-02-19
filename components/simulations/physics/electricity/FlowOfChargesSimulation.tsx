"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ElectricityShell, SliderControl } from "./ElectricityShell";
import { useSimulationLifecycle } from "./useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function FlowOfChargesSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [voltage, setVoltage] = useState(12);
  const [resistance, setResistance] = useState(6);
  const [wireLength, setWireLength] = useState(0.5);
  const [wireThickness, setWireThickness] = useState(1);
  const [showElectronFlow, setShowElectronFlow] = useState(true);
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });

  const { elapsedTime, hasLaunched, isPaused, launch, pause, reset, isAnimating } = useSimulationLifecycle();
  const simTime = elapsedTime;

  const current = useMemo(() => (resistance > 0 ? voltage / resistance : 0), [voltage, resistance]);
  const driftSpeed = useMemo(() => Math.min(1, current * 0.08 + 0.05), [current]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    });
    ro.observe(container);
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    dimsRef.current = { w: canvas.width, h: canvas.height, dpr };
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = dimsRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const loopW = Math.min(w, h) * 0.7;
    const loopH = loopW * 0.45;
    const left = cx - loopW / 2;
    const right = cx + loopW / 2;
    const top = cy - loopH / 2;
    const bottom = cy + loopH / 2;
    const wireR = (4 + wireThickness * 3) * dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);
    const gridStep = 20 * dpr;
    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(100,116,139,0.6)";
    ctx.lineWidth = wireR * 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.stroke();

    const batX = left + (right - left) * 0.22;
    ctx.strokeStyle = "#fde047";
    ctx.fillStyle = "#fde047";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(batX, top + 8 * dpr);
    ctx.lineTo(batX, bottom - 8 * dpr);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(batX + 14 * dpr, top + 8 * dpr);
    ctx.lineTo(batX + 14 * dpr, bottom - 8 * dpr);
    ctx.stroke();
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "center";
    ctx.fillText("V = " + voltage + " V", batX + 7 * dpr, top - 6 * dpr);

    const switchX = right - (right - left) * 0.25;
    ctx.strokeStyle = current > 0 ? "rgba(34,211,238,0.9)" : "rgba(100,116,139,0.5)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(switchX, top);
    ctx.lineTo(switchX, top + 14 * dpr);
    ctx.moveTo(switchX, bottom);
    ctx.lineTo(switchX, bottom - 14 * dpr);
    ctx.stroke();
    if (current > 0) {
      ctx.beginPath();
      ctx.moveTo(switchX, top + 14 * dpr);
      ctx.lineTo(switchX + 12 * dpr, cy);
      ctx.lineTo(switchX, bottom - 14 * dpr);
      ctx.stroke();
    }

    const perimeter = 2 * (loopW + loopH);
    const nDots = 12;
    const direction = showElectronFlow ? -1 : 1;
    const speed = 0.2 * driftSpeed * (current / 2 + 0.5);
    const t = isAnimating ? simTime * speed * 60 : 0;

    for (let i = 0; i < nDots; i++) {
      const s = ((t * direction + (i / nDots) * perimeter) % perimeter + perimeter) % perimeter / perimeter;
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
      if (showElectronFlow) {
        ctx.fillStyle = "rgba(125,211,252,0.95)";
        ctx.shadowColor = "rgba(56,189,248,0.8)";
        ctx.shadowBlur = 6 * dpr;
      } else {
        ctx.fillStyle = "rgba(251,191,36,0.95)";
        ctx.shadowColor = "rgba(245,158,11,0.8)";
        ctx.shadowBlur = 6 * dpr;
      }
      ctx.beginPath();
      ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${11 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(showElectronFlow ? "Electron flow (− → +)" : "Conventional current (+ → −)", left, bottom + 18 * dpr);
    ctx.fillText(`I = V/R = ${formatNum(current, 3)} A`, left, bottom + 32 * dpr);
  }, [voltage, resistance, wireLength, wireThickness, current, driftSpeed, simTime, showElectronFlow, isAnimating]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Voltage V" value={voltage} min={1} max={24} step={1} unit="V" onChange={setVoltage} color="blue" title="Battery voltage" />
      <SliderControl label="Resistance R" value={resistance} min={1} max={30} step={1} unit="Ω" onChange={setResistance} color="orange" title="Circuit resistance" />
      <SliderControl label="Wire length" value={wireLength} min={0.3} max={1} step={0.1} unit="rel." onChange={setWireLength} color="cyan" />
      <SliderControl label="Wire thickness" value={wireThickness} min={0.5} max={2} step={0.25} unit="rel." onChange={setWireThickness} color="cyan" />
      <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
        <input type="checkbox" checked={showElectronFlow} onChange={(e) => setShowElectronFlow(e.target.checked)} className="rounded border-neutral-500 bg-neutral-800 text-cyan-500" />
        Show electron flow (vs conventional current)
      </label>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Live</div>
        <div className="font-mono">I = V/R = {formatNum(current, 3)} A</div>
        <div className="text-xs text-neutral-400">Animation speed ∝ current</div>
      </div>
      <p className="text-[11px] text-neutral-500">Conventional current is + → −; electrons move − → +. Toggle to compare.</p>
    </>
  );

  return (
    <ElectricityShell
      title="Flow of Charges in a Conductor"
      subtitle="Battery and switch. Current speed reflects I = V/R."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="block w-full h-full" style={{ width: "100%", height: "100%" }} />
      </div>
    </ElectricityShell>
  );
}
