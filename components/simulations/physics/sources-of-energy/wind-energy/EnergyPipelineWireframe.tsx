"use client";

import React, { useState, useRef } from "react";
import type { PipelineData } from "./PhysicsBindings";

/** Strict color system: Wind cyan, Mechanical orange, Electrical yellow, Loss red */
const ENERGY_COLORS = {
  wind: "#06b6d4",
  mechanical: "#f97316",
  electrical: "#eab308",
  loss: "#ef4444",
} as const;

export type EnergyPipelineWireframeProps = {
  data: PipelineData & { isAnimating: boolean };
  flowSpeed: number;
  explainMode: boolean;
  isolatedStageId: string | null;
  onStageClick: (id: string | null) => void;
};

const BLOCK_WIDTH = 120;
const BLOCK_HEIGHT = 90;
const GAP = 28;
const CONNECTOR_THICKNESS = 4;

const HORIZONTAL_STAGES = [
  { id: "blades", name: "Blades", valueKey: "pCaptured" as const, color: "#10b981", energyType: "mechanical" as const },
  { id: "shaft", name: "Shaft", valueKey: "pMech" as const, color: ENERGY_COLORS.mechanical, energyType: "mechanical" as const },
  { id: "gearbox", name: "Gearbox", valueKey: "pGear" as const, color: "#84cc16", energyType: "mechanical" as const },
  { id: "generator", name: "Generator", valueKey: "pGenerator" as const, color: ENERGY_COLORS.electrical, energyType: "electrical" as const },
  { id: "output", name: "Output", valueKey: "pOutput" as const, color: "#f59e0b", energyType: "electrical" as const },
];

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

function PipelineBlock({
  title,
  subtitle,
  value,
  color,
  isActive,
  onClick,
  isIsolated,
  explainMode,
  tooltip,
}: {
  title: string;
  subtitle: string;
  value: number;
  color: string;
  isActive: boolean;
  onClick: () => void;
  isIsolated: boolean;
  explainMode: boolean;
  tooltip: string;
}) {
  const [hover, setHover] = useState(false);
  const showTooltip = explainMode && (hover || isIsolated);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative flex flex-col rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg active:scale-[0.98] overflow-hidden group"
      style={{
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        borderColor: isActive ? color : "rgba(100,116,139,0.5)",
        backgroundColor: "rgba(15,23,42,0.9)",
        boxShadow: isActive ? `0 0 24px ${color}40, 0 4px 12px rgba(0,0,0,0.3)` : "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      <div
        className="flex flex-col items-center justify-center flex-1 px-2 py-2 border-b border-slate-700/60"
        style={{ borderLeftWidth: CONNECTOR_THICKNESS, borderLeftColor: color }}
      >
        <span className="text-[13px] font-semibold text-slate-100 uppercase tracking-wide">{title}</span>
        <span className="text-[11px] text-slate-400 mt-0.5">{subtitle}</span>
      </div>
      <div className="px-2 py-1.5 flex justify-center">
        <span className="font-mono text-[14px] font-bold tabular-nums" style={{ color }}>
          {formatNum(value, 2)} kW
        </span>
      </div>
      {showTooltip && (
        <div
          className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-3 rounded-xl shadow-xl border-2 bg-slate-900 text-left pointer-events-none text-[12px]"
          style={{ borderColor: color }}
        >
          {tooltip}
        </div>
      )}
    </button>
  );
}

/** Vertical connector with arrow; 4px thick, animated when active */
function VerticalConnector({ active, color, speed }: { active: boolean; color: string; speed: number }) {
  const dur = Math.max(0.4, 1.2 - speed);
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div
        className="w-1 rounded-full transition-all"
        style={{
          height: 32,
          backgroundColor: active ? color : "rgba(100,116,139,0.3)",
          boxShadow: active ? `0 0 12px ${color}` : "none",
          animation: active ? `energy-flow-pulse ${dur}s linear infinite` : "none",
        }}
      />
      {active && (
        <span className="text-cyan-400 font-bold text-lg leading-none mt-0.5" style={{ animation: `energy-flow-pulse ${dur}s linear infinite` }}>
          ↓
        </span>
      )}
    </div>
  );
}

/** Horizontal connector: 4px line + arrowhead, animated */
function HorizontalConnector({ active, color, speed }: { active: boolean; color: string; speed: number }) {
  const dur = Math.max(0.4, 1.2 - speed);
  return (
    <div
      className="flex items-center flex-shrink-0 pipeline-h-conn"
      style={{ width: GAP, minWidth: GAP }}
    >
      <div
        className="h-1 flex-1 rounded-full transition-all"
        style={{
          backgroundColor: active ? color : "rgba(100,116,139,0.3)",
          boxShadow: active ? `0 0 12px ${color}` : "none",
          animation: active ? `energy-flow-pulse ${dur}s linear infinite` : "none",
          height: CONNECTOR_THICKNESS,
        }}
      />
      {active && (
        <span className="text-amber-400/90 font-bold text-sm ml-0.5" style={{ animation: `energy-flow-pulse ${dur}s linear infinite` }}>
          →
        </span>
      )}
    </div>
  );
}

export function EnergyPipelineWireframe({
  data,
  flowSpeed,
  explainMode,
  isolatedStageId,
  onStageClick,
}: EnergyPipelineWireframeProps) {
  const pMax = Math.max(1, data.pWind);
  const percent = (p: number) => (100 * p) / pMax;
  const windActive = data.isAnimating && data.pWind > 0;

  return (
    <>
      <style>
        {`
          @keyframes energy-flow-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}
      </style>
      <div className="flex flex-col items-center justify-center h-full min-h-0 p-4">
        {/* Row 1: Wind only */}
        <PipelineBlock
          title="Wind"
          subtitle="kinetic energy"
          value={data.pWind}
          color={ENERGY_COLORS.wind}
          isActive={windActive}
          onClick={() => onStageClick(isolatedStageId === "wind" ? null : "wind")}
          isIsolated={isolatedStageId === "wind"}
          explainMode={explainMode}
          tooltip="Moving air carries kinetic energy. Power ∝ v³. (Cyan = wind.)"
        />
        <div className="h-2" />
        <VerticalConnector active={windActive} color={ENERGY_COLORS.wind} speed={flowSpeed} />
        <div className="h-2" />
        {/* Row 2: Blades → Shaft → Gearbox → Generator → Output */}
        <div className="flex items-center flex-wrap justify-center gap-0">
          {HORIZONTAL_STAGES.map((stage, i) => {
            const value = data[stage.valueKey];
            const showFlow = data.isAnimating && value > 0;
            const subtitles: Record<string, string> = {
              blades: "captures wind",
              shaft: "rotation",
              gearbox: "RPM step-up",
              generator: "→ electrical",
              output: "electricity",
            };
            return (
              <React.Fragment key={stage.id}>
                {i > 0 && (
                  <HorizontalConnector
                    active={showFlow}
                    color={HORIZONTAL_STAGES[i - 1].color}
                    speed={flowSpeed}
                  />
                )}
                <PipelineBlock
                  title={stage.name}
                  subtitle={subtitles[stage.id] ?? ""}
                  value={value}
                  color={stage.color}
                  isActive={showFlow}
                  onClick={() => onStageClick(isolatedStageId === stage.id ? null : stage.id)}
                  isIsolated={isolatedStageId === stage.id}
                  explainMode={explainMode}
                  tooltip={`${stage.name}: ${stage.energyType === "mechanical" ? "Mechanical (orange)" : "Electrical (yellow)"}. Click to isolate.`}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}
