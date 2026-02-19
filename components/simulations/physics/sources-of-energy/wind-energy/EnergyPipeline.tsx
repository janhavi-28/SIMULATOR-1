"use client";

import React, { useState, useRef } from "react";
import type { PipelineData } from "./PhysicsBindings";

const ENERGY_COLORS = {
  windKinetic: "#06b6d4",   // cyan
  mechanical: "#f97316",   // orange
  electrical: "#eab308",   // yellow
  loss: "#ef4444",         // red
} as const;

export type EnergyPipelineProps = {
  data: PipelineData & { isAnimating: boolean };
  flowSpeed: number;       // 0..1 proportional to wind for pulse speed
  explainMode: boolean;
  isolatedStageId: string | null;
  onStageClick: (id: string | null) => void;
  largeLabels?: boolean;
  highContrast?: boolean;
  minimalMode?: boolean;
  /** When true, show connector from turbine (left edge) */
  showTurbineConnector?: boolean;
};

type StageDef = {
  id: string;
  name: string;
  subtitle: string;
  energyIn: string;
  energyOut: string;
  explanation: string;
  valueKey: keyof Pick<PipelineData, "pWind" | "pCaptured" | "pMech" | "pGear" | "pGenerator" | "pOutput">;
  color: string;
  animation: "blades" | "shaft" | "gearbox" | "generator" | "output" | "wind";
};

const STAGES: StageDef[] = [
  { id: "wind", name: "Wind", subtitle: "kinetic energy", energyIn: "—", energyOut: "Kinetic", explanation: "Moving air carries kinetic energy. Power ∝ v³.", valueKey: "pWind", color: ENERGY_COLORS.windKinetic, animation: "wind" },
  { id: "blades", name: "Blades", subtitle: "captures wind energy", energyIn: "Kinetic", energyOut: "Mechanical", explanation: "Blades capture up to 59.3% (Betz limit). Rest is lost.", valueKey: "pCaptured", color: "#10b981", animation: "blades" },
  { id: "shaft", name: "Shaft", subtitle: "rotation", energyIn: "Mechanical", energyOut: "Mechanical", explanation: "Spinning shaft carries torque to the gearbox.", valueKey: "pMech", color: ENERGY_COLORS.mechanical, animation: "shaft" },
  { id: "gearbox", name: "Gearbox", subtitle: "RPM step-up", energyIn: "Mechanical", energyOut: "Mechanical", explanation: "Increases rotation speed; small loss (~2%).", valueKey: "pGear", color: "#84cc16", animation: "gearbox" },
  { id: "generator", name: "Generator", subtitle: "mechanical → electrical", energyIn: "Mechanical", energyOut: "Electrical", explanation: "Electromagnetic induction produces AC electricity.", valueKey: "pGenerator", color: ENERGY_COLORS.electrical, animation: "generator" },
  { id: "output", name: "Electricity", subtitle: "output", energyIn: "Electrical", energyOut: "—", explanation: "Electrical power (kW) fed to the grid.", valueKey: "pOutput", color: "#f59e0b", animation: "output" },
];

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

/** Glowing flow line with direction arrow; speed proportional to wind for pulse animation. */
function FlowLine({ active, color, speed }: { active: boolean; color: string; speed: number }) {
  const pulseDuration = Math.max(0.4, 1.2 - speed);
  return (
    <div className="flex items-center flex-1 min-w-[12px] max-w-[28px] gap-0.5 overflow-visible">
      <div
        className="h-1 flex-1 min-w-[6px] rounded-full transition-all duration-300 pipeline-flow-line"
        style={{
          background: active
            ? `linear-gradient(90deg, transparent 0%, ${color} 30%, rgba(234,179,8,0.9) 50%, ${color} 70%, transparent 100%)`
            : "rgba(100,116,139,0.25)",
          boxShadow: active ? `0 0 12px ${color}, 0 0 6px rgba(234,179,8,0.5)` : "none",
          animation: active ? `energy-flow-pulse ${pulseDuration}s linear infinite` : "none",
        }}
      />
      {active && (
        <span
          className="text-[10px] text-amber-300/90 font-bold leading-none pipeline-flow-arrow"
          style={{ animation: `energy-flow-pulse ${pulseDuration}s linear infinite` }}
          aria-hidden
        >
          →
        </span>
      )}
    </div>
  );
}

