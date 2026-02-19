"use client";

import React, { useCallback, useMemo, useState } from "react";
import { SliderControl, LiveValue, LiveOutputCard } from "./SourcesOfEnergyShell";
import { SimulatorCanvas } from "./EnergySimulatorLayout";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";
import { RenewableEnergyAnimations } from "./RenewableEnergyAnimations";

const RENEWABLE_LAYOUT_STYLES = `
  .renewable-lab-grid {
    display: grid;
    grid-template-columns: 2.2fr 1fr;
    gap: 24px;
    align-items: start;
  }
  @media (max-width: 768px) {
    .renewable-lab-grid { grid-template-columns: 1fr; }
  }
  .renewable-simulator-container {
    background: linear-gradient(145deg, #0b1b2e, #081423);
    border-radius: 18px;
    padding: 24px;
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow: 0 8px 30px rgba(0,0,0,0.35);
    position: relative;
    min-height: 560px;
    display: flex;
    flex-direction: column;
  }
  .renewable-simulator-container::after {
    content: "";
    position: absolute;
    right: -12px;
    top: 10%;
    height: 80%;
    width: 1px;
    background: linear-gradient(to bottom, transparent, rgba(0,255,200,0.12), transparent);
    pointer-events: none;
  }
  @media (max-width: 768px) {
    .renewable-simulator-container::after { display: none; }
  }
  .renewable-parameters-container {
    background: linear-gradient(145deg, #1a2738, #142233);
    border-radius: 18px;
    padding: 22px;
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
    max-height: 600px;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .renewable-parameters-container::-webkit-scrollbar { width: 6px; }
  .renewable-parameters-container::-webkit-scrollbar-track { background: rgba(15,23,42,0.9); border-radius: 9999px; }
  .renewable-parameters-container::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.4); border-radius: 9999px; }
  .renewable-parameters-container::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.55); }
  .renewable-sim-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .renewable-sim-canvas-wrap {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
`;

const G = 9.81; // m/s²
const RHO_WATER = 1000; // kg/m³

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

