/**
 * Simulation engine: ties PhysicsModel to time and machine state.
 * Single tick loop updates reserve, overload, and physics. No physics in UI.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { FuelType, SimMachineState } from "./types";
import type { PhysicsModelInput, PhysicsModelOutput } from "./PhysicsModel";
import { computePhysicsTick } from "./PhysicsModel";

const INITIAL_RESERVE = 100;

export interface SimulationEngineInput {
  fuelType: FuelType;
  fuelInputRate: number;
  coolingLevel: number;
  airIntake: number;
  maintenanceLevel: number;
  isRunning: boolean;
  isPaused: boolean;
  runSpeed: number;
}

export interface SimulationEngineState {
  machineState: SimMachineState;
  reservePercent: number;
  overloadAccumulatedSec: number;
  elapsedTimeSec: number;
  physics: PhysicsModelOutput;
}

export function useSimulationEngine(
  input: SimulationEngineInput,
  options: { onReset?: () => void } = {}
) {
  const { onReset } = options;
  const [machineState, setMachineState] = useState<SimMachineState>("idle");
  const [reservePercent, setReservePercent] = useState(INITIAL_RESERVE);
  const [overloadAccumulatedSec, setOverloadAccumulatedSec] = useState(0);
  const [elapsedTimeSec, setElapsedTimeSec] = useState(0);
  const [physics, setPhysics] = useState<PhysicsModelOutput>({
    powerMW: 0,
    co2TonsPerHour: 0,
    reservePercent: INITIAL_RESERVE,
    efficiencyPercent: 40,
    temperatureNormalized: 0,
    pressureNormalized: 0,
    turbineRPMNormalized: 0,
    voltageNormalized: 0,
    overloadFactor: 0,
    isOverheated: false,
    fuelDepletionRate: 0,
    overloadAccumulatedSec: 0,
  });

  const stateRef = useRef({
    reservePercent: INITIAL_RESERVE,
    overloadAccumulatedSec: 0,
    elapsedTimeSec: 0,
    startTime: 0,
    offset: 0,
  });
  const animRef = useRef<number>(0);
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  const isActuallyRunning = input.isRunning && !input.isPaused;
  const wasRunningRef = useRef(false);

  useEffect(() => {
    if (!isActuallyRunning) return;
    if (machineState === "idle") {
      setMachineState("starting");
      stateRef.current.startTime = performance.now();
      stateRef.current.offset = 0;
    }
    wasRunningRef.current = true;
  }, [isActuallyRunning, machineState]);

  useEffect(() => {
    if (!input.isRunning) return;
    if (input.isPaused && wasRunningRef.current) {
      const now = performance.now();
      stateRef.current.offset += (now - stateRef.current.startTime) / 1000;
      wasRunningRef.current = false;
    }
    if (!input.isPaused) {
      stateRef.current.startTime = performance.now();
      wasRunningRef.current = true;
    }
  }, [input.isPaused, input.isRunning]);

  useEffect(() => {
    if (machineState === "starting") {
      const t = setTimeout(() => setMachineState("running"), 800);
      return () => clearTimeout(t);
    }
  }, [machineState]);

  useEffect(() => {
    if (!isActuallyRunning) {
      const modelInput: PhysicsModelInput = {
        fuelType: input.fuelType,
        fuelInputRate: input.fuelInputRate,
        coolingLevel: input.coolingLevel,
        airIntake: input.airIntake,
        maintenanceLevel: input.maintenanceLevel,
        reservePercent,
        elapsedTimeSec,
        isRunning: false,
        overloadAccumulatedSec,
        dtSec: 0,
      };
      const out = computePhysicsTick(modelInput);
      setPhysics(out);
    }
  }, [isActuallyRunning, reservePercent, elapsedTimeSec, overloadAccumulatedSec, input.fuelType, input.fuelInputRate, input.coolingLevel, input.airIntake, input.maintenanceLevel]);

  useEffect(() => {
    if (!isActuallyRunning) return;
    let last = performance.now();
    const tick = (now: number) => {
      animRef.current = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000) * input.runSpeed;
      last = now;
      const s = stateRef.current;
      s.elapsedTimeSec = s.offset + (now - s.startTime) / 1000;

      const modelInput: PhysicsModelInput = {
        fuelType: input.fuelType,
        fuelInputRate: input.fuelInputRate,
        coolingLevel: input.coolingLevel,
        airIntake: input.airIntake,
        maintenanceLevel: input.maintenanceLevel,
        reservePercent: s.reservePercent,
        elapsedTimeSec: s.elapsedTimeSec,
        isRunning: true,
        overloadAccumulatedSec: s.overloadAccumulatedSec,
        dtSec: dt,
      };
      const out = computePhysicsTick(modelInput);
      s.reservePercent = out.reservePercent;
      s.overloadAccumulatedSec = out.overloadAccumulatedSec;

      setElapsedTimeSec(s.elapsedTimeSec);
      setReservePercent(Math.round(s.reservePercent * 10) / 10);
      setOverloadAccumulatedSec(s.overloadAccumulatedSec);
      setPhysics(out);

      if (out.reservePercent <= 0) setMachineState("failure");
      else if (out.isOverheated && machineState === "running") setMachineState("overloaded");
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isActuallyRunning, input.fuelType, input.fuelInputRate, input.coolingLevel, input.airIntake, input.maintenanceLevel, input.runSpeed, machineState]);

  useEffect(() => {
    if (!isActuallyRunning && machineState !== "idle") {
      if (physics.isOverheated) setMachineState("cooling");
      else setMachineState("idle");
    }
  }, [isActuallyRunning, machineState, physics.isOverheated]);

  const reset = useCallback(() => {
    setMachineState("idle");
    setReservePercent(INITIAL_RESERVE);
    setOverloadAccumulatedSec(0);
    setElapsedTimeSec(0);
    const zeroState = {
      reservePercent: INITIAL_RESERVE,
      overloadAccumulatedSec: 0,
      elapsedTimeSec: 0,
      startTime: 0,
      offset: 0,
    };
    stateRef.current = zeroState;
    setPhysics((p) => ({
      ...p,
      powerMW: 0,
      co2TonsPerHour: 0,
      reservePercent: INITIAL_RESERVE,
      efficiencyPercent: 40,
      temperatureNormalized: 0,
      pressureNormalized: 0,
      turbineRPMNormalized: 0,
      voltageNormalized: 0,
      overloadFactor: 0,
      isOverheated: false,
      fuelDepletionRate: 0,
      overloadAccumulatedSec: 0,
    }));
    onResetRef.current?.();
  }, []);

  return {
    machineState,
    reservePercent,
    elapsedTimeSec,
    physics,
    reset,
  };
}