function StageBlock({
  stage,
  value,
  percent,
  isAnimating,
  isActive,
  isIsolated,
  explainMode,
  largeLabels,
  highContrast,
  minimalMode,
  onClick,
}: {
  stage: StageDef;
  value: number;
  percent: number;
  isAnimating: boolean;
  isActive: boolean;
  isIsolated: boolean;
  explainMode: boolean;
  largeLabels?: boolean;
  highContrast?: boolean;
  minimalMode?: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const showTooltip = explainMode && (hover || isIsolated);
  const animClass = isActive && (isIsolated || !explainMode) ? `pipeline-stage-${stage.animation}` : "";

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTimeout(() => setRipple(null), 500);
    }
    onClick();
  };

  return (
    <div className="relative flex flex-col items-stretch flex-1 min-w-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`
          pipeline-stage-module relative rounded-lg border-2 text-left transition-all duration-200
          flex flex-col min-w-[72px] max-w-[100px] flex-1 overflow-hidden
          ${isActive ? "border-opacity-90" : "border-slate-600/60"}
          ${highContrast ? "bg-slate-900 border-slate-500" : "bg-slate-800/70 border-slate-700/80"}
          hover:shadow-xl hover:scale-[1.02] active:scale-[0.99]
          ${isActive ? "pipeline-pulse-when-active" : ""}
          ${isIsolated ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900" : ""}
        `}
        style={{
          borderColor: isActive ? stage.color : undefined,
          boxShadow: isActive ? `0 0 24px ${stage.color}50, 0 0 8px ${stage.color}30` : undefined,
        }}
      >
        {ripple && (
          <span
            className="absolute rounded-full bg-white/30 pipeline-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 4,
              height: 4,
              transform: "translate(-50%, -50%)",
            }}
            aria-hidden
          />
        )}
        <div
          className={`flex flex-col items-center justify-center py-2 px-1.5 border-b border-slate-700/60 ${animClass}`}
          style={{ borderLeftWidth: 4, borderLeftColor: stage.color, borderLeftStyle: "solid" }}
        >
          <span className={`font-bold text-slate-100 truncate w-full text-center ${largeLabels ? "text-sm" : "text-xs"}`}>
            {stage.name}
          </span>
          {!minimalMode && (
            <span className="text-[10px] text-slate-400 truncate w-full text-center mt-0.5">
              {stage.subtitle}
            </span>
          )}
        </div>
        <div className="p-1.5 flex flex-col gap-0.5">
          <div className="font-mono font-semibold tabular-nums text-center" style={{ color: stage.color, fontSize: largeLabels ? 14 : 11 }}>
            {formatNum(value, 2)} kW
          </div>
          {!minimalMode && (
            <div className="text-[10px] text-slate-500 text-center">{formatNum(percent, 1)}%</div>
          )}
        </div>
        {isAnimating && value > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700/60 overflow-hidden rounded-b-md">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${percent}%`, backgroundColor: stage.color }}
            />
          </div>
        )}
        {showTooltip && (
          <div
            className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 rounded-lg shadow-xl border border-slate-600 bg-slate-900 text-left pointer-events-none"
            style={{ borderColor: stage.color }}
          >
            <div className="font-semibold text-slate-100">{stage.name}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {stage.energyIn} → {stage.energyOut}
            </div>
            <p className="text-xs text-slate-300 mt-2">{stage.explanation}</p>
          </div>
        )}
      </button>
    </div>
  );
}

