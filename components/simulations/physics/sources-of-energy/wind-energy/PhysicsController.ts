/**
 * Wind Energy Simulator — physics-derived animation state only.
 * No physics calculations; reads from PhysicsBindings and maps to visual params.
 */

import type { PipelineData } from "./PhysicsBindings";
import type { FlowStateSnapshot } from "./FlowStateEngine";

export type AnimationState = {
  /** Blade rotation degrees (cumulative, for CSS transform) */
  turbineRotationDeg: number;
  /** 0..1 wind line opacity */
  windLineOpacity: number;
  /** 0..1 flow intensity */
  flowLevel: number;
  /** 0..1 battery charge display */
  batteryChargeLevel: number;
  /** 0..1 meter needle position */
  controllerMeterValue: number;
  /** Phase for inverter sine wave (radians) */
  inverterPhase: number;
  /** 0..1 pulse for distribution unit */
  distributionPulse: number;
  /** House and grid receive power */
  outputActive: boolean;
  /** Show loss particles (low efficiency) */
  showLossParticles: boolean;
  /** 0..1 fraction of output to house (battery low → more house) */
  powerToHouseFrac: number;
  /** 0..1 fraction of output to grid (battery full → more grid) */
  powerToGridFrac: number;
};

export function getAnimationState(
  pipeline: PipelineData & { isAnimating: boolean },
  flowState: FlowStateSnapshot,
  time: number,
  efficiency: number,
  storageOn: boolean,
  batteryCapacityKW: number
): AnimationState {
  const { flowLevel } = flowState;
  const active = pipeline.isAnimating && flowLevel > 0;
  const pOut = pipeline.pOutput;

  const turbineRotationDeg = (time * 6 * (pipeline.pWind / 50)) % 360;
  const windLineOpacity = Math.min(1, 0.2 + (pipeline.pWind / 100) * 0.8);
  const controllerMeterValue = pipeline.pWind > 0 ? Math.min(1, pOut / Math.max(1, pipeline.pWind)) : 0;
  const inverterPhase = (time * 4) % (Math.PI * 2);
  const distributionPulse = 0.5 + 0.5 * Math.sin(time * 3);
  const outputActive = active && pOut > 0;
  const showLossParticles = efficiency < 0.4 && active;

  const batteryChargeLevel = storageOn && batteryCapacityKW > 0
    ? Math.min(1, (pipeline.pGenerator * 0.1 + 0.3) / 1)
    : 0.5;

  // Flow split: battery full → more to grid; battery low → more to house
  const batteryFrac = Math.max(0.2, Math.min(1, batteryChargeLevel));
  const powerToGridFrac = outputActive ? batteryFrac : 0;
  const powerToHouseFrac = outputActive ? Math.max(0, 1 - batteryFrac * 0.7) : 0;

  return {
    turbineRotationDeg,
    windLineOpacity,
    flowLevel,
    batteryChargeLevel: Math.max(0.2, Math.min(1, batteryChargeLevel)),
    controllerMeterValue,
    inverterPhase,
    distributionPulse,
    outputActive,
    showLossParticles,
    powerToHouseFrac,
    powerToGridFrac,
  };
}
