"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ElectricityShell, SliderControl } from "./ElectricityShell";
import { useSimulationLifecycle } from "./useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function OhmsLawLabSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [voltage, setVoltage] = useState(12);
  const [resistance, setResistance] = useState(6);
  const [showTemp, setShowTemp] = useState(false);
  const [temp, setTemp] = useState(25);
  const [history, setHistory] = useState<{ v: number; i: number }[]>([]);
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });

  const { hasLaunched, isPaused, launch, pause, reset } = useSimulationLifecycle({
    onReset: () => {
      setVoltage(12);
      setResistance(6);
      setHistory([]);
    },
  });

  const current = useMemo(() => (resistance > 0 ? voltage / resistance : 0), [voltage, resistance]);
  useEffect(() => {
    if (!hasLaunched) return;
    setHistory((prev) => [...prev.slice(-20), { v: voltage, i: current }]);
  }, [voltage, resistance, hasLaunched, current]);

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
    const margin = 44 * dpr;
    const plotW = w - 2 * margin;
    const plotH = h - 2 * margin;
    const vMax = 24;
    const iMax = Math.max(4, current * 1.5, ...history.map((x) => x.i));

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, w, h);
    const gridStep = 24 * dpr;
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

    const toX = (v: number) => margin + (v / vMax) * plotW;
    const toY = (i: number) => margin + plotH * (1 - i / iMax);

    ctx.strokeStyle = "rgba(59,130,246,0.4)";
    ctx.lineWidth = 1 * dpr;
    for (let v = 0; v <= vMax; v += 4) {
      ctx.beginPath();
      ctx.moveTo(toX(v), margin);
      ctx.lineTo(toX(v), h - margin);
      ctx.stroke();
    }
    for (let i = 0; i <= iMax; i += 0.5) {
      ctx.beginPath();
      ctx.moveTo(margin, toY(i));
      ctx.lineTo(w - margin, toY(i));
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("V (V)", w / 2, h - 6 * dpr);
    ctx.save();
    ctx.translate(12 * dpr, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("I (A)", 0, 0);
    ctx.restore();

    const slope = resistance > 0 ? 1 / resistance : 0;
    ctx.strokeStyle = "rgba(251,191,36,0.9)";
    ctx.lineWidth = 2 * dpr;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(toX(vMax), toY(vMax * slope));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(34,211,238,0.95)";
    ctx.shadowColor = "rgba(34,211,238,0.7)";
    ctx.shadowBlur = 8 * dpr;
    ctx.beginPath();
    ctx.arc(toX(voltage), toY(current), 8 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = `${11 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(`V = ${voltage} V, I = ${formatNum(current, 3)} A`, margin, margin - 8 * dpr);
  }, [voltage, resistance, current, history]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Voltage V" value={voltage} min={0} max={24} step={0.5} unit="V" onChange={setVoltage} color="blue" />
      <SliderControl label="Resistance R" value={resistance} min={1} max={24} step={0.5} unit="Ω" onChange={setResistance} color="orange" />
      {showTemp && <SliderControl label="Temperature" value={temp} min={0} max={100} step={5} unit="°C" onChange={setTemp} color="rose" />}
      <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
        <input type="checkbox" checked={showTemp} onChange={(e) => setShowTemp(e.target.checked)} className="rounded border-neutral-500 bg-neutral-800 text-cyan-500" />
        Show temperature (R increases with T for metals)
      </label>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Ohm&apos;s law</div>
        <div className="font-mono">V = I R → I = V/R = {formatNum(voltage, 1)} / {formatNum(resistance, 1)} = {formatNum(current, 3)} A</div>
        <div className="text-xs text-neutral-400">Slope of V–I line = R (ohmic).</div>
      </div>
      <p className="text-[11px] text-neutral-500">Linear V–I: constant R. Dot shows current (V, I).</p>
    </>
  );

  return (
    <ElectricityShell
      title="Ohm's Law Interactive Lab"
      subtitle="Battery + resistor. Live V vs I graph; slope = R."
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
