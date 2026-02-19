"use client";

import React from "react";
import type { LensResult } from "./OpticsMath";

export interface StatusCardProps {
  result: LensResult;
  u: number;
  f: number;
  signConvention: "school" | "cartesian";
  /** Trigger re-animate on change */
  animateKey?: string | number;
}

const COLOR = {
  real: "#10b981",
  virtual: "#f97316",
  enlarged: "#3b82f6",
  diminished: "#8b5cf6",
  same: "#64748b",
} as const;

export function StatusCard({ result, u, f, signConvention, animateKey }: StatusCardProps) {
  const vStr = result.v != null && Number.isFinite(result.v) ? result.v.toFixed(1) : "∞";
  const mStr = Number.isFinite(result.m) ? result.m.toFixed(2) : "—";
  const uDisplay = signConvention === "cartesian" ? -Math.abs(u) : u;

  const typeParts: Array<{ text: string; color: string }> = [];
  typeParts.push({
    text: result.isReal ? "Real" : "Virtual",
    color: result.isReal ? COLOR.real : COLOR.virtual,
  });
  typeParts.push({
    text: result.isErect ? "Erect" : "Inverted",
    color: result.isReal ? COLOR.real : COLOR.virtual,
  });
  typeParts.push({
    text: result.sizeType === "enlarged" ? "Enlarged" : result.sizeType === "diminished" ? "Diminished" : "Same Size",
    color:
      result.sizeType === "enlarged"
        ? COLOR.enlarged
        : result.sizeType === "diminished"
          ? COLOR.diminished
          : COLOR.same,
  });

  return (
    <div
      className="lens-status-card"
      key={animateKey}
      title="Image type and position from lens equation 1/f = 1/v + 1/u, m = v/u"
    >
      <h3 className="lens-status-title">Image Type</h3>
      <div className="lens-status-tags">
        {typeParts.map((p) => (
          <span
            key={p.text}
            className="lens-status-tag"
            style={{ background: `${p.color}22`, color: p.color, borderColor: `${p.color}66` }}
          >
            {p.text}
          </span>
        ))}
      </div>
      <h3 className="lens-status-title">Values</h3>
      <div className="lens-status-values">
        <div className="lens-status-row">
          <span className="lens-status-key">u</span>
          <span className="lens-status-val">{uDisplay} cm</span>
        </div>
        <div className="lens-status-row">
          <span className="lens-status-key">v</span>
          <span className="lens-status-val">{vStr} cm</span>
        </div>
        <div className="lens-status-row">
          <span className="lens-status-key">f</span>
          <span className="lens-status-val">{f} cm</span>
        </div>
        <div className="lens-status-row">
          <span className="lens-status-key">m</span>
          <span className="lens-status-val">{mStr}</span>
        </div>
      </div>
    </div>
  );
}
