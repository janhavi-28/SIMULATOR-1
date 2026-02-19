"use client";

import React, { useState } from "react";

const BETZ_LIMIT = 0.593;  // theoretical max; typical Cp ~0.35–0.45
const CP_TYPICAL = 0.59;  // match simulator: blade capture fraction
const MECH_LOSS = 0.03;   // 3%
const GEAR_LOSS = 0.02;   // 2%

function formatNum(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(d);
}

export type PipelineData = {
  pWind: number;      // kW (available in wind)
  pCaptured: number;  // kW (after Betz capture)
  pMech: number;      // kW (after mechanical loss)
  pGear: number;      // kW (after gearbox)
  pGenerator: number; // kW (electrical out)
  pOutput: number;    // kW (same as generator)
  etaOverall: number; // 0..1
  isAnimating: boolean;
};

type StageConfig = {
  id: string;
  name: string;
  shortName: string;
  formula: string;
  valueKey: keyof Pick<PipelineData, "pWind" | "pCaptured" | "pMech" | "pGear" | "pGenerator" | "pOutput">;
  color: string;
  lossPercent?: number; // loss after this stage (shown below)
  icon: "wind" | "blades" | "shaft" | "gearbox" | "generator" | "output";
};

const STAGES: StageConfig[] = [
  { id: "wind", name: "Wind kinetic energy", shortName: "Wind", formula: "P = ½ρAv³", valueKey: "pWind", color: "#3b82f6", icon: "wind" },
  { id: "blades", name: "Blade capture (Betz)", shortName: "Blades", formula: "P × Cₚ (Cₚ ≤ 59.3%)", valueKey: "pCaptured", color: "#10b981", lossPercent: (1 - BETZ_LIMIT) * 100, icon: "blades" },
  { id: "mech", name: "Mechanical rotation", shortName: "Shaft", formula: "P_captured × (1 − loss)", valueKey: "pMech", color: "#22c55e", lossPercent: MECH_LOSS * 100, icon: "shaft" },
  { id: "gearbox", name: "Gearbox", shortName: "Gearbox", formula: "RPM step-up, power loss", valueKey: "pGear", color: "#84cc16", lossPercent: GEAR_LOSS * 100, icon: "gearbox" },
  { id: "generator", name: "Generator", shortName: "Generator", formula: "P_mech × η_gen", valueKey: "pGenerator", color: "#eab308", icon: "generator" },
  { id: "output", name: "Electrical output", shortName: "Output", formula: "P_elec (kW)", valueKey: "pOutput", color: "#f59e0b", icon: "output" },
];

function StageIcon({ type, color }: { type: StageConfig["icon"]; color: string }) {
  const s = 20;
  const stroke = 1.8;
  if (type === "wind") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" className="shrink-0">
        <path d="M12 4v4M12 12v4M12 4h4M12 12h-3M4 8h3M17 14h2" />
      </svg>
    );
  }
  if (type === "blades") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" className="shrink-0">
        <circle cx="12" cy="12" r="2" />
        <path d="M12 4v3M12 17v3M4 12h3M17 12h3M7.05 7.05l2.12 2.12M14.83 14.83l2.12 2.12M7.05 16.95l2.12-2.12M14.83 9.17l2.12-2.12" />
      </svg>
    );
  }
  if (type === "shaft") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" className="shrink-0">
        <rect x="10" y="2" width="4" height="20" rx="1" />
        <circle cx="12" cy="6" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="18" r="1.5" />
      </svg>
    );
  }
  if (type === "gearbox") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" className="shrink-0">
        <circle cx="8" cy="8" r="4" />
        <circle cx="16" cy="16" r="4" />
        <path d="M8 12v0a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4v0" />
      </svg>
    );
  }
  if (type === "generator") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" className="shrink-0">
        <circle cx="12" cy="12" r="6" />
        <path d="M12 6v2M12 16v2M6 12h2M16 12h2M8.34 8.34l1.42 1.42M14.24 14.24l1.42 1.42M8.34 15.66l1.42-1.42M14.24 9.76l1.42-1.42" />
      </svg>
    );
  }
  // output
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" className="shrink-0">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function FlowSegment({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-center flex-1 min-w-[12px] max-w-[32px] h-px overflow-hidden">
      <div
        className="h-full w-full flex-shrink-0"
        style={{
          background: `repeating-linear-gradient(90deg, ${color}, ${color} 4px, transparent 4px, transparent 8px)`,
          animation: active ? "flow-dash 0.8s linear infinite" : "none",
        }}
      />
    </div>
  );
}

