"use client";

import React, { useEffect, useRef, useState } from "react";
import { MatterShell, SliderControl } from "./MatterShell";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";

type Substance = "water" | "ethanol";

function formatNum(n: number, d = 1) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export default function ChangeOfStateSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [substance, setSubstance] = useState<Substance>("water");
  const [heatRate, setHeatRate] = useState(100); // arb units
  const [initialTemp, setInitialTemp] = useState(-10);
  const [mass, setMass] = useState(1);
  const dimsRef = useRef({ w: 600, h: 280, dpr: 1 });
  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle({
      onReset: () => {},
    });

  const t = isAnimating ? elapsedTime : 0;

  const meltPoint = substance === "water" ? 0 : -114;
  const boilPoint = substance === "water" ? 100 : 78;
  const cSolid = substance === "water" ? 2.1 : 2.0;
  const cLiquid = substance === "water" ? 4.2 : 4.0;
  const Lf = substance === "water" ? 334 : 109;
  const Lv = substance === "water" ? 2260 : 854;

  const totalHeat = heatRate * t;
  let temp = initialTemp;
  let phase: "solid" | "liquid" | "gas" = "solid";
  let heatLeft = totalHeat;

  if (temp < meltPoint) {
    const needed = (meltPoint - temp) * cSolid * mass;
    if (heatLeft < needed) {
      temp = temp + heatLeft / (cSolid * mass);
      phase = "solid";
      heatLeft = 0;
    } else {
      temp = meltPoint;
      heatLeft -= needed;
    }
  }
  if (heatLeft > 0 && temp === meltPoint) {
    const neededLf = Lf * mass;
    if (heatLeft < neededLf) {
      // still during melting; treat as effectively at melting point, mostly solid/liquid mix
      phase = "solid";
      heatLeft = 0;
    } else {
      heatLeft -= neededLf;
      phase = "liquid";
    }
  }
  if (heatLeft > 0 && temp < boilPoint) {
    const neededToBoil = (boilPoint - temp) * cLiquid * mass;
    if (heatLeft < neededToBoil) {
      temp = temp + heatLeft / (cLiquid * mass);
      phase = "liquid";
      heatLeft = 0;
    } else {
      temp = boilPoint;
      heatLeft -= neededToBoil;
    }
  }
  if (heatLeft > 0 && temp === boilPoint) {
    const neededLv = Lv * mass;
    if (heatLeft < neededLv) {
      // during boiling; treat as liquid for label purposes
      phase = "liquid";
      heatLeft = 0;
    } else {
      heatLeft -= neededLv;
      phase = "gas";
    }
  }
  if (heatLeft > 0 && phase === "gas") {
    temp = temp + heatLeft / (cLiquid * mass);
  }

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
    const marginX = 40 * dpr;
    const marginY = 36 * dpr;
    const graphW = w - 2 * marginX;
    const graphH = h - 2 * marginY;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050911";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginX, marginY + graphH);
    ctx.lineTo(marginX, marginY);
    ctx.lineTo(marginX + graphW, marginY + graphH);
    ctx.stroke();

    ctx.strokeStyle = "rgba(34,211,238,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const maxTime = 10;
    const maxTemp = boilPoint + 40;
    for (let i = 0; i <= 120; i++) {
      const timeNorm = (i / 120) * maxTime;
      const frac = timeNorm / (t || maxTime);
      const energy = heatRate * timeNorm;
      const fakeT = Math.min(temp, initialTemp + (temp - initialTemp) * (frac || 0));
      const x = marginX + (timeNorm / maxTime) * graphW;
      const y =
        marginY + graphH - ((fakeT - initialTemp + 20) / (maxTemp - initialTemp + 20)) * graphH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(248,250,252,0.9)";
    ctx.font = `${10 * dpr}px system-ui,sans-serif`;
    ctx.fillText(`Phase: ${phase}`, marginX, marginY - 8 * dpr);
    ctx.fillText(
      `T ≈ ${formatNum(temp, 1)} °C   Q = ${formatNum(totalHeat, 1)} units`,
      marginX,
      h - 10 * dpr,
    );
  }, [substance, heatRate, initialTemp, mass, t, temp, phase, totalHeat]);

  const sidebar = (
    <>
      <h3 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">Parameters</h3>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-300">Substance</label>
        <select
          value={substance}
          onChange={(e) => setSubstance(e.target.value as Substance)}
          aria-label="Toggle reflection insight"
          className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200"
        >
          <option value="water">Water</option>
          <option value="ethanol">Ethanol</option>
        </select>
      </div>
      <SliderControl
        label="Heat input rate"
        value={heatRate}
        min={50}
        max={200}
        step={10}
        unit="arb."
        onChange={setHeatRate}
        color="amber"
      />
      <SliderControl
        label="Initial temperature"
        value={initialTemp}
        min={-40}
        max={40}
        step={5}
        unit="°C"
        onChange={setInitialTemp}
        color="blue"
      />
      <SliderControl
        label="Mass"
        value={mass}
        min={0.5}
        max={2}
        step={0.1}
        unit="kg"
        onChange={setMass}
        color="violet"
      />
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 text-sm text-neutral-200">
        <div className="text-xs font-medium text-cyan-300 uppercase tracking-wider">
          Heating curve
        </div>
        <p className="mt-1 text-xs">
          Sloped regions: temperature rises in one state. Flat regions: latent heat, where state
          changes at nearly constant temperature.
        </p>
      </div>
    </>
  );

  return (
    <MatterShell
      title="Change of State"
      subtitle="Heating curve with particle-level intuition."
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

