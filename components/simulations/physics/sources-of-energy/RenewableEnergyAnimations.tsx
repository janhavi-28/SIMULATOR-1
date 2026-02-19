"use client";

import React from "react";

/** Normalize power (kW) to 0..1 for visual scaling. Max reference ~200 kW. */
function norm(pKw: number) {
  return Math.min(1, Math.max(0, pKw / 200));
}

/** Solar: rays, panel glow ∝ I×η, energy line panel→inverter→output, output meter. */
function SolarSchematic({
  irradiance,
  solarEta,
  solarPowerkW,
  isAnimating,
}: {
  irradiance: number;
  solarEta: number;
  solarPowerkW: number;
  isAnimating: boolean;
}) {
  const glowIntensity = Math.min(1, (irradiance / 1000) * solarEta * 4);
  const meterLevel = norm(solarPowerkW);

  return (
    <div className="renewable-schematic renewable-solar flex flex-col rounded-lg border border-slate-700/70 bg-slate-800/30 p-3 h-full min-h-[140px]">
      <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-2">Solar</div>
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Sun rays: only move when animating */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute w-px bg-amber-400/40 renewable-ray"
              style={{
                height: "45%",
                top: "2%",
                left: "50%",
                transform: `translateX(-50%) rotate(${-30 + i * 15}deg)`,
                transformOrigin: "50% 100%",
                animation: isAnimating ? "solar-ray 2.5s ease-in-out infinite" : "none",
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
        {/* Panel */}
        <div
          className="w-14 h-8 rounded border border-amber-500/50 flex items-center justify-center relative z-10"
          style={{
            boxShadow: isAnimating ? `0 0 ${12 + glowIntensity * 20}px rgba(245,158,11,${0.15 + glowIntensity * 0.25})` : "none",
            backgroundColor: `rgba(245,158,11,${0.08 + glowIntensity * 0.12})`,
          }}
        >
          <div className="w-full h-full border-t border-b border-amber-400/20" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(245,158,11,0.1) 3px, rgba(245,158,11,0.1) 4px)" }} />
        </div>
        {/* Energy line: panel → inverter → output */}
        <div className="flex items-center gap-1 mt-2 w-full justify-center">
          <div className="w-6 h-px bg-slate-600 rounded overflow-hidden">
            <div
              className="h-full bg-amber-500/70 renewable-flow-line"
              style={{
                width: "40%",
                animation: isAnimating && solarPowerkW > 0 ? "flow-pulse 1.2s ease-in-out infinite" : "none",
              }}
            />
          </div>
          <div className="w-4 h-4 rounded border border-slate-500 bg-slate-700/80" title="Inverter" />
          <div className="w-6 h-px bg-slate-600 rounded overflow-hidden">
            <div
              className="h-full bg-amber-500/70 renewable-flow-line"
              style={{
                width: "40%",
                animation: isAnimating && solarPowerkW > 0 ? "flow-pulse 1.2s ease-in-out infinite 0.15s" : "none",
              }}
            />
          </div>
          <div className="flex flex-col items-center" title="Output">
            <div className="w-3 h-8 rounded-sm border border-slate-600 bg-slate-800 overflow-hidden">
              <div
                className="w-full rounded-sm bg-amber-500/80 transition-all duration-500 ease-out"
                style={{
                  height: `${meterLevel * 100}%`,
                  minHeight: meterLevel > 0 ? "4px" : "0",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Wind: horizontal particles, turbine rotation ∝ v, shaft, generator glow ∝ P. */
function WindSchematic({
  windSpeed,
  windPowerkW,
  isAnimating,
  elapsedTime,
}: {
  windSpeed: number;
  windPowerkW: number;
  isAnimating: boolean;
  elapsedTime: number;
}) {
  const rotationDeg = isAnimating ? (elapsedTime * windSpeed * 36) % 360 : 0;
  const glowOpacity = 0.1 + norm(windPowerkW) * 0.35;

  return (
    <div className="renewable-schematic renewable-wind flex flex-col rounded-lg border border-slate-700/70 bg-slate-800/30 p-3 h-full min-h-[140px]">
      <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-2">Wind</div>
      <div className="flex-1 flex items-center justify-between gap-1 relative overflow-hidden">
        {/* Wind particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute w-1 h-px bg-cyan-400/50 rounded-full"
              style={{
                top: `${25 + i * 18}%`,
                left: isAnimating ? `${(elapsedTime * 0.3 * windSpeed + i * 25) % 110 - 10}%` : `${i * 22}%`,
                transition: isAnimating ? "none" : "left 0.3s ease-out",
              }}
            />
          ))}
        </div>
        {/* Turbine */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className="w-10 h-10 flex items-center justify-center"
            style={{ transform: `rotate(${rotationDeg}deg)` }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute w-1 h-6 bg-cyan-600/90 rounded-sm origin-bottom"
                style={{ transform: `rotate(${i * 120}deg)` }}
              />
            ))}
          </div>
          <div className="w-1.5 h-4 bg-slate-500 rounded-full mt-0.5" />
        </div>
        {/* Shaft stripe when animating */}
        <div className="flex-1 h-px bg-slate-600 relative mx-1 min-w-[20px]">
          {isAnimating && windPowerkW > 0 && (
            <div
              className="absolute top-0 left-0 w-2 h-full bg-cyan-500/40 rounded-full"
              style={{
                animation: "shaft-stripe 0.6s linear infinite",
              }}
            />
          )}
        </div>
        {/* Generator */}
        <div
          className="w-8 h-8 rounded border border-slate-500 flex items-center justify-center relative z-10"
          style={{
            boxShadow: isAnimating && windPowerkW > 0 ? `0 0 ${8 + glowOpacity * 20}px rgba(6,182,212,${glowOpacity})` : "none",
            backgroundColor: `rgba(6,182,212,${windPowerkW > 0 ? glowOpacity * 0.4 : 0.05})`,
          }}
        >
          <div className="w-4 h-4 rounded-full border border-cyan-500/50" />
        </div>
      </div>
    </div>
  );
}

/** Hydro: water particles, turbine rotation ∝ Q, generator glow ∝ P. */
function HydroSchematic({
  flowRate,
  hydroPowerkW,
  isAnimating,
  elapsedTime,
}: {
  flowRate: number;
  hydroPowerkW: number;
  isAnimating: boolean;
  elapsedTime: number;
}) {
  const rotationDeg = isAnimating ? (elapsedTime * flowRate * 45) % 360 : 0;
  const glowOpacity = 0.1 + norm(hydroPowerkW) * 0.35;

  return (
    <div className="renewable-schematic renewable-hydro flex flex-col rounded-lg border border-slate-700/70 bg-slate-800/30 p-3 h-full min-h-[140px]">
      <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-2">Hydro</div>
      <div className="flex-1 flex items-center justify-between gap-1 relative overflow-hidden">
        {/* Water flow (vertical particles) */}
        <div className="absolute inset-0 pointer-events-none flex justify-center">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute w-2 h-1 rounded-full bg-teal-400/50"
              style={{
                left: `${20 + i * 25}%`,
                top: isAnimating ? `${(elapsedTime * 0.4 * flowRate + i * 20) % 110 - 10}%` : `${i * 25}%`,
                transition: isAnimating ? "none" : "top 0.3s ease-out",
              }}
            />
          ))}
        </div>
        {/* Turbine (horizontal wheel) */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className="w-10 h-10 rounded-full border-2 border-teal-500/80 flex items-center justify-center"
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              background: "radial-gradient(circle at 50% 50%, rgba(20,184,166,0.15), transparent 70%)",
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="absolute w-0.5 h-4 bg-teal-500/80 rounded origin-center"
                style={{
                  transform: `rotate(${i * 60}deg) translateY(-10px)`,
                }}
              />
            ))}
          </div>
          <div className="w-1.5 h-4 bg-slate-500 rounded-full mt-0.5" />
        </div>
        {/* Shaft */}
        <div className="flex-1 h-px bg-slate-600 relative mx-1 min-w-[20px]">
          {isAnimating && hydroPowerkW > 0 && (
            <div
              className="absolute top-0 left-0 w-2 h-full bg-teal-500/40 rounded-full"
              style={{ animation: "shaft-stripe 0.5s linear infinite" }}
            />
          )}
        </div>
        {/* Generator */}
        <div
          className="w-8 h-8 rounded border border-slate-500 flex items-center justify-center relative z-10"
          style={{
            boxShadow: isAnimating && hydroPowerkW > 0 ? `0 0 ${8 + glowOpacity * 20}px rgba(20,184,166,${glowOpacity})` : "none",
            backgroundColor: `rgba(20,184,166,${hydroPowerkW > 0 ? glowOpacity * 0.4 : 0.05})`,
          }}
        >
          <div className="w-4 h-4 rounded-full border border-teal-500/50" />
        </div>
      </div>
    </div>
  );
}

const ANIMATION_STYLES = `
  @keyframes solar-ray {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.45; }
  }
  @keyframes flow-pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  @keyframes shaft-stripe {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

export function RenewableEnergyAnimations({
  isAnimating,
  elapsedTime,
  irradiance,
  solarEta,
  solarPowerkW,
  windSpeed,
  windPowerkW,
  flowRate,
  hydroPowerkW,
}: {
  isAnimating: boolean;
  elapsedTime: number;
  irradiance: number;
  solarEta: number;
  solarPowerkW: number;
  windSpeed: number;
  windPowerkW: number;
  flowRate: number;
  hydroPowerkW: number;
}) {
  return (
    <>
      <style>{ANIMATION_STYLES}</style>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <SolarSchematic irradiance={irradiance} solarEta={solarEta} solarPowerkW={solarPowerkW} isAnimating={isAnimating} />
        <WindSchematic windSpeed={windSpeed} windPowerkW={windPowerkW} isAnimating={isAnimating} elapsedTime={elapsedTime} />
        <HydroSchematic flowRate={flowRate} hydroPowerkW={hydroPowerkW} isAnimating={isAnimating} elapsedTime={elapsedTime} />
      </div>
    </>
  );
}
