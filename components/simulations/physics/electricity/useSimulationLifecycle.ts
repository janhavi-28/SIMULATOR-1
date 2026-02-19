"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SimState = "idle" | "running" | "paused";

export interface UseSimulationLifecycleOptions {
  /** Called when Reset is pressed; use to reset positions, counters, graph history, etc. */
  onReset?: () => void;
}

export interface SimulationLifecycle {
  simState: SimState;
  elapsedTime: number;
  launch: () => void;
  pause: () => void;
  reset: () => void;
  /** True only when state === "running" (animation loop should advance). */
  isAnimating: boolean;
  /** True when launched (running or paused). */
  hasLaunched: boolean;
  /** True when state === "paused". */
  isPaused: boolean;
}

export function useSimulationLifecycle(
  options: UseSimulationLifecycleOptions = {}
): SimulationLifecycle {
  const { onReset } = options;
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  const [simState, setSimState] = useState<SimState>("idle");
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);

  const launch = useCallback(() => {
    if (simState !== "idle") return;
    setSimState("running");
    startTimeRef.current = performance.now();
    offsetRef.current = 0;
    setElapsedTime(0);
  }, [simState]);

  const pause = useCallback(() => {
    if (simState === "idle") return;
    if (simState === "running") {
      offsetRef.current = offsetRef.current + (performance.now() - startTimeRef.current) / 1000;
      setSimState("paused");
    } else {
      setSimState("running");
      startTimeRef.current = performance.now();
    }
  }, [simState]);

  const reset = useCallback(() => {
    setSimState("idle");
    setElapsedTime(0);
    offsetRef.current = 0;
    onResetRef.current?.();
  }, []);

  const isAnimating = simState === "running";
  const hasLaunched = simState !== "idle";
  const isPaused = simState === "paused";

  useEffect(() => {
    if (!isAnimating) return;
    let rafId: number;
    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const elapsed = offsetRef.current + (now - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isAnimating]);

  return {
    simState,
    elapsedTime,
    launch,
    pause,
    reset,
    isAnimating,
    hasLaunched,
    isPaused,
  };
}
