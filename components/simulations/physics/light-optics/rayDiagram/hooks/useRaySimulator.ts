/**
 * SIMULATION CONTROLLER HOOK
 * Based on useSimulationControls pattern: play, pause, reset with requestAnimationFrame loop.
 * Sequential ray animation when playing.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getRayPaths } from "../physics/rayPhysics";
import { drawScene } from "../renderer/drawScene";
import {
  ensureSpriteLoaded,
  getImageCacheSnapshot,
  type ObjectImageCache,
} from "../utils/objectImageLoader";
import type { SimState } from "../physics/rayPhysics";

const INITIAL_STATE: SimState = {
  mirrorType: "concave",
  objectDistance: 40,
  objectHeight: 30,
  focalLength: 20,
  launched: false,
  objectType: "arrow",
};

const RAY_ANIM_DURATION_MS = 4500;

function renderFrame(
  canvas: HTMLCanvasElement | null,
  container: HTMLDivElement | null,
  state: SimState,
  rayProgress: number,
  imageCache: ObjectImageCache
) {
  if (!canvas || !container) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(2, Math.max(1, typeof window !== "undefined" ? window.devicePixelRatio : 1));
  const w = Math.max(200, container.clientWidth);
  const h = Math.max(150, container.clientHeight);
  const cw = Math.round(w * dpr);
  const ch = Math.round(h * dpr);

  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }

  ctx.save();
  ctx.scale(dpr, dpr);

  if (!state.launched) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#667eea";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🔬 Ray Diagram Simulator", w / 2, h / 2 - 40);
    ctx.fillStyle = "#ccc";
    ctx.font = "18px Arial";
    ctx.fillText('Click "Launch Simulator" to begin', w / 2, h / 2 + 20);
    ctx.restore();
    return;
  }

  const physicsResult = getRayPaths(state);
  drawScene(ctx, w, h, physicsResult, state.mirrorType, rayProgress, state.objectType, imageCache);
  ctx.restore();
}

export function useRaySimulator(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const [state, setState] = useState<SimState>(INITIAL_STATE);
  const [rayProgress, setRayProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageCache, setImageCache] = useState<ObjectImageCache>({});

  const frameRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const startProgressRef = useRef(0);
  const prevStateKeyRef = useRef("");
  const isPlayingRef = useRef(false);
  const stateRef = useRef(state);
  const rayProgressRef = useRef(rayProgress);
  stateRef.current = state;
  rayProgressRef.current = rayProgress;
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    ensureSpriteLoaded(state.objectType).then(() =>
      setImageCache(getImageCacheSnapshot())
    );
  }, [state.objectType]);

  const updateState = useCallback((updates: Partial<SimState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const loop = useCallback((time: number) => {
    if (!isPlayingRef.current) return;

    const elapsed = time - startTimeRef.current;
    const newProgress = Math.min(
      1,
      startProgressRef.current + elapsed / RAY_ANIM_DURATION_MS
    );

    setRayProgress(newProgress);

    if (newProgress >= 1) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      frameRef.current = 0;
    } else {
      frameRef.current = requestAnimationFrame(loop);
    }
  }, []);

  const play = useCallback(() => {
    if (isPlayingRef.current || !stateRef.current.launched) return;

    const start = rayProgressRef.current >= 1 ? 0 : rayProgressRef.current;
    startProgressRef.current = start;
    startTimeRef.current = performance.now();
    if (start >= 1) setRayProgress(0);

    isPlayingRef.current = true;
    setIsPlaying(true);
    frameRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    setRayProgress(0);
    setState((prev) => ({
      ...INITIAL_STATE,
      launched: prev.launched,
      objectType: prev.objectType,
    }));
  }, [pause]);

  // Redraw when state or rayProgress changes
  useEffect(() => {
    const stateKey = JSON.stringify({ state, rayProgress });
    if (prevStateKeyRef.current === stateKey) return;
    prevStateKeyRef.current = stateKey;

    renderFrame(canvasRef.current, containerRef.current, state, rayProgress, imageCache);
  }, [state, rayProgress, imageCache, canvasRef, containerRef]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      renderFrame(canvasRef.current, containerRef.current, state, rayProgress, imageCache);
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [state, rayProgress, imageCache, canvasRef, containerRef]);

  return {
    simState: state,
    updateState,
    isPlaying,
    play,
    pause,
    reset,
  };
}
