"use client";

import React, { useCallback, useMemo, useState } from "react";
import { SimulatorCanvas } from "./EnergySimulatorLayout";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";
import {
  type FuelType,
  type OverlayToggles,
  SEMANTIC_COLORS,
  useSimulationEngine,
  useUIState,
  useGraphEngine,
  FUEL_CONFIG as PHYSICS_FUEL_CONFIG,
  getTooltip,
  evaluateChallenge,
  CHALLENGE_PROBLEMS,
  NonRenewableLabLayout,
  PhETSlider,
  GaugeMeter,
  GraphPanel,
} from "./non-renewable-lab";
import type { PhysicsModelOutput } from "./non-renewable-lab/PhysicsModel";

const FUEL_UI: Record<FuelType, { icon: string; color: string }> = {
  coal: { icon: "🪨", color: "#78716c" },
  oil: { icon: "🛢️", color: "#1c1917" },
  gas: { icon: "🔥", color: "#0ea5e9" },
};

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

// —— Pipeline with semantic colors and overlay toggles ——
function PowerPlantPipeline({
  fuelType,
  isRunning,
  reservePercent,
  physics,
  overlays,
  animationSpeed,
  selectedComponent,
  onSelectComponent,
  tooltipData,
}: {
  fuelType: FuelType;
  isRunning: boolean;
  reservePercent: number;
  physics: PhysicsModelOutput;
  overlays: OverlayToggles;
  animationSpeed: number;
  selectedComponent: string | null;
  onSelectComponent: (id: string | null) => void;
  tooltipData: { id: string; name: string; role: string; formula: string; analogy: string } | null;
}) {
  const flowIntensity = isRunning ? Math.min(1, physics.powerMW / 10) : 0;
  const co2Intensity = Math.min(1, physics.co2TonsPerHour / 10);
  const cfg = FUEL_UI[fuelType];
  const duration = `${1 / animationSpeed}s`;

  return (
    <div className="relative w-full h-full min-h-[280px] flex flex-col items-center justify-center py-2 px-4">
      <style>
        {`
          .phet-flow-dash { animation: phet-flow-dash 0.8s linear infinite; }
          .phet-flame { animation: phet-flame 0.6s ease-in-out infinite; }
          .phet-turbine-spin { animation: phet-spin 2s linear infinite; }
          .phet-co2-rise { animation: phet-co2-rise 2.5s ease-out infinite; }
          .phet-glow { animation: phet-glow 1.5s ease-in-out infinite; }
          .phet-energy-particle { animation: phet-particle 1.2s linear infinite; }
          .phet-heat-pulse { animation: phet-heat-pulse 1s ease-in-out infinite; }
          .phet-pipeline-active { box-shadow: 0 0 20px ${SEMANTIC_COLORS.energyFlow}40; }
          @keyframes phet-flow-dash { 0% { stroke-dashoffset: 24; } 100% { stroke-dashoffset: 0; } }
          @keyframes phet-flame { 0%, 100% { opacity: 0.9; transform: scaleY(1); } 50% { opacity: 1; transform: scaleY(1.15); } }
          @keyframes phet-spin { to { transform: rotate(360deg); } }
          @keyframes phet-co2-rise { 0% { opacity: 0; transform: translateY(0) scale(0.8); } 40% { opacity: 0.7; } 100% { opacity: 0; transform: translateY(-60px) scale(1.2); } }
          @keyframes phet-glow { 0%, 100% { filter: drop-shadow(0 0 6px ${SEMANTIC_COLORS.electricOutput}66); } 50% { filter: drop-shadow(0 0 14px ${SEMANTIC_COLORS.electricOutput}aa); } }
          @keyframes phet-particle { 0% { opacity: 0; transform: translateX(-8px); } 50% { opacity: 1; } 100% { opacity: 0; transform: translateX(8px); } }
          @keyframes phet-heat-pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.2); } }
          .phet-btn-ripple:active { transform: scale(0.98); }
        `}
      </style>

      <svg
        viewBox="0 0 420 240"
        className="w-full max-w-[600px] h-auto flex-shrink-0"
        style={{
          filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.35))",
          animationDuration: duration,
        }}
      >
        <defs>
          <linearGradient id="phet-energy" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={SEMANTIC_COLORS.energyFlow} stopOpacity="0.4" />
            <stop offset="100%" stopColor={SEMANTIC_COLORS.energyFlow} stopOpacity="1" />
          </linearGradient>
          <linearGradient id="phet-heat" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={SEMANTIC_COLORS.heatLoss} stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="phet-mechanical" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={SEMANTIC_COLORS.mechanicalMotion} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="phet-electric" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={SEMANTIC_COLORS.electricOutput} />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="phet-co2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={SEMANTIC_COLORS.co2} stopOpacity="0.9" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Fuel tank */}
        <g
          transform="translate(40, 100)"
          className="cursor-pointer"
          onClick={() => onSelectComponent("fuelTank")}
          style={{ outline: selectedComponent === "fuelTank" ? `2px solid ${SEMANTIC_COLORS.energyFlow}` : "none", outlineOffset: 2 }}
        >
          <rect x="0" y="0" width="56" height="80" rx="6" fill="#1e293b" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
          <rect x="4" y="4" width="48" height="72" rx="4" fill="#0f172a" />
          <rect x="6" y={6 + 66 * (1 - reservePercent / 100)} width="44" height={66 * (reservePercent / 100)} rx="3" fill={cfg.color} opacity="0.9" className="transition-all duration-500" />
          <text x="28" y="42" textAnchor="middle" style={{ fontSize: "20px" }}>{cfg.icon}</text>
          <text x="28" y="95" textAnchor="middle" fill="rgba(148,163,184,0.9)" style={{ fontSize: "11px" }}>Reserve</text>
          <text x="28" y="108" textAnchor="middle" fill="rgba(148,163,184,0.7)" style={{ fontSize: "10px" }}>{formatNum(reservePercent, 0)}%</text>
        </g>

        {/* Energy flow overlay: particles */}
        {overlays.showEnergyFlow && flowIntensity > 0 && (
          <g transform="translate(96, 138)">
            {[0, 1, 2].map((i) => (
              <circle key={i} r="3" fill={SEMANTIC_COLORS.energyFlow} opacity="0.9" className="phet-energy-particle" style={{ animationDelay: `${i * 0.3}s` }} />
            ))}
          </g>
        )}

        <line x1="96" y1="140" x2="140" y2="140" stroke={flowIntensity > 0 ? cfg.color : "rgba(100,116,139,0.4)"} strokeWidth="6" strokeLinecap="round" opacity={flowIntensity > 0 ? 0.8 : 0.3} />
        <line x1="96" y1="140" x2="140" y2="140" stroke="url(#phet-heat)" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 12" strokeDashoffset="24" opacity={flowIntensity} style={{ animation: flowIntensity > 0 ? "phet-flow-dash 0.8s linear infinite" : "none" }} />

        {/* Boiler */}
        <g transform="translate(148, 108)" onClick={() => onSelectComponent("boiler")} className="cursor-pointer" style={{ outline: selectedComponent === "boiler" ? `2px solid ${SEMANTIC_COLORS.heatLoss}` : "none", outlineOffset: 2 }}>
          <rect x="0" y="0" width="64" height="64" rx="8" fill="#1e293b" stroke={SEMANTIC_COLORS.heatLoss} strokeWidth="1.5" strokeOpacity="0.5" />
          <rect x="4" y="4" width="56" height="56" rx="6" fill="#0f172a" />
          {overlays.showHeatLoss && isRunning && <ellipse cx="32" cy="32" rx="24" ry="28" fill="url(#phet-heat)" opacity="0.2" className="phet-heat-pulse" />}
          <g transform="translate(32, 32)" opacity={isRunning ? 1 : 0.25}>
            <ellipse cx="0" cy="8" rx="12" ry="18" fill="url(#phet-heat)" className="origin-center" style={{ animation: isRunning ? "phet-flame 0.6s ease-in-out infinite" : "none" }} />
            <ellipse cx="0" cy="4" rx="8" ry="12" fill="#fbbf24" opacity="0.9" style={{ animation: isRunning ? "phet-flame 0.5s ease-in-out infinite 0.1s" : "none" }} />
          </g>
          <text x="32" y="88" textAnchor="middle" fill="rgba(148,163,184,0.7)" style={{ fontSize: "10px" }}>Boiler</text>
        </g>

        <line x1="212" y1="140" x2="258" y2="140" stroke="rgba(148,163,184,0.5)" strokeWidth="5" strokeLinecap="round" />
        <line x1="212" y1="140" x2="258" y2="140" stroke={SEMANTIC_COLORS.mechanicalMotion} strokeWidth="3" strokeLinecap="round" strokeDasharray="8 8" strokeDashoffset="16" opacity={flowIntensity} style={{ animation: flowIntensity > 0 ? "phet-flow-dash 0.6s linear infinite" : "none" }} />

        {/* Turbine */}
        <g transform="translate(266, 108)" onClick={() => onSelectComponent("turbine")} className="cursor-pointer" style={{ outline: selectedComponent === "turbine" ? `2px solid ${SEMANTIC_COLORS.mechanicalMotion}` : "none", outlineOffset: 2 }}>
          <rect x="0" y="0" width="56" height="64" rx="8" fill="#1e293b" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
          <circle cx="28" cy="32" r="18" fill="none" stroke={SEMANTIC_COLORS.mechanicalMotion} strokeWidth="3" strokeOpacity="0.5" />
          <g className={isRunning ? "phet-turbine-spin" : ""} style={{ transformOrigin: "28px 32px" }}>
            <line x1="28" y1="14" x2="28" y2="50" stroke={SEMANTIC_COLORS.mechanicalMotion} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="10" y1="32" x2="46" y2="32" stroke={SEMANTIC_COLORS.mechanicalMotion} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="16" x2="42" y2="48" stroke={SEMANTIC_COLORS.mechanicalMotion} strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="48" x2="42" y2="16" stroke={SEMANTIC_COLORS.mechanicalMotion} strokeWidth="2" strokeLinecap="round" />
          </g>
          <text x="28" y="88" textAnchor="middle" fill="rgba(148,163,184,0.7)" style={{ fontSize: "10px" }}>Turbine</text>
        </g>

        {/* Generator */}
        <g transform="translate(338, 108)" onClick={() => onSelectComponent("generator")} className="cursor-pointer" style={{ outline: selectedComponent === "generator" ? `2px solid ${SEMANTIC_COLORS.electricOutput}` : "none", outlineOffset: 2 }}>
          <rect x="0" y="0" width="56" height="64" rx="8" fill="#1e293b" stroke={isRunning && physics.powerMW > 0 ? SEMANTIC_COLORS.electricOutput : "rgba(148,163,184,0.3)"} strokeWidth="1.5" strokeOpacity="0.6" />
          <rect x="4" y="4" width="48" height="56" rx="6" fill="#0f172a" style={overlays.showEfficiency && physics.powerMW > 0 ? { filter: `brightness(${0.7 + physics.efficiencyPercent / 100})` } : undefined} />
          <circle cx="28" cy="32" r="16" fill="#0f172a" stroke="url(#phet-electric)" strokeWidth="2" opacity={isRunning && physics.powerMW > 0 ? 1 : 0.4} style={isRunning && physics.powerMW > 0 ? { animation: "phet-glow 1.5s ease-in-out infinite" } : undefined} />
          <path d="M28 18 v4 M28 34 v4 M18 28 h4 M34 28 h4" stroke={SEMANTIC_COLORS.electricOutput} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={isRunning && physics.powerMW > 0 ? 0.9 : 0.3} />
          <text x="28" y="88" textAnchor="middle" fill="rgba(148,163,184,0.7)" style={{ fontSize: "10px" }}>Generator</text>
        </g>

        <g transform="translate(395, 120)">
          <rect x="0" y="-12" width="22" height="44" rx="4" fill="#0f172a" stroke={SEMANTIC_COLORS.electricOutput} strokeWidth="1" strokeOpacity="0.5" />
          <rect x="2" y={32 - Math.min(36, (physics.powerMW / 12) * 36)} width="18" height={Math.min(36, Math.max(0, (physics.powerMW / 12) * 36))} rx="3" fill="url(#phet-electric)" opacity={isRunning && physics.powerMW > 0 ? 0.9 : 0.35} className="transition-all duration-300" />
          <text x="11" y="48" textAnchor="middle" fill="rgba(148,163,184,0.8)" style={{ fontSize: "9px" }}>MW</text>
        </g>

        {/* Smokestack + CO₂ */}
        <g transform="translate(180, 40)" onClick={() => onSelectComponent("smokestack")} className="cursor-pointer" style={{ outline: selectedComponent === "smokestack" ? `2px solid ${SEMANTIC_COLORS.co2}` : "none", outlineOffset: 2 }}>
          <rect x="8" y="0" width="24" height="70" rx="4" fill="#334155" stroke="rgba(100,116,139,0.4)" strokeWidth="1" />
          <rect x="12" y="4" width="16" height="62" rx="2" fill="#1e293b" />
          {overlays.showEmissions && isRunning && co2Intensity > 0 && [0, 1, 2].map((i) => (
            <ellipse key={i} cx="20" cy="75" rx={6 + 4 * co2Intensity} ry="8" fill="url(#phet-co2)" opacity={co2Intensity * 0.7} className="phet-co2-rise" style={{ animationDelay: `${i * 0.8}s` }} />
          ))}
          <text x="20" y="-6" textAnchor="middle" fill="rgba(248,113,113,0.9)" style={{ fontSize: "9px" }}>CO₂</text>
        </g>
      </svg>

      {/* Inline tooltip */}
      {tooltipData && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-sm rounded-xl border border-slate-600 bg-slate-900/95 px-4 py-3 shadow-xl z-10 text-left">
          <div className="font-semibold text-slate-200">{tooltipData.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{tooltipData.role}</div>
          <div className="text-[11px] font-mono text-amber-200/90 mt-1">{tooltipData.formula}</div>
          <div className="text-[11px] text-slate-500 mt-1 italic">{tooltipData.analogy}</div>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500 text-center max-w-md">
        Non-renewable fuel depletes as it runs. Efficiency ≈ base × (1 − overload²). Only ~40% of fuel energy becomes electricity.
      </p>
    </div>
  );
}

