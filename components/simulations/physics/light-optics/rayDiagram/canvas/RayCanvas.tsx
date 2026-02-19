"use client";

/**
 * CANVAS LAYER — Presentation only.
 * Auto-resizes with container, maintains aspect ratio, no overflow.
 */

import React, { forwardRef } from "react";

export const RayCanvas = forwardRef<HTMLCanvasElement, React.HTMLAttributes<HTMLCanvasElement>>(
  (props, ref) => {
    return (
      <canvas
        ref={ref}
        className="ray-diagram-canvas"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          borderRadius: 10,
          cursor: "crosshair",
        }}
        {...props}
      />
    );
  }
);

RayCanvas.displayName = "RayCanvas";
