/**
 * Physics topic metadata for SEO. Simulation loading is done client-side
 * via PhysicsSimulationLoader (next/dynamic with ssr: false).
 */
export const physicsTopicMeta: Record<
  string,
  { title: string; description: string }
> = {
  gravity: {
    title: "Gravity – Free fall & bounces | Physics",
    description:
      "Explore motion under gravity with an interactive simulator. Change g, mass, initial height and velocity, and try different worlds (Moon, Earth, Mars, Jupiter).",
  },
  "rutherford-gold-foil": {
    title: "Rutherford Gold Foil Experiment | Physics",
    description:
      "Interactive Rutherford scattering: α-particles, gold foil, and a tiny nucleus. Adjust Z, energy, and emission rate to see passing, scattered, and backscattered counts.",
  },
  "projectile-motion": {
    title: "Projectile Motion Simulator | Physics",
    description:
      "Visualize 2D projectile motion with adjustable speed, launch angle, height and gravity. See the trajectory, time of flight, range and maximum height update in real time.",
  },
  "velocity-time-position-time-graphs": {
    title: "Velocity–Time and Position–Time Graphs | Physics",
    description:
      "Interactive v–t and x–t graphs for Class 11 kinematics. Adjust initial velocity, acceleration and initial position; see graphs and formulas update in real time.",
  },
  "relations-for-uniformly-accelerated-motion": {
    title: "Relations for Uniformly Accelerated Motion | Physics",
    description:
      "Explore v = u + at, s = ut + ½at² and v² = u² + 2as with an interactive 1D motion simulator. Adjust u, a and x₀; see position, velocity and the third relation update in real time.",
  },
  "special-relativity": {
    title: "Special Relativity – Time Dilation & Length Contraction | Physics",
    description:
      "Interactive special relativity simulator: moving spaceship and clocks. Adjust v/c to see time dilation (moving clock ticks slower) and length contraction. Formulas γ, Δt = γ Δτ, L = L₀/γ.",
  },
  "general-relativity": {
    title: "General Relativity – Spacetime Curvature & Gravitational Lensing | Physics",
    description:
      "Interactive general relativity demo: rubber-sheet spacetime and light bending. Adjust mass strength and impact parameter to see curvature and geodesic deflection. Formula α ≈ 4GM/(c²b).",
  },
  "black-holes": {
    title: "Black Holes – Event Horizon, Light Bending & Time Dilation | Physics",
    description:
      "Interactive black hole simulator: event horizon, bent light rays, and gravitational time dilation. Adjust mass and impact parameter; see r_s = 2GM/c² and time slowing near the horizon.",
  },
  wormholes: {
    title: "Wormholes – Shortcuts in Spacetime | Physics",
    description:
      "Interactive wormhole simulator: 2D space folded into a tunnel. See shortcuts through spacetime and why wormholes are unstable. Adjust throat radius, curvature, and stability.",
  },
  "time-travel": {
    title: "Time Travel – Physics (CTCs) vs Sci-Fi | Physics",
    description:
      "Interactive time travel demo: closed timelike curves (CTCs), timeline splitting, and why paradoxes arise. Compare physics-allowed CTCs with Sci-Fi paradox zones. Adjust CTC strength, branches, and loop extent.",
  },
  "double-slit": {
    title: "Double Slit Experiment | Physics",
    description:
      "Interactive double slit simulator: particles gradually form an interference pattern on the screen. Adjust wavelength, slit separation, and screen distance to see wave-particle duality and fringe spacing.",
  },
  "quantum-superposition": {
    title: "Quantum Superposition | Physics",
    description:
      "Interactive quantum superposition simulator: probability clouds for two overlapping states (Schrödinger's cat style). Adjust |α|², phase, spread, and separation to see interference and how measurement collapses the wave.",
  },
  "quantum-entanglement": {
    title: "Quantum Entanglement | Physics",
    description:
      "Interactive quantum entanglement simulator: two particles in a singlet state reacting together no matter the distance. Measure one and see the other correlate instantly. Adjust separation, correlation strength, and measurement angles.",
  },
  "quantum-tunneling": {
    title: "Quantum Tunneling | Physics",
    description:
      "Interactive quantum tunneling simulator: particles passing through an energy barrier when E < V₀. See probability leak-through in real time. Adjust energy ratio, barrier width, and mass to observe how transmission probability T changes.",
  },
  "wave-function-collapse": {
    title: "Wave Function Collapse | Physics",
    description:
      "Interactive wave function collapse simulator: fuzzy probability distribution before measurement, sharp outcome after. Adjust P(A), spread, and peak separation; click Measure to see collapse. Measurement changes outcome.",
  },
};
