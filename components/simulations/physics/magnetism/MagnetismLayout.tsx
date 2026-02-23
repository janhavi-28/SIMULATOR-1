"use client";

import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SimulatorFrame } from "@/components/simulator/SimulatorFrame";

/** Magnetism & Electromagnetism design system — electric blue, neon cyan, magnetic red */
export const MAGNETISM_TOKENS = {
  canvasBg: "#0c1222",
  gridOpacity: 0.06,
  gridSize: "24px",
  panelRadius: 16,
  panelShadow: "0 12px 30px rgba(0,0,0,0.4)",
  canvasInsetShadow: "inset 0 2px 24px rgba(0,0,0,0.45)",
  canvasPaddingTop: 24,
  canvasPaddingBottom: 24,
  canvasPaddingX: 24,
  gapPanels: 28,
  simHeight: 780,
  simPanelBg: "#0a0e1a",
  paramsBg: "#1e293b",
  electricBlue: "#3b82f6",
  neonCyan: "#22d3ee",
  magneticRed: "#ef4444",
  fieldGlow: "rgba(59,130,246,0.4)",
  currentGlow: "rgba(239,68,68,0.35)",
  outputGlow: "rgba(34,197,94,0.35)",
} as const;

type SimulatorHeaderProps = {
  title: string;
  subtitle?: string;
  hasLaunched: boolean;
  paused: boolean;
  onLaunch: () => void;
  onPause: () => void;
  onReset: () => void;
};

export function MagnetismSimulatorHeader({
  title,
  subtitle,
  hasLaunched,
  paused,
  onLaunch,
  onPause,
  onReset,
}: SimulatorHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-800/80 shrink-0">
      <div className="min-w-0 space-y-0.5">
        <h2 className="text-base md:text-lg font-semibold text-slate-100 tracking-tight truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-400 truncate">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onLaunch}
          disabled={hasLaunched}
          className={`rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
            hasLaunched
              ? "bg-cyan-500/10 text-cyan-700 cursor-not-allowed"
              : "bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-[0_0_18px_rgba(34,211,238,0.5)]"
          }`}
          aria-label="Launch simulation"
        >
          Launch
        </button>
        <button
          type="button"
          onClick={onPause}
          disabled={!hasLaunched}
          className={`rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
            !hasLaunched
              ? "bg-slate-700/40 text-slate-500 cursor-not-allowed"
              : paused
              ? "bg-slate-600 text-slate-100 hover:bg-slate-500"
              : "bg-slate-500 text-slate-100 hover:bg-slate-400"
          }`}
          aria-label={paused ? "Play" : "Pause"}
        >
          {paused ? "Play" : "Pause"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl px-4 py-2.5 text-xs md:text-sm font-medium border border-slate-600/80 text-slate-200 bg-transparent hover:bg-slate-900/40 transition-all duration-200 active:scale-[0.97]"
          aria-label="Reset simulation"
        >
          Reset
        </button>
      </div>
    </header>
  );
}

type MagnetismCanvasProps = {
  children: React.ReactNode;
  className?: string;
  fullBleed?: boolean;
};

export function MagnetismCanvas({ children, className = "", fullBleed = false }: MagnetismCanvasProps) {
  const { canvasBg, gridOpacity, gridSize, canvasInsetShadow, canvasPaddingTop, canvasPaddingBottom, canvasPaddingX } = MAGNETISM_TOKENS;
  const padding = fullBleed
    ? { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }
    : { paddingTop: canvasPaddingTop, paddingBottom: canvasPaddingBottom, paddingLeft: canvasPaddingX, paddingRight: canvasPaddingX };
  return (
    <div
      className={`relative flex flex-col flex-1 min-h-[640px] rounded-xl ${className}`}
      style={{ backgroundColor: canvasBg, boxShadow: canvasInsetShadow }}
    >
      <style>
        {`
        .magnetism-grid {
          background-image:
            linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px);
          background-size: ${gridSize} ${gridSize};
        }
        .magnetism-params-scroll::-webkit-scrollbar { width: 6px; }
        .magnetism-params-scroll::-webkit-scrollbar-track { background: rgba(15,23,42,0.95); border-radius: 9999px; }
        .magnetism-params-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.45); border-radius: 9999px; }
        .magnetism-slider-field:focus-within .slider-track { box-shadow: 0 0 12px rgba(59,130,246,0.25); }
        .magnetism-slider-current:focus-within .slider-track { box-shadow: 0 0 12px rgba(239,68,68,0.2); }
        .magnetism-slider-output:focus-within .slider-track { box-shadow: 0 0 12px rgba(34,197,94,0.2); }
        `}
      </style>
      <div
        className="absolute inset-0 pointer-events-none rounded-xl magnetism-grid"
        style={{ opacity: gridOpacity }}
      />
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 60%)",
        }}
      />
      <div
        className="relative flex flex-col flex-1 min-h-0"
        style={padding}
      >
        {children}
      </div>
    </div>
  );
}

