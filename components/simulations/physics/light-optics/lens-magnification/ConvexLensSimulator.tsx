"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { LensCanvas } from "./LensCanvas";
import { ControlPanel } from "./ControlPanel";
import { StatusCard } from "./StatusCard";
import { computeLensResult } from "./OpticsMath";
import type { LensState } from "./OpticsMath";
import "./LensMagnification.css";

const INITIAL_STATE: LensState = {
  u: 40,
  f: 20,
  ho: 18,
  signConvention: "school",
  objectType: "arrow",
  lensType: "convex",
};

const RAY_ANIM_DURATION_MS = 9500;

function ConvexLensSimulator() {
  const [state, setState] = useState<LensState>(INITIAL_STATE);
  const [launched, setLaunched] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rayProgress, setRayProgress] = useState(0);
  const [pulseT, setPulseT] = useState(0);
  const [focalGlow, setFocalGlow] = useState(0);
  const [lensFlash, setLensFlash] = useState(0);
  const prevFRef = useRef(state.f);
  const prevSignRef = useRef(state.signConvention);
  const prevLensTypeRef = useRef(state.lensType);
  const animStartRef = useRef(0);
  const animProgressRef = useRef(0);
  const rafRef = useRef<number>(0);

  const result = computeLensResult(state);

  const updateState = useCallback((updates: Partial<LensState>) => {
    setState((s) => {
      const next = { ...s, ...updates };
      if (updates.f !== undefined && updates.f !== prevFRef.current) {
        prevFRef.current = updates.f;
        setTimeout(() => setFocalGlow(1), 0);
      }
      if (updates.signConvention !== undefined && updates.signConvention !== prevSignRef.current) {
        prevSignRef.current = updates.signConvention;
        setTimeout(() => setLensFlash(1), 0);
      }
      if (updates.lensType !== undefined && updates.lensType !== prevLensTypeRef.current) {
        prevLensTypeRef.current = updates.lensType;
        setTimeout(() => setLensFlash(1), 0);
      }
      return next;
    });
  }, []);

  const onLaunch = useCallback(() => {
    setLaunched(true);
    setRayProgress(0);
    setIsPlaying(false);
  }, []);

  const onReset = useCallback(() => {
    setState(INITIAL_STATE);
    setLaunched(false);
    setIsPlaying(false);
    setIsDemo(false);
    setRayProgress(0);
    setZoom(1);
  }, []);

  const onPlay = useCallback(() => {
    if (!launched) return;
    const fromStart = rayProgress >= 0.99;
    if (fromStart) setRayProgress(0);
    setIsPlaying(true);
    animStartRef.current = performance.now();
    animProgressRef.current = fromStart ? 0 : rayProgress;
  }, [launched, rayProgress]);

  const onPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const onDemoToggle = useCallback(() => {
    setIsDemo((d) => !d);
  }, []);

  const onZoomIn = useCallback(() => {
    setZoom((z) => Math.min(2, z + 0.2));
  }, []);

  const onZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.4, z - 0.2));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPulseT((p) => (p + 0.02) % 1), 50);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (focalGlow <= 0) return;
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const next = Math.max(0, 1 - elapsed / 600);
      setFocalGlow(next);
      if (next > 0) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [focalGlow]);

  useEffect(() => {
    if (lensFlash <= 0) return;
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const next = Math.max(0, 1 - elapsed / 400);
      setLensFlash(next);
      if (next > 0) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [lensFlash]);

  useEffect(() => {
    if (!isPlaying || !launched) return;
    const loop = (time: number) => {
      const elapsed = time - animStartRef.current;
      const progress = animProgressRef.current + elapsed / RAY_ANIM_DURATION_MS;
      if (progress >= 1) {
        setRayProgress(1);
        setIsPlaying(false);
        return;
      }
      setRayProgress(progress);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, launched]);

  const demoDirRef = useRef(1);
  useEffect(() => {
    if (!isDemo || !launched) return;
    const id = setInterval(() => {
      setState((s) => {
        let u = s.u + demoDirRef.current * 0.35;
        if (u >= 100) {
          demoDirRef.current = -1;
          u = 100;
        } else if (u <= 22) {
          demoDirRef.current = 1;
          u = 22;
        }
        return { ...s, u };
      });
    }, 70);
    return () => clearInterval(id);
  }, [isDemo, launched]);

  return (
    <div className="lens-simulator">
      <div className="lens-simulator-main">
        <div className="lens-simulator-canvas-wrap">
          <div className="lens-canvas-stage">
            <LensCanvas
              state={state}
              pulseT={pulseT}
              focalGlow={focalGlow}
              lensFlash={lensFlash}
              zoom={zoom}
              rayProgress={launched ? rayProgress : 0}
              launched={launched}
            />
          </div>
        </div>
        <div className="lens-simulator-controls">
          <ControlPanel
            state={state}
            onUpdate={updateState}
            launched={launched}
            isPlaying={isPlaying}
            isDemo={isDemo}
            zoom={zoom}
            onLaunch={onLaunch}
            onReset={onReset}
            onPlay={onPlay}
            onPause={onPause}
            onDemoToggle={onDemoToggle}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            statusCard={
              launched ? (
                <StatusCard
                  result={result}
                  u={state.u}
                  f={state.f}
                  signConvention={state.signConvention}
                  animateKey={`${state.u}-${state.f}-${state.signConvention}`}
                />
              ) : null
            }
          />
        </div>
      </div>
    </div>
  );
}

export { ConvexLensSimulator };
export default ConvexLensSimulator;
