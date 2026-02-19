"use client";

import React, { useState } from "react";

type OpticsShellProps = {
  title: string;
  subtitle?: string;
  onLaunch?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onDemo?: () => void;
  paused: boolean;
  hasLaunched?: boolean;
  controlsDisabled?: boolean;
  demoActive?: boolean;
  controlsInSidebar?: boolean;
  /** On mobile, sidebar can be toggled open/closed via a drawer button */
  sidebarCollapsible?: boolean;
  /** Canvas-to-controls ratio: "80/20" (larger canvas), "75/25" (3fr 1fr), or "70/30" */
  layoutRatio?: "80/20" | "75/25" | "70/30";
  /** Fixed width for sidebar in px (320–380). When set, canvas takes remaining space. */
  sidebarWidth?: number;
  children: React.ReactNode;
  sidebar: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
};

export function OpticsShell({
  title,
  subtitle,
  onLaunch,
  onPause,
  onReset,
  onDemo,
  paused,
  hasLaunched = true,
  controlsDisabled = false,
  demoActive = false,
  controlsInSidebar = false,
  sidebarCollapsible = false,
  layoutRatio = "75/25",
  sidebarWidth,
  children,
  sidebar,
  footer,
  contentClassName,
}: OpticsShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const btnDisabled = controlsDisabled;
  const glow = "hover:shadow-[0_0_14px_rgba(34,211,238,0.5)] hover:shadow-cyan-500/30";
  const activeGlow = "active:scale-[0.98] active:shadow-inner";
  const gridCols = sidebarWidth
    ? undefined
    : layoutRatio === "80/20"
      ? "md:grid-cols-[4fr_1fr]"
      : layoutRatio === "75/25"
        ? "md:grid-cols-[3fr_1fr]"
        : "md:grid-cols-[7fr_3fr]";
  const gridStyle = sidebarWidth ? { gridTemplateColumns: `1fr ${sidebarWidth}px` } : undefined;

  return (
    <div
      className="simulator-wrapper flex flex-col w-full h-full min-h-[80vh] rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900/80"
    >
      <section
        className={`flex flex-1 min-h-0 w-full flex-col md:grid bg-neutral-900/95 rounded-xl overflow-hidden relative simulator-section ${gridCols ?? ""}`}
        style={{ height: "100%", minHeight: 0, ...gridStyle }}
      >
        <div
          className={`simulator-canvas-panel w-full min-w-0 md:border-r border-neutral-600/80 flex flex-col overflow-hidden canvas-area isolate ${contentClassName ?? "p-3"}`}
          style={{ flex: 1, minHeight: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 mb-2 shrink-0">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">{title}</h2>
              {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
            </div>
            <div className={`flex items-center gap-2 flex-shrink-0 ${controlsInSidebar ? "hidden" : ""}`}>
              {onLaunch && (
                <button
                  type="button"
                  onClick={onLaunch}
                  disabled={btnDisabled || hasLaunched}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition duration-200 ${glow} ${activeGlow} ${
                    btnDisabled || hasLaunched
                      ? "border-neutral-600 bg-neutral-800/50 text-neutral-500 cursor-not-allowed opacity-70"
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
                  disabled={btnDisabled || !hasLaunched}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition duration-200 ${glow} ${activeGlow} ${
                    btnDisabled || !hasLaunched
                      ? "bg-neutral-800/60 text-neutral-500 cursor-not-allowed opacity-70"
                      : paused
                        ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 ring-2 ring-cyan-400/50"
                        : "bg-cyan-500/90 text-white ring-2 ring-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
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
                  disabled={btnDisabled || !hasLaunched}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition duration-200 ${glow} ${activeGlow} ${
                    btnDisabled || !hasLaunched
                      ? "border-neutral-600 bg-neutral-800/50 text-neutral-500 cursor-not-allowed opacity-70"
                      : "border-neutral-600 bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  Reset
                </button>
              )}
              {onDemo && (
                <button
                  type="button"
                  onClick={onDemo}
                  disabled={btnDisabled}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition duration-200 ${glow} ${activeGlow} ${
                    demoActive
                      ? "border-violet-500/60 bg-violet-500/20 text-violet-200"
                      : "border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
                  }`}
                >
                  Demo
                </button>
              )}
            </div>
          </div>
          <div className="relative flex-1 min-h-0 w-full rounded-xl border border-neutral-700 bg-[#0a0f1a] overflow-hidden flex flex-col">
            {children}
          </div>
          {footer && <div className="mt-2 shrink-0">{footer}</div>}
        </div>
        {/* Mobile: collapsible drawer; Desktop: always visible sidebar */}
        {sidebarCollapsible && (
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="md:hidden fixed bottom-4 right-4 z-40 rounded-xl px-4 py-2.5 bg-cyan-500/90 text-white text-xs font-semibold shadow-lg ring-2 ring-cyan-400/50"
            aria-label={sidebarOpen ? "Close controls" : "Open controls"}
          >
            {sidebarOpen ? "Close controls" : "Controls"}
          </button>
        )}
        <aside
          className={`simulator-control-panel w-full min-w-0 flex flex-col gap-2 px-4 py-4 bg-neutral-900/80 overflow-auto min-h-0 border-t md:border-t-0 md:border-l border-neutral-600/80 transition-transform duration-300 ease-out relative z-10
            ${sidebarCollapsible ? "fixed md:relative inset-y-0 right-0 z-30 shadow-xl md:shadow-none " : ""}
            ${sidebarCollapsible && !sidebarOpen ? "translate-x-full md:translate-x-0" : ""}`}
          style={{ pointerEvents: "auto", ...(sidebarWidth ? { width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth } : {}), ...(sidebarCollapsible && !sidebarWidth ? { width: "min(100%, 320px)" } : {}) }}
        >
          {sidebarCollapsible && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden self-end rounded-lg px-2 py-1 text-xs text-neutral-400 hover:text-white"
            >
              Close
            </button>
          )}
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
  size = "default",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
  color?: "cyan" | "amber" | "emerald" | "violet" | "rose";
  size?: "default" | "large";
}) {
  const thumb = {
    cyan: "[&::-webkit-slider-thumb]:bg-cyan-300 [&::-webkit-slider-thumb]:ring-cyan-500/50",
    amber: "[&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:ring-amber-500/50",
    emerald: "[&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:ring-emerald-500/50",
    violet: "[&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:ring-violet-500/50",
    rose: "[&::-webkit-slider-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:ring-rose-500/50",
  }[color];
  const isLarge = size === "large";
  return (
    <div className={isLarge ? "space-y-2" : "space-y-1.5"}>
      <div className="flex items-baseline justify-between">
        <label className={isLarge ? "text-sm font-semibold text-neutral-200" : "text-xs font-medium text-neutral-300"}>{label}</label>
        <span className={`tabular-nums font-mono ${isLarge ? "text-base text-cyan-200 font-semibold" : "text-sm text-cyan-300"}`}>
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
        className={`w-full rounded-full appearance-none bg-neutral-600 outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:ring-2 ${thumb} ${isLarge ? "h-4 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8" : "h-2.5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5"}`}
      />
    </div>
  );
}

export const degToRad = (d: number) => (d * Math.PI) / 180;
export const radToDeg = (r: number) => (r * 180) / Math.PI;
