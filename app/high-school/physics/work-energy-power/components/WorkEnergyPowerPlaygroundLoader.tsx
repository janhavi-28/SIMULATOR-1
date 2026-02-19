"use client";

import dynamic from "next/dynamic";

const WorkEnergyPowerPlayground = dynamic(
  () => import("@/components/simulations/physics/work-energy-power/WorkEnergyPowerPlayground"),
  { ssr: false, loading: () => <div className="min-h-[420px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">Loading simulator…</div> }
);

export default function WorkEnergyPowerPlaygroundLoader() {
  return <WorkEnergyPowerPlayground />;
}
