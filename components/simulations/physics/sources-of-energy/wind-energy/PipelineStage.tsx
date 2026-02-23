"use client";

import React, { useMemo, useRef } from "react";
import { tickPipeline } from "./pipelineLogic";

const COLORS = {
  cyan: "#22d3ee",
  orange: "#fb923c",
  yellow: "#facc15",
  green: "#4ade80",
  red: "#ef4444",
  muted: "#1e293b",
};

const INACTIVE_PATHS = {
  hc: { active: false as const, color: COLORS.muted },
  cc: { active: false as const, color: COLORS.muted },
  cs: { active: false as const, color: COLORS.muted },
  cg: { active: false as const, color: COLORS.muted },
  su: { active: false as const, color: COLORS.muted },
  cu: { active: false as const, color: COLORS.muted },
};

export type FlowPathState = {
  active: boolean;
  color: string;
  reverse?: boolean;
};

export type PipelineStageProps = {
  active: boolean;
  wind: number;
  load: number;
  battery: number;
  gen: number;
  gridEx: number;
  spinSpeedSec: number;
  paths: {
    hc: FlowPathState;
    cc: FlowPathState;
    cs: FlowPathState;
    cg: FlowPathState;
    su: FlowPathState;
    cu: FlowPathState;
  };
};

/** Path geometry in percentage coordinates (viewBox 0 0 100 100). Node positions match style top/left %. */
const PATH_D_COORDS: Record<string, string> = {
  hc: "M 15 30 C 27.5 30, 27.5 30, 40 30",
  cc: "M 40 30 C 52.5 30, 52.5 30, 65 30",
  cs: "M 65 30 C 52.5 50, 52.5 50, 40 70",
  cg: "M 65 30 C 77.5 30, 77.5 30, 90 30",
  su: "M 40 70 C 57.5 70, 57.5 70, 75 70",
  cu: "M 65 30 C 70 50, 70 50, 75 70",
};