export default function NonRenewableSourcesSimulation() {
  const [fuelType, setFuelType] = useState<FuelType>("coal");
  const [fuelInputRate, setFuelInputRate] = useState(50);
  const [coolingLevel, setCoolingLevel] = useState(50);
  const [airIntake, setAirIntake] = useState(50);
  const [maintenanceLevel, setMaintenanceLevel] = useState(50);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeResult, setChallengeResult] = useState<ReturnType<typeof evaluateChallenge> | null>(null);

  const { hasLaunched, isPaused, isAnimating, launch, pause, reset } = useSimulationLifecycle({
    onReset: () => setChallengeResult(null),
  });
  const isRunning = hasLaunched && !isPaused;

  const { uiState, setOverlay, setLearningMode, setRunSpeed, setSoundEnabled, setGraphPanelOpen, toggleGraphPanel, setHighContrastMode, setLargeLabels, setSlowMotion, setShowOnlyMainProcesses } = useUIState();

  const { machineState, reservePercent, elapsedTimeSec, physics, reset: engineReset } = useSimulationEngine(
    {
      fuelType,
      fuelInputRate,
      coolingLevel,
      airIntake,
      maintenanceLevel,
      isRunning,
      isPaused,
      runSpeed: uiState.runSpeed,
    },
    { onReset: () => {} }
  );

  const { series, clearSeries } = useGraphEngine(isRunning, { powerMW: physics.powerMW, efficiencyPercent: physics.efficiencyPercent, co2TonsPerHour: physics.co2TonsPerHour, fuelInputRate }, elapsedTimeSec);

  const handleReset = useCallback(() => {
    reset();
    engineReset();
    clearSeries();
    setChallengeResult(null);
  }, [reset, engineReset, clearSeries]);

  const tooltipData = selectedComponent ? getTooltip(selectedComponent) : null;
  const homesEquivalent = physics.powerMW > 0 ? Math.round((physics.powerMW / 6) * 5000) : 0;
  const isOverheated = physics.isOverheated;
  const isFailure = machineState === "failure";

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-700/80 bg-slate-900/80 shrink-0">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-slate-100 tracking-tight">Non-Renewable Energy Lab</h2>
        <p className="text-xs text-slate-400 mt-0.5">PhET-style virtual power plant — fuel → heat → turbine → electricity</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Learning mode */}
        <div className="flex rounded-lg border border-slate-600/80 overflow-hidden bg-slate-800/50 p-0.5">
          {(["explore", "learn", "challenge"] as const).map((mode) => (
            <button key={mode} type="button" onClick={() => setLearningMode(mode)} className={`px-3 py-1.5 text-xs font-medium capitalize transition-all phet-btn-ripple ${uiState.learningMode === mode ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/50" : "text-slate-400 hover:text-slate-200"}`}>
              {mode}
            </button>
          ))}
        </div>
        <button type="button" onClick={launch} disabled={hasLaunched} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all phet-btn-ripple ${hasLaunched ? "bg-slate-600 text-slate-400 cursor-not-allowed" : "bg-emerald-500 text-slate-900 hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"}`}>
          ▶ Launch
        </button>
        <button type="button" onClick={pause} disabled={!hasLaunched} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all phet-btn-ripple ${!hasLaunched ? "bg-slate-700/40 text-slate-500 cursor-not-allowed" : isPaused ? "bg-cyan-500 text-slate-900 hover:bg-cyan-400" : "bg-slate-500 text-slate-200 hover:bg-slate-400"}`}>
          {isPaused ? "▶ Play" : "⏸ Pause"}
        </button>
        <button type="button" onClick={handleReset} className="rounded-xl border border-slate-500/60 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700/80 transition-all phet-btn-ripple">
          🔁 Reset
        </button>
      </div>
      {(isOverheated || isFailure) && (
        <div className="w-full flex items-center gap-2 rounded-lg bg-amber-500/20 border border-amber-500/50 px-3 py-2 text-amber-200 text-sm font-medium animate-pulse">
          <span>{isFailure ? "⚠ Out of fuel" : "⚠ System overheated — reduce input or increase cooling"}</span>
        </div>
      )}
    </header>
  );

  const controlPanel = (
    <div className="p-4 space-y-6 overflow-y-auto energy-params-scroll">
      {/* SYSTEM CONTROLS */}
      <section>
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">System controls</h3>
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-[11px] text-slate-400">Fuel type</p>
            <div className="grid grid-cols-3 gap-2">
              {(["coal", "oil", "gas"] as FuelType[]).map((t) => {
                const c = FUEL_UI[t];
                const selected = fuelType === t;
                return (
                  <button key={t} type="button" onClick={() => setFuelType(t)} title={PHYSICS_FUEL_CONFIG[t].label} className={`flex flex-col items-center rounded-xl border-2 py-2.5 px-2 transition-all phet-btn-ripple ${selected ? "border-amber-500/60 bg-amber-500/15 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.2)" : "border-slate-600/60 bg-slate-800/40 text-slate-400 hover:border-slate-500"}`}>
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-[10px] font-medium truncate w-full text-center">{PHYSICS_FUEL_CONFIG[t].label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <PhETSlider label="Fuel input rate" value={fuelInputRate} min={0} max={100} step={5} unit="%" onChange={setFuelInputRate} tooltip="Higher = more power but more CO₂ and overload risk" />
          <PhETSlider label="Cooling level" value={coolingLevel} min={0} max={100} step={5} unit="%" onChange={setCoolingLevel} tooltip="Reduces temperature and overload risk" />
          <PhETSlider label="Air intake" value={airIntake} min={0} max={100} step={5} unit="%" onChange={setAirIntake} tooltip="Affects combustion efficiency" />
          <PhETSlider label="Maintenance level" value={maintenanceLevel} min={0} max={100} step={5} unit="%" onChange={setMaintenanceLevel} tooltip="Higher maintenance improves efficiency" />
        </div>
      </section>

      {/* SIMULATION MODE */}
      <section>
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Simulation mode</h3>
        <div className="space-y-3">
          <PhETSlider label="Run speed" value={uiState.runSpeed} min={0.5} max={2} step={0.5} unit="×" onChange={setRunSpeed} tooltip="Time scale: 1 = real-time" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Auto stabilize</span>
            <button type="button" onClick={() => {}} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${uiState.autoStabilize ? "bg-cyan-500/30 text-cyan-200" : "bg-slate-700/60 text-slate-400"}`}>
              {uiState.autoStabilize ? "On" : "Off"}
            </button>
          </div>
        </div>
      </section>

      {/* VISUALIZATION */}
      <section>
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Visualization</h3>
        <div className="space-y-2">
          {(["showEnergyFlow", "showHeatLoss", "showEmissions", "showEfficiency"] as const).map((key) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300">
              <input type="checkbox" checked={uiState.overlayToggles[key]} onChange={(e) => setOverlay(key, e.target.checked)} className="rounded border-slate-500 accent-cyan-500" />
              {key.replace("show", "").replace(/([A-Z])/g, " $1").trim()}
            </label>
          ))}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">🔊 Sound</span>
            <button type="button" onClick={() => setSoundEnabled(!uiState.soundEnabled)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${uiState.soundEnabled ? "bg-cyan-500/30 text-cyan-200" : "bg-slate-700/60 text-slate-400"}`}>
              {uiState.soundEnabled ? "On" : "Off"}
            </button>
          </div>
        </div>
      </section>

      {/* Gauges */}
      <section>
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Live gauges</h3>
        <div className="grid grid-cols-2 gap-2">
          <GaugeMeter label="Temperature" value={physics.temperatureNormalized} unit="norm" displayValue={formatNum(physics.temperatureNormalized * 100, 0)} color={SEMANTIC_COLORS.heatLoss} isActive={isRunning} />
          <GaugeMeter label="Pressure" value={physics.pressureNormalized} unit="norm" displayValue={formatNum(physics.pressureNormalized * 100, 0)} color={SEMANTIC_COLORS.mechanicalMotion} isActive={isRunning} />
          <GaugeMeter label="Turbine RPM" value={physics.turbineRPMNormalized} unit="norm" displayValue={formatNum(physics.turbineRPMNormalized * 100, 0)} color={SEMANTIC_COLORS.mechanicalMotion} isActive={isRunning} />
          <GaugeMeter label="Voltage" value={physics.voltageNormalized} unit="norm" displayValue={formatNum(physics.voltageNormalized * 100, 0)} color={SEMANTIC_COLORS.electricOutput} isActive={isRunning && physics.powerMW > 0} />
        </div>
      </section>

      {/* Output summary */}
      <section className="rounded-xl border border-slate-700/80 bg-slate-800/40 p-4 space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Output</h3>
        <div className="flex justify-between text-sm"><span className="text-slate-400">Power</span><span className="font-mono text-emerald-400">{physics.powerMW.toFixed(2)} MW</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-400">CO₂</span><span className="font-mono text-slate-300">{physics.co2TonsPerHour.toFixed(2)} tons/h</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-400">Efficiency</span><span className="font-mono text-amber-300">{physics.efficiencyPercent.toFixed(1)}%</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-400">Reserve</span><span className="font-mono text-slate-200">{formatNum(reservePercent, 0)}%</span></div>
        {homesEquivalent > 0 && <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-700/60">≈ {homesEquivalent.toLocaleString()} homes (1 h)</p>}
      </section>

      {/* CHALLENGE MODE */}
      {uiState.learningMode === "challenge" && (
        <section>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Challenge</h3>
          <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-3 space-y-2">
            <p className="text-xs font-medium text-slate-200">{CHALLENGE_PROBLEMS[challengeIndex].title}</p>
            <p className="text-[11px] text-slate-400">{CHALLENGE_PROBLEMS[challengeIndex].description}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setChallengeIndex((i) => (i + 1) % CHALLENGE_PROBLEMS.length)} className="text-[10px] text-cyan-400 hover:underline">Next challenge</button>
              <button type="button" onClick={() => setChallengeResult(evaluateChallenge(CHALLENGE_PROBLEMS[challengeIndex], { powerMW: physics.powerMW, co2TonsPerHour: physics.co2TonsPerHour, efficiencyPercent: physics.efficiencyPercent, isOverheated: physics.isOverheated, elapsedTimeSec }))} className="text-[10px] text-amber-400 hover:underline">Evaluate</button>
            </div>
            {challengeResult && (
              <div className={`mt-2 rounded p-2 text-xs ${challengeResult.success ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"}`}>
                {challengeResult.message} Score: {challengeResult.scorePercent}%
              </div>
            )}
          </div>
        </section>
      )}

      {/* Accessibility */}
      <section>
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Accessibility</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300"><input type="checkbox" checked={uiState.highContrastMode} onChange={(e) => setHighContrastMode(e.target.checked)} className="rounded accent-cyan-500" /> High contrast</label>
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300"><input type="checkbox" checked={uiState.largeLabels} onChange={(e) => setLargeLabels(e.target.checked)} className="rounded accent-cyan-500" /> Large labels</label>
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300"><input type="checkbox" checked={uiState.slowMotion} onChange={(e) => setSlowMotion(e.target.checked)} className="rounded accent-cyan-500" /> Slow motion</label>
          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300"><input type="checkbox" checked={uiState.showOnlyMainProcesses} onChange={(e) => setShowOnlyMainProcesses(e.target.checked)} className="rounded accent-cyan-500" /> Show only main processes</label>
        </div>
      </section>

      <GraphPanel series={series} open={uiState.graphPanelOpen} onToggle={toggleGraphPanel} />
    </div>
  );

  const canvas = (
    <SimulatorCanvas fullBleed={false} compactPadding>
      <PowerPlantPipeline
        fuelType={fuelType}
        isRunning={isRunning}
        reservePercent={reservePercent}
        physics={physics}
        overlays={uiState.overlayToggles}
        animationSpeed={uiState.animationSpeed}
        selectedComponent={selectedComponent}
        onSelectComponent={setSelectedComponent}
        tooltipData={
          tooltipData
            ? { id: selectedComponent ?? "", name: tooltipData.name, role: tooltipData.role, formula: tooltipData.formula, analogy: tooltipData.analogy }
            : null
        }
      />
    </SimulatorCanvas>
  );

  const footer = (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
      <span>State: <strong className="text-slate-400">{machineState}</strong></span>
      <span>Time: <strong className="font-mono text-slate-400">{formatNum(elapsedTimeSec, 1)}s</strong></span>
    </div>
  );

  return (
    <div className="w-full px-0 mx-0 max-w-none nonrenew-lab-root">
      <style>{`
        .nonrenew-lab-root .energy-params-scroll { overflow-y: auto; }
        .nonrenew-lab-root .energy-params-scroll::-webkit-scrollbar { width: 7px; }
        .nonrenew-lab-root .energy-params-scroll::-webkit-scrollbar-track { background: rgba(15,23,42,0.95); border-radius: 9999px; }
        .nonrenew-lab-root .energy-params-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.45); border-radius: 9999px; }
        .nonrenew-lab-root .energy-params-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.6); }
      `}</style>
      <NonRenewableLabLayout header={header} canvas={canvas} controlPanel={controlPanel} footer={footer} />
    </div>
  );
}
