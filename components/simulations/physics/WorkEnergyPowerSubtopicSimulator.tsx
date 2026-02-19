"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { WorkEnergyPowerSubtopicSlug } from "@/lib/data/work-energy-power-subtopics";

const WorkByForceSimulation = dynamic(
  () => import("@/components/simulations/physics/work-energy-power/WorkByForceSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const EnergyTransformationSimulation = dynamic(
  () => import("@/components/simulations/physics/work-energy-power/EnergyTransformationSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const SpeedVsKESimulation = dynamic(
  () => import("@/components/simulations/physics/work-energy-power/SpeedVsKESimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const HeightAndPESimulation = dynamic(
  () => import("@/components/simulations/physics/work-energy-power/HeightAndPESimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const EnergyConservationLabSimulation = dynamic(
  () => import("@/components/simulations/physics/work-energy-power/EnergyConservationLabSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const PowerAndTimeSimulation = dynamic(
  () => import("@/components/simulations/physics/work-energy-power/PowerAndTimeSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);

const WORK_ENERGY_POWER_SIM_MAP: Record<WorkEnergyPowerSubtopicSlug, React.ComponentType> = {
  work: WorkByForceSimulation,
  energy: EnergyTransformationSimulation,
  "kinetic-energy": SpeedVsKESimulation,
  "potential-energy": HeightAndPESimulation,
  "conservation-of-energy": EnergyConservationLabSimulation,
  power: PowerAndTimeSimulation,
};

type Props = { slug: WorkEnergyPowerSubtopicSlug };

export default function WorkEnergyPowerSubtopicSimulator({ slug }: Props) {
  const Sim = WORK_ENERGY_POWER_SIM_MAP[slug];
  if (!Sim) return null;

  return (
    <div className="w-full h-full min-h-[420px] flex flex-col">
      <Sim />
    </div>
  );
}
