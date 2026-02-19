"use client";

/**
 * UI LAYER — Controls update simState only.
 * Sliders: live update, no debounce.
 * Dropdown: recomputes physics, resets invalid configs.
 */

import React from "react";
import { getDynamicExplanation, getOpticalFeedback } from "../physics/rayPhysics";
import type { ObjectType, SimState } from "../physics/rayPhysics";
import { OBJECT_TYPE_OPTIONS } from "../utils/objectMap";

const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
  arrow: "↑ Arrow",
  apple: "🍎 Apple",
  candle: "🕯 Candle",
  tree: "🌳 Tree",
  human: "🧑 Human",
};

interface SimulationControlsProps {
  simState: SimState;
  onUpdate: (updates: Partial<SimState>) => void;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onReset?: () => void;
}

export function SimulationControls({
  simState,
  onUpdate,
  isPlaying = false,
  onPlay,
  onPause,
  onReset,
}: SimulationControlsProps) {
  const handleMirrorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mirrorType = e.target.value as SimState["mirrorType"];
    onUpdate({
      mirrorType,
      focalLength: mirrorType === "plane" ? 28 : mirrorType === "convex" ? 25 : 20,
    });
  };

  return (
    <div className="ray-diagram-control-panel">
      <div className="ray-diagram-control-section">
        <h3>
          <span className="ray-diagram-section-letter">A</span>
          Mirror Type
        </h3>
        <select
          className="ray-diagram-select"
          value={simState.mirrorType}
          onChange={handleMirrorChange}
        >
          <option value="concave">Concave Mirror</option>
          <option value="convex">Convex Mirror</option>
          <option value="plane">Plane Mirror</option>
        </select>
      </div>

      <div className="ray-diagram-control-section">
        <h3>
          <span className="ray-diagram-section-letter">B</span>
          Object Type
        </h3>
        <select
          className="ray-diagram-select ray-diagram-select-object"
          value={simState.objectType}
          onChange={(e) => onUpdate({ objectType: e.target.value as ObjectType })}
          aria-label="Object type"
        >
          {OBJECT_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {OBJECT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="ray-diagram-control-section">
        <h3>
          <span className="ray-diagram-section-letter">C</span>
          Object Settings
        </h3>
        <div className="ray-diagram-slider-control">
          <div className="ray-diagram-slider-label">
            <span>Object Distance</span>
            <span className="ray-diagram-slider-value">{simState.objectDistance} cm</span>
          </div>
          <div className="ray-diagram-slider">
            <input
              type="range"
              min={10}
              max={80}
              value={simState.objectDistance}
              step={1}
              onChange={(e) => onUpdate({ objectDistance: parseInt(e.target.value, 10) })}
              disabled={!simState.launched}
            />
          </div>
        </div>
        <div className="ray-diagram-slider-control">
          <div className="ray-diagram-slider-label">
            <span>Object Height</span>
            <span className="ray-diagram-slider-value">{simState.objectHeight} px</span>
          </div>
          <div className="ray-diagram-slider">
            <input
              type="range"
              min={10}
              max={60}
              value={simState.objectHeight}
              step={1}
              onChange={(e) => onUpdate({ objectHeight: parseInt(e.target.value, 10) })}
              disabled={!simState.launched}
            />
          </div>
        </div>
      </div>

      <div className="ray-diagram-control-section">
        <h3>
          <span className="ray-diagram-section-letter">D</span>
          Mirror Properties
        </h3>
        <div className="ray-diagram-slider-control">
          <div className="ray-diagram-slider-label">
            <span>Focal Length</span>
            <span className="ray-diagram-slider-value">{simState.focalLength} cm</span>
          </div>
          <div className="ray-diagram-slider">
            <input
              type="range"
              min={10}
              max={50}
              value={simState.focalLength}
              step={1}
              onChange={(e) => onUpdate({ focalLength: parseInt(e.target.value, 10) })}
              disabled={simState.mirrorType === "plane"}
            />
          </div>
        </div>
      </div>

      <div className="ray-diagram-control-section">
        <h3>
          <span className="ray-diagram-section-letter">E</span>
          Actions
        </h3>
        <div className="ray-diagram-button-group">
          <button
            type="button"
            className="ray-diagram-btn ray-diagram-btn-primary ray-diagram-btn-full"
            onClick={() => onUpdate({ launched: true })}
            disabled={simState.launched}
            style={simState.launched ? { opacity: 0.5 } : undefined}
          >
            🚀 Launch Simulator
          </button>
          <button
            type="button"
            className={`ray-diagram-btn ray-diagram-btn-primary ${isPlaying ? "ray-diagram-btn-active" : ""}`}
            onClick={isPlaying ? onPause : onPlay}
            disabled={!simState.launched}
            title={isPlaying ? "Pause ray animation" : "Play ray animation"}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            type="button"
            className="ray-diagram-btn ray-diagram-btn-secondary"
            onClick={onReset}
            disabled={!simState.launched}
            title="Reset simulator and ray animation"
          >
            🔄 Reset
          </button>
        </div>
        <div className="ray-diagram-concept-box" style={{ marginTop: 15 }}>
          <strong>💡 Dynamic Explanation:</strong>
          <span> {simState.launched ? getDynamicExplanation(simState) : "Launch the simulator to see explanations based on object position."}</span>
        </div>
        {simState.launched && (() => {
          const feedback = getOpticalFeedback(simState);
          if (!feedback) return null;
          return (
            <div className="ray-diagram-concept-box ray-diagram-optical-feedback" style={{ marginTop: 10 }}>
              <strong>📐 Optical Feedback</strong>
              <div className="ray-diagram-feedback-row">
                <span>Image distance:</span>
                <span>{feedback.imageDistanceCm} cm</span>
              </div>
              <div className="ray-diagram-feedback-row">
                <span>Magnification:</span>
                <span>{feedback.magnification}</span>
              </div>
              <div className="ray-diagram-feedback-row">
                <span>Type:</span>
                <span>{feedback.imageTypeText}</span>
              </div>
            </div>
          );
        })()}
        <div className="ray-diagram-ray-legend" style={{ marginTop: 18 }}>
          <div className="ray-diagram-legend-item">
            <div className="ray-diagram-legend-line" style={{ background: "#f87171" }} />
            Incident ray
          </div>
          <div className="ray-diagram-legend-item">
            <div className="ray-diagram-legend-line" style={{ background: "#facc15" }} />
            Reflected ray
          </div>
          <div className="ray-diagram-legend-item">
            <div className="ray-diagram-legend-line" style={{ borderBottom: "2px dashed #94a3b8", height: 0, background: "none" }} />
            Virtual extension
          </div>
          <p style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--ray-border)", color: "var(--ray-text-muted)", fontSize: 12, fontStyle: "italic" }}>
            Drag the object on the canvas to move it (when launched).
          </p>
        </div>
      </div>
    </div>
  );
}
