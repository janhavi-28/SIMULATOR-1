"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { SimulatorContainer } from "./EnergySimulatorLayout";
import { useSimulationLifecycle } from "@/components/simulations/physics/electricity/useSimulationLifecycle";
import { PipelineStage } from "./wind-energy/PipelineStage";
import { genFromWind, spinSpeedFromWind, tickPipeline, type PipelinePaths } from "./wind-energy/pipelineLogic";

const INITIAL_BATTERY = 50;

export default function WindEnergySimulation() {
  const { hasLaunched, isPaused, launch, pause, reset } = useSimulationLifecycle();
  const active = hasLaunched && !isPaused;

  const [wind, setWind] = useState(0);
  const [load, setLoad] = useState(5);
  const [battery, setBattery] = useState(INITIAL_BATTERY);
  const [paths, setPaths] = useState<PipelinePaths>({
    hc: { active: false, color: "#1e293b" },
    cc: { active: false, color: "#1e293b" },
    cs: { active: false, color: "#1e293b" },
    cg: { active: false, color: "#1e293b" },
    su: { active: false, color: "#1e293b" },
    cu: { active: false, color: "#1e293b" },
  });
  const [gridEx, setGridEx] = useState(0);
  const rafRef = useRef<number>(0);
  const batteryRef = useRef(battery);
  batteryRef.current = battery;

  const gen = genFromWind(wind);
  const spinSpeedSec = spinSpeedFromWind(gen, wind);

  useEffect(() => {
    if (!active) {
      setPaths({
        hc: { active: false, color: "#1e293b" },
        cc: { active: false, color: "#1e293b" },
        cs: { active: false, color: "#1e293b" },
        cg: { active: false, color: "#1e293b" },
        su: { active: false, color: "#1e293b" },
        cu: { active: false, color: "#1e293b" },
      });
      setGridEx(0);
      return;
    }

    const tick = () => {
      const genNow = genFromWind(wind);
      const { battery: nextBattery, paths: nextPaths, gridEx: nextGridEx } = tickPipeline(
        genNow,
        load,
        batteryRef.current
      );
      batteryRef.current = nextBattery;
      setBattery(nextBattery);
      setPaths(nextPaths);
      setGridEx(nextGridEx);
      rafRef.current = requestAnimationFrame(tick);
    };
    const genNow = genFromWind(wind);
    const { battery: nextBattery, paths: nextPaths, gridEx: nextGridEx } = tickPipeline(
      genNow,
      load,
      batteryRef.current
    );
    batteryRef.current = nextBattery;
    setBattery(nextBattery);
    setPaths(nextPaths);
    setGridEx(nextGridEx);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, wind, load]);

  const handleLaunch = useCallback(() => {
    if (!hasLaunched) {
      if (wind < 3) setWind(12);
      launch();
    }
  }, [hasLaunched, wind, launch]);

  const handleReset = useCallback(() => {
    reset();
    setBattery(INITIAL_BATTERY);
    setPaths({
      hc: { active: false, color: "#1e293b" },
      cc: { active: false, color: "#1e293b" },
      cs: { active: false, color: "#1e293b" },
      cg: { active: false, color: "#1e293b" },
      su: { active: false, color: "#1e293b" },
      cu: { active: false, color: "#1e293b" },
    });
    setGridEx(0);
  }, [reset]);

  const sysMsg = !active
    ? "Waiting for system ignition..."
    : gen > 22
      ? "HIGH WIND WARNING: AUTOMATIC BRAKE"
      : "PIPELINE ACTIVE";

  const telemetryEff = Math.round((gen / 20) * 100);
  const telemetryNet = gen - load;

  const controlPanel = (
    <div className="h-full flex flex-col gap-5 p-6 overflow-y-auto bg-[#0f172a] border-l border-slate-700/80 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
        <span className="w-1 h-5 bg-cyan-400 rounded-full" />
        System Control
      </h2>

      <button
        type="button"
        onClick={active ? pause : handleLaunch}
        className={`w-full py-3.5 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 ${
          active
            ? "bg-red-500/90 text-white hover:bg-red-500 shadow-[0_4px_15px_rgba(239,68,68,0.3)]"
            : "bg-cyan-400 text-[#020617] hover:bg-cyan-300 shadow-[0_4px_15px_rgba(34,211,238,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(34,211,238,0.5)]"
        }`}
      >
        {active ? "Shutdown System" : "Launch Pipeline"}
      </button>

      <div className="rounded-xl border border-slate-600/80 bg-white/[0.03] p-4">
        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Environmental: Wind Speed</label>
        <input
          type="range"
          min={0}
          max={30}
          step={0.5}
          value={wind}
          onChange={(e) => setWind(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer"
        />
        <div className="flex justify-between font-mono text-sm text-cyan-400 mt-2">
          <span>{wind.toFixed(1)}</span>
          <span>m/s</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-600/80 bg-white/[0.03] p-4">
        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Load: Consumer Demand</label>
        <input
          type="range"
          min={1}
          max={15}
          step={0.5}
          value={load}
          onChange={(e) => setLoad(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer"
        />
        <div className="flex justify-between font-mono text-sm text-cyan-400 mt-2">
          <span>{load.toFixed(1)}</span>
          <span>kW</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-600/80 bg-white/[0.03] p-4 font-mono text-sm text-slate-200">
        <label className="block text-xs text-slate-500 uppercase tracking-wider mb-3">Live Data Stream</label>
        <div className="flex justify-between py-1.5 border-b border-white/5">
          <span>Gen Efficiency:</span>
          <span>{telemetryEff}%</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-white/5">
          <span>Net Power:</span>
          <span>{telemetryNet.toFixed(1)} kW</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span>Grid State:</span>
          <span>{gridEx > 0 ? "Exporting" : gridEx < 0 ? "Importing" : "Stable"}</span>
        </div>
      </div>

      <div className="mt-auto pt-2 text-center">
        <span className="inline-block px-3 py-1.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/50">
          {sysMsg}
        </span>
      </div>
    </div>
  );

  const statusBar = (
    <div className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-slate-800/80 bg-slate-900/60">
      <div className="flex flex-col items-center justify-center rounded-lg px-3 py-2 bg-slate-800/80 border border-slate-700/60">
        <span className="text-[10px] uppercase text-slate-500">Wind</span>
        <span className="font-mono text-base font-bold text-cyan-400">{wind.toFixed(1)} m/s</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg px-3 py-2 bg-slate-800/80 border border-slate-700/60">
        <span className="text-[10px] uppercase text-slate-500">Generation</span>
        <span className="font-mono text-base font-bold text-amber-400">{gen.toFixed(1)} kW</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg px-3 py-2 bg-slate-800/80 border border-slate-700/60">
        <span className="text-[10px] uppercase text-slate-500">Battery</span>
        <span className="font-mono text-base font-bold text-emerald-400">{battery.toFixed(1)}%</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg px-3 py-2 bg-slate-800/80 border border-slate-700/60">
        <span className="text-[10px] uppercase text-slate-500">Grid</span>
        <span className="font-mono text-base font-bold text-slate-300">
          {gridEx > 0 ? `+${gridEx.toFixed(1)}` : gridEx < 0 ? gridEx.toFixed(1) : "0"} kW
        </span>
      </div>
    </div>
  );

  return (
    <SimulatorContainer
      layout="wind"
      title="Wind Energy"
      subtitle="Advanced Wind Energy Pipeline — Harvest → Convert → Control → Store → Utilize → Grid"
      hasLaunched={hasLaunched}
      paused={isPaused}
      onLaunch={handleLaunch}
      onPause={pause}
      onReset={handleReset}
      canvas={
        <div className="flex w-full flex-1 min-h-[400px] overflow-hidden">
          <div className="w-[75%] min-w-[280px] min-h-[380px] flex flex-col">
            <PipelineStage
              active={active}
              wind={wind}
              load={load}
              battery={battery}
              gen={gen}
              gridEx={gridEx}
              spinSpeedSec={spinSpeedSec}
              paths={paths}
            />
          </div>
          <div className="w-[25%] min-w-[260px] shrink-0 min-h-[380px] flex flex-col">
            {controlPanel}
          </div>
        </div>
      }
      footer={statusBar}
    />
  );
}
