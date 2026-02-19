"use client";

import React from "react";

/** Connector between flow nodes: 5px thickness, gradient, moving particles (CSS), arrow. Speed ∝ power. */
const TOKENS = {
  wind: "#22d3ee",
  mechanical: "#f97316",
  electrical: "#facc15",
  stored: "#4ade80",
} as const;

export type EnergyConnectorProps = {
  active: boolean;
  /** 0..1 for brightness and particle speed */
  flowLevel: number;
  /** Gradient color key for segment (left color) */
  colorFrom?: keyof typeof TOKENS;
  /** Gradient color key for segment (right color) */
  colorTo?: keyof typeof TOKENS;
  /** Direction arrow at end */
  showArrow?: boolean;
};

const CONNECTOR_GAP = 80;
const THICKNESS = 5;

export function EnergyConnector({
  active,
  flowLevel,
  colorFrom = "wind",
  colorTo = "electrical",
  showArrow = true,
}: EnergyConnectorProps) {
  const from = TOKENS[colorFrom];
  const to = TOKENS[colorTo];
  const duration = Math.max(0.8, 2 - flowLevel * 1.2);

  return (
    <div
      className="flex items-center flex-shrink-0 relative overflow-visible"
      style={{ width: CONNECTOR_GAP, minWidth: CONNECTOR_GAP }}
    >
      <div
        className="h-[5px] w-full rounded-[999px] flex-shrink-0 relative overflow-hidden"
        style={{
          background: active
            ? `linear-gradient(90deg, ${from}, ${to})`
            : "rgba(30,41,59,0.6)",
          boxShadow: active ? `0 0 12px ${to}80` : "none",
          opacity: active ? 0.5 + 0.5 * flowLevel : 0.4,
        }}
      >
        {active && (
          <div
            className="energy-connector-particles absolute inset-0 rounded-[999px] pointer-events-none"
            style={{
              background: "repeating-linear-gradient(90deg, transparent 0px, transparent 20px, rgba(255,255,255,0.6) 20px, rgba(255,255,255,0.6) 26px)",
              width: "200%",
              animation: `energy-connector-flow ${duration}s linear infinite`,
            }}
          />
        )}
      </div>
      {showArrow && active && (
        <span
          className="text-[#facc15] font-bold text-sm ml-1 flex-shrink-0"
          style={{ textShadow: "0 0 8px rgba(250,204,21,0.6)" }}
          aria-hidden
        >
          →
        </span>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes energy-connector-flow {
          from { transform: translateX(0); }
          to { transform: translateX(-26px); }
        }
      `}} />
    </div>
  );
}

export { CONNECTOR_GAP };
