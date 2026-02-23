"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ElectricityShell, SliderControl } from "./ElectricityShell";
import { useSimulationLifecycle } from "./useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

type Appliance = "fan" | "bulb" | "heater";

export default function EnergyConsumptionTracker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [voltage, setVoltage] = useState(230);
  const [current, setCurrent] = useState(2);
  const [appliance, setAppliance] = useState<Appliance>("bulb");
  const dimsRef = useRef({ w: 400, h: 300, dpr: 1 });

  const { elapsedTime, hasLaunched, isPaused, launch, pause, reset } = useSimulationLifecycle();
  const simTime = elapsedTime;

  const power = useMemo(() => voltage * current, [voltage, current]);
  const energyJ = useMemo(() => power * simTime, [power, simTime]);
  const energyKWh = useMemo(() => (power * simTime) / (1000 * 3600), [power, simTime]);

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

    const label = { fan: "Fan", bulb: "Bulb", heater: "Heater" }[appliance];
    ctx.fillStyle = "rgba(34,211,238,0.2)";
    ctx.strokeStyle = "rgba(34,211,238,0.5)";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy - 20 * dpr, 50 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e2e8f0";
    ctx.font = `${14 * dpr}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy - 18 * dpr);

    const meterY = cy + 50 * dpr;
    ctx.fillStyle = "rgba(15,23,42,0.9)";
    ctx.strokeStyle = "rgba(148,163,184,0.4)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(cx - 70 * dpr, meterY - 18 * dpr, 140 * dpr, 36 * dpr);
    ctx.fillRect(cx - 68 * dpr, meterY - 16 * dpr, 136 * dpr, 32 * dpr);
    ctx.fillStyle = "rgba(34,211,238,0.9)";
    ctx.font = `${12 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`E = ${formatNum(energyJ, 0)} J`, cx, meterY - 2 * dpr);
    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`${formatNum(energyKWh, 4)} kWh`, cx, meterY + 14 * dpr);
  }, [appliance, voltage, current, power, energyJ, energyKWh, simTime]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl label="Voltage V" value={voltage} min={1} max={240} step={5} unit="V" onChange={setVoltage} color="blue" />
      <SliderControl label="Current I" value={current} min={0.1} max={15} step={0.1} unit="A" onChange={setCurrent} color="cyan" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Appliance</label>
        <select value={appliance} onChange={(e) => setAppliance(e.target.value as Appliance)} aria-label="Appliance" className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200">
          <option value="fan">Fan</option>
          <option value="bulb">Bulb</option>
          <option value="heater">Heater</option>
        </select>
      </div>
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">E = V I t</div>
        <div className="font-mono">P = VI = {formatNum(power, 1)} W</div>
        <div className="text-xs">E = Pt = {formatNum(energyJ, 0)} J = {formatNum(energyKWh, 4)} kWh</div>
      </div>
      <p className="text-[11px] text-neutral-500">Energy meter ticks with time. Bill in kWh.</p>
    </>
  );

  return (
    <ElectricityShell
      title="Energy Consumption Tracker"
      subtitle="Appliance + live energy meter; E = VIt, kWh."
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
