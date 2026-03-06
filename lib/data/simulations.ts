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
  {
    slug: "physical-world-and-units",
    title: "Physical World & Units – Scattering Explorer",
    description:
      "Alpha particles and a massive nucleus at nuclear scales. Adjust MeV, fm and mass units to see how they change scattering.",
    color: "cyan",
    href:
      "/senior-secondary/physics/physical-world-and-measurement/physical-world-and-units",
  },
  { slug: "projectile-motion", title: "Projectile Motion Simulator", description: "Visualize 2D projectile motion with adjustable speed, launch angle, height and gravity.", color: "amber", href: "/senior-secondary/physics/kinematics/projectile-motion" },
  { slug: "velocity-time-position-time-graphs", title: "Velocity–Time and Position–Time Graphs", description: "Interactive v–t and x–t graphs for kinematics.", color: "sky", href: "/senior-secondary/physics/kinematics/velocity-time-position-time-graphs" },
  { slug: "relations-for-uniformly-accelerated-motion", title: "Relations for Uniformly Accelerated Motion", description: "Explore v = u + at, s = ut + ½at² and v² = u² + 2as with an interactive 1D motion simulator.", color: "teal", href: "/senior-secondary/physics/kinematics/relations-for-uniformly-accelerated-motion" },
  { slug: "resonance", title: "Resonance – Driven oscillator", description: "Drive an oscillator at its natural frequency and watch the amplitude soar. Adjust damping and force for dramatic effects.", color: "amber", href: "/senior-secondary/physics/oscillations-and-waves/resonance" },
  { slug: "work-energy-theorem", title: "The Work-Energy Theorem", description: "Explore how friction stops a sliding block. Adjust mass, initial velocity, and friction; see stopping distance and work done. Net Work = ΔKE.", color: "cyan", href: "/senior-secondary/physics/work-energy-and-power/work-energy-theorem" },
  { slug: "escape-velocity", title: "Escape Velocity", description: "Explore the escape velocity of celestial bodies. Adjust mass and radius to see how they affect escape velocity.", color: "violet", href: "/senior-secondary/physics/gravitation/escape-velocity" },
  { slug: "universal-law-of-gravitation", title: "Universal Law of Gravitation", description: "Explore Newton's law F = Gm₁m₂/r² with a live orbital simulator, auto-scaling trajectories, and force-dominance scale bars.", color: "sky", href: "/senior-secondary/physics/gravitation/universal-law-of-gravitation" },
  { slug: "keplers-laws-of-planetary-motion", title: "Kepler's Laws of Planetary Motion", description: "Visualize elliptical orbits and Kepler's laws. Adjust eccentricity, orbital period, and see how they relate to the sun.", color: "emerald", href: "/senior-secondary/physics/gravitation/keplers-laws-of-planetary-motion" },
  { slug: "orbital-velocity", title: "Orbital Velocity", description: "Explore the orbital velocity of satellites. Adjust mass and radius to see how they affect orbital velocity.", color: "indigo", href: "/senior-secondary/physics/gravitation/orbital-velocity" },
  { slug: "newtons-second-law-force-acceleration-lab", title: "Newton's Second Law – Force & Acceleration Lab", description: "Apply different forces to a mass and see how it accelerates. Adjust mass and force to explore F = ma.", color: "fuchsia", href: "/senior-secondary/physics/laws-of-motion/newtons-second-law-force-acceleration-lab" },
  { slug: "inclined-plane-friction-force-analysis", title: "Inclined Plane & Friction – Force Analysis Lab", description: "Analyze forces on a block on an inclined plane with adjustable angle, mass, and friction coefficient.", color: "teal", href: "/senior-secondary/physics/laws-of-motion/inclined-plane-friction-force-analysis" },
  { slug: "banking-of-roads", title: "Banking of Roads", description: "Explore the physics of banked curves. Adjust speed, radius, and banking angle to see how they affect the required friction for safe turns.", color: "indigo", href: "/senior-secondary/physics/laws-of-motion/banking-of-roads" },
  { slug: "centre-of-mass", title: "Center of Mass Simulation", description: "Visualize the center of mass of a system of particles. Adjust masses and positions to see how the center of mass changes.", color: "fuchsia", href: "/senior-secondary/physics/motion-of-system-of-particles-and-rigid-body/centre-of-mass" },
  { slug: "moment-of-inertia", title: "Moment of Inertia Simulation", description: "Explore the moment of inertia of different shapes and mass distributions. Adjust parameters to see how it affects rotational motion.", color: "emerald", href: "/senior-secondary/physics/motion-of-system-of-particles-and-rigid-body/moment-of-inertia" },
  { slug: "rolling-motion", title: "Rolling Motion Simulation", description: "Visualize rolling motion with adjustable radius, mass, and incline angle. See how these parameters affect the rolling behavior.", color: "sky", href: "/senior-secondary/physics/motion-of-system-of-particles-and-rigid-body/rolling-motion" },
  { slug: "torque-and-rotational-dynamics", title: "Torque and Rotational Dynamics Simulation", description: "Explore torque and rotational dynamics with adjustable force, lever arm, and moment of inertia. See how these parameters affect angular acceleration.", color: "violet", href: "/senior-secondary/physics/motion-of-system-of-particles-and-rigid-body/torque-and-rotational-dynamics" },
];

