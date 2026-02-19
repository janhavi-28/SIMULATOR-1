/**
 * Wind Energy Simulator — wind visualization (particles / flow lines).
 * Renders moving horizontal particles; opacity ∝ wind speed. Multiple layers for depth.
 */

export type WindRenderParams = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  windSpeed: number;  // m/s
  time: number;       // elapsed seconds (for animation)
  showAirflow: boolean;
};

const WIND_MAX_SPEED = 20;

export function drawWind(params: WindRenderParams): void {
  const { ctx, width, height, dpr, windSpeed, time, showAirflow } = params;
  if (!showAirflow) return;

  const vFrac = Math.min(1, windSpeed / WIND_MAX_SPEED);
  // Opacity proportional to wind speed (--energy-wind #22d3ee)
  const opacity = 0.2 + 0.6 * vFrac;
  const particleCount = 32;
  const baseLen = 22 * dpr + 60 * dpr * vFrac;
  const speed = 40 * vFrac;

  // Back layer: softer, slower
  for (let i = 0; i < particleCount; i++) {
    const y = height * 0.12 + (i / particleCount) * (height * 0.72);
    const len = baseLen * (0.6 + 0.4 * Math.sin(i * 0.5));
    const xOffset = (time * speed * 0.7 * dpr) % (len * 2.5);
    ctx.strokeStyle = `rgba(34, 211, 238, ${opacity * 0.5})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-xOffset, y);
    ctx.lineTo(len - xOffset, y);
    ctx.stroke();
  }

  // Main layer: wind particle flow lines (left to right)
  for (let i = 0; i < particleCount; i++) {
    const y = height * 0.15 + (i / particleCount) * (height * 0.65);
    const len = baseLen * (0.7 + 0.3 * Math.sin(i * 0.7));
    const xOffset = (time * speed * dpr) % (len * 2.2);
    ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-xOffset, y);
    ctx.lineTo(len - xOffset, y);
    ctx.stroke();
  }

  // Front layer: brighter streaks for strong wind
  if (vFrac > 0.4) {
    const frontCount = 12;
    for (let i = 0; i < frontCount; i++) {
      const y = height * 0.2 + (i / frontCount) * (height * 0.55);
      const len = baseLen * 1.1 * (0.8 + 0.2 * Math.sin(i + time * 0.5));
      const xOffset = (time * speed * 1.2 * dpr) % (len * 2);
      ctx.strokeStyle = `rgba(34, 211, 238, ${opacity * 0.9})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-xOffset, y);
      ctx.lineTo(len - xOffset, y);
      ctx.stroke();
    }
  }
}
