/**
 * Simulation links for landing page.
 * - Trending Topics: standalone sims (gravity, relativity, quantum, etc.)
 * - Senior Secondary: syllabus sims (projectile-motion, velocity-time graphs, etc.)
 */
export interface SimulationLink {
  slug: string;
  title: string;
  description: string;
  color: "emerald" | "sky" | "amber" | "violet" | "cyan" | "teal" | "indigo" | "fuchsia";
  href: string; // full path
}

// Standalone sims → Trending Topics
export const trendingTopicsPhysicsSimulations: SimulationLink[] = [
  { slug: "gravity", title: "Gravity – Free fall & bounces", description: "Visualize motion under gravity with live control of g, height, and initial velocity.", color: "emerald", href: "/trending-topics/physics/gravity" },
  { slug: "rutherford-gold-foil", title: "Rutherford gold foil experiment", description: "Watch α-particles scatter from a tiny nucleus with controllable Z and energy.", color: "sky", href: "/trending-topics/physics/rutherford-gold-foil" },
  { slug: "special-relativity", title: "Special Relativity – Time dilation & length contraction", description: "Moving spaceship and clocks: see time dilation and length contraction as v/c changes.", color: "amber", href: "/trending-topics/physics/special-relativity" },
  { slug: "general-relativity", title: "General Relativity – Spacetime curvature & light bending", description: "Rubber-sheet spacetime and gravitational lensing: see mass curve the grid and light rays bend.", color: "violet", href: "/trending-topics/physics/general-relativity" },
  { slug: "black-holes", title: "Black Holes – Event horizon, light bending & time dilation", description: "Event horizon, bent light rays, and time slowing near the hole. Adjust mass and impact parameter.", color: "cyan", href: "/trending-topics/physics/black-holes" },
  { slug: "wormholes", title: "Wormholes – Shortcuts in spacetime", description: "2D space folded into a tunnel: see shortcuts and why wormholes are unstable.", color: "teal", href: "/trending-topics/physics/wormholes" },
  { slug: "time-travel", title: "Time Travel – Physics (CTCs) vs Sci‑Fi", description: "Closed timelike curves, timeline splitting, and why paradoxes happen.", color: "indigo", href: "/trending-topics/physics/time-travel" },
  { slug: "double-slit", title: "Double Slit Experiment – Wave vs particle", description: "Particles gradually forming an interference pattern. See wave–particle duality.", color: "sky", href: "/trending-topics/physics/double-slit" },
  { slug: "quantum-superposition", title: "Quantum Superposition – Probability clouds", description: "States overlapping like Schrödinger's cat. See probability clouds instead of fixed positions.", color: "violet", href: "/trending-topics/physics/quantum-superposition" },
  { slug: "quantum-entanglement", title: "Quantum Entanglement – Instant correlation", description: "Two particles reacting together no matter the distance. Measure one and see the other correlate.", color: "fuchsia", href: "/trending-topics/physics/quantum-entanglement" },
  { slug: "quantum-tunneling", title: "Quantum Tunneling – Probability leak-through", description: "Energy barrier with E < V₀: particles tunnel through classically forbidden regions.", color: "emerald", href: "/trending-topics/physics/quantum-tunneling" },
  { slug: "wave-function-collapse", title: "Wave Function Collapse – Fuzzy → sharp on measurement", description: "Before measurement: fuzzy probability. After: one sharp outcome.", color: "cyan", href: "/trending-topics/physics/wave-function-collapse" },
];

// Syllabus sims (Class 11/12) → Senior Secondary
export const seniorSecondaryPhysicsSimulations: SimulationLink[] = [
  { slug: "projectile-motion", title: "Projectile Motion Simulator", description: "Visualize 2D projectile motion with adjustable speed, launch angle, height and gravity.", color: "amber", href: "/senior-secondary/physics/kinematics/projectile-motion" },
  { slug: "velocity-time-position-time-graphs", title: "Velocity–Time and Position–Time Graphs", description: "Interactive v–t and x–t graphs for kinematics.", color: "sky", href: "/senior-secondary/physics/kinematics/velocity-time-position-time-graphs" },
  { slug: "relations-for-uniformly-accelerated-motion", title: "Relations for Uniformly Accelerated Motion", description: "Explore v = u + at, s = ut + ½at² and v² = u² + 2as.", color: "violet", href: "/senior-secondary/physics/kinematics/relations-for-uniformly-accelerated-motion" },
];

// Combined for landing page (trending first, then senior secondary)
export const physicsSimulations: SimulationLink[] = [
  ...trendingTopicsPhysicsSimulations,
  ...seniorSecondaryPhysicsSimulations,
];
