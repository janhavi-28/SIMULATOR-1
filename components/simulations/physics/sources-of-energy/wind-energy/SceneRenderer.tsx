"use client";

import React, { useState } from "react";
import {
  WindTurbineIllustration,
  HouseIllustration,
  GridTowersIllustration,
  ChargeControllerIllustration,
  BatteryPackIllustration,
  PowerInverterIllustration,
  DistributionUnitIllustration,
} from "./illustrations";
import { EnergyShaft, FlowArrowHorizontal } from "./EnergyFlow";
import { WindStreaks } from "./WindStreaks";
import { ModuleInspectionCard } from "./ModuleInspectionCard";
import type { AnimationState } from "./PhysicsController";
import type { FlowStateSnapshot } from "./FlowStateEngine";

const PIPELINE_GAP = 64;

export type SceneRendererProps = {
  animation: AnimationState;
  flowState: FlowStateSnapshot;
  storageOn: boolean;
  explainMode: boolean;
  explainModeSlowsFlow?: boolean;
  windSpeed: number;
  rpm: number;
  torque: number;
  powerKW: number;
  efficiencyPercent: number;
  inspectedModuleId: string | null;
  onInspectModule: (id: string | null) => void;
  onTurbineClick?: () => void;
};

export function SceneRenderer({
  animation,
  flowState,
  storageOn,
  explainMode,
  explainModeSlowsFlow = true,
  windSpeed,
  rpm,
  torque,
  powerKW,
  efficiencyPercent,
  inspectedModuleId,
  onInspectModule,
  onTurbineClick,
}: SceneRendererProps) {
  const { flowLevel, showWarning } = flowState;
  const active = flowLevel > 0 && !showWarning;
  const [hoverId, setHoverId] = useState<string | null>(null);

  const flowSpeed = explainModeSlowsFlow && explainMode ? flowLevel * 0.5 : flowLevel;
  const arrowWidth = 64;
  const enlarged = explainMode;

  const formatNum = (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : "—");

  return (
    <div className="relative w-full h-full min-h-[320px] flex flex-col rounded-xl overflow-hidden bg-[#0f172a]">
      {/* Top info strip: Wind speed | RPM | Torque | Power | Efficiency — live values, semantic colors */}
      <div className="flex-none grid grid-cols-5 gap-2 px-4 py-2 border-b border-slate-700/60 bg-slate-800/50">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase text-slate-500 tracking-wider">Wind speed</span>
          <span className={`font-mono text-sm font-bold tabular-nums ${active ? "text-cyan-400" : "text-slate-400"}`}>{formatNum(windSpeed, 1)} m/s</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase text-slate-500 tracking-wider">RPM</span>
          <span className={`font-mono text-sm font-bold tabular-nums ${active ? "text-cyan-400" : "text-slate-400"}`}>{formatNum(rpm, 0)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase text-slate-500 tracking-wider">Torque</span>
          <span className={`font-mono text-sm font-bold tabular-nums ${active ? "text-orange-400" : "text-slate-400"}`}>{formatNum(torque, 1)} N⋅m</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase text-slate-500 tracking-wider">Power</span>
          <span className={`font-mono text-sm font-bold tabular-nums ${active ? "text-amber-400" : "text-slate-400"}`}>{formatNum(powerKW, 2)} kW</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase text-slate-500 tracking-wider">Efficiency</span>
          <span className={`font-mono text-sm font-bold tabular-nums ${active ? "text-emerald-400" : "text-slate-400"}`}>{formatNum(efficiencyPercent, 1)}%</span>
        </div>
      </div>

      {/* Main 3-column layout: LEFT turbine + wind + shaft | CENTER pipeline | RIGHT outputs (grid-cols-[1.2fr_1.8fr_1fr]) */}
      <div className="flex-1 min-h-[260px] grid gap-0" style={{ gridTemplateColumns: "1.2fr 1.8fr 1fr" }}>
        {/* ——— LEFT: Turbine + wind + energy shaft ——— */}
        <div className="relative flex flex-col items-center justify-end border-r border-slate-700/50 bg-slate-900/30">
          <WindStreaks windSpeed={windSpeed} active={active && windSpeed > 1} />
          <div
            className="relative flex flex-col items-center pt-2"
            onMouseEnter={() => setHoverId("turbine")}
            onMouseLeave={() => setHoverId(null)}
          >
            <button
              type="button"
              onClick={() => { onTurbineClick?.(); onInspectModule(inspectedModuleId === "turbine" ? null : "turbine"); }}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
            >
              <WindTurbineIllustration
                rotationDeg={animation.turbineRotationDeg}
                windActive={active}
                width={120}
                height={138}
              />
            </button>
            {(explainMode || hoverId === "turbine") && (
              <div className="mt-1 px-2 py-1 rounded bg-slate-800/95 border border-cyan-500/50 text-[10px] text-slate-300 text-center max-w-[140px]">
                Wind → mechanical energy
              </div>
            )}
          </div>
          <EnergyShaft active={active} flowLevel={flowLevel} windSpeed={windSpeed} height={80} className="mt-1 shrink-0" />
        </div>

        {/* ——— CENTER: Pipeline row ——— */}
        <div className="relative flex flex-col justify-end border-r border-slate-700/50 bg-slate-900/30">
          <div className="flex items-end justify-center gap-0 py-4 px-2" style={{ gap: PIPELINE_GAP }}>
            <FlowArrowHorizontal active={active} flowLevel={flowSpeed} colorFrom="wind" colorTo="mechanical" width={arrowWidth} enlarged={enlarged} />

            <div className="relative flex flex-col items-center">
              <button type="button" onClick={() => onInspectModule(inspectedModuleId === "controller" ? null : "controller")} onMouseEnter={() => setHoverId("controller")} onMouseLeave={() => setHoverId(null)} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded">
                <ChargeControllerIllustration active={active} meterValue={animation.controllerMeterValue} width={92} height={64} />
              </button>
              {(explainMode || hoverId === "controller") && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-[100] px-2 py-1 rounded bg-slate-800/95 border border-green-500/50 text-[10px] text-slate-300 text-center w-40 shadow-xl">
                  Charge controller
                </div>
              )}
            </div>

            <FlowArrowHorizontal active={active} flowLevel={flowSpeed} colorFrom="mechanical" colorTo="stored" width={arrowWidth} enlarged={enlarged} />

            <div className="relative flex flex-col items-center">
              <button type="button" onClick={() => onInspectModule(inspectedModuleId === "battery" ? null : "battery")} onMouseEnter={() => setHoverId("battery")} onMouseLeave={() => setHoverId(null)} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded">
                <BatteryPackIllustration active={active && storageOn} chargeLevel={animation.batteryChargeLevel} width={92} height={64} />
              </button>
              {(explainMode || hoverId === "battery") && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-[100] px-2 py-1 rounded bg-slate-800/95 border border-amber-500/50 text-[10px] text-slate-300 text-center w-40 shadow-xl">
                  Battery pack
                </div>
              )}
            </div>

            <FlowArrowHorizontal active={active} flowLevel={flowSpeed} colorFrom="stored" colorTo="electrical" width={arrowWidth} enlarged={enlarged} />

            <div className="relative flex flex-col items-center">
              <button type="button" onClick={() => onInspectModule(inspectedModuleId === "inverter" ? null : "inverter")} onMouseEnter={() => setHoverId("inverter")} onMouseLeave={() => setHoverId(null)} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded">
                <PowerInverterIllustration active={active} phase={animation.inverterPhase} width={92} height={64} />
              </button>
              {(explainMode || hoverId === "inverter") && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-[100] px-2 py-1 rounded bg-slate-800/95 border border-teal-500/50 text-[10px] text-slate-300 text-center w-40 shadow-xl">
                  Power inverter
                </div>
              )}
            </div>

            <FlowArrowHorizontal active={active} flowLevel={flowSpeed} colorFrom="electrical" colorTo="electrical" width={arrowWidth} enlarged={enlarged} />

            <div className="relative flex flex-col items-center">
              <button type="button" onClick={() => onInspectModule(inspectedModuleId === "distribution" ? null : "distribution")} onMouseEnter={() => setHoverId("distribution")} onMouseLeave={() => setHoverId(null)} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded">
                <DistributionUnitIllustration active={active} pulse={animation.distributionPulse} width={92} height={64} />
              </button>
              {(explainMode || hoverId === "distribution") && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-[100] px-2 py-1 rounded bg-slate-800/95 border border-cyan-500/50 text-[10px] text-slate-300 text-center w-44 shadow-xl">
                  Distribution
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ——— RIGHT: Home + Grid (output targets); wires drawn by full-scene overlay ——— */}
        <div className="relative flex flex-col items-center justify-end gap-6 pb-6 bg-slate-900/30">
          <div className="relative flex flex-col items-center gap-2">
            <button type="button" onClick={() => onInspectModule(inspectedModuleId === "grid" ? null : "grid")} onMouseEnter={() => setHoverId("grid")} onMouseLeave={() => setHoverId(null)} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg">
              <GridTowersIllustration hasPower={animation.outputActive && animation.powerToGridFrac > 0} width={80} height={80} />
            </button>
            <span className="text-[11px] font-medium text-slate-400">Grid</span>
            {animation.outputActive && <span className="text-[10px] text-amber-400/90">{formatNum(powerKW * animation.powerToGridFrac, 2)} kW</span>}
          </div>

          <div className="relative flex flex-col items-center gap-2">
            <button type="button" onClick={() => onInspectModule(inspectedModuleId === "house" ? null : "house")} onMouseEnter={() => setHoverId("house")} onMouseLeave={() => setHoverId(null)} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg">
              <HouseIllustration hasPower={animation.outputActive && animation.powerToHouseFrac > 0} width={80} height={80} />
            </button>
            <span className="text-[11px] font-medium text-slate-400">Home</span>
            {animation.outputActive && <span className="text-[10px] text-amber-400/90">{formatNum(powerKW * animation.powerToHouseFrac, 2)} kW</span>}
          </div>
        </div>
      </div>

      {/* Ground reference line across full canvas + subtle shadow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-600/90 z-[1]" aria-hidden />
      <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none z-0 opacity-80" style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.12))" }} />

      {/* Wires from distribution (center) to Home + Grid (right) — visible connection */}
      <svg className="absolute left-0 top-0 w-full h-full pointer-events-none z-[3]" aria-hidden preserveAspectRatio="none">
        <defs>
          <linearGradient id="wire-house-full" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#facc15" stopOpacity={animation.outputActive ? 0.9 * animation.powerToHouseFrac : 0.2} />
            <stop offset="100%" stopColor="#facc15" stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id="wire-grid-full" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#facc15" stopOpacity={animation.outputActive ? 0.9 * animation.powerToGridFrac : 0.2} />
            <stop offset="100%" stopColor="#facc15" stopOpacity={0.35} />
          </linearGradient>
        </defs>
        {/* Distribution (end of center column ~58%) → right column: house (bottom) and grid (top) */}
        <line x1="58%" y1="78%" x2="68%" y2="78%" stroke={animation.outputActive ? "url(#wire-house-full)" : "#334155"} strokeWidth={animation.outputActive ? 2.5 : 1} strokeDasharray={animation.outputActive ? "none" : "4 4"} opacity={animation.outputActive ? 0.95 : 0.35} />
        <line x1="58%" y1="78%" x2="68%" y2="22%" stroke={animation.outputActive ? "url(#wire-grid-full)" : "#334155"} strokeWidth={animation.outputActive ? 2.5 : 1} strokeDasharray={animation.outputActive ? "none" : "4 4"} opacity={animation.outputActive ? 0.95 : 0.35} />
        <line x1="68%" y1="78%" x2="92%" y2="78%" stroke={animation.outputActive ? "url(#wire-house-full)" : "#334155"} strokeWidth={animation.outputActive ? 2.5 : 1} opacity={animation.outputActive ? 0.95 : 0.35} />
        <line x1="68%" y1="22%" x2="92%" y2="22%" stroke={animation.outputActive ? "url(#wire-grid-full)" : "#334155"} strokeWidth={animation.outputActive ? 2.5 : 1} opacity={animation.outputActive ? 0.95 : 0.35} />
      </svg>

      {/* Inspection card (anchored to center or near clicked element) */}
      {inspectedModuleId && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[200]">
          <ModuleInspectionCard moduleId={inspectedModuleId} onClose={() => onInspectModule(null)} />
        </div>
      )}

      {showWarning && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-200 bg-amber-500/20 border border-amber-500/60 animate-pulse">
          High wind — brake
        </div>
      )}

      {/* Loss sparks when efficiency is low (semantic red) */}
      {animation.showLossParticles && (
        <div className="absolute inset-0 pointer-events-none z-[2]" aria-hidden>
          <div className="absolute left-[38%] top-[55%] w-2 h-2 rounded-full bg-red-500/80 animate-ping" style={{ animationDuration: "1.2s" }} />
          <div className="absolute left-[52%] top-[58%] w-1.5 h-1.5 rounded-full bg-red-400/70 animate-ping" style={{ animationDuration: "1.5s", animationDelay: "0.3s" }} />
          <div className="absolute left-[45%] top-[52%] w-1 h-1 rounded-full bg-red-500/90 animate-ping" style={{ animationDuration: "1s", animationDelay: "0.6s" }} />
        </div>
      )}
    </div>
  );
}
