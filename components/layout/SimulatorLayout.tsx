"use client";

import React from "react";
import { SIMULATOR_LAYOUT_CONFIG } from "@/lib/simulatorLayout.config";

const { maxWidth, grid, minHeight, panel, header } = SIMULATOR_LAYOUT_CONFIG;

type SimulatorLayoutProps = {
  /** Optional title (left side of header) */
  title?: React.ReactNode;
  /** Optional subtitle or description below title */
  subtitle?: React.ReactNode;
  /** Right side of header: Launch, Pause, Reset, etc. */
  headerControls?: React.ReactNode;
  /** When set, the entire header is this node (overrides title/subtitle/headerControls) */
  renderHeader?: React.ReactNode;
  /** Main simulation canvas/content area */
  children: React.ReactNode;
  /** Right-hand parameter/control panel */
  controlPanel: React.ReactNode;
  /** Optional class for outer wrapper */
  className?: string;
};

/**
 * Global simulator layout — use for all High School Physics simulators.
 * Ensures optimal viewing size, no scrolling, and consistent edtech proportions.
 * Below 1280px: stacks vertically (simulator full width, controls below).
 */
export function SimulatorLayout({
  title,
  subtitle,
  headerControls,
  renderHeader,
  children,
  controlPanel,
  className = "",
}: SimulatorLayoutProps) {
  const hasHeader = renderHeader != null || title != null || headerControls != null;
  return (
    <div
      className={`w-full mx-auto overflow-visible sim-layout-outer ${className}`}
      style={{
        maxWidth: maxWidth,
        paddingInline: SIMULATOR_LAYOUT_CONFIG.paddingInline,
      }}
    >
      <div
        className="sim-layout-grid grid gap-6 grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] overflow-visible"
        style={{ gap: grid.gap }}
      >
        {/* Simulator canvas area */}
        <div
          className="sim-layout-canvas-area flex flex-col min-w-0 overflow-visible rounded-[18px] flex-1 min-h-[620px] lg:min-h-[720px] xl:min-h-[780px]"
          style={{
            background: panel.background,
            border: panel.border,
            boxShadow: panel.boxShadow,
          }}
        >
          {hasHeader && (
            <header className="sim-layout-header shrink-0 px-4 pt-4" style={{ marginBottom: header.marginBottom }}>
              {renderHeader != null ? (
                renderHeader
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {title != null && (
                    <div>
                      <div className="text-base font-semibold text-white">{title}</div>
                      {subtitle != null && (
                        <div className="text-xs text-neutral-400 mt-0.5">{subtitle}</div>
                      )}
                    </div>
                  )}
                  {headerControls != null && (
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {headerControls}
                    </div>
                  )}
                </div>
              )}
            </header>
          )}
          <div className="sim-layout-canvas-inner relative flex-1 w-full overflow-visible min-h-0 rounded-b-[18px] px-4 pb-4 flex flex-col">
            {children}
          </div>
        </div>

        {/* Control panel area */}
        <aside
          className="sim-layout-controls flex flex-col overflow-y-auto overflow-x-visible rounded-[18px] min-w-[320px] xl:min-w-[320px] flex-shrink-0 min-h-[320px] xl:max-h-[780px]"
          style={{
            background: panel.background,
            border: panel.border,
            boxShadow: panel.boxShadow,
          }}
        >
          <div className="p-4 h-full overflow-y-auto overflow-x-visible">
            {controlPanel}
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Apply these to canvas or wrapper so the simulation scales without cropping */
export const SIMULATOR_CANVAS_CLASS =
  "w-full h-full min-h-0 block object-contain";
export const SIMULATOR_CANVAS_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
};

export { SIMULATOR_LAYOUT_CONFIG };
