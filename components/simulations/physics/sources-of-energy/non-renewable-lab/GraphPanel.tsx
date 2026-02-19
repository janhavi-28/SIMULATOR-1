"use client";

import React, { useMemo } from "react";
import type { DataPoint } from "./GraphEngine";
import { SEMANTIC_COLORS } from "./types";

export interface GraphPanelProps {
  series: DataPoint[];
  open: boolean;
  onToggle: () => void;
  title?: string;
}

const W = 280;
const H = 120;
const PAD = { top: 8, right: 8, bottom: 24, left: 36 };

export function GraphPanel({ series, open, onToggle, title = "Live graphs" }: GraphPanelProps) {
  const { powerPath, efficiencyPath, emissionsPath } = useMemo(() => {
    if (series.length < 2) {
      return { powerPath: "", efficiencyPath: "", emissionsPath: "" };
    }
    const xs = series.map((d) => d.t);
    const tMin = Math.min(...xs);
    const tMax = Math.max(...xs);
    const tRange = tMax > tMin ? tMax - tMin : 1;
    const pMax = Math.max(1, ...series.map((d) => d.powerMW));
    const eMax = Math.max(1, ...series.map((d) => d.efficiencyPercent));
    const cMax = Math.max(0.1, ...series.map((d) => d.emissionsTonsPerHour));
    const scaleX = (t: number) => PAD.left + ((t - tMin) / tRange) * (W - PAD.left - PAD.right);
    const scalePower = (v: number) => H - PAD.bottom - (v / pMax) * (H - PAD.top - PAD.bottom);
    const scaleEff = (v: number) => H - PAD.bottom - (v / eMax) * (H - PAD.top - PAD.bottom);
    const scaleCo2 = (v: number) => H - PAD.bottom - (v / cMax) * (H - PAD.top - PAD.bottom);
    const powerPath = series.map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(d.t)} ${scalePower(d.powerMW)}`).join(" ");
    const efficiencyPath = series.map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(d.t)} ${scaleEff(d.efficiencyPercent)}`).join(" ");
    const emissionsPath = series.map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(d.t)} ${scaleCo2(d.emissionsTonsPerHour)}`).join(" ");
    return { powerPath, efficiencyPath, emissionsPath };
  }, [series]);

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-semibold text-slate-200 hover:bg-slate-800/60 transition-colors"
      >
        <span>{title}</span>
        <span className="text-slate-500 transform transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▼
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Power vs Time</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[100px] rounded bg-slate-800/50" preserveAspectRatio="none">
            <path d={powerPath} fill="none" stroke={SEMANTIC_COLORS.electricOutput} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Efficiency vs Time</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[80px] rounded bg-slate-800/50" preserveAspectRatio="none">
            <path d={efficiencyPath} fill="none" stroke={SEMANTIC_COLORS.energyFlow} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Emissions vs Time</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[80px] rounded bg-slate-800/50" preserveAspectRatio="none">
            <path d={emissionsPath} fill="none" stroke={SEMANTIC_COLORS.co2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}
