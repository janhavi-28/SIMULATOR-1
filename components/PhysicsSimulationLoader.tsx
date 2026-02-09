"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

function SimulationLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-900/50">
        <p className="text-neutral-400">Loading simulation…</p>
      </div>
    </div>
  );
}

const GravitySimulation = dynamic(
  () => import("@/components/simulations/physics/GravitySimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const RutherfordSimulation = dynamic(
  () => import("@/components/simulations/physics/RutherfordSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const ProjectileSimulation = dynamic(
  () =>
    import("@/components/simulations/physics/ProjectileMotionSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const VelocityTimePositionTimeGraphsSimulation = dynamic(
  () =>
    import("@/components/simulations/physics/VelocityTimePositionTimeGraphsSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const RelationsUniformlyAcceleratedMotionSimulation = dynamic(
  () =>
    import("@/components/simulations/physics/RelationsUniformlyAcceleratedMotionSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const SpecialRelativitySimulation = dynamic(
  () =>
    import("@/components/simulations/physics/SpecialRelativitySimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const GeneralRelativitySimulation = dynamic(
  () =>
    import("@/components/simulations/physics/GeneralRelativitySimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const BlackHolesSimulation = dynamic(
  () =>
    import("@/components/simulations/physics/BlackHolesSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const WormholesSimulation = dynamic(
  () =>
    import("@/components/simulations/physics/WormholesSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const TimeTravelSimulation = dynamic(
  () =>
    import("@/components/simulations/physics/TimeTravelSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const DoubleSlitSimulation = dynamic(
  () =>
    import("@/components/simulations/physics/DoubleSlitSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const QuantumSuperpositionSimulation = dynamic(
  () =>
    import("@/components/simulations/physics/QuantumSuperpositionSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const QuantumEntanglementSimulation = dynamic(
  () =>
    import("@/components/simulations/physics/QuantumEntanglementSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const QuantumTunnelingSimulation = dynamic(
  () =>
    import("@/components/simulations/physics/QuantumTunnelingSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const WaveFunctionCollapseSimulation = dynamic(
  () =>
    import("@/components/simulations/physics/WaveFunctionCollapseSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const registry: Record<string, ComponentType> = {
  gravity: GravitySimulation,
  "rutherford-gold-foil": RutherfordSimulation,
  "projectile-motion": ProjectileSimulation,
  "velocity-time-position-time-graphs": VelocityTimePositionTimeGraphsSimulation,
  "relations-for-uniformly-accelerated-motion": RelationsUniformlyAcceleratedMotionSimulation,
  "special-relativity": SpecialRelativitySimulation,
  "general-relativity": GeneralRelativitySimulation,
  "black-holes": BlackHolesSimulation,
  wormholes: WormholesSimulation,
  "time-travel": TimeTravelSimulation,
  "double-slit": DoubleSlitSimulation,
  "quantum-superposition": QuantumSuperpositionSimulation,
  "quantum-entanglement": QuantumEntanglementSimulation,
  "quantum-tunneling": QuantumTunnelingSimulation,
  "wave-function-collapse": WaveFunctionCollapseSimulation,
};

export default function PhysicsSimulationLoader({
  topic,
}: {
  topic: string;
}) {
  const Simulation = registry[topic];
  if (!Simulation) return null;
  return <Simulation />;
}
