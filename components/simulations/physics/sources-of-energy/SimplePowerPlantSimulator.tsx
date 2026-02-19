"use client";

import React, { useState } from "react";
import { SimulatorContainer, SimulatorCanvas } from "./EnergySimulatorLayout";
import { Factory, Flame, RotateCw, Zap, ArrowRight } from "lucide-react";

type FuelType = "coal" | "oil" | "gas";

const FUEL_LABELS: Record<FuelType, string> = {
  coal: "Coal",
  oil: "Oil",
  gas: "Natural Gas",
};

const FUEL_FACTORS: Record<FuelType, { powerFactor: number; co2Factor: number }> = {
  coal: { powerFactor: 1.0, co2Factor: 1.0 },
  oil: { powerFactor: 0.95, co2Factor: 0.85 },
  gas: { powerFactor: 0.9, co2Factor: 0.6 },
};

export default function SimplePowerPlantSimulator() {
  const [fuelType, setFuelType] = useState<FuelType>("coal");
  const [fuelAmount, setFuelAmount] = useState(0.5);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isRunning = hasLaunched && !isPaused;
  const launch = () => { setHasLaunched(true); setIsPaused(false); };
  const pause = () => setIsPaused(true);
  const reset = () => { setHasLaunched(false); setIsPaused(false); setFuelAmount(0.5); };

  const { powerFactor, co2Factor } = FUEL_FACTORS[fuelType];
  const powerMW = Math.round(fuelAmount * 12 * powerFactor * 100) / 100;
  const co2TonsPerHour = Math.round(fuelAmount * 8 * co2Factor * 100) / 100;
  const homesEquivalent = Math.round((powerMW / 6) * 5000);

  const stages = [
    { icon: Factory, label: "Fuel", value: fuelAmount >= 0.1 ? "In" : "—" },
    { icon: Flame, label: "Burn", value: isRunning ? "Hot" : "—" },
    { icon: RotateCw, label: "Turbine", value: isRunning ? "Spin" : "—" },
    { icon: Zap, label: "Power", value: isRunning ? `${powerMW} MW` : "—" },
  ];

  const sidebar = (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-slate-400">Fuel type</p>
        <div className="flex gap-2">
          {(["coal", "oil", "gas"] as FuelType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFuelType(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                fuelType === t ? "bg-amber-500/20 text-amber-400 border border-amber-500/50" : "bg-slate-800/80 text-slate-400 border border-transparent hover:bg-slate-700"
              }`}
            >
              {FUEL_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-slate-400">Fuel amount</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={fuelAmount}
            onChange={(e) => setFuelAmount(Number(e.target.value))}
            className="flex-1 h-2 rounded-full appearance-none bg-slate-700 accent-amber-500"
          />
          <span className="w-10 text-right text-sm font-mono text-slate-300">{Math.round(fuelAmount * 100)}%</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={launch}
          disabled={hasLaunched}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
            hasLaunched ? "bg-slate-600 text-slate-400 cursor-not-allowed" : "bg-amber-500 text-slate-900 hover:bg-amber-400"
          }`}
        >
          {hasLaunched ? "Running" : "Start"}
        </button>
        <button
          type="button"
          onClick={pause}
          disabled={!hasLaunched}
          className="rounded-lg py-2.5 px-3 text-sm font-medium bg-slate-600 text-slate-200 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPaused ? "Play" : "Pause"}
        </button>
        <button type="button" onClick={reset} className="rounded-lg py-2.5 px-3 text-sm font-medium border border-slate-500 text-slate-300 hover:bg-slate-700">
          Reset
        </button>
      </div>
      <div className="rounded-lg border border-slate-700/80 bg-slate-800/40 p-3 space-y-1">
        <p className="text-xs text-slate-400">Power</p>
        <p className="text-xl font-bold text-amber-400">{powerMW.toFixed(2)} MW</p>
        <p className="text-xs text-slate-400">CO₂</p>
        <p className="text-sm text-slate-300">{co2TonsPerHour.toFixed(2)} tons/hour</p>
        {isRunning && powerMW > 0 && (
          <p className="text-xs text-slate-500 pt-1">≈ {homesEquivalent.toLocaleString()} homes (1 h)</p>
        )}
      </div>
    </div>
  );

  return (
    <SimulatorContainer
      title="Non-Renewable Power Plant"
      subtitle="Fuel → heat → turbine → electricity."
      hasLaunched={hasLaunched}
      paused={isPaused}
      onLaunch={launch}
      onPause={pause}
      onReset={reset}
      canvas={
        <SimulatorCanvas>
          <div className="flex flex-col flex-1 min-h-0 items-center justify-center p-4">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              {stages.map((stage, i) => {
                const Icon = stage.icon;
                return (
                  <React.Fragment key={stage.label}>
                    {i > 0 && (
                      <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 shrink-0" aria-hidden />
                    )}
                    <div
                      className={`flex flex-col items-center rounded-xl border-2 p-4 min-w-[100px] transition-colors ${
                        isRunning ? "border-amber-400/50 bg-amber-500/10" : "border-slate-600/50 bg-slate-800/30"
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-lg mb-2 ${
                          isRunning ? "bg-amber-400/20 text-amber-400" : "text-slate-500"
                        } ${isRunning && stage.label === "Turbine" ? "animate-spin" : ""}`}
                        style={stage.label === "Turbine" && isRunning ? { animationDuration: "2s" } : undefined}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-slate-200">{stage.label}</span>
                      <span className="text-xs font-mono text-slate-400 mt-0.5">{stage.value}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            <p className="mt-6 text-xs text-slate-500 text-center max-w-sm">
              Only about 40% of the fuel energy becomes electricity; the rest is lost as heat.
            </p>
          </div>
        </SimulatorCanvas>
      }
      sidebar={sidebar}
    />
  );
}
