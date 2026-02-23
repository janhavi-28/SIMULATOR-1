"use client";

import React, { useEffect, useRef, useState } from "react";

type SourcesShellProps = {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  onLaunch: () => void;
  onPause: () => void;
  onReset: () => void;
  paused: boolean;
  hasLaunched: boolean;
  children: React.ReactNode;
  sidebar: React.ReactNode;
  footer?: React.ReactNode;
};

export function SourcesOfEnergyShell({
  title,
  subtitle,
  titleClassName,
  subtitleClassName,
  onLaunch,
  onPause,
  onReset,
  paused,
  hasLaunched,
  children,
  sidebar,
  footer,
}: SourcesShellProps) {
  return (
    <div
      className="flex flex-col w-full min-h-[420px] max-h-[70vh] rounded-[16px] box-border overflow-hidden transition-shadow duration-300"
      style={{
        backgroundImage: "linear-gradient(to bottom, #1f2937, #111827)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 shrink-0 mb-4">
        <div>
          <h2 className={`text-lg font-semibold text-slate-100 tracking-tight ${titleClassName ?? ""}`}>
            {title}
          </h2>
          {subtitle && (
            <p className={`text-sm mt-1 text-slate-400 max-w-xl ${subtitleClassName ?? ""}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onLaunch}
            disabled={hasLaunched}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
              hasLaunched
                ? "border-slate-600 bg-slate-700/80 text-slate-500 cursor-not-allowed"
                : "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-400/60 hover:shadow-md hover:shadow-emerald-500/20"
            }`}
            aria-label="Launch simulation"
          >
            ▶ Launch
          </button>
          <button
            type="button"
            onClick={onPause}
            disabled={!hasLaunched}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
              !hasLaunched
                ? "bg-slate-700/80 text-slate-500 cursor-not-allowed"
                : paused
                ? "bg-emerald-500 text-slate-900 hover:bg-emerald-400 hover:shadow-md hover:shadow-emerald-500/30"
                : "bg-slate-600 text-slate-100 hover:bg-slate-500 hover:shadow-md"
            }`}
            aria-label={paused ? "Play" : "Pause"}
          >
            ⏸ {paused ? "Play" : "Pause"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-slate-500/60 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700/80 hover:border-slate-400/50 transition-all duration-200 active:scale-[0.98]"
            aria-label="Reset simulation"
          >
            🔁 Reset
          </button>
        </div>
      </div>
      <div
        className="flex-1 min-h-0 flex flex-col md:flex-row gap-7 md:gap-8 overflow-y-auto overflow-x-hidden"
        style={{ boxSizing: "border-box" }}
      >
        <div className="w-full md:w-[70%] min-w-0 flex flex-col gap-4 shrink-0">
          <div className="relative w-full flex-1 flex flex-col min-h-[280px]">
            {children}
          </div>
          {footer && <div className="mt-2 shrink-0">{footer}</div>}
        </div>
        <aside
          className="w-full md:w-[30%] md:min-w-[220px] flex flex-col gap-5 rounded-xl py-1 md:pl-6 md:border-l shrink-0"
          style={{
            backgroundColor: "rgba(27, 36, 49, 0.6)",
            borderLeftColor: "rgba(255,255,255,0.08)",
            boxSizing: "border-box",
          }}
        >
          {sidebar}
        </aside>
      </div>
    </div>
  );
}

/** Live value with brief highlight when the number changes — "show, don't tell" */
export function LiveValue({
  value,
  className = "",
  decimals = 2,
  suffix = "",
}: {
  value: number;
  className?: string;
  decimals?: number;
  suffix?: string;
}) {
  const [flash, setFlash] = useState(false);
  const prevRef = useRef<number>(value);
  const display = Number.isFinite(value) ? value.toFixed(decimals) : "—";

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setFlash(true);
      const id = window.setTimeout(() => setFlash(false), 400);
      return () => clearTimeout(id);
    }
  }, [value]);

  return (
    <span
      className={`font-mono tabular-nums transition-all duration-200 ${className} ${
        flash ? "text-emerald-300" : ""
      }`}
      style={flash ? { textShadow: "0 0 10px rgba(110, 231, 183, 0.35)" } : undefined}
    >
      {display}
      {suffix}
    </span>
  );
}

/** Live output section — refined, with optional active-state pulse */
export function LiveOutputCard({
  title,
  children,
  className = "",
  isActive = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
}) {
  return (
    <div
      className={`mt-1 pt-5 border-t border-slate-700/60 rounded-lg border border-slate-600/40 bg-slate-800/30 p-5 space-y-3 transition-all duration-300 ${className} ${
        isActive ? "live-output-active" : ""
      }`}
      style={{
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 0 0 1px rgba(34,197,94,0.08)",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-[0.18em]">
          {title}
        </span>
        {isActive && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400/90 animate-pulse"
            aria-hidden
          />
        )}
      </div>
      <div className={isActive ? "live-output-values" : ""}>{children}</div>
    </div>
  );
}

const SLIDER_ACCENT: Record<
  "emerald" | "cyan" | "amber" | "violet" | "blue" | "rose",
  string
> = {
  emerald: "#10b981",
  cyan: "#06b6d4",
  amber: "#d97706",
  violet: "#7c3aed",
  blue: "#2563eb",
  rose: "#e11d48",
};

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  color = "emerald",
  title,
  isActive = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
  color?: "emerald" | "cyan" | "amber" | "violet" | "blue" | "rose";
  title?: string;
  isActive?: boolean;
}) {
  const fillPercent =
    max > min ? Math.min(100, ((value - min) / (max - min)) * 100) : 0;
  const thumb = {
    emerald:
      "[&::-webkit-slider-thumb]:bg-emerald-500/90 [&::-webkit-slider-thumb]:ring-emerald-500/40 [&::-webkit-slider-thumb]:hover:bg-emerald-400 [&:active::-webkit-slider-thumb]:shadow-[0_0_0_5px_rgba(16,185,129,0.25)]",
    cyan:
      "[&::-webkit-slider-thumb]:bg-cyan-500/90 [&::-webkit-slider-thumb]:ring-cyan-500/40 [&::-webkit-slider-thumb]:hover:bg-cyan-400 [&:active::-webkit-slider-thumb]:shadow-[0_0_0_5px_rgba(6,182,212,0.25)]",
    amber:
      "[&::-webkit-slider-thumb]:bg-amber-500/90 [&::-webkit-slider-thumb]:ring-amber-500/40 [&::-webkit-slider-thumb]:hover:bg-amber-400 [&:active::-webkit-slider-thumb]:shadow-[0_0_0_5px_rgba(245,158,11,0.25)]",
    violet:
      "[&::-webkit-slider-thumb]:bg-violet-500/90 [&::-webkit-slider-thumb]:ring-violet-500/40 [&::-webkit-slider-thumb]:hover:bg-violet-400 [&:active::-webkit-slider-thumb]:shadow-[0_0_0_5px_rgba(139,92,246,0.25)]",
    blue:
      "[&::-webkit-slider-thumb]:bg-blue-500/90 [&::-webkit-slider-thumb]:ring-blue-500/40 [&::-webkit-slider-thumb]:hover:bg-blue-400 [&:active::-webkit-slider-thumb]:shadow-[0_0_0_5px_rgba(59,130,246,0.25)]",
    rose:
      "[&::-webkit-slider-thumb]:bg-rose-500/90 [&::-webkit-slider-thumb]:ring-rose-500/40 [&::-webkit-slider-thumb]:hover:bg-rose-400 [&:active::-webkit-slider-thumb]:shadow-[0_0_0_5px_rgba(244,63,94,0.25)]",
  }[color];

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          className="text-[11px] font-medium text-slate-400 truncate"
          title={title}
        >
          {label}
        </label>
        <span className="text-xs font-mono font-light tabular-nums text-slate-400 text-right shrink-0 transition-all duration-300">
          {typeof value === "number" && step < 1 ? value.toFixed(2) : value}{" "}
          {unit}
        </span>
      </div>
      <div className={`relative h-2 w-full rounded-full bg-slate-700/90 overflow-hidden ${isActive ? "slider-fill-active" : ""}`}>
        <div
          className="slider-fill absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: SLIDER_ACCENT[color],
            opacity: 0.72,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Toggle reflection insight"
          className={`absolute inset-0 w-full h-full cursor-pointer appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-105 [&::-webkit-slider-runnable-track]:bg-transparent ${thumb}`}
        />
      </div>
    </div>
  );
}