export function WindEnergyPipeline({ data }: { data: PipelineData }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFormulas, setShowFormulas] = useState(true);
  const pMax = Math.max(1, data.pWind);
  const percent = (p: number) => (100 * p / pMax);

  return (
    <div className="w-full">
      <style>
        {`
          @keyframes flow-dash {
            0% { transform: translateX(0); }
            100% { transform: translateX(-8px); }
          }
          @keyframes pipeline-particle {
            0% { opacity: 0; transform: translateX(-4px); }
            20% { opacity: 0.8; }
            80% { opacity: 0.8; }
            100% { opacity: 0; transform: translateX(4px); }
          }
        `}
      </style>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Energy transformation pipeline
        </span>
        <button
          type="button"
          onClick={() => setShowFormulas((f) => !f)}
          className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showFormulas ? "Hide formulas" : "Show formulas"}
        </button>
      </div>

      <div className="energy-pipeline flex flex-wrap items-stretch gap-0 overflow-x-auto pb-2">
        {STAGES.map((stage, i) => {
          const value = data[stage.valueKey];
          const pct = percent(value);
          const isExpanded = expandedId === stage.id;
          const showFlow = data.isAnimating && value > 0;

          return (
            <React.Fragment key={stage.id}>
              {i > 0 && <FlowSegment active={showFlow} color={STAGES[i - 1].color} />}
              <button
                type="button"
                className="pipeline-stage flex flex-col rounded-lg border border-slate-700/80 bg-slate-800/50 min-w-[88px] max-w-[120px] flex-1 cursor-pointer transition-all duration-200 hover:border-slate-600 hover:bg-slate-800/70 text-left"
                data-stage={stage.id}
                onClick={() => setExpandedId(isExpanded ? null : stage.id)}
              >
                <div
                  className="flex items-center gap-1.5 p-2 border-b border-slate-700/60 rounded-t-lg"
                  style={{ borderLeftColor: stage.color, borderLeftWidth: 3, borderLeftStyle: "solid" }}
                >
                  <StageIcon type={stage.icon} color={stage.color} />
                  <span className="text-[10px] font-medium text-slate-300 truncate">{stage.shortName}</span>
                </div>
                <div className="p-2 flex flex-col gap-0.5">
                  <div className="font-mono text-sm font-semibold tabular-nums text-slate-100" style={{ color: stage.color }}>
                    {formatNum(value, 2)} kW
                  </div>
                  <div className="text-[10px] text-slate-500">{formatNum(pct, 1)}%</div>
                  {showFormulas && (
                    <div className="text-[9px] text-slate-500 mt-0.5 truncate" title={stage.formula}>
                      {stage.formula}
                    </div>
                  )}
                  {stage.lossPercent !== undefined && (
                    <div className="text-[9px] text-rose-400/80">−{formatNum(stage.lossPercent, 1)}% loss</div>
                  )}
                </div>
                {data.isAnimating && value > 0 && (
                  <div className="h-0.5 w-full overflow-hidden rounded-b-lg bg-slate-700/60 mt-auto">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${pct}%`, backgroundColor: stage.color }}
                    />
                  </div>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {expandedId && (() => {
        const stage = STAGES.find((s) => s.id === expandedId);
        if (!stage) return null;
        const value = data[stage.valueKey];
        const pct = percent(value);
        return (
          <div className="mt-2 rounded-lg border border-slate-600 bg-slate-800/95 p-3 text-xs text-slate-300 space-y-2">
            <div className="font-medium text-slate-200">{stage.name}</div>
            <div className="text-[11px] text-slate-400">{stage.formula}</div>
            <div className="font-mono text-slate-100">{formatNum(value, 2)} kW ({formatNum(pct, 1)}% of input)</div>
            {stage.lossPercent !== undefined && (
              <div className="text-rose-400/90">Loss at this stage: {formatNum(stage.lossPercent, 1)}%</div>
            )}
          </div>
        );
      })()}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
        <span>Total system efficiency: <span className="font-mono text-slate-300">{formatNum(data.etaOverall * 100, 1)}%</span></span>
        <span>Betz limit: 59.3%</span>
        {data.pOutput > 0 && (
          <span>Could power ~<span className="font-mono text-slate-400">{Math.round(data.pOutput)}</span> homes (at 1 kW avg)</span>
        )}
      </div>
    </div>
  );
}

/** Compute pipeline stage values from available wind power (kW) and overall efficiency η (wind→elec). */
export function computePipelineFromParams(
  availableKW: number,
  eta: number
): Omit<PipelineData, "isAnimating"> {
  const pCaptured = availableKW * CP_TYPICAL;
  const pMech = pCaptured * (1 - MECH_LOSS);
  const pGear = pMech * (1 - GEAR_LOSS);
  const etaGen = Math.min(0.99, eta / (CP_TYPICAL * (1 - MECH_LOSS) * (1 - GEAR_LOSS)));
  const pGenerator = pGear * etaGen;
  const pOutput = pGenerator;

  return {
    pWind: availableKW,
    pCaptured,
    pMech,
    pGear,
    pGenerator,
    pOutput,
    etaOverall: availableKW > 0 ? pOutput / availableKW : 0,
  };
}
