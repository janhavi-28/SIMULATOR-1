"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

function SimulationLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-900/50">
        <p className="text-neutral-400">Loading simulationâ€¦</p>
      </div>
    </div>
  );
}

const GravitySimulation = dynamic(
  () => import("@/components/simulations/physics/GravitySimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const PhysicalWorldUnitsSimulation = dynamic(
  () =>
    import(
      "@/components/simulations/physics/PhysicalWorldUnitsSimulation"
    ),
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

const ResonanceSimulation = dynamic(
  () => import("@/components/simulations/physics/ResonanceSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const UniformCircularMotionSimulation = dynamic(
  () =>
    import(
      "@/components/simulations/physics/UniformCircularMotionSimulation"
    ),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const FundamentalForcesSimulation = dynamic(
  () => import("@/components/simulations/physics/FundamentalForcesSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const FrameOfReferenceSimulation = dynamic(
  () => import("@/components/simulations/physics/FrameOfReferenceSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const MotionInAStraightLineSimulation = dynamic(
  () => import("@/components/simulations/physics/MotionInAStraightLineSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const MotionInAPlaneSimulation = dynamic(
  () => import("@/components/simulations/physics/MotionInAPlaneSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const InclinedPlaneFrictionSimulation = dynamic(
  () => import("@/components/simulations/physics/InclinedPlaneFrictionSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const NewtonsSecondLawForceAccelerationLabSimulation = dynamic(
  () => import("@/components/simulations/physics/NewtonsSecondLawForceAccelerationLabSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const NewtonsCradleSimulation = dynamic(
  () => import("@/components/simulations/physics/NewtonsCradleSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const BankingOfRoadsSimulation = dynamic(
  () => import("@/components/simulations/physics/BankingOfRoadsSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const WorkEnergyTheoremSimulation = dynamic(
  () => import("@/components/simulations/physics/WorkEnergyTheoremSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);

const RotationalInertiaMomentSimulation = dynamic(
  () => import("@/components/simulations/physics/RotationalInertiaMomentSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);
const EscapeVelocitySimulation = dynamic(
  () => import("@/components/simulations/physics/EscapeVelocitySimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);
const KeplersLawsSimulation = dynamic(
  () => import("@/components/simulations/physics/KeplersLawsSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);
const OrbitalVelocitySimulation = dynamic(
  () => import("@/components/simulations/physics/OrbitalVelocitySimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);
const UniversalLawOfGravitationSimulation = dynamic(
  () => import("@/components/simulations/physics/UniversalLawOfGravitationSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);
const COMSimulation = dynamic(
  () => import("@/components/simulations/physics/COMSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);
const MomentofInertiaSimulation= dynamic(
  () => import("@/components/simulations/physics/MomentofInertiaSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);
const RollingMotionSimulation = dynamic(
  () => import("@/components/simulations/physics/RollingMotionSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);
const TorqueAndRotationalDynamicsSimulation = dynamic(
  () => import("@/components/simulations/physics/TorqueAndRotationalDynamicsSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);
const HeatTransferSimulation = dynamic(
  () => import("@/components/simulations/physics/HeatTransferSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);
const ThermodynamicSystemsAndProcessesSimulation = dynamic(
  () => import("@/components/simulations/physics/ThermodynamicSystemsAndProcessesSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);
const WorkDoneByGasSimulation = dynamic(
  () => import("@/components/simulations/physics/WorkDoneByGasSimulation"),
  { ssr: false, loading: () => <SimulationLoading /> }
);


const registry: Record<string, ComponentType> = {
  gravity: GravitySimulation,
  "physical-world-and-units": PhysicalWorldUnitsSimulation,
  "fundamental-forces": FundamentalForcesSimulation,
  "frame-of-reference": FrameOfReferenceSimulation,
  "motion-in-a-straight-line": MotionInAStraightLineSimulation,
  "motion-in-a-plane": MotionInAPlaneSimulation,
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
  resonance: ResonanceSimulation,
  "uniform-circular-motion": UniformCircularMotionSimulation,
  "newtons-second-law-force-acceleration-lab": NewtonsSecondLawForceAccelerationLabSimulation,
  "inclined-plane-friction-force-analysis": InclinedPlaneFrictionSimulation,
  "newtons-cradle": NewtonsCradleSimulation,
  "banking-of-roads": BankingOfRoadsSimulation,
  "work-energy-theorem": WorkEnergyTheoremSimulation,
  "rotational-inertia-moment": RotationalInertiaMomentSimulation,
  "escape-velocity": EscapeVelocitySimulation,
  "keplers-laws-of-planetary-motion": KeplersLawsSimulation,
  "orbital-velocity": OrbitalVelocitySimulation,
  "universal-law-of-gravitation": UniversalLawOfGravitationSimulation,
  "centre-of-mass": COMSimulation,
  "center-of-mass": COMSimulation,
  "moment-of-inertia": MomentofInertiaSimulation, 
  "rolling-motion": RollingMotionSimulation,
  "Rolling-Motion": RollingMotionSimulation,
  "torque-and-rotational-dynamics": TorqueAndRotationalDynamicsSimulation,
  "heat-transfer-conduction-convection-radiation": HeatTransferSimulation,
  "thermodynamic-systems-and-processes": ThermodynamicSystemsAndProcessesSimulation,
  "work-done-by-gas": WorkDoneByGasSimulation,

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

