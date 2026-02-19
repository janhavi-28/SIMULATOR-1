"use client";

import React, { useEffect, useRef, useState } from "react";
import { MatterShell, SliderControl } from "./MatterShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function DensitySimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mass, setMass] = useState(5);
  const [volume, setVolume] = useState(2);
  const [fluidDensity, setFluidDensity] = useState(1);
  const [gravity, setGravity] = useState(9.8);
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle();

  const t = isAnimating ? elapsedTime : 0;
  const density = mass / (volume || 1);
  const weight = mass * gravity;
  const displacedFluidMass = fluidDensity * volume;
  const buoyantForce = displacedFluidMass * gravity;
  const net = buoyantForce - weight;

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
    const fluidTop = h * 0.35;
    const fluidBottom = h * 0.85;
    const cx = w * 0.35;
    const boxW = 70 * dpr;
    const boxH = 70 * dpr;

    let boxY = fluidTop + (fluidBottom - fluidTop) / 2 - boxH / 2;
    const floatFactor = Math.max(-1, Math.min(1, net / (weight || 1)));
    boxY -= floatFactor * 40 * dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050911";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(59,130,246,0.7)";
    ctx.fillRect(cx - 120 * dpr, fluidTop, 240 * dpr, fluidBottom - fluidTop);

    ctx.fillStyle = "rgba(148,163,184,0.7)";
    ctx.fillRect(cx - boxW / 2, boxY, boxW, boxH);

    ctx.strokeStyle = "rgba(248,250,252,0.9)";
    ctx.beginPath();
    ctx.moveTo(cx, boxY + boxH);
    ctx.lineTo(cx, boxY + boxH + 30 * dpr);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, boxY);
    ctx.lineTo(cx, boxY - 30 * dpr);
    ctx.stroke();

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText("Weight (down)", cx + 10 * dpr, boxY + boxH + 20 * dpr);
    ctx.fillText("Upthrust (up)", cx + 10 * dpr, boxY - 18 * dpr);

    ctx.fillText(
      `ρ_obj = ${formatNum(density, 2)} g/cm³   ρ_fluid = ${formatNum(fluidDensity, 2)} g/cm³`,
      w * 0.55,
      h * 0.4,
    );
    ctx.fillText(`Buoyant force = ${formatNum(buoyantForce, 1)} N`, w * 0.55, h * 0.4 + 16 * dpr);
    ctx.fillText(`Weight = ${formatNum(weight, 1)} N`, w * 0.55, h * 0.4 + 32 * dpr);
    ctx.fillText(
      net > 0 ? "Net up → floats" : net < 0 ? "Net down → sinks" : "Balanced → neutrally buoyant",
      w * 0.55,
      h * 0.4 + 48 * dpr,
    );
  }, [mass, volume, fluidDensity, gravity, density, weight, buoyantForce, net, isAnimating, t]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <SliderControl
        label="Object mass"
        value={mass}
        min={1}
        max={20}
        step={1}
        unit="kg"
        onChange={setMass}
        color="cyan"
      />
      <SliderControl
        label="Object volume"
        value={volume}
        min={0.5}
        max={10}
        step={0.5}
        unit="L"
        onChange={setVolume}
        color="violet"
      />
      <SliderControl
        label="Fluid density"
        value={fluidDensity}
        min={0.5}
        max={2}
        step={0.1}
        unit="g/cm³"
        onChange={setFluidDensity}
        color="blue"
      />
      <SliderControl
        label="Gravity g"
        value={gravity}
        min={1}
        max={20}
        step={1}
        unit="m/s²"
        onChange={setGravity}
        color="amber"
      />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200 space-y-1">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">
          Live relations
        </div>
        <p className="text-xs font-mono">ρ = m / V</p>
        <p className="text-xs">
          Object floats if its average density is less than the fluid&apos;s density (or if shape
          causes enough displaced fluid for upthrust ≥ weight).
        </p>
      </div>
    </>
  );

  return (
    <MatterShell
      title="Density & Buoyancy"
      subtitle="Adjust densities to see floating and sinking."
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      paused={isPaused}
      hasLaunched={hasLaunched}
      sidebar={sidebar}
    >
      <div
        ref={containerRef}
        className="w-full h-full min-h-[280px] flex items-center justify-center p-2"
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full w-full h-full rounded-lg"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </MatterShell>
  );
}