export function PipelineStage({
  active,
  wind,
  load,
  battery,
  gen,
  gridEx,
  spinSpeedSec,
  paths,
}: PipelineStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pathKeys: (keyof typeof paths)[] = ["hc", "cc", "cs", "cg", "su", "cu"];

  const displayPaths = useMemo(() => {
    if (!active || gen <= 0) return INACTIVE_PATHS;
    const { paths: computed } = tickPipeline(gen, load, battery);
    return computed;
  }, [active, gen, load, battery]);

  /** Glow color per node when that step has active flow (matches reference image). */
  const nodeGlow = useMemo(() => {
    const g: Record<string, string | undefined> = {};
    if (!active || gen <= 0) return g;
    if (displayPaths.hc?.active) g["node-harvest"] = COLORS.cyan;
    if (displayPaths.hc?.active || displayPaths.cc?.active) g["node-convert"] = COLORS.orange;
    if (displayPaths.cc?.active || displayPaths.cs?.active || displayPaths.cg?.active || displayPaths.cu?.active)
      g["node-control"] = COLORS.yellow;
    if (displayPaths.cs?.active || displayPaths.su?.active) g["node-storage"] = COLORS.green;
    if (displayPaths.cu?.active || displayPaths.su?.active) g["node-usage"] = COLORS.yellow;
    if (displayPaths.cg?.active) g["node-grid"] = displayPaths.cg.color ?? COLORS.yellow;
    return g;
  }, [active, gen, displayPaths]);

  const glowStyle = (color: string) => ({
    boxShadow: `0 0 14px ${color}80, 0 0 6px ${color}, inset 0 0 0 1px ${color}40`,
    borderColor: color,
  });

  return (
    <div
      className="w-full h-full min-h-[360px] flex items-center justify-center relative flex-1"
      style={{
        background: "radial-gradient(circle at 30% 30%, #020b1f 0%, #020617 100%)",
        borderRight: "2px solid #1e293b",
      }}
    >
      <div
        ref={stageRef}
        className="relative rounded-2xl overflow-hidden border-2 border-slate-600 bg-slate-900/95"
        style={{
          width: "90%",
          maxWidth: "100%",
          height: "85%",
          minWidth: 320,
          minHeight: 300,
          backgroundImage: "radial-gradient(#334155 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 1 }}>
          <defs>
            <filter id="flow-glow-cyan">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22d3ee" floodOpacity="0.9" />
            </filter>
            <filter id="flow-glow-orange">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#fb923c" floodOpacity="0.9" />
            </filter>
            <filter id="flow-glow-yellow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#facc15" floodOpacity="0.9" />
            </filter>
            <filter id="flow-glow-green">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#4ade80" floodOpacity="0.9" />
            </filter>
            <filter id="flow-glow-red">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.9" />
            </filter>
          </defs>
          {pathKeys.map((key, i) => {
            const p = displayPaths[key];
            const isActive = !!p?.active;
            const strokeColor = isActive ? (p?.color ?? COLORS.muted) : COLORS.muted;
            const filter =
              isActive && strokeColor === COLORS.cyan
                ? "url(#flow-glow-cyan)"
                : isActive && strokeColor === COLORS.orange
                  ? "url(#flow-glow-orange)"
                  : isActive && strokeColor === COLORS.yellow
                    ? "url(#flow-glow-yellow)"
                    : isActive && strokeColor === COLORS.green
                      ? "url(#flow-glow-green)"
                      : isActive && strokeColor === COLORS.red
                        ? "url(#flow-glow-red)"
                        : undefined;
            return (
              <path
                key={key}
                d={PATH_D_COORDS[key] ?? ""}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isActive ? 5 : 1.5}
                strokeDasharray={isActive ? "10 8" : "6 6"}
                strokeLinecap="round"
                style={{
                  stroke: strokeColor,
                  filter: filter ?? "none",
                  animation: isActive ? "flow-dash 0.6s linear infinite" : "none",
                  animationDirection: (p as FlowPathState).reverse ? "reverse" : "normal",
                }}
              />
            );
          })}
        </svg>
        <style>{`
          @keyframes flow-dash {
            from { stroke-dashoffset: 18; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes rotor-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Step 1: Harvest */}
        <div
          data-id="node-harvest"
          className="absolute bg-slate-900/90 backdrop-blur border-2 rounded-xl p-3 text-center min-w-[130px] transform -translate-x-1/2 -translate-y-1/2 z-[5] transition-all duration-300"
          style={{
            top: "30%",
            left: "15%",
            borderBottomWidth: "3px",
            borderBottomColor: COLORS.cyan,
            ...(nodeGlow["node-harvest"] ? glowStyle(nodeGlow["node-harvest"]) : { borderColor: "#475569" }),
          }}
        >
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Step 1: Harvest</h3>
          <div className="text-sm font-bold text-slate-200 mb-1">Wind Turbine</div>
          <div className="w-12 h-12 mx-auto mb-2 relative">
            <div
              className="absolute inset-0"
              style={{
                animation: spinSpeedSec > 0 ? `rotor-spin ${spinSpeedSec}s linear infinite` : "none",
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: COLORS.cyan, filter: "drop-shadow(0 0 5px #22d3ee)" }}>
                <path d="M50 50 L50 5 A10 10 0 0 1 60 5 L50 50 Z" />
                <path d="M50 50 L89 72 A10 10 0 0 1 84 81 L50 50 Z" transform="rotate(120 50 50)" />
                <path d="M50 50 L11 72 A10 10 0 0 1 16 81 L50 50 Z" transform="rotate(240 50 50)" />
              </svg>
            </div>
          </div>
          <div className="text-xs font-mono text-cyan-400 bg-black/30 px-2 py-0.5 rounded">{gen.toFixed(1)} kW</div>
        </div>

        {/* Step 2: Convert */}
        <div
          data-id="node-convert"
          className="absolute bg-slate-900/90 backdrop-blur border-2 rounded-xl p-3 text-center min-w-[130px] transform -translate-x-1/2 -translate-y-1/2 z-[5] transition-all duration-300"
          style={{
            top: "30%",
            left: "40%",
            borderBottomWidth: "3px",
            borderBottomColor: COLORS.orange,
            ...(nodeGlow["node-convert"] ? glowStyle(nodeGlow["node-convert"]) : { borderColor: "#475569" }),
          }}
        >
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Step 2: Convert</h3>
          <div className="text-sm font-bold text-slate-200 mb-1">Generator</div>
          <div className="text-xl mb-1">⚙️</div>
          <div className="text-xs font-mono text-orange-400 bg-black/30 px-2 py-0.5 rounded">Mechanical → AC</div>
        </div>

        {/* Step 3: Control */}
        <div
          data-id="node-control"
          className="absolute bg-slate-900/90 backdrop-blur border-2 rounded-xl p-3 text-center min-w-[130px] transform -translate-x-1/2 -translate-y-1/2 z-[5] transition-all duration-300"
          style={{
            top: "30%",
            left: "65%",
            borderBottomWidth: "3px",
            borderBottomColor: COLORS.yellow,
            ...(nodeGlow["node-control"] ? glowStyle(nodeGlow["node-control"]) : { borderColor: "#475569" }),
          }}
        >
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Step 3: Control</h3>
          <div className="text-sm font-bold text-slate-200 mb-1">Transformer</div>
          <div className="text-xl mb-1">📟</div>
          <div className="text-xs font-mono text-amber-400 bg-black/30 px-2 py-0.5 rounded">Voltage Sync</div>
        </div>

        {/* Step 4: Storage */}
        <div
          data-id="node-storage"
          className="absolute bg-slate-900/90 backdrop-blur border-2 rounded-xl p-3 text-center min-w-[130px] transform -translate-x-1/2 -translate-y-1/2 z-[5] transition-all duration-300"
          style={{
            top: "70%",
            left: "40%",
            borderBottomWidth: "3px",
            borderBottomColor: COLORS.green,
            ...(nodeGlow["node-storage"] ? glowStyle(nodeGlow["node-storage"]) : { borderColor: "#475569" }),
          }}
        >
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Step 4: Store</h3>
          <div className="text-sm font-bold text-slate-200 mb-1">Battery Bank</div>
          <div className="w-10 h-[18px] border-2 border-slate-500 rounded-sm mx-auto my-1 relative overflow-hidden">
            <div
              className="h-full rounded-sm transition-all duration-300"
              style={{
                width: `${Math.max(0, Math.min(100, battery))}%`,
                background: battery < 20 ? COLORS.red : COLORS.green,
              }}
            />
          </div>
          <div className="text-xs font-mono text-emerald-400 bg-black/30 px-2 py-0.5 rounded">{battery.toFixed(1)}%</div>
        </div>

        {/* Step 5: Usage */}
        <div
          data-id="node-usage"
          className="absolute bg-slate-900/90 backdrop-blur border-2 rounded-xl p-3 text-center min-w-[130px] transform -translate-x-1/2 -translate-y-1/2 z-[5] transition-all duration-300"
          style={{
            top: "70%",
            left: "75%",
            borderBottomWidth: "3px",
            borderBottomColor: COLORS.yellow,
            ...(nodeGlow["node-usage"] ? glowStyle(nodeGlow["node-usage"]) : { borderColor: "#475569" }),
          }}
        >
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Step 5: Utilize</h3>
          <div className="text-sm font-bold text-slate-200 mb-1">Community</div>
          <div className="text-2xl my-1">🏘️</div>
          <div className="text-xs font-mono text-slate-300 bg-black/30 px-2 py-0.5 rounded">Demand: {load.toFixed(1)} kW</div>
        </div>

        {/* Step 6: Grid */}
        <div
          data-id="node-grid"
          className="absolute bg-slate-900/90 backdrop-blur border-2 rounded-xl p-3 text-center min-w-[130px] transform -translate-x-1/2 -translate-y-1/2 z-[5] transition-all duration-300"
          style={{
            top: "30%",
            left: "90%",
            borderBottomWidth: "3px",
            borderBottomColor: COLORS.yellow,
            ...(nodeGlow["node-grid"] ? glowStyle(nodeGlow["node-grid"]) : { borderColor: "#475569" }),
          }}
        >
          <h3 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Step 6: Balance</h3>
          <div className="text-sm font-bold text-slate-200 mb-1">The Grid</div>
          <div className="text-xl mb-1">🌐</div>
          <div className="text-xs font-mono text-amber-400 bg-black/30 px-2 py-0.5 rounded">
            {gridEx > 0 ? `Exporting: ${gridEx.toFixed(1)} kW` : gridEx < 0 ? `Importing: ${Math.abs(gridEx).toFixed(1)} kW` : "Balanced"}
          </div>
        </div>
      </div>
    </div>
  );
}
