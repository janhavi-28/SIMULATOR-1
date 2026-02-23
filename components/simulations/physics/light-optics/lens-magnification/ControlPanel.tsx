"use client";

import React, { useState } from "react";
import { Slider } from "./Slider";
import type { LensState, SignConvention, ObjectType, LensType } from "./OpticsMath";
import { OBJECT_TYPE_OPTIONS, LENS_TYPE_OPTIONS } from "./OpticsMath";

export interface ControlPanelProps {
  state: LensState;
  onUpdate: (updates: Partial<LensState>) => void;
  statusCard?: React.ReactNode;
  launched?: boolean;
  isPlaying?: boolean;
  isDemo?: boolean;
  zoom?: number;
  onLaunch?: () => void;
  onReset?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onDemoToggle?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

const OBJECT_LABELS: Record<ObjectType, string> = {
  pencil: "Pencil",
  arrow: "Arrow",
  tree: "Tree",
  human: "Person",
  apple: "Apple",
};

export function ControlPanel({
  state,
  onUpdate,
  statusCard,
  launched = false,
  isPlaying = false,
  isDemo = false,
  zoom = 1,
  onLaunch,
  onReset,
  onPlay,
  onPause,
  onDemoToggle,
  onZoomIn,
  onZoomOut,
}: ControlPanelProps) {
  const [objectsOpen, setObjectsOpen] = useState(false);
  const [lensesOpen, setLensesOpen] = useState(false);

  return (
    <aside className="lens-control-panel">
      <div className="lens-control-panel-inner">
        <h2 className="lens-control-heading">Controls</h2>

      {!launched && onLaunch && (
        <div className="lens-control-actions">
          <button type="button" className="lens-btn lens-btn-launch" onClick={onLaunch}>
            Launch
          </button>
        </div>
      )}

      {launched && (
        <>
          <div className="lens-control-actions lens-control-actions-row">
            {onReset && (
              <button type="button" className="lens-btn lens-btn-secondary" onClick={onReset}>
                Reset
              </button>
            )}
            {onPlay && (
              <button
                type="button"
                className="lens-btn lens-btn-primary"
                onClick={isPlaying ? onPause : onPlay}
                title={isPlaying ? "Pause animation" : "Play step-by-step ray animation"}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
            )}
          </div>

          <div className="lens-control-toggle-row">
            <span className="lens-control-toggle-label">Demo</span>
            <button
              type="button"
              className={`lens-toggle ${isDemo ? "lens-toggle-on" : ""}`}
              onClick={onDemoToggle}
              title="Auto-sweep object distance"
              aria-pressed={isDemo ? "true" : "false"}
            >
              <span className="lens-toggle-thumb" />
            </button>
          </div>

          <div className="lens-control-actions lens-control-actions-row">
            {onZoomOut && (
              <button type="button" className="lens-btn lens-btn-zoom" onClick={onZoomOut} title="Zoom out">
                − Zoom out
              </button>
            )}
            {onZoomIn && (
              <button type="button" className="lens-btn lens-btn-zoom" onClick={onZoomIn} title="Zoom in">
                + Zoom in
              </button>
            )}
          </div>
          {zoom !== 1 && (
            <p className="lens-zoom-value">Zoom: {(zoom * 100).toFixed(0)}%</p>
          )}

          <div className="lens-dropdown-wrap">
            <button
              type="button"
              className={`lens-dropdown-trigger ${lensesOpen ? "lens-dropdown-trigger-open" : ""}`}
              onClick={() => setLensesOpen((o) => !o)}
              aria-expanded={lensesOpen ? "true" : "false"}
            >
              Lenses
              <span className="lens-dropdown-chevron" aria-hidden>▼</span>
            </button>
            {lensesOpen && (
              <div className="lens-dropdown-menu">
                {LENS_TYPE_OPTIONS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`lens-dropdown-option ${state.lensType === type ? "lens-dropdown-option-active" : ""}`}
                    onClick={() => {
                      onUpdate({ lensType: type });
                    }}
                  >
                    {type === "convex" ? "Convex lens" : "Concave lens"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lens-dropdown-wrap">
            <button
              type="button"
              className={`lens-dropdown-trigger ${objectsOpen ? "lens-dropdown-trigger-open" : ""}`}
              onClick={() => setObjectsOpen((o) => !o)}
              aria-expanded={objectsOpen ? "true" : "false"}
            >
              Objects
              <span className="lens-dropdown-chevron" aria-hidden>▼</span>
            </button>
            {objectsOpen && (
              <div className="lens-dropdown-menu">
                {OBJECT_TYPE_OPTIONS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`lens-dropdown-option ${state.objectType === type ? "lens-dropdown-option-active" : ""}`}
                    onClick={() => onUpdate({ objectType: type })}
                  >
                    {OBJECT_LABELS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {statusCard && <div className="lens-control-status-wrap">{statusCard}</div>}

      <section className="lens-control-section">
        <h3 className="lens-control-section-title">Sign Convention</h3>
        <div className="lens-sign-toggle">
          <label className="lens-radio">
            <input
              type="radio"
              name="signMode"
              checked={state.signConvention === "school"}
              onChange={() => onUpdate({ signConvention: "school" as SignConvention })}
              disabled={!launched}
            />
            <span>School Geometry Mode</span>
          </label>
          <label className="lens-radio">
            <input
              type="radio"
              name="signMode"
              checked={state.signConvention === "cartesian"}
              onChange={() => onUpdate({ signConvention: "cartesian" as SignConvention })}
              disabled={!launched}
            />
            <span>Cartesian Sign Convention</span>
          </label>
        </div>
        <p className="lens-control-hint">Cartesian: u negative (left), v positive (right), f positive (convex).</p>
      </section>

      {launched && (
        <section className="lens-control-section">
          <h3 className="lens-control-section-title">Parameters</h3>
          <Slider
            id="lens-u"
            label="Object distance (u)"
            value={state.u}
            min={10}
            max={120}
            step={1}
            unit=" cm"
            tickStep={5}
            onChange={(v) => onUpdate({ u: v })}
            accentColor="#fbbf24"
          />
          <Slider
            id="lens-f"
            label="Focal length (f)"
            value={state.f}
            min={5}
            max={60}
            step={1}
            unit=" cm"
            tickStep={5}
            onChange={(v) => onUpdate({ f: v })}
            accentColor="#a78bfa"
          />
          <Slider
            id="lens-ho"
            label="Object height (hₒ)"
            value={state.ho}
            min={5}
            max={55}
            step={1}
            unit=" cm"
            tickStep={5}
            onChange={(v) => onUpdate({ ho: v })}
            accentColor="#eab308"
          />
        </section>
      )}

      <div className="lens-legend">
        <div className="lens-legend-item">
          <span className="lens-legend-swatch" style={{ background: "#fbbf24" }} />
          Incident
        </div>
        <div className="lens-legend-item">
          <span className="lens-legend-swatch" style={{ background: "#34d399" }} />
          Refracted
        </div>
        <div className="lens-legend-item">
          <span className="lens-legend-swatch lens-legend-swatch-thick" style={{ background: "#22d3ee" }} />
          Center ray
        </div>
        <div className="lens-legend-item">
          <span className="lens-legend-dashed" />
          Extension
        </div>
      </div>
      </div>
    </aside>
  );
}
