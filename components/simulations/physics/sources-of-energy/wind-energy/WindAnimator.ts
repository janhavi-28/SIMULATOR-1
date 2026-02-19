/**
 * Wind Energy Simulator — wind animation parameters (visualization only).
 * Used by canvas/renderer; rotation speed = windSpeed × 6 (physics-feel).
 * Decay on low wind, never instant stop.
 */

export const ROTATION_SPEED_FACTOR = 6;

/** Rotation speed (rad/s) for blades — proportional to wind when above threshold */
export function getBladeRotationSpeed(windSpeed: number, isRunning: boolean): number {
  if (!isRunning || windSpeed < 0.5) return 0;
  return windSpeed * ROTATION_SPEED_FACTOR * (Math.PI / 180);
}

/** Wind line opacity 0..1 proportional to wind speed (for horizontal wind lines) */
export function getWindLineOpacity(windSpeed: number, maxWind = 20): number {
  const f = Math.min(1, windSpeed / maxWind);
  return 0.2 + 0.6 * f;
}

/** Particle spacing for flow (px) — smaller when faster */
export function getFlowParticleSpacing(flowLevel: number): number {
  return Math.max(20, 28 - flowLevel * 12);
}