export function EnergyPipeline({
  data,
  flowSpeed,
  explainMode,
  isolatedStageId,
  onStageClick,
  largeLabels,
  highContrast,
  minimalMode,
  showTurbineConnector = true,
}: EnergyPipelineProps) {
  const pMax = Math.max(1, data.pWind);
  const percent = (p: number) => (100 * p) / pMax;
  const hasFlow = data.isAnimating && data.pOutput > 0;

  return (
    <>
      <style>
        {`
          @keyframes energy-flow-pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }
          .pipeline-flow-line { will-change: opacity; }
          .pipeline-flow-arrow { will-change: opacity; }
          .pipeline-stage-blades { animation: pipeline-blades 1.5s linear infinite; }
          .pipeline-stage-shaft { animation: pipeline-shaft 0.8s linear infinite; }
          .pipeline-stage-gearbox { animation: pipeline-gearbox 1s linear infinite; }
          .pipeline-stage-generator { animation: pipeline-generator 0.6s ease-in-out infinite; }
          .pipeline-stage-output { animation: pipeline-output 1.2s ease-in-out infinite; }
          .pipeline-stage-wind { animation: pipeline-wind 2s linear infinite; }
          @keyframes pipeline-blades { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(5deg); } }
          @keyframes pipeline-shaft { from { transform: scaleY(1); } 50% { transform: scaleY(1.02); } to { transform: scaleY(1); } }
          @keyframes pipeline-gearbox { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }
          @keyframes pipeline-generator { 0%, 100% { box-shadow: 0 0 8px rgba(234,179,8,0.4); } 50% { box-shadow: 0 0 20px rgba(234,179,8,0.8); } }
          @keyframes pipeline-output { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
          @keyframes pipeline-wind { 0%, 100% { opacity: 1; } 50% { opacity: 0.85; } }
          .pipeline-pulse-when-active { animation: pipeline-module-pulse 2s ease-in-out infinite; }
          @keyframes pipeline-module-pulse {
            0%, 100% { box-shadow: 0 0 24px var(--stage-glow, rgba(234,179,8,0.3)); }
            50% { box-shadow: 0 0 32px var(--stage-glow, rgba(234,179,8,0.5)); }
          }
          .pipeline-ripple {
            animation: pipeline-click-ripple 0.5s ease-out forwards;
            transform: translate(-50%, -50%) scale(0);
          }
          @keyframes pipeline-click-ripple {
            to { transform: translate(-50%, -50%) scale(25); opacity: 0; }
          }
        `}
      </style>
      <div className="flex flex-col h-full">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 flex-wrap">
          <span>Energy flow:</span>
          <span className="text-cyan-400">Wind</span>
          <span className="text-slate-500">→</span>
          <span className="text-emerald-400">Blades</span>
          <span className="text-slate-500">→</span>
          <span className="text-orange-400">Shaft</span>
          <span className="text-slate-500">→</span>
          <span className="text-lime-400">Gearbox</span>
          <span className="text-slate-500">→</span>
          <span className="text-amber-400">Generator</span>
          <span className="text-slate-500">→</span>
          <span className="text-yellow-500">Electricity</span>
        </div>
        <div className="flex items-stretch gap-0 flex-1 min-h-0">
          {showTurbineConnector && (
            <div
              className="flex items-center shrink-0 pr-1"
              title="Connected to turbine"
              aria-hidden
            >
              <div
                className="flex flex-col items-center justify-center rounded-l-md border border-r-0 border-slate-600/80 bg-slate-800/50 px-2 py-3 min-w-[48px]"
                style={{
                  boxShadow: hasFlow ? "inset 0 0 20px rgba(6,182,212,0.15), 0 0 12px rgba(234,179,8,0.2)" : undefined,
                  borderColor: hasFlow ? "rgba(6,182,212,0.5)" : undefined,
                }}
              >
                <span className="text-[9px] text-slate-400 uppercase font-medium">From</span>
                <span className="text-[9px] text-cyan-400 font-semibold">Turbine</span>
                {hasFlow && (
                  <span className="text-amber-400/90 text-xs mt-0.5" style={{ animation: "energy-flow-pulse 0.8s linear infinite" }}>
                    →
                  </span>
                )}
              </div>
              <FlowLine active={hasFlow} color={ENERGY_COLORS.windKinetic} speed={flowSpeed} />
            </div>
          )}
          {STAGES.map((stage, i) => {
            const value = data[stage.valueKey];
            const pct = percent(value);
            const showFlow = data.isAnimating && value > 0;
            return (
              <React.Fragment key={stage.id}>
                {i > 0 && (
                  <FlowLine active={showFlow} color={STAGES[i - 1].color} speed={flowSpeed} />
                )}
                <StageBlock
                  stage={stage}
                  value={value}
                  percent={pct}
                  isAnimating={data.isAnimating}
                  isActive={showFlow}
                  isIsolated={isolatedStageId === stage.id}
                  explainMode={explainMode}
                  largeLabels={largeLabels}
                  highContrast={highContrast}
                  minimalMode={minimalMode}
                  onClick={() => onStageClick(isolatedStageId === stage.id ? null : stage.id)}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}
