"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { computeLensResult, getPrincipalRays } from "./OpticsMath";
import { renderLensDiagram } from "./RayRenderer";
import type { LensState } from "./OpticsMath";

export interface LensCanvasProps {
  state: LensState;
  pulseT: number;
  focalGlow?: number;
  lensFlash?: number;
  zoom?: number;
  rayProgress?: number;
  launched?: boolean;
}

const LOGICAL_EXTENT = 92;

export function LensCanvas({
  state,
  pulseT,
  focalGlow = 0,
  lensFlash = 0,
  zoom = 1,
  rayProgress = 1,
  launched = true,
}: LensCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { result, rays, logicalExtent } = useMemo(() => {
    const res = computeLensResult(state);
    const r = res.imageX != null ? getPrincipalRays(res) : [];
    const ext = Math.max(
      LOGICAL_EXTENT,
      Math.abs(res.objectX) + 10,
      Math.abs(res.f2Right) + 10,
      res.imageX != null ? Math.abs(res.imageX) + 10 : 0
    );
    return { result: res, rays: r, logicalExtent: ext };
  }, [state.u, state.f, state.ho, state.signConvention, state.objectType, state.lensType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio ?? 1);
      const w = container.clientWidth;
      const h = container.clientHeight;
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

      if (!launched) {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#64748b";
        ctx.font = "18px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Click Launch to start the simulation", w / 2, h / 2 - 10);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px system-ui, sans-serif";
        ctx.fillText("Then use Play to see rays form the image step by step", w / 2, h / 2 + 20);
      } else {
        renderLensDiagram({
          ctx,
          width: w,
          height: h,
          result,
          rays,
          logicalExtent,
          pulseT,
          lensFlash: lensFlash || focalGlow,
          zoom,
          rayProgress,
          objectType: state.objectType,
        });
      }

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [result, rays, logicalExtent, pulseT, focalGlow, lensFlash, zoom, rayProgress, state.objectType, launched]);

  return (
    <div ref={containerRef} className="lens-canvas-container">
      <canvas ref={canvasRef} className="lens-canvas" title="Image forms here" />
    </div>
  );
}
