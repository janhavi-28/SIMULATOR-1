/**
 * Shared types for the Non-Renewable Energy PhET-style simulator.
 * No physics logic here — types only.
 */

export type FuelType = "coal" | "oil" | "gas";

/** Simulator machine state — affects visuals, sounds, and output values */
export type SimMachineState =
  | "idle"
  | "starting"
  | "running"
  | "overloaded"
  | "cooling"
  | "failure";

/** Learning / experience mode */
export type LearningMode = "explore" | "learn" | "challenge";

/** Overlay toggles for visualization */
export interface OverlayToggles {
  showEnergyFlow: boolean;
  showHeatLoss: boolean;
  showEmissions: boolean;
  showEfficiency: boolean;
}

/** System control inputs (0–100 or enum) */
export interface SystemControls {
  fuelInputRate: number;
  coolingLevel: number;
  airIntake: number;
  maintenanceLevel: number;
}

/** Simulation run mode */
export type RunMode = "realtime" | "step";
export interface SimulationModeState {
  runSpeed: number; // 0.5, 1, 2, etc.
  runMode: RunMode;
  autoStabilize: boolean;
}

/** Visualization preferences */
export interface VisualizationState {
  overlayToggles: OverlayToggles;
  colorTheme: "default" | "highContrast";
  animationSpeed: number; // 0.5 = slow, 1 = normal, 2 = fast
}

/** Challenge mode target (when learning mode = challenge) */
export interface ChallengeTarget {
  targetPowerMW?: number;
  emissionLimitTonsPerHour?: number;
  efficiencyGoalPercent?: number;
  runWithoutOverheatSeconds?: number;
}

/** Physics output from PhysicsModel — no UI */
export interface PhysicsSnapshot {
  powerMW: number;
  co2TonsPerHour: number;
  reservePercent: number;
  efficiencyPercent: number;
  temperatureNormalized: number; // 0–1
  pressureNormalized: number;
  turbineRPMNormalized: number;
  voltageNormalized: number;
  overloadFactor: number; // 0–1+, used for overload state
  isOverheated: boolean;
  fuelDepletionRate: number; // % per second
}

/** Semantic color tokens for the simulator */
export const SEMANTIC_COLORS = {
  energyFlow: "#facc15",      // yellow glow
  heatLoss: "#f97316",        // red/orange
  mechanicalMotion: "#22d3ee", // cyan
  electricOutput: "#4ade80",  // neon green
  co2: "#94a3b8",            // gray smoke
  warning: "#f59e0b",        // amber
  success: "#22c55e",
  danger: "#ef4444",
} as const;
