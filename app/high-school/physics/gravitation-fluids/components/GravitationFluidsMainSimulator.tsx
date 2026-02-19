"use client";

import dynamic from "next/dynamic";

const GravitySimulation = dynamic(
  () => import("@/components/simulations/physics/GravitySimulation").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[320px] rounded-xl border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">
        Loading simulator…
      </div>
    ),
  }
);

export default function GravitationFluidsMainSimulator() {
  return <GravitySimulation embedded />;
}
