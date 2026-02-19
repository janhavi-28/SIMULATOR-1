"use client";

/**
 * RAY DIAGRAM SIMULATOR
 * 4-layer architecture: UI → State → Physics → Renderer
 * Single simState. No duplicated state. No physics in UI. No drawing in physics.
 */

import React, { useRef } from "react";
import { useRaySimulator } from "./hooks/useRaySimulator";
import { RayCanvas } from "./canvas/RayCanvas";
import { SimulationControls } from "./controls/SimulationControls";
import { getDynamicExplanation, getOpticalFeedback } from "./physics/rayPhysics";
import "./RaySimulator.css";

export default function RaySimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { simState, updateState, isPlaying, play, pause, reset } = useRaySimulator(canvasRef, containerRef);

  const feedback = simState.launched ? getOpticalFeedback(simState) : null;
  const explanation = simState.launched ? getDynamicExplanation(simState) : "";

  return (
    <div className="ray-diagram-wrapper">
      <div className="ray-diagram-container">
        <div className="ray-diagram-header">
          <h1>
            <div className="ray-diagram-header-icon">🔬</div>
            Ray Diagram Simulator
          </h1>
          <div style={{ fontSize: 13, color: "var(--ray-text-muted)" }}>High School Physics · Light & Optics</div>
        </div>

        <div className="ray-diagram-main">
          <div className="ray-diagram-simulator-panel">
            <div className="ray-diagram-simulator-title">
              <span style={{ fontSize: 22 }}>📐</span>
              <span>Interactive Ray Diagram</span>
            </div>

            <div
              className="ray-diagram-canvas-container simCanvasWrapper"
              ref={containerRef}
            >
              <div className="ray-diagram-edu-overlay">
                {simState.launched ? (
                  <>
                    <h2>{feedback?.imageTypeText ?? "Image at infinity"}</h2>
                    <p>{explanation}</p>
                    {feedback && (
                      <div className="ray-math-data">
                        v = {feedback.imageDistanceCm} cm | m = {feedback.magnification}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h2>Ray diagram</h2>
                    <p>Launch the simulator to see image classification, position, and ray data (v, m).</p>
                  </>
                )}
              </div>
              <RayCanvas ref={canvasRef} />
            </div>
          </div>

          <SimulationControls
            simState={simState}
            onUpdate={updateState}
            isPlaying={isPlaying}
            onPlay={play}
            onPause={pause}
            onReset={reset}
          />
        </div>
      </div>
    </div>
  );
}
