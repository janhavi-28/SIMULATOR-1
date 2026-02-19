"use client";

import React from "react";
import { SIMULATOR_LAYOUT_CONFIG } from "@/lib/simulatorLayout.config";

const config = SIMULATOR_LAYOUT_CONFIG;
const { maxWidth, grid, minHeight, panel, header } = config;

export type SimulatorFrameProps = {
  /** Optional title (left side of header) */
  title?: React.ReactNode;
  /** Optional subtitle below title */
  subtitle?: React.ReactNode;
  /** Right side of header: Launch, Pause, Reset */
  headerControls?: React.ReactNode;
  /** When set, the entire header is this node */
  renderHeader?: React.ReactNode;
  /** Main simulation canvas content */
  children: React.ReactNode;
  /** Right-hand control panel content */
  controlPanel: React.ReactNode;
  className?: string;
};

/**
 * Shared simulator layout wrapper for High School Physics.
 * Use for all simulators under /high-school/physics/* and subtopics.
 * Structure: sim-root > sim-canvas | sim-controls
 */
export function SimulatorFrame({
  title,
  subtitle,
  headerControls,
  renderHeader,
  children,
  controlPanel,
  className = "",
}: SimulatorFrameProps) {
  const hasHeader = renderHeader != null || title != null || headerControls != null;

  return (
    <div
      className={`sim-root w-full max-w-[1600px] mx-auto overflow-visible ${className}`}
      style={{
        maxWidth: maxWidth,
        paddingInline: config.paddingInline,
      }}
    >
      <div
        className="grid gap-6 grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] overflow-visible"
        style={{ gap: grid.gap }}
      >
        <div
          className="sim-canvas flex flex-col min-w-0 overflow-visible rounded-[18px] flex-1 min-h-[650px] lg:min-h-[720px] xl:min-h-[780px]"
          style={{
            background: panel.background,
            border: panel.border,
            boxShadow: panel.boxShadow,
            padding: panel.padding,
          }}
        >
          {hasHeader && (
            <header
              className="shrink-0 w-full"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: header.marginBottom,
              }}
            >
              {renderHeader != null ? (
                renderHeader
              ) : (
                <>
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
                </>
              )}
            </header>
          )}
          <div className="relative flex-1 w-full overflow-visible min-h-0 flex flex-col rounded-b-[18px]">
            {children}
          </div>
        </div>

        <div
          className="sim-controls flex flex-col overflow-y-auto overflow-x-visible rounded-[18px] flex-shrink-0 min-h-[320px] xl:max-h-[780px]"
          style={{
            background: panel.background,
            border: panel.border,
            boxShadow: panel.boxShadow,
            padding: panel.padding,
          }}
        >
          {controlPanel}
        </div>
      </div>
    </div>
  );
}

/** Canvas scaling: use on canvas or wrapper for full visibility without cropping */
export const SIMULATOR_CANVAS_CLASS = "w-full h-full min-h-0 block object-contain";
export const SIMULATOR_CANVAS_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "contain",
};
