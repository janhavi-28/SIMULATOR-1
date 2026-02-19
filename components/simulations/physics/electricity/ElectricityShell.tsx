"use client";

import React from "react";

type ElectricityShellProps = {
  title: string;
  subtitle?: string;
  onLaunch: () => void;
  onPause: () => void;
  onReset: () => void;
  paused: boolean;
  hasLaunched: boolean;
  scenario?: "beginner" | "advanced" | "exam";
  onScenarioChange?: (s: "beginner" | "advanced" | "exam") => void;
  children: React.ReactNode;
  sidebar: React.ReactNode;
  footer?: React.ReactNode;
};

export function ElectricityShell({
  title,
  subtitle,
  onLaunch,
  onPause,
  onReset,
  paused,
  hasLaunched,
  scenario,
  onScenarioChange,
  children,
  sidebar,
  footer,
}: ElectricityShellProps) {
  return (
    <div className="flex flex-col w-full h-full min-h-[420px] bg-neutral-900 overflow-hidden rounded-xl ring-1 ring-cyan-500/15 shadow-[0_0_24px_-4px_rgba(34,211,238,0.08)]">
      <section className="flex flex-1 min-h-0 flex-col md:flex-row bg-neutral-900/95 rounded-xl overflow-hidden">
        <div className="w-full md:w-[65%] min-w-0 md:border-r border-neutral-600/80 flex flex-col p-3 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 mb-2 shrink-0">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">{title}</h2>
              {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {onScenarioChange && (
                <select
                  value={scenario ?? "beginner"}
                  onChange={(e) => onScenarioChange(e.target.value as "beginner" | "advanced" | "exam")}
                  className="rounded-lg border border-neutral-600 bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-200 focus:ring-1 focus:ring-cyan-500/50"
                  aria-label="Scenario"
                >
                  <option value="beginner">Beginner</option>
                  <option value="advanced">Advanced</option>
                  <option value="exam">Exam Mode</option>
                </select>
              )}
              <button
                type="button"
                onClick={onLaunch}
                disabled={hasLaunched}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${hasLaunched ? "border-neutral-600 bg-neutral-800/50 text-neutral-500 cursor-not-allowed" : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:shadow-[0_0_12px_-2px_rgba(34,211,238,0.3)]"}`}
                aria-label="Launch simulation"
              >
                ▶ Launch
              </button>
              <button
                type="button"
                onClick={onPause}
                disabled={!hasLaunched}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${!hasLaunched ? "bg-neutral-700 text-neutral-500 cursor-not-allowed" : paused ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_10px_-2px_rgba(34,211,238,0.4)]" : "bg-neutral-600 text-neutral-200 hover:bg-neutral-500"}`}
                aria-label={paused ? "Play" : "Pause"}
              >
                ⏸ {paused ? "Play" : "Pause"}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-xl border border-neutral-600 bg-neutral-800/80 px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-neutral-200 transition"
                aria-label="Reset simulation"
              >
                🔁 Reset
              </button>
            </div>
          </div>
          <div className="relative flex-1 min-h-0 w-full rounded-xl border border-neutral-700 bg-[#0a0f1a] overflow-hidden flex flex-col">
            {children}
          </div>
          {footer && <div className="mt-2 shrink-0">{footer}</div>}
        </div>
        <aside className="w-full md:w-[35%] md:min-w-[220px] flex flex-col gap-4 px-4 py-4 bg-neutral-900/80 overflow-auto min-h-0 border-t md:border-t-0 md:border-l border-neutral-600/80">
          {sidebar}
        </aside>
      </section>
    </div>
  );
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  color = "cyan",
  title,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
  color?: "cyan" | "amber" | "emerald" | "violet" | "rose" | "blue" | "orange";
  title?: string;
}) {
  const thumb = {
    cyan: "[&::-webkit-slider-thumb]:bg-cyan-300 [&::-webkit-slider-thumb]:ring-cyan-500/50",
    amber: "[&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:ring-amber-500/50",
    emerald: "[&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:ring-emerald-500/50",
    violet: "[&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:ring-violet-500/50",
    rose: "[&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:ring-rose-500/50",
    blue: "[&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:ring-blue-500/50",
    orange: "[&::-webkit-slider-thumb]:bg-orange-400 [&::-webkit-slider-thumb]:ring-orange-500/50",
  }[color];
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-neutral-300" title={title}>{label}</label>
        <span className="text-sm text-cyan-300 font-mono tabular-nums">
          {typeof value === "number" && step < 1 ? value.toFixed(2) : value} {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`w-full h-2.5 rounded-full appearance-none bg-neutral-600 outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:ring-2 ${thumb}`} />
    </div>
  );
}
