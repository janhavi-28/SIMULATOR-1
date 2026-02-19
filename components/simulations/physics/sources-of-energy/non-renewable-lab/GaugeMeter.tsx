"use client";

import React from "react";

export interface GaugeMeterProps {
  label: string;
  value: number; // 0–1 normalized
  unit: string;
  displayValue: string | number;
  color: string;
  isActive: boolean;
}

export function GaugeMeter({
  label,
  value,
  unit,
  displayValue,
  color,
  isActive,
}: GaugeMeterProps) {
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <div
      className={`rounded-xl border p-3 transition-all duration-300 ${
        isActive ? "border-slate-500/60 bg-slate-800/50" : "border-slate-700/40 bg-slate-800/30"
      }`}
      style={{
        boxShadow: isActive ? `inset 0 0 20px ${color}15` : undefined,
      }}
    >
      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 truncate">
        {label}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span
          className="font-mono text-lg font-bold tabular-nums transition-all duration-300"
          style={{ color: isActive ? color : "rgba(148,163,184,0.8)" }}
        >
          {displayValue}
        </span>
        <span className="text-[10px] text-slate-500">{unit}</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            opacity: isActive ? 0.9 : 0.5,
          }}
        />
      </div>
    </div>
  );
}
