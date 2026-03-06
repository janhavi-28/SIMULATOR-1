import EscapeVelocitySimulation from "@/components/simulations/physics/EscapeVelocitySimulation";

export default function EscapeVelocityPage() {
  return (
    <div>
      <h1>Escape Velocity</h1>
      <p>
        Minimum speed required to leave a planet without further propulsion.
      </p>

      <EscapeVelocitySimulation />

    </div>
  );
}