// High School sims → high-school physics chapters
export const highSchoolPhysicsSimulations: SimulationLink[] = [
  { slug: "hs-motion", title: "Motion & Mechanics", description: "Kinematics, force, Newton's laws, inertia, and momentum with an interactive speed–time simulator.", color: "cyan", href: "/high-school/physics/motion" },
  { slug: "hs-electricity", title: "Electricity", description: "Build intuition for charge, current, voltage, resistance, and basic circuit behaviour. Interactive DC circuit simulator.", color: "sky", href: "/high-school/physics/electricity" },
  { slug: "hs-gravitation-fluids", title: "Gravitation & Fluids", description: "Explore gravity, pressure, buoyancy, and Archimedes' principle through visual simulations.", color: "teal", href: "/high-school/physics/gravitation-fluids" },
  { slug: "hs-magnetism", title: "Magnetism", description: "Understand magnetic fields, electromagnetic effects, and generator concepts interactively.", color: "violet", href: "/high-school/physics/magnetism" },
  { slug: "hs-light", title: "Light & Optics", description: "Reflection, refraction, lenses, and optics concepts with interactive chapter content.", color: "amber", href: "/high-school/physics/light" },
  { slug: "hs-sound", title: "Sound", description: "Wave properties, pitch, wavelength, and reflection of sound with guided simulators.", color: "emerald", href: "/high-school/physics/sound" },
  { slug: "hs-work-energy-power", title: "Work, Energy & Power", description: "Energy transfer, conservation, and power in everyday and lab-style scenarios.", color: "indigo", href: "/high-school/physics/work-energy-power" },
  { slug: "hs-matter-density-states", title: "Matter, Density & States", description: "Particle-level understanding of states of matter, density, and related properties.", color: "fuchsia", href: "/high-school/physics/matter-density-states" },
  { slug: "hs-sources-of-energy", title: "Sources of Energy", description: "Renewable and non-renewable energy sources with process-focused visual explainers.", color: "sky", href: "/high-school/physics/sources-of-energy" },
];

// Combined for landing page (trending first, then senior secondary)
export const physicsSimulations: SimulationLink[] = [
  ...trendingTopicsPhysicsSimulations,
  ...seniorSecondaryPhysicsSimulations,
];

// Curated landing page list: all trending topics + selected senior secondary
const LANDING_SENIOR_SLUGS = new Set([
  "resonance",
  "physical-world-and-units",
  "projectile-motion",
  "velocity-time-position-time-graphs",
  "relations-for-uniformly-accelerated-motion",
  "work-energy-theorem",
]);

export const landingPageSimulations: SimulationLink[] = [
  ...trendingTopicsPhysicsSimulations,
  ...seniorSecondaryPhysicsSimulations.filter((s) => LANDING_SENIOR_SLUGS.has(s.slug)),
];

