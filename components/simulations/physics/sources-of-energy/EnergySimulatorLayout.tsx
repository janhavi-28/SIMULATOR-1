"use client";

import React from "react";

/** Energy simulation design system — shared across all Sources of Energy subtopics */
export const ENERGY_TOKENS = {
  canvasBg: "#0b1220",
  gridOpacity: 0.04,
  gridSize: "20px",
  panelRadius: 16,
  panelShadow: "0 12px 30px rgba(0,0,0,0.35)",
  canvasInsetShadow: "inset 0 2px 24px rgba(0,0,0,0.4)",
  canvasPaddingTop: 28,
  canvasPaddingBottom: 28,
  canvasPaddingX: 24,
  iconStrokeWidth: 2.2,
  flowStrokeWidth: 2.2,
  glowOpacity: 0.35,
  animationSpeedLines: 1.5,
  gapPanels: 32,
  simHeight: 620,
  paramsBg: "#1f2937",
  simPanelBg: "#020617",
} as const;

type SimulatorHeaderProps = {
  title: string;
  subtitle?: string;
  hasLaunched: boolean;
  paused: boolean;
  onLaunch: () => void;
  onPause: () => void;
  onReset: () => void;
  /** When true, use wireframe spec: 72px height, 22px title, subtle divider */
  compact?: boolean;
};

/** Header with title, subtitle, and controls inside the simulator panel */
export function SimulatorHeader({
  title,
  subtitle,
  hasLaunched,
  paused,
  onLaunch,
  onPause,
  onReset,
  compact = false,
}: SimulatorHeaderProps) {
  return (
    <header
      className={`flex items-center justify-between gap-4 border-b border-slate-800/80 shrink-0 ${compact ? "h-[72px] px-6" : "px-5 py-4"}`}
    >
      <div className="min-w-0 space-y-0.5">
        <h2 className={`font-semibold text-slate-100 tracking-tight truncate ${compact ? "text-[22px]" : "text-base md:text-lg"}`}>
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
              ? "bg-emerald-500/10 text-emerald-800/50 cursor-not-allowed"
              : "bg-emerald-500 text-slate-900 hover:bg-emerald-400 hover:shadow-[0_0_18px_rgba(16,185,129,0.45)]"
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

type SimulatorCanvasProps = {
  children: React.ReactNode;
  className?: string;
  /** When true, no padding so content fills the canvas (e.g. Biogas process + metrics). */
  fullBleed?: boolean;
  /** When true, use smaller top/bottom padding to reduce empty vertical space. */
  compactPadding?: boolean;
};

/** Immersive canvas: dark navy, subtle grid, radial gradient, inset shadow. No heavy borders. */
export function SimulatorCanvas({ children, className = "", fullBleed = false, compactPadding = false }: SimulatorCanvasProps) {
  const { canvasBg, gridOpacity, gridSize, canvasInsetShadow, canvasPaddingTop, canvasPaddingBottom, canvasPaddingX } = ENERGY_TOKENS;
  const padding = fullBleed
    ? { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }
    : compactPadding
    ? { paddingTop: 10, paddingBottom: 10, paddingLeft: canvasPaddingX, paddingRight: canvasPaddingX }
    : { paddingTop: canvasPaddingTop, paddingBottom: canvasPaddingBottom, paddingLeft: canvasPaddingX, paddingRight: canvasPaddingX };
  return (
    <div
      className={`relative flex flex-col flex-1 min-h-0 overflow-hidden rounded-xl ${className}`}
      style={{
        backgroundColor: canvasBg,
        boxShadow: canvasInsetShadow,
      }}
    >
      <style>
        {`
        @keyframes energy-ambient-pulse {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.05; }
        }
        .energy-canvas-grid {
          background-image:
            linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px);
          background-size: ${gridSize} ${gridSize};
        }
        .energy-params-scroll::-webkit-scrollbar { width: 7px; }
        .energy-params-scroll::-webkit-scrollbar-track { background: rgba(15,23,42,0.95); border-radius: 9999px; }
        .energy-params-scroll::-webkit-scrollbar-thumb {
          background: rgba(100,116,139,0.45);
          border-radius: 9999px;
        }
        .energy-params-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.6); }
        @keyframes live-output-pulse {
          0%, 100% { opacity: 1; text-shadow: 0 0 0 transparent; }
          50% { opacity: 1; text-shadow: 0 0 12px rgba(52,211,153,0.12); }
        }
        .live-output-values .font-mono { animation: live-output-pulse 3s ease-in-out infinite; }
        @keyframes slider-fill-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.08); }
        }
        .slider-fill-active .slider-fill { animation: slider-fill-glow 2.5s ease-in-out infinite; }
        @keyframes wind-gust-flash {
          0% { box-shadow: 0 0 0 rgba(6,182,212,0); }
          30% { box-shadow: 0 0 20px rgba(6,182,212,0.4), inset 0 0 12px rgba(6,182,212,0.08); }
          100% { box-shadow: 0 0 0 rgba(6,182,212,0); }
        }
        .wind-gust-active { animation: wind-gust-flash 0.5s ease-out; }
      `}
      </style>
      <div
        className="absolute inset-0 pointer-events-none rounded-xl energy-canvas-grid"
        style={{ opacity: gridOpacity }}
      />
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: "radial-gradient(ellipse 75% 55% at 50% 45%, rgba(56,189,248,0.06) 0%, transparent 55%)",
          animation: "energy-ambient-pulse 10s ease-in-out infinite",
        }}
      />
      <div
        className="relative flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        style={padding}
      >
        {children}
      </div>
    </div>
  );
}

