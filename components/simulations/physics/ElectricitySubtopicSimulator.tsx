"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ElectricitySubtopicSlug } from "@/lib/data/electricity-subtopics";

const ChargeInteractionPlayground = dynamic(
  () => import("@/components/simulations/physics/electricity/ChargeInteractionPlayground"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const FlowOfChargesSimulation = dynamic(
  () => import("@/components/simulations/physics/electricity/FlowOfChargesSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const ElectricPotentialLandscape = dynamic(
  () => import("@/components/simulations/physics/electricity/ElectricPotentialLandscape"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const OhmsLawLabSimulation = dynamic(
  () => import("@/components/simulations/physics/electricity/OhmsLawLabSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const MicroscopicResistanceExplorer = dynamic(
  () => import("@/components/simulations/physics/electricity/MicroscopicResistanceExplorer"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const ResistanceFactorsSimulation = dynamic(
  () => import("@/components/simulations/physics/electricity/ResistanceFactorsSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const CircuitBuilderSimulation = dynamic(
  () => import("@/components/simulations/physics/electricity/CircuitBuilderSimulation"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const EnergyConsumptionTracker = dynamic(
  () => import("@/components/simulations/physics/electricity/EnergyConsumptionTracker"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);
const PowerHeatVisualizer = dynamic(
  () => import("@/components/simulations/physics/electricity/PowerHeatVisualizer"),
  { ssr: false, loading: () => <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);

const ELECTRICITY_SIM_MAP: Record<ElectricitySubtopicSlug, React.ComponentType> = {
  "electric-charge": ChargeInteractionPlayground,
  "electric-current": FlowOfChargesSimulation,
  "electric-potential-and-potential-difference": ElectricPotentialLandscape,
  "ohms-law": OhmsLawLabSimulation,
  resistance: MicroscopicResistanceExplorer,
  "factors-affecting-resistance": ResistanceFactorsSimulation,
  "electric-circuit": CircuitBuilderSimulation,
  "electrical-energy": EnergyConsumptionTracker,
  "electric-power": PowerHeatVisualizer,
};

type Props = { slug: ElectricitySubtopicSlug };

export default function ElectricitySubtopicSimulator({ slug }: Props) {
  const Sim = ELECTRICITY_SIM_MAP[slug];
  if (!Sim) return null;

  return (
    <div className="w-full h-full min-h-[420px] flex flex-col">
      <Sim />
    </div>
  );
}
