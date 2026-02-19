/**
 * Wind Energy Simulator — turbine animation state.
 * Rotation speed ∝ wind; torque arc and blade state for drawing.
 * No physics changes; visualization only.
 */

import { isWindTooLow, isWindTooHigh, WIND_CUT_IN, WIND_CUT_OUT } from "./PhysicsBindings";

export type TurbineState = {
  /** Current rotation angle (radians) for blades */
  rotationAngle: number;
  /** 0..1 for torque indicator arc length */
  torqueFrac: number;
  /** Blades are spinning */
  isSpinning: boolean;
  /** Show brake / overspeed warning */
  showWarning: boolean;
  /** Shake/vibration intensity 0..1 when spinning fast */
  vibration: number;
};

export function getTurbineState(
  windSpeed: number,
  isAnimating: boolean,
  elapsedTime: number,
  mechPowerKW: number,
  maxMechKW: number
): TurbineState {
  const tooLow = isWindTooLow(windSpeed);
  const tooHigh = isWindTooHigh(windSpeed);
  const isSpinning = isAnimating && !tooLow && !tooHigh && windSpeed >= WIND_CUT_IN;
  const angularSpeed = isSpinning ? windSpeed * 0.32 : 0;
  const rotationAngle = angularSpeed * elapsedTime;
  const torqueFrac = maxMechKW > 0 ? Math.min(1, mechPowerKW / Math.max(1, maxMechKW)) : 0;
  const showWarning = isAnimating && tooHigh;
  const vibration = isSpinning && windSpeed > 12 ? 0.3 + 0.4 * Math.min(1, (windSpeed - 12) / 8) : 0;

  return {
    rotationAngle,
    torqueFrac,
    isSpinning,
    showWarning,
    vibration,
  };
}