type SimulatorContainerProps = {
  title: string;
  subtitle?: string;
  hasLaunched: boolean;
  paused: boolean;
  onLaunch: () => void;
  onPause: () => void;
  onReset: () => void;
  canvas: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  /** "wind" = single full-width panel, 35-40-25 grid inside canvas, header 72px, footer = status bar 80px */
  layout?: "default" | "wind";
};

/** Default: two-panel 75% | 25%. Wind: single full-width panel with header + canvas (3-col grid) + footer (status bar). */
export function SimulatorContainer({
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
  layout = "default",
}: SimulatorContainerProps) {
  const { gapPanels, panelRadius, panelShadow, simPanelBg } = ENERGY_TOKENS;
  const isWind = layout === "wind";

  if (isWind) {
    return (
      <div className="w-full min-w-0 max-w-full flex flex-col rounded-[16px] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)] min-h-[620px] h-[620px]">
        <section
          className="flex flex-col flex-1 min-h-0 rounded-[16px] w-full overflow-hidden"
          style={{
            backgroundColor: simPanelBg,
            boxShadow: panelShadow,
            borderRadius: panelRadius,
          }}
        >
          <SimulatorHeader
            title={title}
            subtitle={subtitle}
            hasLaunched={hasLaunched}
            paused={paused}
            onLaunch={onLaunch}
            onPause={onPause}
            onReset={onReset}
            compact
          />
          <div className="flex-1 min-h-0 flex flex-col p-2 overflow-hidden">
            {canvas}
          </div>
          {footer && (
            <div className="shrink-0 h-[80px] flex items-stretch">
              {footer}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]"
        style={{ gap: gapPanels }}
      >
        <section
          className="flex flex-col overflow-hidden rounded-[16px] w-full"
          style={{
            height: "auto",
            minHeight: 0,
            backgroundColor: simPanelBg,
            boxShadow: panelShadow,
            borderRadius: panelRadius,
          }}
        >
          <SimulatorHeader
            title={title}
            subtitle={subtitle}
            hasLaunched={hasLaunched}
            paused={paused}
            onLaunch={onLaunch}
            onPause={onPause}
            onReset={onReset}
          />
          <div className="min-h-[360px] px-2 pt-2 pb-2 flex flex-col flex-1">
            <div className="flex-1 min-h-0 overflow-hidden rounded-[14px] flex flex-col w-full">
              {canvas}
            </div>
          </div>
          {footer && <div className="shrink-0 px-5 pb-3">{footer}</div>}
        </section>

        <aside
          className="flex flex-col overflow-hidden rounded-[16px] w-full energy-params-scroll min-h-0"
          style={{
            height: "auto",
            minHeight: 0,
            backgroundImage: "linear-gradient(to bottom, #252d3a 0%, #1a2230 50%, #151b26 100%)",
            boxShadow: `${panelShadow}, inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -2px 12px rgba(0,0,0,0.25)`,
            borderRadius: panelRadius,
          }}
        >
          <div className="px-5 py-4 border-b border-slate-700/60 shrink-0">
            <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em]">
              Parameters
            </h3>
          </div>
          <div className="energy-params-scroll flex-1 min-h-0 px-5 pt-5 pb-6 space-y-6 overflow-y-auto">
            {sidebar}
          </div>
        </aside>
      </div>
    </div>
  );
}
