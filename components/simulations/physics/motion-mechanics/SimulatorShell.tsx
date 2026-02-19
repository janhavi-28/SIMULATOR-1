"use client";

import React from "react";

type SimulatorShellProps = {
  title: string;
  subtitle?: string;
  onLaunch?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  paused: boolean;
  hasLaunched?: boolean;
  children: React.ReactNode;
  sidebar: React.ReactNode;
  footer?: React.ReactNode;
};

export function SimulatorShell({
  title,
  subtitle,
  onLaunch,
  onPause,
  onReset,
  paused,
  hasLaunched = true,
  children,
  sidebar,
  footer,
}: SimulatorShellProps) {
  return (
    <div className="flex flex-col w-full h-full min-h-[420px] bg-neutral-900 overflow-hidden rounded-xl ring-1 ring-cyan-500/15 shadow-[0_0_24px_-4px_rgba(34,211,238,0.08)]">
      <section className="flex flex-1 min-h-0 flex-col md:flex-row bg-neutral-900/95 rounded-xl overflow-hidden">
        <div className="w-full md:w-[65%] min-w-0 md:border-r border-neutral-600/80 flex flex-col p-3 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 mb-2 shrink-0">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">{title}</h2>
              {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onLaunch && (
                <button
                  type="button"
                  onClick={onLaunch}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    hasLaunched
                      ? "border-neutral-600 bg-neutral-800/50 text-neutral-500 cursor-default"
                      : "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
                  }`}
                >
                  Launch
                </button>
              )}
              {onPause && (
                <button
                  type="button"
                  onClick={onPause}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    paused ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400" : "bg-neutral-600 text-neutral-200 hover:bg-neutral-500"
                  }`}
                  aria-label={paused ? "Play" : "Pause"}
                >
                  {paused ? "Play" : "Pause"}
                </button>
              )}
              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="rounded-xl border border-neutral-600 bg-neutral-800/80 px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition"
                >
                  Reset
                </button>
              )}
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
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
  color?: "cyan" | "amber" | "emerald" | "violet" | "rose";
}) {
  const thumb = {
    cyan: "[&::-webkit-slider-thumb]:bg-cyan-300 [&::-webkit-slider-thumb]:ring-cyan-500/50",
    amber: "[&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:ring-amber-500/50",
    emerald: "[&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:ring-emerald-500/50",
    violet: "[&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:ring-violet-500/50",
    rose: "[&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:ring-rose-500/50",
  }[color];
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-neutral-300">{label}</label>
        <span className="text-sm text-cyan-300 font-mono tabular-nums">
          {typeof value === "number" && step < 1 ? value.toFixed(2) : value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2.5 rounded-full appearance-none bg-neutral-600 outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:ring-2 ${thumb}`}
      />
    </div>
  );
}