type MagnetismContainerProps = {
  title: string;
  subtitle?: string;
  hasLaunched: boolean;
  paused: boolean;
  onLaunch: () => void;
  onPause: () => void;
  onReset: () => void;
  canvas: React.ReactNode;
  sidebar: React.ReactNode;
  footer?: React.ReactNode;
  /** "generator" = 2.6fr/1fr (72%/28%) grid, min-height 780px, no viewport; matches Electric Generator */
  layoutVariant?: "default" | "generator";
};

/** Reusable layout: uses SimulatorFrame for all Magnetism simulators */
export function MagnetismContainer({
  title,
  subtitle,
  hasLaunched,
  paused,
  onLaunch,
  onPause,
  onReset,
  canvas,
  sidebar,
  footer,
  layoutVariant: _layoutVariant,
}: MagnetismContainerProps) {
  return (
    <SimulatorFrame
      renderHeader={
        <MagnetismSimulatorHeader
          title={title}
          subtitle={subtitle}
          hasLaunched={hasLaunched}
          paused={paused}
          onLaunch={onLaunch}
          onPause={onPause}
          onReset={onReset}
        />
      }
      controlPanel={
        <>
          <div className="shrink-0 border-b border-slate-700/60 pb-4 mb-4">
            <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em]">
              Parameters
            </h3>
          </div>
          <div className="space-y-4 magnetism-params-scroll">
            {sidebar}
          </div>
        </>
      }
    >
      <>
        <div className="sim-dashboard__canvas flex flex-col flex-1 min-h-0">
          {canvas}
        </div>
        {footer != null && <div className="shrink-0 pt-3">{footer}</div>}
      </>
    </SimulatorFrame>
  );
}

/** Collapsible parameter section — color theme: field (blue), current (red), output (green), cyan, violet */
export function MagnetismParamSection({
  title,
  open,
  onToggle,
  children,
  theme = "field",
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  theme?: "field" | "current" | "output" | "cyan" | "violet";
}) {
  const borderClass =
    theme === "field"
      ? "border-blue-500/30"
      : theme === "current"
      ? "border-red-500/30"
      : theme === "output"
      ? "border-emerald-500/30"
      : theme === "violet"
      ? "border-violet-500/30"
      : "border-cyan-500/30";
  return (
    <div className={`rounded-lg border overflow-hidden bg-slate-800/30 ${borderClass}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-slate-700/30 transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 space-y-3 border-t border-slate-700/60">
          {children}
        </div>
      )}
    </div>
  );
}

/** Slider with glow accent — color: blue (field), red (current), green (output), cyan (neutral) */
export function MagnetismSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  theme = "cyan",
  isActive,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
  theme?: "field" | "current" | "output" | "cyan" | "violet";
  isActive?: boolean;
}) {
  const accent = theme === "field" ? "blue" : theme === "current" ? "red" : theme === "output" ? "emerald" : theme === "violet" ? "violet" : "cyan";
  const thumbRing = {
    blue: "accent-blue-400 [&::-webkit-slider-thumb]:ring-blue-500/50",
    red: "accent-red-400 [&::-webkit-slider-thumb]:ring-red-500/50",
    emerald: "accent-emerald-400 [&::-webkit-slider-thumb]:ring-emerald-500/50",
    violet: "accent-violet-400 [&::-webkit-slider-thumb]:ring-violet-500/50",
    cyan: "accent-cyan-400 [&::-webkit-slider-thumb]:ring-cyan-500/50",
  }[accent];
  const glowClass = theme === "field" ? "magnetism-slider-field" : theme === "current" ? "magnetism-slider-current" : theme === "output" ? "magnetism-slider-output" : "";
  return (
    <div className={`space-y-1.5 ${glowClass}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <span className={`text-sm font-mono tabular-nums ${isActive ? "text-cyan-300" : "text-slate-400"}`}>
          {step < 1 ? value.toFixed(2) : value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Toggle reflection insight"
        className={`slider-track w-full h-2 rounded-full bg-slate-700 outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:transition-shadow ${thumbRing}`}
      />
    </div>
  );
}

/** Compact live metric for bottom of params panel */
export function MagnetismLiveCard({
  label,
  value,
  unit,
  active,
}: {
  label: string;
  value: string;
  unit: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center transition-all ${
        active ? "border-cyan-400/50 bg-cyan-500/10" : "border-slate-600/60 bg-slate-800/40"
      }`}
    >
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`font-mono text-sm font-semibold tabular-nums ${active ? "text-cyan-300" : "text-slate-400"}`}>
        {value} <span className="text-slate-500 font-normal text-xs">{unit}</span>
      </div>
    </div>
  );
}