/** Single energy conversion module: input → η → electrical output (lab-style) */
function ConversionModule({
  title,
  inputLabel,
  inputValueW,
  efficiency,
  outputPowerkW,
  accentColor,
}: {
  title: string;
  inputLabel: string;
  inputValueW: number;
  efficiency: number;
  outputPowerkW: number;
  accentColor: string;
}) {
  const inputkW = inputValueW / 1000;
  return (
    <div
      className="flex flex-col rounded-lg border border-slate-700/80 bg-slate-800/40 p-4 min-w-0"
      style={{ borderTopColor: `${accentColor}40` }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
        {title}
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-slate-500">{inputLabel}</span>
          <span className="font-mono tabular-nums text-slate-300">
            {formatNum(inputkW, 2)} kW
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-slate-500">η (efficiency)</span>
          <span className="font-mono tabular-nums text-slate-300">
            {(efficiency * 100).toFixed(1)}%
          </span>
        </div>
        <div className="pt-2 mt-2 border-t border-slate-700/60 flex justify-between items-baseline gap-2">
          <span className="text-slate-400 font-medium">P<sub>elec</sub></span>
          <span
            className="font-mono tabular-nums font-medium"
            style={{ color: accentColor }}
          >
            {formatNum(outputPowerkW, 2)} kW
          </span>
        </div>
      </div>
    </div>
  );
}

/** Lab view: three conversion modules + total output. No decorative flow. */
function EnergyConversionLab({
  solarInputW,
  solarEta,
  solarPowerkW,
  windInputW,
  windEta,
  windPowerkW,
  hydroInputW,
  hydroEta,
  hydroPowerkW,
  totalPowerkW,
  energyKWh,
  isAnimating,
}: {
  solarInputW: number;
  solarEta: number;
  solarPowerkW: number;
  windInputW: number;
  windEta: number;
  windPowerkW: number;
  hydroInputW: number;
  hydroEta: number;
  hydroPowerkW: number;
  totalPowerkW: number;
  energyKWh: number;
  isAnimating: boolean;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <ConversionModule
          title="Solar (PV)"
          inputLabel="P_in = I × A"
          inputValueW={solarInputW}
          efficiency={solarEta}
          outputPowerkW={solarPowerkW}
          accentColor="#f59e0b"
        />
        <ConversionModule
          title="Wind (turbine)"
          inputLabel="P_kin = ½ρAv³"
          inputValueW={windInputW}
          efficiency={windEta}
          outputPowerkW={windPowerkW}
          accentColor="#06b6d4"
        />
        <ConversionModule
          title="Hydro (turbine)"
          inputLabel="P_grav = ρgQH"
          inputValueW={hydroInputW}
          efficiency={hydroEta}
          outputPowerkW={hydroPowerkW}
          accentColor="#14b8a6"
        />
      </div>

      <div className="mt-auto pt-4 border-t border-slate-700/70">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">
              Total electrical power
            </span>
            <span
              className={`font-mono text-lg tabular-nums font-semibold ${isAnimating ? "text-emerald-400" : "text-slate-200"}`}
            >
              <LiveValue value={totalPowerkW} decimals={2} /> kW
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">
              Energy (since launch)
            </span>
            <span className="font-mono text-lg tabular-nums text-slate-300">
              <LiveValue value={energyKWh} decimals={2} suffix=" kWh" />
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          P_total = P_solar + P_wind + P_hydro; E = ∫ P_total dt
        </p>
      </div>
    </div>
  );
}

const INITIAL = {
  irradiance: 600,
  solarArea: 15,
  solarEta: 0.18,
  windSpeed: 10,
  rotorRadius: 25,
  airDensity: 1.225,
  windEta: 0.35,
  flowRate: 5,
  head: 20,
  hydroEta: 0.85,
};

export default function RenewableSourcesSimulation() {
  const [irradiance, setIrradiance] = useState(INITIAL.irradiance);
  const [solarArea, setSolarArea] = useState(INITIAL.solarArea);
  const [solarEta, setSolarEta] = useState(INITIAL.solarEta);
  const [windSpeed, setWindSpeed] = useState(INITIAL.windSpeed);
  const [rotorRadius, setRotorRadius] = useState(INITIAL.rotorRadius);
  const [airDensity, setAirDensity] = useState(INITIAL.airDensity);
  const [windEta, setWindEta] = useState(INITIAL.windEta);
  const [flowRate, setFlowRate] = useState(INITIAL.flowRate);
  const [head, setHead] = useState(INITIAL.head);
  const [hydroEta, setHydroEta] = useState(INITIAL.hydroEta);

  const resetParams = useCallback(() => {
    setIrradiance(INITIAL.irradiance);
    setSolarArea(INITIAL.solarArea);
    setSolarEta(INITIAL.solarEta);
    setWindSpeed(INITIAL.windSpeed);
    setRotorRadius(INITIAL.rotorRadius);
    setAirDensity(INITIAL.airDensity);
    setWindEta(INITIAL.windEta);
    setFlowRate(INITIAL.flowRate);
    setHead(INITIAL.head);
    setHydroEta(INITIAL.hydroEta);
  }, []);

  const { hasLaunched, isPaused, launch, pause, reset, isAnimating, elapsedTime } =
    useSimulationLifecycle({ onReset: resetParams });

  const solarInputW = irradiance * solarArea;
  const solarPowerW = solarEta * solarInputW;
  const solarPowerkW = solarPowerW / 1000;

  const windArea = useMemo(() => Math.PI * rotorRadius * rotorRadius, [rotorRadius]);
  const windInputW = useMemo(
    () => 0.5 * airDensity * windArea * windSpeed * windSpeed * windSpeed,
    [airDensity, windArea, windSpeed]
  );
  const windPowerW = windEta * windInputW;
  const windPowerkW = windPowerW / 1000;

  const hydroInputW = useMemo(
    () => RHO_WATER * G * flowRate * head,
    [flowRate, head]
  );
  const hydroPowerW = hydroEta * hydroInputW;
  const hydroPowerkW = hydroPowerW / 1000;

  const totalPowerkW = solarPowerkW + windPowerkW + hydroPowerkW;
  const energyKWh = totalPowerkW * (elapsedTime / 3600);

  const parametersPanel = (
    <>
      <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-3">
        PARAMETERS
      </h3>
      <div className="h-px bg-slate-600/60 mb-4" aria-hidden />
      <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Solar (P = η × I × A)
          </span>
          <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded bg-amber-500/10 text-amber-400/90">
            {formatNum(solarPowerkW, 2)} kW
          </span>
        </div>
        <SliderControl
          label="Irradiance I"
          value={irradiance}
          min={200}
          max={1000}
          step={50}
          unit="W/m²"
          onChange={setIrradiance}
          color="amber"
          isActive={isAnimating}
        />
        <SliderControl
          label="Panel area A"
          value={solarArea}
          min={2}
          max={40}
          step={1}
          unit="m²"
          onChange={setSolarArea}
          color="amber"
          isActive={isAnimating}
        />
        <SliderControl
          label="Efficiency η"
          value={solarEta}
          min={0.08}
          max={0.24}
          step={0.01}
          unit=""
          onChange={setSolarEta}
          color="emerald"
          isActive={isAnimating}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Wind (P = η × ½ρπR²v³)
          </span>
          <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400/90">
            {formatNum(windPowerkW, 2)} kW
          </span>
        </div>
        <SliderControl
          label="Wind speed v"
          value={windSpeed}
          min={3}
          max={18}
          step={1}
          unit="m/s"
          onChange={setWindSpeed}
          color="cyan"
          isActive={isAnimating}
        />
        <SliderControl
          label="Rotor radius R"
          value={rotorRadius}
          min={8}
          max={50}
          step={2}
          unit="m"
          onChange={setRotorRadius}
          color="cyan"
          isActive={isAnimating}
        />
        <SliderControl
          label="Air density ρ"
          value={airDensity}
          min={1.1}
          max={1.35}
          step={0.05}
          unit="kg/m³"
          onChange={setAirDensity}
          color="blue"
          isActive={isAnimating}
        />
        <SliderControl
          label="Efficiency η"
          value={windEta}
          min={0.2}
          max={0.48}
          step={0.02}
          unit=""
          onChange={setWindEta}
          color="emerald"
          isActive={isAnimating}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Hydro (P = η × ρgQH)
          </span>
          <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded bg-teal-500/10 text-teal-400/90">
            {formatNum(hydroPowerkW, 2)} kW
          </span>
        </div>
        <SliderControl
          label="Flow rate Q"
          value={flowRate}
          min={0.5}
          max={20}
          step={0.5}
          unit="m³/s"
          onChange={setFlowRate}
          color="cyan"
          isActive={isAnimating}
        />
        <SliderControl
          label="Head H"
          value={head}
          min={5}
          max={80}
          step={5}
          unit="m"
          onChange={setHead}
          color="cyan"
          isActive={isAnimating}
        />
        <SliderControl
          label="Efficiency η"
          value={hydroEta}
          min={0.7}
          max={0.95}
          step={0.02}
          unit=""
          onChange={setHydroEta}
          color="emerald"
          isActive={isAnimating}
        />
      </div>

      <LiveOutputCard title="Live output" isActive={isAnimating}>
        <div className="space-y-2 text-sm">
          <p className="flex justify-between gap-2">
            <span className="text-slate-400">P_total</span>
            <span className="font-mono text-slate-200">
              <LiveValue value={totalPowerkW} decimals={2} suffix=" kW" />
            </span>
          </p>
          <p className="flex justify-between gap-2">
            <span className="text-slate-400">E (since launch)</span>
            <span className="font-mono text-slate-200">
              <LiveValue value={energyKWh} decimals={2} suffix=" kWh" />
            </span>
          </p>
          <p className="text-[11px] text-slate-500 pt-1">
            Renewable conversion: solar (radiation → electricity), wind (kinetic → electricity), hydro (gravitational → electricity).
          </p>
        </div>
      </LiveOutputCard>
      </div>
    </>
  );

  return (
    <>
      <style>{RENEWABLE_LAYOUT_STYLES}</style>
      <div className="renewable-lab-grid w-full">
        <div className="renewable-simulator-container">
          <header className="renewable-sim-header">
            <div className="min-w-0 space-y-0.5">
              <h2 className="text-base md:text-lg font-semibold text-slate-100 tracking-tight truncate">
                Renewable Sources of Energy
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Energy transformation and efficiency: solar, wind, hydro → electrical power.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={launch}
                disabled={hasLaunched}
                className={`rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
                  hasLaunched
                    ? "bg-emerald-500/10 text-emerald-800/50 cursor-not-allowed"
                    : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                }`}
                aria-label="Launch simulation"
              >
                Launch
              </button>
              <button
                type="button"
                onClick={pause}
                disabled={!hasLaunched}
                className={`rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
                  !hasLaunched
                    ? "bg-slate-700/40 text-slate-500 cursor-not-allowed"
                    : isPaused
                    ? "bg-slate-600 text-slate-100 hover:bg-slate-500"
                    : "bg-slate-500 text-slate-100 hover:bg-slate-400"
                }`}
                aria-label={isPaused ? "Play" : "Pause"}
              >
                {isPaused ? "Play" : "Pause"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl px-4 py-2.5 text-xs md:text-sm font-medium border border-slate-600/80 text-slate-200 bg-transparent hover:bg-slate-900/40 transition-all duration-200 active:scale-[0.97]"
                aria-label="Reset simulation"
              >
                Reset
              </button>
            </div>
          </header>
          <div className="renewable-sim-canvas-wrap">
            <SimulatorCanvas>
              <div className="flex flex-col flex-1 min-h-0">
                <RenewableEnergyAnimations
                  isAnimating={isAnimating}
                  elapsedTime={elapsedTime}
                  irradiance={irradiance}
                  solarEta={solarEta}
                  solarPowerkW={solarPowerkW}
                  windSpeed={windSpeed}
                  windPowerkW={windPowerkW}
                  flowRate={flowRate}
                  hydroPowerkW={hydroPowerkW}
                />
                <EnergyConversionLab
                  solarInputW={solarInputW}
                  solarEta={solarEta}
                  solarPowerkW={solarPowerkW}
                  windInputW={windInputW}
                  windEta={windEta}
                  windPowerkW={windPowerkW}
                  hydroInputW={hydroInputW}
                  hydroEta={hydroEta}
                  hydroPowerkW={hydroPowerkW}
                  totalPowerkW={totalPowerkW}
                  energyKWh={energyKWh}
                  isAnimating={isAnimating}
                />
              </div>
            </SimulatorCanvas>
          </div>
        </div>

        <aside className="renewable-parameters-container">
          {parametersPanel}
        </aside>
      </div>
    </>
  );
}
