"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ElectricityShell, SliderControl } from "./ElectricityShell";
import { useSimulationLifecycle } from "./useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

type ComponentType = "battery" | "bulb" | "switch" | "resistor";
type Placement = { id: string; type: ComponentType; x: number; y: number; value?: number };

const DEFAULT_BATTERY_V = 12;
const DEFAULT_RESISTANCE = 10;

export default function CircuitBuilderSimulation() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [series, setSeries] = useState(true);
  const [batteryV, setBatteryV] = useState(DEFAULT_BATTERY_V);
  const [switchClosed, setSwitchClosed] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { hasLaunched, isPaused, launch, pause, reset } = useSimulationLifecycle({
    onReset: () => setPlacements([]),
  });
  const [dragStart, setDragStart] = useState<{ id: string; x: number; y: number } | null>(null);

  const hasBattery = placements.some((p) => p.type === "battery");
  const hasSwitch = placements.some((p) => p.type === "switch");
  const R_total = useMemo(() => {
    const resistors = placements.filter((p) => p.type === "resistor");
    if (resistors.length === 0) return 0;
    const R = resistors.reduce((sum, p) => sum + (p.value ?? DEFAULT_RESISTANCE), 0);
    return series ? R : (resistors.length > 0 ? 1 / resistors.reduce((s, p) => s + 1 / (p.value ?? DEFAULT_RESISTANCE), 0) : 0);
  }, [placements, series]);
  const circuitClosed = !hasSwitch || switchClosed;
  const current = useMemo(() => {
    if (!hasBattery || R_total <= 0 || !circuitClosed) return 0;
    return batteryV / R_total;
  }, [hasBattery, batteryV, R_total, circuitClosed]);
  const bulbBrightness = useMemo(() => Math.min(1, current * 0.5), [current]);

  const addComponent = useCallback((type: ComponentType) => {
    const id = type + "-" + Date.now();
    const value = type === "resistor" ? DEFAULT_RESISTANCE : undefined;
    setPlacements((prev) => [...prev, { id, type, x: 0.5, y: 0.4 + prev.length * 0.08, value }]);
  }, []);

  const removeComponent = useCallback((id: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    setSelectedId((sid) => (sid === id ? null : sid));
  }, []);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const hit = placements.find((p) => {
        const dx = x - p.x;
        const dy = y - p.y;
        return dx * dx + dy * dy < 0.04;
      });
      if (hit) {
        setSelectedId(hit.id);
        setDragStart({ id: hit.id, x: hit.x - x, y: hit.y - y });
      } else {
        setSelectedId(null);
      }
    },
    [placements]
  );
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragStart) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0.1, Math.min(0.9, (e.clientX - rect.left) / rect.width + dragStart.x));
      const y = Math.max(0.1, Math.min(0.9, (e.clientY - rect.top) / rect.height + dragStart.y));
      setPlacements((prev) => prev.map((p) => (p.id === dragStart.id ? { ...p, x, y } : p)));
    },
    [dragStart]
  );
  const handleCanvasMouseUp = useCallback(() => setDragStart(null), []);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Build circuit</h3>
      <p className="text-xs text-neutral-400">Add components, then drag on canvas to arrange.</p>
      <div className="flex flex-wrap gap-2">
        {(["battery", "bulb", "switch", "resistor"] as ComponentType[]).map((type) => (
          <button key={type} type="button" onClick={() => addComponent(type)} className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 capitalize">
            + {type}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
        <input type="checkbox" checked={series} onChange={(e) => setSeries(e.target.checked)} className="rounded border-neutral-500 bg-neutral-800 text-cyan-500" />
        Series (else parallel)
      </label>
      {placements.some((p) => p.type === "battery") && (
        <SliderControl label="Battery V" value={batteryV} min={1} max={24} step={1} unit="V" onChange={setBatteryV} color="blue" />
      )}
      {placements.some((p) => p.type === "switch") && (
        <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
          <input type="checkbox" checked={switchClosed} onChange={(e) => setSwitchClosed(e.target.checked)} className="rounded border-neutral-500 bg-neutral-800 text-cyan-500" />
          Switch closed
        </label>
      )}
      {placements.filter((p) => p.type === "resistor").map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <SliderControl label={`R (${p.id.slice(-4)})`} value={p.value ?? DEFAULT_RESISTANCE} min={1} max={50} step={1} unit="Ω" onChange={(v) => setPlacements((prev) => prev.map((x) => (x.id === p.id ? { ...x, value: v } : x)))} color="orange" />
          <button type="button" onClick={() => removeComponent(p.id)} className="text-xs text-rose-400 hover:underline">Remove</button>
        </div>
      ))}
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Live</div>
        <div>R_total = {formatNum(R_total, 2)} Ω</div>
        <div className="text-cyan-300 font-mono">I = V/R = {formatNum(current, 3)} A</div>
        <div className="text-xs">V across each (series) or same V (parallel).</div>
      </div>
      <p className="text-[11px] text-neutral-500">Bulb brightness ∝ current. Add battery and close switch to see flow.</p>
    </>
  );

  return (
    <ElectricityShell
      title="Build-Your-Own Circuit Board"
      subtitle="Drag components. Series/parallel; live I and V."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
    >
      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#0a0f1a] rounded-xl"
        style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        {placements.length === 0 && (
          <p className="text-neutral-500 text-sm">Add a battery, bulb, switch, or resistor from the panel →</p>
        )}
        {placements.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-xl border-2 flex items-center justify-center text-xs font-mono text-white min-w-[56px] min-h-[40px] cursor-move"
            style={{
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              transform: "translate(-50%, -50%)",
              borderColor: selectedId === p.id ? "rgba(34,211,238,0.8)" : "rgba(100,116,139,0.5)",
              backgroundColor: p.type === "battery" ? "rgba(253,224,71,0.2)" : p.type === "bulb" ? `rgba(251,191,36,${0.2 + bulbBrightness * 0.5})` : p.type === "switch" ? "rgba(148,163,184,0.2)" : "rgba(249,115,22,0.2)",
              boxShadow: p.type === "bulb" ? `0 0 20px rgba(251,191,36,${bulbBrightness * 0.5})` : undefined,
            }}
          >
            {p.type === "battery" && <>V={batteryV}</>}
            {p.type === "bulb" && <>Bulb</>}
            {p.type === "switch" && <>({switchClosed ? "on" : "off"})</>}
            {p.type === "resistor" && <>R={p.value ?? DEFAULT_RESISTANCE}Ω</>}
          </div>
        ))}
        {current > 0 && circuitClosed && (
          <div className="absolute bottom-4 left-4 text-cyan-300 font-mono text-sm">
            I = {formatNum(current, 3)} A
          </div>
        )}
      </div>
    </ElectricityShell>
  );
}
